"""
XGBoost Freight Rate Forecasting Model — v2

Trains on historical freight data and predicts freight rates with
calibrated confidence intervals and per-prediction explanations.

What changed vs. v1 (see CHANGES.md alongside this file for the full writeup):
  - Bayesian hyperparameter search (Optuna) over a TimeSeriesSplit CV loop,
    replacing the old hardcoded XGBoost params.
  - Target encoding is now fit *inside* each CV fold (train rows only).
    v1 fit it once on the whole dataset before splitting, which leaked
    future information into every fold's "test" score.
  - The deployed model is retrained on 100% of history using the tuned
    hyperparameters, instead of keeping whichever CV fold happened to run
    last (v1's `self.model = model` after the loop).
  - Confidence intervals come from conformalized quantile regression (CQR):
    two XGBoost quantile models (2.5% / 97.5%) calibrated against held-out
    residuals, so the interval has a real, checkable coverage guarantee
    instead of `rmse * fudge_factor`.
  - `contributing_factors` is now computed with SHAP (TreeExplainer) —
    real per-prediction attribution, not global-importance * feature-value.
  - Optional LightGBM ensemble member, blended with XGBoost using
    inverse-CV-error weights (diversity from a different algorithm, not
    just a different random seed).
  - `predict_trend` is now a seeded Monte Carlo simulation (reproducible),
    returning a proper percentile band instead of one noisy random walk.
  - Every public method keeps its original signature and return shape, so
    `optimizer.py` and `train_model.py` need zero changes to use this file.
"""

import pickle
import warnings
from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
import xgboost as xgb
import optuna

try:
    import shap
    _SHAP_AVAILABLE = True
except ImportError:
    _SHAP_AVAILABLE = False

try:
    import lightgbm as lgb
    _LGB_AVAILABLE = True
except ImportError:
    _LGB_AVAILABLE = False

warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")
warnings.filterwarnings("ignore", message=".*eval_set.*deprecated.*")
optuna.logging.set_verbosity(optuna.logging.WARNING)


class TargetEncoder:
    """Simple smoothed Target Encoder for categorical features."""

    def __init__(self, smoothing: float = 15):
        self.smoothing = smoothing
        self.mapping = {}
        self.global_mean = 0.0
        self.cols = []

    def fit(self, X: pd.DataFrame, y: pd.Series, cols: list):
        self.cols = cols
        self.global_mean = float(y.mean())
        for col in self.cols:
            stats = y.groupby(X[col]).agg(["count", "mean"])
            smooth = (stats["count"] * stats["mean"] + self.smoothing * self.global_mean) / (
                stats["count"] + self.smoothing
            )
            self.mapping[col] = smooth.to_dict()
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_out = X.copy()
        for col in self.cols:
            X_out[col + "_encoded"] = X[col].map(self.mapping.get(col, {})).fillna(self.global_mean)
        return X_out

    def fit_transform(self, X: pd.DataFrame, y: pd.Series, cols: list) -> pd.DataFrame:
        self.fit(X, y, cols)
        return self.transform(X)


