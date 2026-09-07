"""
Voyage Economics Calculator
Calculates TCE, costs, emissions, and profitability for each vessel-route combination.
"""

import math
from typing import Optional
from .data_generator import LOADING_PORTS, DISCHARGE_PORTS, VESSEL_CLASSES, ROUTE_DISTANCES


# Carbon emission factors
CO2_PER_TONNE_FUEL = 3.114  # tonnes CO2 per tonne of fuel (VLSFO)
EU_ETS_CARBON_PRICE = 65.0  # €/tonne CO2 (approximate)
EUR_USD = 1.08


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance in nautical miles."""
    R = 3440.065  # Earth radius in nautical miles
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


class VoyageCalculator:
    """Calculate detailed voyage economics for a given vessel-route-cargo combination."""
    
    def __init__(self, bunker_price: float = 580.0, carbon_price: float = 65.0):
        self.bunker_price = bunker_price  # $/MT for VLSFO
        self.carbon_price = carbon_price  # €/tonne CO2
    
    def calculate_ballast_distance(self, vessel_position: dict, loading_port: str) -> float:
        """Calculate ballast leg distance from vessel's current position to loading port."""
        load_info = LOADING_PORTS.get(loading_port, {})
        if not load_info:
            return 1000  # default
        
        return haversine_distance(
            vessel_position.get("lat", 0), vessel_position.get("lon", 0),
            load_info["lat"], load_info["lon"]
        )
    
    def calculate_voyage(
        self,
        vessel: dict,
        loading_port: str,
        discharge_port: str,
        cargo_type: str,
        quantity_mt: float,
        freight_rate: float,
        port_congestion: float = 30.0,
        weather_delay_days: float = 0.0,
    ) -> dict:
        """
        Calculate complete voyage economics.
        
        Returns detailed breakdown of costs, revenue, TCE, emissions, and timing.
        """
        # ─── Distances ────────────────────────────────────────────
        laden_distance = ROUTE_DISTANCES.get(
            (loading_port, discharge_port),
            4500  # default
        )
        
        ballast_distance = self.calculate_ballast_distance(
            vessel.get("current_position", {"lat": 0, "lon": 0}),
            loading_port
        )
        
        total_distance = laden_distance + ballast_distance
        
        # ─── Timing ───────────────────────────────────────────────
        speed = vessel.get("speed_knots", 14.0)
        
        laden_sea_days = laden_distance / (speed * 24)
        ballast_sea_days = ballast_distance / (speed * 24)
        total_sea_days = laden_sea_days + ballast_sea_days
        
        # Port days
        disc_info = DISCHARGE_PORTS.get(discharge_port, {})
        handling_rate = disc_info.get("handling_rate_mt_day", 25000)
        
        load_port_days = 3.0  # average loading time
        discharge_port_days = quantity_mt / handling_rate + 1.0
        
        # Congestion delay
        congestion_delay = max(0, (port_congestion - 35) / 15) * 1.5
        
        total_port_days = load_port_days + discharge_port_days + congestion_delay + weather_delay_days
        total_voyage_days = total_sea_days + total_port_days
        
        # Waiting + availability
        days_until_available = vessel.get("days_until_available", 0)
        total_days_including_wait = total_voyage_days + days_until_available
        
        # ─── Revenue ──────────────────────────────────────────────
        gross_revenue = freight_rate * quantity_mt
        brokerage = gross_revenue * 0.0125  # 1.25% standard
        net_revenue = gross_revenue - brokerage
        
        # ─── Fuel Costs ───────────────────────────────────────────
        laden_consumption = vessel.get("consumption_laden_mt_day", 32)
        ballast_consumption = vessel.get("consumption_ballast_mt_day", 27)
        port_consumption = 3.0  # MT/day at port
        
        laden_fuel = laden_sea_days * laden_consumption
        ballast_fuel = ballast_sea_days * ballast_consumption
        port_fuel = total_port_days * port_consumption
        total_fuel = laden_fuel + ballast_fuel + port_fuel
        
        bunker_cost = total_fuel * self.bunker_price
        
        # ─── Port Costs ──────────────────────────────────────────
        # Simplified port cost model
        load_port_cost = 35000 + quantity_mt * 0.15  # fixed + variable
        discharge_port_cost = 40000 + quantity_mt * 0.20
        total_port_cost = load_port_cost + discharge_port_cost
        
        # ─── Canal/Strait Dues ─────────────────────────────────────
        canal_dues = 0  # No Suez/Panama for Indian East Coast routes
        
        # ─── Emissions ────────────────────────────────────────────
        co2_emissions = total_fuel * CO2_PER_TONNE_FUEL
        
        # EU ETS (only if route touches EU waters — generally not for these routes)
        eu_ets_cost = 0
        if vessel.get("eu_ets_compliant", False) is False:
            # Small exposure for vessels that may have been in EU waters
            eu_ets_cost = 0  # Not applicable for India East Coast routes
        
        # ─── Demurrage / Despatch ──────────────────────────────────
        demurrage_rate = vessel.get("hire_rate_per_day", 15000) * 0.5
        despatch_rate = demurrage_rate * 0.5
        
        # Estimate based on congestion
        if port_congestion > 50:
            demurrage_days = max(0, congestion_delay - 1)
            demurrage_cost = demurrage_days * demurrage_rate
            despatch_income = 0
        else:
            demurrage_cost = 0
            despatch_days = max(0, 1 - congestion_delay) * 0.5
            despatch_income = despatch_days * despatch_rate
        
        # ─── Total Costs ──────────────────────────────────────────
        voyage_costs = bunker_cost + total_port_cost + canal_dues + demurrage_cost - despatch_income
        
        daily_opex = vessel.get("daily_opex", 7500)
        total_opex = daily_opex * total_voyage_days
        
        # ─── TCE Calculation ──────────────────────────────────────
        tce = (net_revenue - voyage_costs) / total_voyage_days if total_voyage_days > 0 else 0
        
        # ─── Profit ───────────────────────────────────────────────
        gross_profit = net_revenue - voyage_costs
        net_profit = gross_profit - total_opex
        profit_margin = (net_profit / gross_revenue * 100) if gross_revenue > 0 else 0
        
        # ─── Repositioning Cost ────────────────────────────────────
        repositioning_cost = ballast_fuel * self.bunker_price + (ballast_sea_days * daily_opex)
        
        # ─── Risk Score ────────────────────────────────────────────
        risk_factors = {
            "vessel_age": min(vessel.get("age_years", 10) / 25 * 20, 20),
            "congestion": min(port_congestion / 100 * 25, 25),
            "distance": min(laden_distance / 10000 * 15, 15),
            "weather": min(weather_delay_days / 5 * 15, 15),
            "availability": min(days_until_available / 14 * 15, 15),
            "fuel_volatility": 10,
        }
        risk_score = sum(risk_factors.values())
        risk_score = min(max(risk_score, 0), 100)
        
        # ─── ETA Calculation ──────────────────────────────────────
        eta_days = days_until_available + ballast_sea_days + load_port_days + laden_sea_days + discharge_port_days + congestion_delay
        
        return {
            "vessel_id": vessel.get("id", ""),
            "vessel_name": vessel.get("name", ""),
            "vessel_class": vessel.get("vessel_class", ""),
            
            # Distances
            "laden_distance_nm": round(laden_distance),
            "ballast_distance_nm": round(ballast_distance),
            "total_distance_nm": round(total_distance),
            
            # Timing
            "laden_sea_days": round(laden_sea_days, 1),
            "ballast_sea_days": round(ballast_sea_days, 1),
            "total_sea_days": round(total_sea_days, 1),
            "load_port_days": round(load_port_days, 1),
            "discharge_port_days": round(discharge_port_days, 1),
            "congestion_delay_days": round(congestion_delay, 1),
            "total_port_days": round(total_port_days, 1),
            "total_voyage_days": round(total_voyage_days, 1),
            "days_until_available": days_until_available,
            "eta_days": round(eta_days, 1),
            
            # Revenue
            "freight_rate": round(freight_rate, 2),
            "gross_revenue": round(gross_revenue),
            "brokerage": round(brokerage),
            "net_revenue": round(net_revenue),
            
            # Fuel
            "total_fuel_mt": round(total_fuel, 1),
            "bunker_price": round(self.bunker_price, 1),
            "bunker_cost": round(bunker_cost),
            
            # Port costs
            "load_port_cost": round(load_port_cost),
            "discharge_port_cost": round(discharge_port_cost),
            "total_port_cost": round(total_port_cost),
            
            # Demurrage
            "demurrage_cost": round(demurrage_cost),
            "despatch_income": round(despatch_income),
            
            # Totals
            "voyage_costs": round(voyage_costs),
            "daily_opex": round(daily_opex),
            "total_opex": round(total_opex),
            "repositioning_cost": round(repositioning_cost),
            
            # TCE & Profit
            "tce_per_day": round(tce),
            "gross_profit": round(gross_profit),
            "net_profit": round(net_profit),
            "profit_margin_pct": round(profit_margin, 1),
            
            # Emissions
            "co2_emissions_tonnes": round(co2_emissions, 1),
            "eu_ets_cost": round(eu_ets_cost),
            "carbon_intensity": round(co2_emissions / (quantity_mt * laden_distance / 1000000), 4) if quantity_mt > 0 else 0,
            
            # Risk
            "risk_score": round(risk_score),
            "risk_factors": {k: round(v, 1) for k, v in risk_factors.items()},
        }
    
    def compare_charter_types(
        self,
        voyage_result: dict,
        hire_rate_per_day: float,
        tc_period_days: int = 60,
        predicted_future_rate: Optional[float] = None,
    ) -> dict:
        """
        Compare Voyage Charter vs Time Charter economics.
        """
        # ─── Voyage Charter ────────────────────────────────────────
        vc = {
            "type": "Voyage Charter",
            "total_cost": voyage_result["voyage_costs"] + voyage_result["total_opex"],
            "tce": voyage_result["tce_per_day"],
            "net_profit": voyage_result["net_profit"],
            "risk": voyage_result["risk_score"],
            "eta_days": voyage_result["eta_days"],
            "co2": voyage_result["co2_emissions_tonnes"],
        }
        
        # ─── Time Charter ──────────────────────────────────────────
        tc_total_hire = hire_rate_per_day * tc_period_days
        # Under TC, charterer pays bunker + port costs, owner gets daily hire
        tc_owner_cost = voyage_result["daily_opex"] * tc_period_days
        tc_owner_profit = tc_total_hire - tc_owner_cost
        
        # Effective TCE for the charterer perspective
        tc_charterer_cost = tc_total_hire + voyage_result["bunker_cost"] + voyage_result["total_port_cost"]
        
        # How many voyages can be done in TC period?
        voyages_in_period = tc_period_days / voyage_result["total_voyage_days"] if voyage_result["total_voyage_days"] > 0 else 1
        tc_equivalent_revenue = voyage_result["net_revenue"] * voyages_in_period
        tc_net_profit = tc_equivalent_revenue - tc_charterer_cost
        
        tc = {
            "type": f"Time Charter ({tc_period_days} days)",
            "total_cost": round(tc_charterer_cost),
            "hire_rate_per_day": round(hire_rate_per_day),
            "tce": round(hire_rate_per_day),  # For TC, TCE = hire rate (from owner perspective)
            "net_profit": round(tc_net_profit),
            "risk": max(0, voyage_result["risk_score"] - 10),  # TC is generally lower risk
            "eta_days": voyage_result["eta_days"],
            "co2": voyage_result["co2_emissions_tonnes"],
            "voyages_in_period": round(voyages_in_period, 1),
        }
        
        # ─── Wait Strategy ──────────────────────────────────────────
        wait = None
        if predicted_future_rate is not None:
            wait_days = 3
            rate_improvement = predicted_future_rate - voyage_result["freight_rate"]
            wait_revenue = predicted_future_rate * (voyage_result["gross_revenue"] / voyage_result["freight_rate"])
            wait_cost = voyage_result["voyage_costs"] + (voyage_result["daily_opex"] * (voyage_result["total_voyage_days"] + wait_days))
            wait_profit = wait_revenue * (1 - 0.0125) - wait_cost
            
            wait = {
                "type": f"Wait {wait_days} Days",
                "predicted_rate": round(predicted_future_rate, 2),
                "rate_change": round(rate_improvement, 2),
                "total_cost": round(wait_cost),
                "tce": round((wait_revenue * (1 - 0.0125) - voyage_result["voyage_costs"]) / (voyage_result["total_voyage_days"] + wait_days)),
                "net_profit": round(wait_profit),
                "risk": min(100, voyage_result["risk_score"] + 15),  # Higher risk due to uncertainty
                "eta_days": round(voyage_result["eta_days"] + wait_days, 1),
                "co2": voyage_result["co2_emissions_tonnes"],
                "confidence": 74,  # Lower confidence for future prediction
            }
        
        strategies = [vc, tc]
        if wait:
            strategies.append(wait)
        
        # Rank by net profit
        strategies.sort(key=lambda x: x["net_profit"], reverse=True)
        
        return {
            "strategies": strategies,
            "recommended": strategies[0]["type"],
            "recommendation_reason": self._generate_strategy_reason(strategies),
        }
    
    def _generate_strategy_reason(self, strategies: list) -> str:
        """Generate a natural-language recommendation reason."""
        best = strategies[0]
        second = strategies[1] if len(strategies) > 1 else None
        
        if second:
            profit_diff = best["net_profit"] - second["net_profit"]
            reason = f"{best['type']} is recommended because it yields ${profit_diff:,.0f} more profit than {second['type']}."
            
            if best.get("risk", 50) < second.get("risk", 50):
                reason += f" It also carries lower risk ({best['risk']}/100 vs {second['risk']}/100)."
            elif best.get("risk", 50) > second.get("risk", 50):
                reason += f" Note: it carries slightly higher risk ({best['risk']}/100 vs {second['risk']}/100)."
            
            return reason
        
        return f"{best['type']} is the recommended strategy."
