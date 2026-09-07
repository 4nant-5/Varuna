"""
XGBoost Freight Rate Forecasting Model
Trains on simulated historical data and predicts freight rates
with confidence intervals. Refined with TimeSeriesSplit, 
Target Encoding, and Early Stopping.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
import xgboost as xgb


class TargetEncoder:
    """Simple Target Encoder for categorical features."""
    def __init__(self, smoothing=10):
        self.smoothing = smoothing
        self.mapping = {}
        self.global_mean = 0

    def fit(self, X, y, cols):
        self.cols = cols
        self.global_mean = y.mean()
        for col in self.cols:
            stats = y.groupby(X[col]).agg(['count', 'mean'])
            smooth = (stats['count'] * stats['mean'] + self.smoothing * self.global_mean) / (stats['count'] + self.smoothing)
            self.mapping[col] = smooth.to_dict()
        return self

    def transform(self, X):
        X_out = X.copy()
        for col in self.cols:
            X_out[col + "_encoded"] = X[col].map(self.mapping[col]).fillna(self.global_mean)
        return X_out


class FreightForecastModel:
    """XGBoost-based freight rate forecasting model."""
    
    def __init__(self):
        self.model = None
        self.target_encoder = TargetEncoder(smoothing=15)
        self.feature_columns = []
        self.metrics = {}
        self.is_trained = False
        self.categorical_cols = ["loading_port", "discharge_port", "cargo_type", "vessel_class"]
    
    def _prepare_features(self, df: pd.DataFrame, y=None, fit_encoders: bool = False) -> pd.DataFrame:
        """Prepare features for training/prediction."""
        df = df.copy()
        
        if fit_encoders and y is not None:
            self.target_encoder.fit(df, y, self.categorical_cols)
            
        df = self.target_encoder.transform(df)
        
        # Cyclical encoding for month/day_of_year
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        df["doy_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
        df["doy_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)
        
        # Interaction features
        df["bdi_x_distance"] = df["bdi"] * df["distance_nm"] / 10000
        df["bunker_x_seadays"] = df["bunker_price"] * df["sea_days"] / 100
        df["quantity_ratio"] = df["quantity_mt"] / df["distance_nm"]
        
        self.feature_columns = [
            "loading_port_encoded", "discharge_port_encoded",
            "cargo_type_encoded", "vessel_class_encoded",
            "quantity_mt", "distance_nm", "sea_days", "port_days",
            "bdi", "bunker_price",
            "iron_ore_price", "coking_coal_price", "thermal_coal_price", "steel_hrc_price",
            "port_congestion",
            "month_sin", "month_cos", "doy_sin", "doy_cos",
            "is_monsoon", "quarter",
            "bdi_x_distance", "bunker_x_seadays", "quantity_ratio",
        ]
        
        return df[self.feature_columns]
    
    def train(self, df: pd.DataFrame) -> dict:
        """Train the XGBoost model on historical freight data with TimeSeriesSplit and Early Stopping."""
        print("Preparing features...")
        
        # Sort by date for time series validation
        if "date" in df.columns:
            df = df.sort_values("date").reset_index(drop=True)
            
        y = df["freight_rate"]
        X = self._prepare_features(df, y=y, fit_encoders=True)
        
        # Time-based split instead of random
        tscv = TimeSeriesSplit(n_splits=5)
        
        maes, rmses, mapes = [], [], []
        
        # Using the last split for final training/validation to save the model
        for train_index, test_index in tscv.split(X):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]
            
            model = xgb.XGBRegressor(
                n_estimators=500,
                max_depth=8,
                learning_rate=0.03,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_weight=5,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
                n_jobs=-1,
                early_stopping_rounds=30
            )
            
            model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False
            )
            
            y_pred = model.predict(X_test)
            maes.append(mean_absolute_error(y_test, y_pred))
            rmses.append(np.sqrt(mean_squared_error(y_test, y_pred)))
            mapes.append(np.mean(np.abs((y_test - y_pred) / y_test)) * 100)
            
        self.model = model  # Keep the last fold's model
        
        self.metrics = {
            "mae": round(np.mean(maes), 4),
            "rmse": round(np.mean(rmses), 4),
            "mape": round(np.mean(mapes), 2),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "n_features": len(self.feature_columns),
        }
        
        # Feature importance
        importance = dict(zip(self.feature_columns, self.model.feature_importances_))
        self.metrics["feature_importance"] = {
            k: round(float(v), 4) 
            for k, v in sorted(importance.items(), key=lambda x: -x[1])[:10]
        }
        
        self.is_trained = True
        print(f"Model trained! CV MAE: ${self.metrics['mae']:.2f}/MT, RMSE: ${self.metrics['rmse']:.2f}/MT, MAPE: {self.metrics['mape']:.1f}%")
        
        return self.metrics
    
    def predict(self, input_data: dict) -> dict:
        """
        Predict freight rate for given parameters.
        
        Args:
            input_data: Dict with keys matching training features
            
        Returns:
            Dict with predicted rate, confidence interval, and contributing factors
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")
        
        # Create single-row DataFrame
        df = pd.DataFrame([input_data])
        
        # Ensure all required columns exist
        for col in ["month", "quarter", "day_of_year", "is_monsoon"]:
            if col not in df.columns:
                if "date" in input_data:
                    from datetime import datetime
                    dt = datetime.strptime(input_data["date"], "%Y-%m-%d")
                    df["month"] = dt.month
                    df["quarter"] = (dt.month - 1) // 3 + 1
                    df["day_of_year"] = dt.timetuple().tm_yday
                    df["is_monsoon"] = 1 if dt.month in [6, 7, 8, 9] else 0
        
        X = self._prepare_features(df, fit_encoders=False)
        
        # Predict
        prediction = float(self.model.predict(X)[0])
        
        # Dynamic Confidence Intervals: wider for longer laycans/voyages or high congestion
        residual_std = self.metrics.get("rmse", 1.0)
        congestion_penalty = (input_data.get("port_congestion", 40) / 100) * 0.5
        volatility_factor = 1.0 + congestion_penalty
        
        if "distance_nm" in input_data and input_data["distance_nm"] > 6000:
            volatility_factor += 0.2
            
        adjusted_std = residual_std * volatility_factor
        
        ci_lower = prediction - 1.96 * adjusted_std
        ci_upper = prediction + 1.96 * adjusted_std
        
        # Get SHAP-like contribution (simplified using feature importance)
        contributions = {}
        for feat, imp in self.metrics.get("feature_importance", {}).items():
            if feat in X.columns:
                contributions[feat] = round(float(X[feat].values[0] * imp), 4)
        
        return {
            "predicted_rate": round(prediction, 2),
            "confidence_interval": {
                "lower": round(max(ci_lower, 0), 2),
                "upper": round(ci_upper, 2),
            },
            "confidence_pct": round(max(50, 100 - (self.metrics.get("mape", 5) * volatility_factor)), 1),
            "unit": "$/MT",
            "contributing_factors": contributions,
        }
    
    def predict_trend(self, base_input: dict, days_ahead: int = 30) -> list:
        """Predict freight rate trend for next N days."""
        from datetime import datetime, timedelta
        
        predictions = []
        base_date = datetime.strptime(base_input.get("date", "2026-09-01"), "%Y-%m-%d")
        
        for day in range(days_ahead):
            future_date = base_date + timedelta(days=day)
            input_copy = base_input.copy()
            input_copy["date"] = future_date.strftime("%Y-%m-%d")
            input_copy["month"] = future_date.month
            input_copy["quarter"] = (future_date.month - 1) // 3 + 1
            input_copy["day_of_year"] = future_date.timetuple().tm_yday
            input_copy["is_monsoon"] = 1 if future_date.month in [6, 7, 8, 9] else 0
            
            # Simulate gradual BDI/bunker price changes
            bdi_drift = np.random.normal(0, 5)
            input_copy["bdi"] = input_copy.get("bdi", 1500) + bdi_drift * day * 0.1
            
            pred = self.predict(input_copy)
            predictions.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_rate": pred["predicted_rate"],
                "ci_lower": pred["confidence_interval"]["lower"],
                "ci_upper": pred["confidence_interval"]["upper"],
            })
        
        return predictions
    
    def save(self, filepath: str):
        """Save trained model to disk."""
        data = {
            "model": self.model,
            "target_encoder": self.target_encoder,
            "feature_columns": self.feature_columns,
            "metrics": self.metrics,
        }
        with open(filepath, "wb") as f:
            pickle.dump(data, f)
        print(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load trained model from disk."""
        with open(filepath, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.target_encoder = data["target_encoder"]
        self.feature_columns = data["feature_columns"]
        self.metrics = data["metrics"]
        self.is_trained = True
        print(f"Model loaded from {filepath}")
