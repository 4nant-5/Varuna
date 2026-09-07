"""
Charter Optimization Engine
Evaluates vessel pool, ranks options, and generates explainable recommendations.
"""

import json
import os
from typing import Optional
from .voyage_calculator import VoyageCalculator
from .data_generator import LOADING_PORTS, DISCHARGE_PORTS, VESSEL_CLASSES, ROUTE_DISTANCES


class CharterOptimizer:
    """Main optimization engine that ties together ML predictions, voyage economics, and strategy comparison."""
    
    def __init__(self, freight_model=None, bunker_price: float = 580.0):
        self.freight_model = freight_model
        self.calculator = VoyageCalculator(bunker_price=bunker_price)
        self.vessel_pool = []
        self._load_vessel_pool()
    
    def _load_vessel_pool(self):
        """Load the vessel pool from generated data."""
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "vessel_pool.json")
        if os.path.exists(data_path):
            with open(data_path, "r") as f:
                self.vessel_pool = json.load(f)
    
    def filter_vessels(
        self,
        cargo_type: str,
        quantity_mt: float,
        loading_port: str,
        discharge_port: str,
        preferred_vessel_class: str = "Any",
        max_draft: Optional[float] = None,
        min_capacity: Optional[float] = None,
    ) -> list:
        """Filter vessel pool to find feasible options."""
        feasible = []
        
        # Port draft constraints
        load_max_draft = LOADING_PORTS.get(loading_port, {}).get("max_draft", 20)
        disc_max_draft = DISCHARGE_PORTS.get(discharge_port, {}).get("max_draft", 20)
        port_max_draft = min(load_max_draft, disc_max_draft)
        
        if max_draft:
            port_max_draft = min(port_max_draft, max_draft)
        
        for vessel in self.vessel_pool:
            # Check vessel class preference
            if preferred_vessel_class != "Any" and vessel["vessel_class"] != preferred_vessel_class:
                continue
            
            # Check capacity
            if vessel["dwt"] < quantity_mt * 1.02:  # Need at least qty + 2% margin
                continue
            
            if min_capacity and vessel["dwt"] < min_capacity:
                continue
            
            # Check draft constraint
            if vessel.get("max_draft_m", 20) > port_max_draft + 2:
                # Vessel may be too deep for port, but can load light
                pass
            
            # Check availability (within reasonable window)
            if vessel.get("days_until_available", 0) > 21:
                continue
            
            feasible.append(vessel)
        
        return feasible
    
    def optimize(
        self,
        cargo_type: str,
        quantity_mt: float,
        loading_port: str,
        discharge_port: str,
        laycan_earliest: str,
        laycan_latest: str,
        delivery_date: str,
        preferred_vessel_class: str = "Any",
        max_draft: Optional[float] = None,
        min_capacity: Optional[float] = None,
        budget_per_mt: Optional[float] = None,
        risk_tolerance: str = "moderate",
        optimization_objective: str = "lowest_cost",
        current_bdi: float = 1500,
        current_bunker_price: float = 580,
        port_congestion: float = 30,
    ) -> dict:
        """
        Main optimization function.
        
        Evaluates all feasible vessels, calculates voyage economics for each,
        compares charter strategies, and returns ranked recommendations.
        """
        # Update calculator with current bunker price
        self.calculator.bunker_price = current_bunker_price
        
        # Filter feasible vessels
        feasible_vessels = self.filter_vessels(
            cargo_type, quantity_mt, loading_port, discharge_port,
            preferred_vessel_class, max_draft, min_capacity
        )
        
        if not feasible_vessels:
            return {
                "status": "no_vessels",
                "message": "No feasible vessels found matching the specified criteria. Try relaxing vessel class or capacity constraints.",
                "vessels_evaluated": 0,
                "recommendations": [],
            }
        
        # Get freight rate prediction
        predicted_rate = None
        predicted_future_rate = None
        
        if self.freight_model and self.freight_model.is_trained:
            route_distance = ROUTE_DISTANCES.get((loading_port, discharge_port), 4500)
            
            predict_input = {
                "loading_port": loading_port,
                "discharge_port": discharge_port,
                "cargo_type": cargo_type,
                "vessel_class": preferred_vessel_class if preferred_vessel_class != "Any" else "Panamax",
                "quantity_mt": quantity_mt,
                "distance_nm": route_distance,
                "sea_days": route_distance / (14 * 24),
                "port_days": 5,
                "bdi": current_bdi,
                "bunker_price": current_bunker_price,
                "iron_ore_price": 110,
                "coking_coal_price": 220,
                "thermal_coal_price": 90,
                "steel_hrc_price": 580,
                "port_congestion": port_congestion,
                "date": laycan_earliest,
            }
            
            prediction = self.freight_model.predict(predict_input)
            predicted_rate = prediction["predicted_rate"]
            
            # Predict rate 3 days later (for "wait" strategy)
            predict_input_future = predict_input.copy()
            from datetime import datetime, timedelta
            future_date = datetime.strptime(laycan_earliest, "%Y-%m-%d") + timedelta(days=3)
            predict_input_future["date"] = future_date.strftime("%Y-%m-%d")
            predict_input_future["bdi"] = current_bdi * 1.005  # slight drift
            future_prediction = self.freight_model.predict(predict_input_future)
            predicted_future_rate = future_prediction["predicted_rate"]
        
        # Use predicted rate or budget as freight rate
        freight_rate = predicted_rate or budget_per_mt or 12.0
        
        # Evaluate each vessel
        vessel_results = []
        
        for vessel in feasible_vessels:
            try:
                voyage = self.calculator.calculate_voyage(
                    vessel=vessel,
                    loading_port=loading_port,
                    discharge_port=discharge_port,
                    cargo_type=cargo_type,
                    quantity_mt=quantity_mt,
                    freight_rate=freight_rate,
                    port_congestion=port_congestion,
                )
                
                # Compare charter strategies
                strategies = self.calculator.compare_charter_types(
                    voyage_result=voyage,
                    hire_rate_per_day=vessel.get("hire_rate_per_day", 15000),
                    tc_period_days=60,
                    predicted_future_rate=predicted_future_rate,
                )
                
                vessel_results.append({
                    "vessel": vessel,
                    "voyage": voyage,
                    "strategies": strategies,
                    "best_strategy": strategies["recommended"],
                    "best_profit": strategies["strategies"][0]["net_profit"],
                })
            except Exception as e:
                print(f"Error evaluating vessel {vessel.get('name')}: {e}")
                continue
        
        if not vessel_results:
            return {
                "status": "evaluation_failed",
                "message": "Failed to evaluate voyage economics for any feasible vessel.",
                "vessels_evaluated": len(feasible_vessels),
                "recommendations": [],
            }
        
        # ─── Rank vessels based on optimization objective ──────────
        if optimization_objective == "lowest_cost":
            vessel_results.sort(key=lambda x: x["voyage"]["voyage_costs"])
        elif optimization_objective == "fastest_delivery":
            vessel_results.sort(key=lambda x: x["voyage"]["eta_days"])
        elif optimization_objective == "max_profit":
            vessel_results.sort(key=lambda x: -x["best_profit"])
        elif optimization_objective == "lowest_emissions":
            vessel_results.sort(key=lambda x: x["voyage"]["co2_emissions_tonnes"])
        else:
            # Default: sort by TCE
            vessel_results.sort(key=lambda x: -x["voyage"]["tce_per_day"])
        
        # ─── Generate recommendations ─────────────────────────────
        top_results = vessel_results[:5]  # Top 5 options
        
        recommendations = []
        for i, result in enumerate(top_results):
            rec = {
                "rank": i + 1,
                "vessel": {
                    "id": result["vessel"]["id"],
                    "name": result["vessel"]["name"],
                    "vessel_class": result["vessel"]["vessel_class"],
                    "dwt": result["vessel"]["dwt"],
                    "age_years": result["vessel"]["age_years"],
                    "flag": result["vessel"]["flag"],
                    "current_position": result["vessel"]["current_position"],
                    "speed_knots": result["vessel"]["speed_knots"],
                    "consumption_laden": result["vessel"]["consumption_laden_mt_day"],
                    "consumption_ballast": result["vessel"]["consumption_ballast_mt_day"],
                },
                "voyage_economics": result["voyage"],
                "charter_strategies": result["strategies"],
                "is_recommended": i == 0,
            }
            
            # Generate explanation
            if i == 0:
                rec["explanation"] = self._generate_top_recommendation_explanation(
                    result, top_results, optimization_objective
                )
            elif len(top_results) > 1:
                rec["explanation"] = self._generate_comparison_explanation(
                    result, top_results[0], optimization_objective
                )
            
            recommendations.append(rec)
        
        # ─── Market context ────────────────────────────────────────
        market_context = {
            "current_bdi": current_bdi,
            "bunker_price": current_bunker_price,
            "predicted_freight_rate": predicted_rate,
            "predicted_future_rate_3d": predicted_future_rate,
            "port_congestion": port_congestion,
            "market_sentiment": "bullish" if current_bdi > 1600 else "bearish" if current_bdi < 1200 else "neutral",
        }
        
        return {
            "status": "success",
            "vessels_evaluated": len(feasible_vessels),
            "vessels_feasible": len(vessel_results),
            "optimization_objective": optimization_objective,
            "market_context": market_context,
            "freight_rate_used": freight_rate,
            "recommendations": recommendations,
            "route_info": {
                "loading_port": loading_port,
                "discharge_port": discharge_port,
                "cargo_type": cargo_type,
                "quantity_mt": quantity_mt,
                "distance_nm": ROUTE_DISTANCES.get((loading_port, discharge_port), 4500),
            },
        }
    
    def _generate_top_recommendation_explanation(self, top: dict, all_results: list, objective: str) -> str:
        """Generate natural-language explanation for the top recommendation."""
        v = top["voyage"]
        vessel = top["vessel"]
        strategy = top["strategies"]["recommended"]
        
        explanation_parts = [
            f"**Recommended: Fix {vessel['name']} ({vessel['vessel_class']}, {vessel['dwt']:,} DWT) on {strategy}.**\n"
        ]
        
        # Why this vessel
        explanation_parts.append(
            f"This vessel delivers the {'lowest total cost' if objective == 'lowest_cost' else 'highest TCE' if objective == 'max_profit' else 'fastest delivery' if objective == 'fastest_delivery' else 'lowest emissions'} "
            f"among {len(all_results)} evaluated options."
        )
        
        # Key metrics
        explanation_parts.append(
            f"\n• **TCE**: ${v['tce_per_day']:,}/day | **Net Profit**: ${v['net_profit']:,} | "
            f"**ETA**: {v['eta_days']} days | **CO₂**: {v['co2_emissions_tonnes']:,.0f} tonnes"
        )
        
        # Compare with runner-up
        if len(all_results) > 1:
            runner = all_results[1]
            rv = runner["voyage"]
            profit_diff = v["net_profit"] - rv["net_profit"]
            
            reasons = []
            
            # Consumption comparison
            if vessel["consumption_laden_mt_day"] < runner["vessel"]["consumption_laden_mt_day"]:
                cons_diff = runner["vessel"]["consumption_laden_mt_day"] - vessel["consumption_laden_mt_day"]
                reasons.append(f"lower fuel consumption ({vessel['consumption_laden_mt_day']} vs {runner['vessel']['consumption_laden_mt_day']} MT/day)")
            
            # Ballast leg
            if v["ballast_distance_nm"] < rv["ballast_distance_nm"]:
                reasons.append(f"shorter ballast leg ({v['ballast_distance_nm']:,} vs {rv['ballast_distance_nm']:,} NM)")
            
            # Port costs
            if v["total_port_cost"] < rv["total_port_cost"]:
                reasons.append("lower port charges")
            
            # ETA
            if v["eta_days"] < rv["eta_days"]:
                reasons.append(f"faster delivery ({v['eta_days']} vs {rv['eta_days']} days)")
            
            # Risk
            if v["risk_score"] < rv["risk_score"]:
                reasons.append(f"lower risk profile ({v['risk_score']}/100 vs {rv['risk_score']}/100)")
            
            if reasons:
                reason_text = ", ".join(reasons[:-1])
                if len(reasons) > 1:
                    reason_text += f", and {reasons[-1]}"
                else:
                    reason_text = reasons[0]
                
                explanation_parts.append(
                    f"\n\nAlthough {runner['vessel']['name']} "
                    f"{'has a lower hire rate' if rv.get('voyage', {}).get('freight_rate', 0) < v.get('freight_rate', 0) else 'appears cheaper on paper'}, "
                    f"{vessel['name']}'s {reason_text} make it **${abs(profit_diff):,.0f} more profitable** over the full voyage."
                )
        
        return " ".join(explanation_parts)
    
    def _generate_comparison_explanation(self, current: dict, best: dict, objective: str) -> str:
        """Generate explanation comparing a vessel to the recommended one."""
        cv = current["voyage"]
        bv = best["voyage"]
        vessel = current["vessel"]
        best_vessel = best["vessel"]
        
        profit_diff = bv["net_profit"] - cv["net_profit"]
        
        disadvantages = []
        advantages = []
        
        if cv["tce_per_day"] < bv["tce_per_day"]:
            disadvantages.append(f"lower TCE (${cv['tce_per_day']:,} vs ${bv['tce_per_day']:,}/day)")
        else:
            advantages.append(f"higher TCE (${cv['tce_per_day']:,}/day)")
        
        if cv["bunker_cost"] > bv["bunker_cost"]:
            disadvantages.append(f"higher bunker cost (${cv['bunker_cost']:,} vs ${bv['bunker_cost']:,})")
        
        if cv["eta_days"] > bv["eta_days"]:
            disadvantages.append(f"longer delivery ({cv['eta_days']} vs {bv['eta_days']} days)")
        else:
            advantages.append(f"faster delivery ({cv['eta_days']} days)")
        
        if cv["co2_emissions_tonnes"] > bv["co2_emissions_tonnes"]:
            disadvantages.append(f"higher emissions ({cv['co2_emissions_tonnes']:,.0f} tonnes CO₂)")
        
        explanation = f"**{vessel['name']}** ({vessel['vessel_class']}, {vessel['dwt']:,} DWT)"
        
        if advantages:
            explanation += f" offers {', '.join(advantages)}"
        
        if disadvantages:
            explanation += f", but has {', '.join(disadvantages)}"
        
        if profit_diff > 0:
            explanation += f". Overall **${profit_diff:,.0f} less profitable** than {best_vessel['name']}."
        
        return explanation