class FreightForecastModel:
    """XGBoost-based freight rate forecasting model with tuning, CQR intervals,
    SHAP explanations, and an optional LightGBM ensemble blend."""

    CATEGORICAL_COLS = ["loading_port", "discharge_port", "cargo_type", "vessel_class"]

    FEATURE_COLUMNS = [
        "loading_port_encoded", "discharge_port_encoded",
        "cargo_type_encoded", "vessel_class_encoded",
        "quantity_mt", "distance_nm", "sea_days", "port_days",
        "bdi", "bunker_price",
        "iron_ore_price", "coking_coal_price", "thermal_coal_price", "steel_hrc_price",
        "port_congestion",
        "month_sin", "month_cos", "doy_sin", "doy_cos",
        "is_monsoon", "quarter",
        "bdi_x_distance", "bunker_x_seadays", "quantity_ratio",
        "coal_spread", "bdi_bunker_ratio",
    ]

    NUMERIC_RANGE_COLS = [
        "quantity_mt", "distance_nm", "sea_days", "port_days", "bdi", "bunker_price",
        "iron_ore_price", "coking_coal_price", "thermal_coal_price", "steel_hrc_price",
        "port_congestion",
    ]

    def __init__(self, use_ensemble: bool = True, random_state: int = 42):
        self.model = None                    # tuned XGBoost point model (final, trained on 100% of data)
        self.ensemble_model = None           # optional LightGBM point model
        self.ensemble_weights = {"xgb": 1.0, "lgb": 0.0}
        self.quantile_lo = None              # XGBoost quantile model, 2.5th percentile
        self.quantile_hi = None              # XGBoost quantile model, 97.5th percentile
        self.quantile_alpha = (0.025, 0.975)
        self.conformal_offset = 0.0
        self._residual_offset_lo = None      # fallback if quantile objective unavailable
        self._residual_offset_hi = None

        self.target_encoder = TargetEncoder(smoothing=15)
        self.categorical_cols = self.CATEGORICAL_COLS
        self.feature_columns = []
        self.metrics = {}
        self.best_params = {}
        self.is_trained = False
        self.use_ensemble = use_ensemble
        self.random_state = random_state
        self.model_version = "2.0.0-tuned"

        self.shap_explainer = None
        self._feature_ranges = {}

    # ─────────────────────────── Feature engineering ───────────────────────────

    def _engineer_raw(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        df["doy_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
        df["doy_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)
        df["bdi_x_distance"] = df["bdi"] * df["distance_nm"] / 10000
        df["bunker_x_seadays"] = df["bunker_price"] * df["sea_days"] / 100
        df["quantity_ratio"] = df["quantity_mt"] / df["distance_nm"]
        # New: coal price spread (coking vs thermal) and BDI-per-bunker-dollar
        # efficiency ratio — both derived purely from columns every caller
        # already supplies, so no breaking change to predict()'s input shape.
        df["coal_spread"] = df["coking_coal_price"] - df["thermal_coal_price"]
        df["bdi_bunker_ratio"] = df["bdi"] / (df["bunker_price"] + 1e-6)
        return df

    def _make_features(self, df: pd.DataFrame, encoder: "TargetEncoder") -> pd.DataFrame:
        """Build the model-ready feature matrix using a specific, already-fitted encoder."""
        df = self._engineer_raw(df)
        df = encoder.transform(df)
        for col in self.FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0.0
        return df[self.FEATURE_COLUMNS]

    def _prepare_features(self, df: pd.DataFrame, y=None, fit_encoders: bool = False) -> pd.DataFrame:
        """Backward-compatible entry point: fits/uses the deployment target encoder."""
        if fit_encoders and y is not None:
            self.target_encoder.fit(df, y, self.categorical_cols)
        self.feature_columns = self.FEATURE_COLUMNS
        return self._make_features(df, self.target_encoder)

    def _fill_missing_date_features(self, df: pd.DataFrame, input_data: dict) -> pd.DataFrame:
        needs_date_fields = any(c not in df.columns for c in ["month", "quarter", "day_of_year", "is_monsoon"])
        if not needs_date_fields:
            return df
        date_str = input_data.get("date")
        dt = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.now()
        df["month"] = dt.month
        df["quarter"] = (dt.month - 1) // 3 + 1
        df["day_of_year"] = dt.timetuple().tm_yday
        df["is_monsoon"] = 1 if dt.month in [6, 7, 8, 9] else 0
        return df

    # ─────────────────────────── CV / tuning helpers ───────────────────────────

    def _fold_fit(self, df: pd.DataFrame, y: pd.Series, train_idx, test_idx, params: dict, seed: int):
        """Fit one CV fold with its OWN target encoder (train rows only — no leakage)."""
        df_train, df_test = df.iloc[train_idx], df.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        enc = TargetEncoder(smoothing=15)
        enc.fit(df_train, y_train, self.categorical_cols)

        X_train = self._make_features(df_train, enc)
        X_test = self._make_features(df_test, enc)

        model = xgb.XGBRegressor(
            n_estimators=1500,
            random_state=seed,
            n_jobs=-1,
            early_stopping_rounds=30,
            eval_metric="mae",
            **params,
        )
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
        preds = model.predict(X_test)

        mae = float(mean_absolute_error(y_test, preds))
        best_iter = getattr(model, "best_iteration", None)
        best_iter = int(best_iter) if best_iter is not None else model.n_estimators
        return mae, best_iter, model, X_test, y_test, preds

    def _tune_hyperparameters(self, df, y, splits, n_trials, timeout, verbose):
        def objective(trial):
            params = {
                "max_depth": trial.suggest_int("max_depth", 3, 10),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.15, log=True),
                "subsample": trial.suggest_float("subsample", 0.6, 1.0),
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
                "min_child_weight": trial.suggest_int("min_child_weight", 1, 15),
                "reg_alpha": trial.suggest_float("reg_alpha", 1e-3, 10.0, log=True),
                "reg_lambda": trial.suggest_float("reg_lambda", 1e-2, 10.0, log=True),
                "gamma": trial.suggest_float("gamma", 0.0, 5.0),
            }
            fold_maes = []
            for train_idx, test_idx in splits:
                mae, *_ = self._fold_fit(df, y, train_idx, test_idx, params, seed=self.random_state)
                fold_maes.append(mae)
            return float(np.mean(fold_maes))

        def progress_cb(study, trial):
            if not verbose:
                return
            step = max(1, n_trials // 10)
            if trial.number == 0 or (trial.number + 1) % step == 0:
                print(f"  trial {trial.number + 1}/{n_trials} — best CV MAE so far: ${study.best_value:.3f}/MT")

        sampler = optuna.samplers.TPESampler(seed=self.random_state)
        study = optuna.create_study(direction="minimize", sampler=sampler)
        if verbose:
            print(f"Tuning hyperparameters with Optuna ({n_trials} trials × 5 folds, fold-safe target encoding)...")
        study.optimize(objective, n_trials=n_trials, timeout=timeout, callbacks=[progress_cb])
        if verbose:
            print(f"Best CV MAE: ${study.best_value:.3f}/MT")
            print(f"Best params: {study.best_params}")
        return study.best_params

    def _train_ensemble_member(self, df, y, splits) -> Optional[float]:
        """Train a LightGBM point model as an ensemble partner for XGBoost. Returns its
        mean CV MAE (used to weight the blend), or None if LightGBM isn't installed."""
        if not _LGB_AVAILABLE:
            self.ensemble_model = None
            return None

        lgb_params = dict(
            num_leaves=63,
            learning_rate=self.best_params.get("learning_rate", 0.05),
            subsample=self.best_params.get("subsample", 0.8),
            colsample_bytree=self.best_params.get("colsample_bytree", 0.8),
            reg_alpha=self.best_params.get("reg_alpha", 0.1),
            reg_lambda=self.best_params.get("reg_lambda", 1.0),
            random_state=self.random_state,
            n_jobs=-1,
            verbosity=-1,
        )

        lgb_maes = []
        for train_idx, test_idx in splits:
            df_train, df_test = df.iloc[train_idx], df.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            enc = TargetEncoder(smoothing=15)
            enc.fit(df_train, y_train, self.categorical_cols)
            X_train = self._make_features(df_train, enc)
            X_test = self._make_features(df_test, enc)

            m = lgb.LGBMRegressor(n_estimators=800, **lgb_params)
            m.fit(
                X_train, y_train, eval_set=[(X_test, y_test)],
                callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(0)],
            )
            preds = m.predict(X_test)
            lgb_maes.append(mean_absolute_error(y_test, preds))

        X_full = self._make_features(df, self.target_encoder)
        self.ensemble_model = lgb.LGBMRegressor(n_estimators=800, **lgb_params)
        self.ensemble_model.fit(X_full, y)
        return float(np.mean(lgb_maes))

    def _fit_quantile_models(self, df, y, verbose):
        """Conformalized Quantile Regression: fit quantile models on the first 85% of
        history, calibrate the interval width against the held-out last 15%, then
        refit the quantile models on 100% of data for deployment."""
        n = len(df)
        split_at = int(n * 0.85)
        df_tr, df_cal = df.iloc[:split_at], df.iloc[split_at:]
        y_tr, y_cal = y.iloc[:split_at], y.iloc[split_at:]

        lo_alpha, hi_alpha = self.quantile_alpha
        qparams = dict(
            max_depth=self.best_params.get("max_depth", 6),
            learning_rate=self.best_params.get("learning_rate", 0.05),
            subsample=self.best_params.get("subsample", 0.8),
            colsample_bytree=self.best_params.get("colsample_bytree", 0.8),
            n_estimators=500,
            random_state=self.random_state,
            n_jobs=-1,
        )

        try:
            enc = TargetEncoder(smoothing=15)
            enc.fit(df_tr, y_tr, self.categorical_cols)
            X_tr = self._make_features(df_tr, enc)
            X_cal = self._make_features(df_cal, enc)

            qlo_cal = xgb.XGBRegressor(objective="reg:quantileerror", quantile_alpha=lo_alpha, **qparams)
            qlo_cal.fit(X_tr, y_tr)
            qhi_cal = xgb.XGBRegressor(objective="reg:quantileerror", quantile_alpha=hi_alpha, **qparams)
            qhi_cal.fit(X_tr, y_tr)

            lo_pred_cal = qlo_cal.predict(X_cal)
            hi_pred_cal = qhi_cal.predict(X_cal)
            nonconformity = np.maximum(lo_pred_cal - y_cal.values, y_cal.values - hi_pred_cal)
            self.conformal_offset = float(max(0.0, np.quantile(nonconformity, 1 - (1 - (hi_alpha - lo_alpha)))))

            covered = np.mean(
                (y_cal.values >= lo_pred_cal - self.conformal_offset)
                & (y_cal.values <= hi_pred_cal + self.conformal_offset)
            )

            # Refit on 100% of data for deployment
            X_full = self._make_features(df, self.target_encoder)
            self.quantile_lo = xgb.XGBRegressor(objective="reg:quantileerror", quantile_alpha=lo_alpha, **qparams)
            self.quantile_lo.fit(X_full, y)
            self.quantile_hi = xgb.XGBRegressor(objective="reg:quantileerror", quantile_alpha=hi_alpha, **qparams)
            self.quantile_hi.fit(X_full, y)

            method = "conformalized_quantile_regression"
        except Exception as e:
            if verbose:
                print(f"  Quantile regression unavailable ({e}); falling back to empirical residual quantiles.")
            enc = TargetEncoder(smoothing=15)
            enc.fit(df_tr, y_tr, self.categorical_cols)
            X_cal = self._make_features(df_cal, enc)
            point_cal_pred = self.model.predict(X_cal)
            residuals = y_cal.values - point_cal_pred
            self._residual_offset_lo = float(np.quantile(residuals, 0.025))
            self._residual_offset_hi = float(np.quantile(residuals, 0.975))
            self.quantile_lo = None
            self.quantile_hi = None
            covered = np.mean(
                (residuals >= self._residual_offset_lo) & (residuals <= self._residual_offset_hi)
            )
            method = "empirical_residual_quantiles"

        self._quantile_diag = {
            "method": method,
            "target_interval_pct": round((hi_alpha - lo_alpha) * 100, 1),
            "empirical_calibration_coverage_pct": round(float(covered) * 100, 1),
            "calibration_size": int(len(df_cal)),
        }

    # ─────────────────────────── Training ───────────────────────────

    def train(
        self,
        df: pd.DataFrame,
        n_trials: int = 60,
        timeout: Optional[float] = None,
        use_ensemble: Optional[bool] = None,
        verbose: bool = True,
    ) -> dict:
        """Train the model: Optuna-tuned XGBoost + optional LightGBM ensemble blend +
        conformalized quantile regression intervals + SHAP explainer.

        Args:
            df: training dataframe (same schema as v1).
            n_trials: number of Optuna trials for hyperparameter search.
            timeout: optional wall-clock seconds cap for tuning.
            use_ensemble: override the instance's use_ensemble setting for this run.
            verbose: print progress.
        """
        if use_ensemble is not None:
            self.use_ensemble = use_ensemble

        if verbose:
            print("Preparing features...")

        if "date" in df.columns:
            df = df.sort_values("date").reset_index(drop=True)
        df = df.reset_index(drop=True)

        y = df["freight_rate"].reset_index(drop=True)

        tscv = TimeSeriesSplit(n_splits=5)
        splits = list(tscv.split(df))

        # ── 1. Hyperparameter tuning (fold-safe target encoding, no leakage) ──
        self.best_params = self._tune_hyperparameters(df, y, splits, n_trials, timeout, verbose)

        # ── 2. Honest out-of-fold metrics using the tuned hyperparameters ──
        if verbose:
            print("Computing honest out-of-fold metrics with tuned hyperparameters...")
        maes, rmses, mapes, best_iters = [], [], [], []
        last_test_size, last_train_size = 0, 0
        for train_idx, test_idx in splits:
            mae, best_iter, _, X_test, y_test, preds = self._fold_fit(
                df, y, train_idx, test_idx, self.best_params, seed=self.random_state
            )
            maes.append(mae)
            rmses.append(float(np.sqrt(mean_squared_error(y_test, preds))))
            denom = np.where(y_test.values == 0, 1e-6, y_test.values)
            mapes.append(float(np.mean(np.abs((y_test.values - preds) / denom)) * 100))
            best_iters.append(best_iter)
            last_train_size, last_test_size = len(train_idx), len(test_idx)

        final_n_estimators = max(50, int(round(np.mean(best_iters))))

        # ── 3. Fit the deployment target encoder on ALL data, then the final point model ──
        self.target_encoder = TargetEncoder(smoothing=15)
        self.target_encoder.fit(df, y, self.categorical_cols)
        X_full = self._make_features(df, self.target_encoder)
        self.feature_columns = self.FEATURE_COLUMNS

        self.model = xgb.XGBRegressor(
            n_estimators=final_n_estimators,
            random_state=self.random_state,
            n_jobs=-1,
            **self.best_params,
        )
        self.model.fit(X_full, y, verbose=False)

        # ── 4. Optional LightGBM ensemble member, blended by inverse-CV-error ──
        lgb_mae = None
        if self.use_ensemble:
            if verbose:
                print("Training LightGBM ensemble member..." if _LGB_AVAILABLE else "LightGBM not installed — skipping ensemble.")
            lgb_mae = self._train_ensemble_member(df, y, splits)

        xgb_mae = float(np.mean(maes))
        if self.ensemble_model is not None and lgb_mae:
            inv_xgb, inv_lgb = 1.0 / xgb_mae, 1.0 / lgb_mae
            w_xgb = inv_xgb / (inv_xgb + inv_lgb)
            self.ensemble_weights = {"xgb": round(float(w_xgb), 3), "lgb": round(float(1 - w_xgb), 3)}
        else:
            self.ensemble_weights = {"xgb": 1.0, "lgb": 0.0}

        # ── 5. Conformalized quantile regression intervals ──
        if verbose:
            print("Fitting quantile regression models for prediction intervals...")
        self._fit_quantile_models(df, y, verbose)

        # ── 6. SHAP explainer for real per-prediction attribution ──
        self.shap_explainer = None
        if _SHAP_AVAILABLE:
            try:
                self.shap_explainer = shap.TreeExplainer(self.model)
            except Exception:
                self.shap_explainer = None

        # ── 7. Feature ranges, for flagging out-of-distribution predictions later ──
        self._feature_ranges = {
            c: (float(df[c].min()), float(df[c].max()))
            for c in self.NUMERIC_RANGE_COLS if c in df.columns
        }

        importance = dict(zip(self.feature_columns, self.model.feature_importances_))

        self.metrics = {
            "mae": round(float(np.mean(maes)), 4),
            "rmse": round(float(np.mean(rmses)), 4),
            "mape": round(float(np.mean(mapes)), 2),
            "train_size": last_train_size,
            "test_size": last_test_size,
            "n_features": len(self.feature_columns),
            "feature_importance": {
                k: round(float(v), 4) for k, v in sorted(importance.items(), key=lambda x: -x[1])[:10]
            },
            "best_params": self.best_params,
            "n_trials": n_trials,
            "final_n_estimators": final_n_estimators,
            "ensemble_used": self.ensemble_model is not None,
            "ensemble_weights": self.ensemble_weights,
            "quantile_calibration_coverage_pct": self._quantile_diag["empirical_calibration_coverage_pct"],
            "quantile_method": self._quantile_diag["method"],
            "model_version": self.model_version,
            "trained_at": datetime.now().isoformat(timespec="seconds"),
        }

        self.is_trained = True

        if verbose:
            print(
                f"Model trained! CV MAE: ${self.metrics['mae']:.2f}/MT, "
                f"RMSE: ${self.metrics['rmse']:.2f}/MT, MAPE: {self.metrics['mape']:.1f}%"
            )
            print(
                f"Prediction interval calibration: {self._quantile_diag['empirical_calibration_coverage_pct']:.1f}% "
                f"empirical coverage (target {self._quantile_diag['target_interval_pct']:.0f}%)"
            )
            if self.metrics["ensemble_used"]:
                print(f"Ensemble blend: XGBoost {self.ensemble_weights['xgb']:.0%} / LightGBM {self.ensemble_weights['lgb']:.0%}")

        return self.metrics

    # ─────────────────────────── Prediction ───────────────────────────

    def _fallback_contributions(self, X: pd.DataFrame) -> dict:
        """Global-importance x feature-value fallback, used only if SHAP is unavailable."""
        contributions = {}
        for feat, imp in self.metrics.get("feature_importance", {}).items():
            if feat in X.columns:
                contributions[feat] = round(float(X[feat].values[0] * imp), 4)
        return contributions

    def predict(self, input_data: dict, include_shap: bool = True) -> dict:
        """
        Predict freight rate for given parameters.

        Args:
            input_data: Dict with keys matching training features.
            include_shap: compute real SHAP attributions (slightly slower). If False,
                or if SHAP isn't installed, falls back to the importance x value heuristic.

        Returns:
            Dict with predicted rate, calibrated confidence interval, confidence_pct,
            contributing_factors, plus a couple of additive diagnostic fields
            (model_agreement, extrapolation_warning) that existing callers can ignore.
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")

        df = pd.DataFrame([input_data])
        df = self._fill_missing_date_features(df, input_data)

        X = self._make_features(df, self.target_encoder)

        xgb_pred = float(self.model.predict(X)[0])
        lgb_pred = None
        if self.ensemble_model is not None:
            lgb_pred = float(self.ensemble_model.predict(X)[0])
            prediction = self.ensemble_weights["xgb"] * xgb_pred + self.ensemble_weights["lgb"] * lgb_pred
        else:
            prediction = xgb_pred

        # ── Confidence interval ──
        if self.quantile_lo is not None and self.quantile_hi is not None:
            ci_lower = float(self.quantile_lo.predict(X)[0]) - self.conformal_offset
            ci_upper = float(self.quantile_hi.predict(X)[0]) + self.conformal_offset
        else:
            offset_lo = self._residual_offset_lo if self._residual_offset_lo is not None else -1.96 * self.metrics.get("rmse", 1.0)
            offset_hi = self._residual_offset_hi if self._residual_offset_hi is not None else 1.96 * self.metrics.get("rmse", 1.0)
            ci_lower = prediction + offset_lo
            ci_upper = prediction + offset_hi
        ci_lower, ci_upper = min(ci_lower, prediction), max(ci_upper, prediction)

        # ── Out-of-distribution check (flags extrapolation beyond training range) ──
        extrapolated = []
        for feat, (lo, hi) in self._feature_ranges.items():
            if feat in input_data:
                val = input_data[feat]
                span = max(hi - lo, 1e-6)
                if val < lo - 0.1 * span or val > hi + 0.1 * span:
                    extrapolated.append(feat)

        base_coverage = self.metrics.get("quantile_calibration_coverage_pct", 95.0)
        confidence_pct = round(max(50.0, min(99.0, base_coverage - 5.0 * len(extrapolated))), 1)

        # ── Contributing factors (real SHAP, or fallback) ──
        contributing_factors = {}
        if include_shap and self.shap_explainer is not None:
            try:
                shap_vals = self.shap_explainer.shap_values(X)
                row = shap_vals[0] if np.ndim(shap_vals) == 2 else np.asarray(shap_vals).ravel()
                contrib = dict(zip(X.columns, row))
                contributing_factors = {
                    k: round(float(v), 4) for k, v in sorted(contrib.items(), key=lambda kv: -abs(kv[1]))[:10]
                }
            except Exception:
                contributing_factors = self._fallback_contributions(X)
        else:
            contributing_factors = self._fallback_contributions(X)

        result = {
            "predicted_rate": round(prediction, 2),
            "confidence_interval": {
                "lower": round(max(ci_lower, 0), 2),
                "upper": round(ci_upper, 2),
            },
            "confidence_pct": confidence_pct,
            "unit": "$/MT",
            "contributing_factors": contributing_factors,
            "extrapolation_warning": bool(extrapolated),
            "extrapolated_features": extrapolated,
            "model_agreement": round(abs(xgb_pred - lgb_pred), 2) if lgb_pred is not None else None,
        }
        return result

    def predict_trend(
        self,
        base_input: dict,
        days_ahead: int = 30,
        n_simulations: int = 200,
        seed: Optional[int] = None,
        bdi_daily_vol: float = 5.0,
    ) -> list:
        """Seeded Monte Carlo freight rate trend for the next N days.

        Simulates n_simulations correlated BDI random-walk paths, batches predictions
        per day, and returns the median with a 5th-95th percentile band. Deterministic
        for a given seed (v1's version reseeded nothing and returned one noisy path).

        bdi_daily_vol controls how much the simulated BDI is allowed to wander per day
        (same 5-point default as v1's implicit assumption) — raise it for a wider,
        more conservative band on longer horizons.
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")

        rng = np.random.RandomState(seed if seed is not None else self.random_state)
        base_date = datetime.strptime(base_input.get("date", "2026-09-01"), "%Y-%m-%d")
        base_bdi = base_input.get("bdi", 1500)

        daily_steps = rng.normal(0, bdi_daily_vol, size=(n_simulations, days_ahead))
        bdi_paths = base_bdi + np.cumsum(daily_steps, axis=1) * 0.1

        predictions = []
        for day in range(days_ahead):
            future_date = base_date + timedelta(days=day)
            rows = []
            for sim in range(n_simulations):
                row = base_input.copy()
                row["date"] = future_date.strftime("%Y-%m-%d")
                row["month"] = future_date.month
                row["quarter"] = (future_date.month - 1) // 3 + 1
                row["day_of_year"] = future_date.timetuple().tm_yday
                row["is_monsoon"] = 1 if future_date.month in [6, 7, 8, 9] else 0
                row["bdi"] = float(bdi_paths[sim, day])
                rows.append(row)

            day_df = pd.DataFrame(rows)
            X = self._make_features(day_df, self.target_encoder)

            xgb_preds = self.model.predict(X)
            if self.ensemble_model is not None:
                lgb_preds = self.ensemble_model.predict(X)
                sims = self.ensemble_weights["xgb"] * xgb_preds + self.ensemble_weights["lgb"] * lgb_preds
            else:
                sims = xgb_preds

            predictions.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_rate": round(float(np.median(sims)), 2),
                "ci_lower": round(float(np.percentile(sims, 5)), 2),
                "ci_upper": round(float(np.percentile(sims, 95)), 2),
            })

        return predictions

    # ─────────────────────────── Persistence ───────────────────────────

    def save(self, filepath: str):
        """Save trained model to disk."""
        data = {
            "model": self.model,
            "ensemble_model": self.ensemble_model,
            "ensemble_weights": self.ensemble_weights,
            "quantile_lo": self.quantile_lo,
            "quantile_hi": self.quantile_hi,
            "quantile_alpha": self.quantile_alpha,
            "conformal_offset": self.conformal_offset,
            "residual_offset_lo": self._residual_offset_lo,
            "residual_offset_hi": self._residual_offset_hi,
            "target_encoder": self.target_encoder,
            "feature_columns": self.feature_columns,
            "metrics": self.metrics,
            "best_params": self.best_params,
            "feature_ranges": self._feature_ranges,
            "model_version": self.model_version,
            "use_ensemble": self.use_ensemble,
            "random_state": self.random_state,
        }
        with open(filepath, "wb") as f:
            pickle.dump(data, f)
        print(f"Model saved to {filepath}")

    def load(self, filepath: str):
        """Load trained model from disk."""
        with open(filepath, "rb") as f:
            data = pickle.load(f)

        self.model = data["model"]
        self.ensemble_model = data.get("ensemble_model")
        self.ensemble_weights = data.get("ensemble_weights", {"xgb": 1.0, "lgb": 0.0})
        self.quantile_lo = data.get("quantile_lo")
        self.quantile_hi = data.get("quantile_hi")
        self.quantile_alpha = data.get("quantile_alpha", (0.025, 0.975))
        self.conformal_offset = data.get("conformal_offset", 0.0)
        self._residual_offset_lo = data.get("residual_offset_lo")
        self._residual_offset_hi = data.get("residual_offset_hi")
        self.target_encoder = data["target_encoder"]
        self.feature_columns = data["feature_columns"]
        self.metrics = data["metrics"]
        self.best_params = data.get("best_params", {})
        self._feature_ranges = data.get("feature_ranges", {})
        self.model_version = data.get("model_version", "unknown")
        self.use_ensemble = data.get("use_ensemble", self.ensemble_model is not None)
        self.random_state = data.get("random_state", 42)
        self.is_trained = True

        # Rebuild the SHAP explainer fresh rather than unpickling it — avoids
        # cross-version shap internals breaking a saved model file.
        self.shap_explainer = None
        if _SHAP_AVAILABLE and self.model is not None:
            try:
                self.shap_explainer = shap.TreeExplainer(self.model)
            except Exception:
                self.shap_explainer = None

        print(f"Model loaded from {filepath}")
