"""
Realistic Freight Rate Data Generator
Generates 3 years of simulated daily freight data for bulk cargo routes
to India's East Coast, with realistic seasonal patterns, volatility,
and correlated market indicators.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import os

# ─── PORT & ROUTE DEFINITIONS ─────────────────────────────────────────

LOADING_PORTS = {
    "Port Hedland": {"country": "Australia", "lat": -20.31, "lon": 118.57, "commodities": ["Iron Ore"], "max_draft": 18.5},
    "Dampier": {"country": "Australia", "lat": -20.66, "lon": 116.71, "commodities": ["Iron Ore"], "max_draft": 17.0},
    "Newcastle": {"country": "Australia", "lat": -32.93, "lon": 151.78, "commodities": ["Thermal Coal", "Coking Coal"], "max_draft": 16.5},
    "Hay Point": {"country": "Australia", "lat": -21.28, "lon": 149.30, "commodities": ["Coking Coal"], "max_draft": 18.0},
    "Richards Bay": {"country": "South Africa", "lat": -28.80, "lon": 32.08, "commodities": ["Thermal Coal", "Chrome Ore"], "max_draft": 17.5},
    "Saldanha Bay": {"country": "South Africa", "lat": -33.00, "lon": 17.93, "commodities": ["Iron Ore", "Manganese Ore"], "max_draft": 21.0},
    "Muara Berau": {"country": "Indonesia", "lat": -1.80, "lon": 116.08, "commodities": ["Thermal Coal"], "max_draft": 14.0},
    "Samarinda": {"country": "Indonesia", "lat": -0.50, "lon": 117.15, "commodities": ["Thermal Coal"], "max_draft": 12.5},
    "Hampton Roads": {"country": "USA", "lat": 36.97, "lon": -76.33, "commodities": ["Coking Coal", "Thermal Coal"], "max_draft": 16.0},
    "Beira": {"country": "Mozambique", "lat": -19.84, "lon": 34.87, "commodities": ["Coking Coal"], "max_draft": 11.0},
    "Nacala": {"country": "Mozambique", "lat": -14.54, "lon": 40.67, "commodities": ["Coking Coal", "Thermal Coal"], "max_draft": 15.0},
    "Tubarao": {"country": "Brazil", "lat": -20.28, "lon": -40.25, "commodities": ["Iron Ore"], "max_draft": 19.5},
    "Vostochny": {"country": "Russia", "lat": 42.75, "lon": 133.08, "commodities": ["Thermal Coal", "Coking Coal"], "max_draft": 16.0},
}

DISCHARGE_PORTS = {
    "Paradip": {"state": "Odisha", "lat": 20.26, "lon": 86.61, "max_draft": 18.5, "handling_rate_mt_day": 35000},
    "Visakhapatnam": {"state": "Andhra Pradesh", "lat": 17.69, "lon": 83.29, "max_draft": 17.1, "handling_rate_mt_day": 30000},
    "Haldia": {"state": "West Bengal", "lat": 22.06, "lon": 88.06, "max_draft": 9.5, "handling_rate_mt_day": 15000},
    "Dhamra": {"state": "Odisha", "lat": 20.78, "lon": 86.95, "max_draft": 18.0, "handling_rate_mt_day": 40000},
    "Gangavaram": {"state": "Andhra Pradesh", "lat": 17.62, "lon": 83.24, "max_draft": 21.0, "handling_rate_mt_day": 45000},
    "Ennore": {"state": "Tamil Nadu", "lat": 13.22, "lon": 80.32, "max_draft": 16.0, "handling_rate_mt_day": 25000},
    "Krishnapatnam": {"state": "Andhra Pradesh", "lat": 14.25, "lon": 80.12, "max_draft": 18.5, "handling_rate_mt_day": 35000},
}

VESSEL_CLASSES = {
    "Handysize": {"dwt_min": 15000, "dwt_max": 35000, "speed_knots": 13.5, "consumption_mt_day": 22, "daily_opex": 6500, "beam": 28},
    "Supramax": {"dwt_min": 50000, "dwt_max": 65000, "speed_knots": 14.0, "consumption_mt_day": 28, "daily_opex": 7200, "beam": 32},
    "Panamax": {"dwt_min": 65000, "dwt_max": 85000, "speed_knots": 14.0, "consumption_mt_day": 32, "daily_opex": 7800, "beam": 32.3},
    "Capesize": {"dwt_min": 150000, "dwt_max": 210000, "speed_knots": 14.5, "consumption_mt_day": 45, "daily_opex": 9500, "beam": 45},
}

CARGO_TYPES = {
    "Iron Ore": {"stowage_factor": 0.35, "density": 2.5, "unit": "MT"},
    "Coking Coal": {"stowage_factor": 0.75, "density": 1.3, "unit": "MT"},
    "Thermal Coal": {"stowage_factor": 0.80, "density": 1.2, "unit": "MT"},
    "Manganese Ore": {"stowage_factor": 0.35, "density": 2.8, "unit": "MT"},
    "Chrome Ore": {"stowage_factor": 0.30, "density": 3.0, "unit": "MT"},
    "Limestone": {"stowage_factor": 0.50, "density": 2.3, "unit": "MT"},
}

# Approximate sea distances in nautical miles
ROUTE_DISTANCES = {
    ("Port Hedland", "Paradip"): 4250,
    ("Port Hedland", "Visakhapatnam"): 4520,
    ("Port Hedland", "Dhamra"): 4300,
    ("Port Hedland", "Gangavaram"): 4550,
    ("Dampier", "Paradip"): 4180,
    ("Dampier", "Visakhapatnam"): 4450,
    ("Newcastle", "Paradip"): 5800,
    ("Newcastle", "Visakhapatnam"): 5650,
    ("Newcastle", "Haldia"): 5900,
    ("Hay Point", "Paradip"): 5400,
    ("Hay Point", "Visakhapatnam"): 5250,
    ("Richards Bay", "Paradip"): 4800,
    ("Richards Bay", "Visakhapatnam"): 4600,
    ("Richards Bay", "Haldia"): 5100,
    ("Richards Bay", "Gangavaram"): 4650,
    ("Saldanha Bay", "Paradip"): 5600,
    ("Saldanha Bay", "Visakhapatnam"): 5400,
    ("Muara Berau", "Paradip"): 3200,
    ("Muara Berau", "Visakhapatnam"): 3000,
    ("Muara Berau", "Haldia"): 3350,
    ("Samarinda", "Paradip"): 3100,
    ("Samarinda", "Haldia"): 3250,
    ("Hampton Roads", "Paradip"): 9800,
    ("Hampton Roads", "Visakhapatnam"): 9600,
    ("Hampton Roads", "Haldia"): 10000,
    ("Beira", "Paradip"): 4200,
    ("Beira", "Visakhapatnam"): 4000,
    ("Nacala", "Paradip"): 3900,
    ("Nacala", "Visakhapatnam"): 3700,
    ("Tubarao", "Paradip"): 9200,
    ("Tubarao", "Visakhapatnam"): 9000,
    ("Vostochny", "Paradip"): 4600,
    ("Vostochny", "Visakhapatnam"): 4800,
    ("Vostochny", "Haldia"): 4700,
}


def _generate_bdi_series(n_days: int, start_date: datetime) -> np.ndarray:
    """Generate realistic Baltic Dry Index time series."""
    t = np.arange(n_days)
    
    # Long-term trend (slight upward)
    trend = 1200 + 0.15 * t
    
    # Seasonal cycle (peaks in Q4, troughs in Q1-Q2)
    seasonal = 350 * np.sin(2 * np.pi * (t - 60) / 365)
    
    # Medium-term cycles (shipping super-cycles ~2-3 years)
    medium_cycle = 200 * np.sin(2 * np.pi * t / 800)
    
    # Random walk (market volatility)
    rng = np.random.RandomState(42)
    noise = np.cumsum(rng.normal(0, 8, n_days))
    noise = noise - np.linspace(noise[0], noise[-1], n_days)  # detrend noise
    
    # Spike events (supply shocks, demand surges)
    spikes = np.zeros(n_days)
    spike_indices = rng.choice(n_days, size=8, replace=False)
    for idx in spike_indices:
        spike_magnitude = rng.uniform(200, 600) * rng.choice([-1, 1])
        spike_decay = np.exp(-np.arange(min(90, n_days - idx)) / 30)
        spikes[idx:idx + len(spike_decay)] += spike_magnitude * spike_decay
    
    bdi = trend + seasonal + medium_cycle + noise + spikes
    bdi = np.clip(bdi, 400, 4500)  # Realistic BDI range
    return bdi


def _generate_bunker_prices(n_days: int) -> np.ndarray:
    """Generate realistic VLSFO bunker price series ($/MT)."""
    t = np.arange(n_days)
    rng = np.random.RandomState(123)
    
    base = 550 + 0.05 * t
    seasonal = 40 * np.sin(2 * np.pi * t / 365)
    oil_correlation = 80 * np.sin(2 * np.pi * t / 500)
    noise = np.cumsum(rng.normal(0, 3, n_days))
    noise = noise - np.linspace(noise[0], noise[-1], n_days)
    
    bunker = base + seasonal + oil_correlation + noise
    bunker = np.clip(bunker, 350, 950)
    return bunker


def _generate_commodity_prices(n_days: int) -> dict:
    """Generate realistic commodity price series."""
    rng = np.random.RandomState(456)
    t = np.arange(n_days)
    
    prices = {}
    
    # Iron Ore 62% Fe ($/MT)
    iron_base = 105 + 0.01 * t
    iron_seasonal = 12 * np.sin(2 * np.pi * (t - 30) / 365)
    iron_noise = np.cumsum(rng.normal(0, 1.2, n_days))
    iron_noise -= np.linspace(iron_noise[0], iron_noise[-1], n_days)
    prices["iron_ore_62fe"] = np.clip(iron_base + iron_seasonal + iron_noise, 70, 180)
    
    # Coking Coal ($/MT)
    coking_base = 210 + 0.03 * t
    coking_seasonal = 25 * np.sin(2 * np.pi * (t - 45) / 365)
    coking_noise = np.cumsum(rng.normal(0, 2.5, n_days))
    coking_noise -= np.linspace(coking_noise[0], coking_noise[-1], n_days)
    prices["coking_coal"] = np.clip(coking_base + coking_seasonal + coking_noise, 120, 400)
    
    # Thermal Coal ($/MT)
    thermal_base = 85 + 0.02 * t
    thermal_seasonal = 15 * np.sin(2 * np.pi * (t + 20) / 365)
    thermal_noise = np.cumsum(rng.normal(0, 1.0, n_days))
    thermal_noise -= np.linspace(thermal_noise[0], thermal_noise[-1], n_days)
    prices["thermal_coal"] = np.clip(thermal_base + thermal_seasonal + thermal_noise, 50, 200)
    
    # Steel HRC ($/MT)
    steel_base = 550 + 0.08 * t
    steel_seasonal = 40 * np.sin(2 * np.pi * (t - 90) / 365)
    steel_noise = np.cumsum(rng.normal(0, 4, n_days))
    steel_noise -= np.linspace(steel_noise[0], steel_noise[-1], n_days)
    prices["steel_hrc"] = np.clip(steel_base + steel_seasonal + steel_noise, 350, 900)
    
    return prices


def _generate_freight_rates(n_days: int, bdi: np.ndarray, bunker: np.ndarray) -> dict:
    """Generate freight rates for each vessel class, correlated with BDI."""
    rng = np.random.RandomState(789)
    rates = {}
    
    # Rate multipliers relative to BDI
    class_multipliers = {
        "Handysize": {"base": 6.5, "bdi_factor": 0.004, "volatility": 0.8},
        "Supramax": {"base": 8.0, "bdi_factor": 0.005, "volatility": 1.0},
        "Panamax": {"base": 9.5, "bdi_factor": 0.006, "volatility": 1.2},
        "Capesize": {"base": 12.0, "bdi_factor": 0.010, "volatility": 2.0},
    }
    
    for vessel_class, params in class_multipliers.items():
        base_rate = params["base"] + bdi * params["bdi_factor"]
        noise = rng.normal(0, params["volatility"], n_days)
        rates[vessel_class] = np.clip(base_rate + noise, params["base"] * 0.5, params["base"] * 3.5)
    
    return rates


def _generate_port_congestion(n_days: int) -> dict:
    """Generate port congestion indices (0-100) for discharge ports."""
    rng = np.random.RandomState(321)
    congestion = {}
    
    for port in DISCHARGE_PORTS:
        base = rng.uniform(20, 45)
        seasonal = 15 * np.sin(2 * np.pi * np.arange(n_days) / 365 + rng.uniform(0, 2 * np.pi))
        noise = rng.normal(0, 5, n_days)
        congestion[port] = np.clip(base + seasonal + noise, 0, 100)
    
    return congestion


def generate_training_data(n_days: int = 1095, start_date: str = "2023-06-01") -> pd.DataFrame:
    """
    Generate the full training dataset for the freight forecasting model.
    
    Returns a DataFrame with ~15 route combinations × n_days rows.
    """
    start = datetime.strptime(start_date, "%Y-%m-%d")
    dates = [start + timedelta(days=i) for i in range(n_days)]
    
    # Generate market indicators
    bdi = _generate_bdi_series(n_days, start)
    bunker = _generate_bunker_prices(n_days)
    commodity_prices = _generate_commodity_prices(n_days)
    freight_rates = _generate_freight_rates(n_days, bdi, bunker)
    port_congestion = _generate_port_congestion(n_days)
    
    rng = np.random.RandomState(999)
    rows = []
    
    # Select primary route combinations
    routes = list(ROUTE_DISTANCES.keys())
    
    for route in routes:
        load_port, disc_port = route
        distance = ROUTE_DISTANCES[route]
        
        # Determine applicable cargo types
        load_info = LOADING_PORTS[load_port]
        applicable_cargoes = load_info["commodities"]
        
        for cargo_type in applicable_cargoes:
            # Determine suitable vessel classes based on cargo and port constraints
            max_draft = min(load_info["max_draft"], DISCHARGE_PORTS[disc_port]["max_draft"])
            
            for vessel_class, v_info in VESSEL_CLASSES.items():
                # Skip impossibly large vessels for small ports
                if vessel_class == "Capesize" and max_draft < 15.0:
                    continue
                if vessel_class == "Handysize" and cargo_type == "Iron Ore" and distance > 6000:
                    continue
                
                for day_idx in range(n_days):
                    date = dates[day_idx]
                    
                    # Cargo quantity (realistic for vessel class)
                    qty = rng.uniform(v_info["dwt_min"] * 0.85, v_info["dwt_max"] * 0.95)
                    
                    # Sea days
                    speed = v_info["speed_knots"] + rng.normal(0, 0.3)
                    sea_days = distance / (speed * 24)
                    
                    # Port days
                    handling_rate = DISCHARGE_PORTS[disc_port]["handling_rate_mt_day"]
                    port_days_load = rng.uniform(2, 5)
                    port_days_discharge = qty / handling_rate + rng.uniform(0.5, 2)
                    
                    # Congestion delay
                    cong = port_congestion[disc_port][day_idx]
                    congestion_delay = max(0, (cong - 40) / 20) * rng.uniform(0.5, 2)
                    
                    total_voyage_days = sea_days + port_days_load + port_days_discharge + congestion_delay
                    
                    # Freight rate ($/MT) - base from market, adjusted by route
                    base_rate = freight_rates[vessel_class][day_idx]
                    distance_factor = distance / 4000  # normalize
                    route_premium = (distance_factor - 1) * 2.5
                    cargo_premium = {"Iron Ore": 0, "Coking Coal": 1.5, "Thermal Coal": 0.5, 
                                    "Manganese Ore": 2.0, "Chrome Ore": 2.5, "Limestone": 1.0}.get(cargo_type, 0)
                    
                    freight_rate = base_rate + route_premium + cargo_premium + rng.normal(0, 0.3)
                    freight_rate = max(freight_rate, 3.0)
                    
                    # Features
                    row = {
                        "date": date.strftime("%Y-%m-%d"),
                        "loading_port": load_port,
                        "discharge_port": disc_port,
                        "cargo_type": cargo_type,
                        "vessel_class": vessel_class,
                        "quantity_mt": round(qty),
                        "distance_nm": distance,
                        "sea_days": round(sea_days, 1),
                        "port_days": round(port_days_load + port_days_discharge, 1),
                        "total_voyage_days": round(total_voyage_days, 1),
                        "bdi": round(bdi[day_idx], 1),
                        "bunker_price": round(bunker[day_idx], 1),
                        "iron_ore_price": round(commodity_prices["iron_ore_62fe"][day_idx], 2),
                        "coking_coal_price": round(commodity_prices["coking_coal"][day_idx], 2),
                        "thermal_coal_price": round(commodity_prices["thermal_coal"][day_idx], 2),
                        "steel_hrc_price": round(commodity_prices["steel_hrc"][day_idx], 2),
                        "port_congestion": round(cong, 1),
                        "month": date.month,
                        "quarter": (date.month - 1) // 3 + 1,
                        "day_of_year": date.timetuple().tm_yday,
                        "is_monsoon": 1 if date.month in [6, 7, 8, 9] else 0,
                        "freight_rate": round(freight_rate, 2),
                    }
                    rows.append(row)
    
    df = pd.DataFrame(rows)
    
    # Sample to keep dataset manageable (~50k rows)
    if len(df) > 60000:
        df = df.sample(n=60000, random_state=42).reset_index(drop=True)
    
    df = df.sort_values(["date", "loading_port", "discharge_port"]).reset_index(drop=True)
    return df


def generate_vessel_pool(n_vessels: int = 30) -> list:
    """Generate a pool of available vessels with current positions."""
    rng = np.random.RandomState(555)
    
    vessel_names_prefix = ["MV ", "MT ", "MV ", ""]
    vessel_names = [
        "Ocean Glory", "Pacific Trader", "Steel Phoenix", "Iron Monarch",
        "Cape Fortune", "Eastern Star", "Global Voyager", "Sea Champion",
        "Bulk Pioneer", "Trade Wind", "Cargo Eagle", "Deep Horizon",
        "Orient Express", "Bay Thunder", "Wave Runner", "Port Royal",
        "Storm Rider", "Golden Anchor", "Blue Sapphire", "Terra Nova",
        "Arctic Explorer", "Coal Titan", "Iron Duke", "Silver Stream",
        "Emerald Bay", "Neptune's Pride", "Red Phoenix", "Dawn Breaker",
        "Coral Spirit", "Thunder Bay"
    ]
    
    # Current positions (latitude, longitude)
    position_regions = [
        {"name": "Indian Ocean", "lat_range": (-10, 15), "lon_range": (60, 90)},
        {"name": "Southeast Asia", "lat_range": (-5, 10), "lon_range": (100, 120)},
        {"name": "Australia", "lat_range": (-35, -15), "lon_range": (110, 155)},
        {"name": "South Africa", "lat_range": (-35, -25), "lon_range": (25, 40)},
        {"name": "Persian Gulf", "lat_range": (20, 30), "lon_range": (48, 58)},
        {"name": "East China Sea", "lat_range": (25, 35), "lon_range": (120, 135)},
    ]
    
    vessels = []
    for i in range(n_vessels):
        vessel_class = rng.choice(list(VESSEL_CLASSES.keys()), p=[0.15, 0.30, 0.35, 0.20])
        v_info = VESSEL_CLASSES[vessel_class]
        
        dwt = rng.randint(v_info["dwt_min"], v_info["dwt_max"])
        age = rng.randint(1, 25)
        
        region = rng.choice(position_regions)
        lat = rng.uniform(*region["lat_range"])
        lon = rng.uniform(*region["lon_range"])
        
        # Availability
        days_until_free = rng.choice([0, 0, 0, 1, 2, 3, 5, 7, 10, 14], p=[0.25, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05])
        
        consumption = v_info["consumption_mt_day"] * (1 + age * 0.01 + rng.normal(0, 0.03))
        
        vessel = {
            "id": f"V{i+1:03d}",
            "name": f"{rng.choice(vessel_names_prefix)}{vessel_names[i]}",
            "vessel_class": vessel_class,
            "dwt": dwt,
            "age_years": age,
            "speed_knots": v_info["speed_knots"] - age * 0.05 + rng.normal(0, 0.2),
            "consumption_laden_mt_day": round(consumption, 1),
            "consumption_ballast_mt_day": round(consumption * 0.85, 1),
            "daily_opex": v_info["daily_opex"] + age * 50,
            "current_position": {"lat": round(lat, 2), "lon": round(lon, 2), "region": region["name"]},
            "days_until_available": days_until_free,
            "flag": rng.choice(["Panama", "Liberia", "Marshall Islands", "Hong Kong", "Singapore", "Greece"]),
            "built_year": 2026 - age,
            "beam_m": v_info["beam"] + rng.uniform(-0.5, 0.5),
            "max_draft_m": round(rng.uniform(12, 18) if vessel_class != "Capesize" else rng.uniform(17, 21), 1),
            "imo_number": f"{rng.randint(9000000, 9999999)}",
            "hire_rate_per_day": round(v_info["daily_opex"] * rng.uniform(1.4, 2.2)),
            "eu_ets_compliant": bool(rng.choice([True, False], p=[0.7, 0.3])),
        }
        vessels.append(vessel)
    
    return vessels


def save_data(output_dir: str = None):
    """Generate and save all data files."""
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate training data
    print("Generating training data (3 years, ~50k records)...")
    df = generate_training_data()
    df.to_csv(os.path.join(output_dir, "freight_training_data.csv"), index=False)
    print(f"  Saved {len(df)} records to freight_training_data.csv")
    
    # Generate vessel pool
    print("Generating vessel pool (30 vessels)...")
    vessels = generate_vessel_pool()
    with open(os.path.join(output_dir, "vessel_pool.json"), "w") as f:
        json.dump(vessels, f, indent=2, default=lambda o: int(o) if hasattr(o, 'dtype') and 'int' in str(o.dtype) else float(o) if hasattr(o, 'dtype') and 'float' in str(o.dtype) else str(o))
    print(f"  Saved {len(vessels)} vessels to vessel_pool.json")
    
    # Save reference data
    ref_data = {
        "loading_ports": LOADING_PORTS,
        "discharge_ports": DISCHARGE_PORTS,
        "vessel_classes": VESSEL_CLASSES,
        "cargo_types": CARGO_TYPES,
        "route_distances": {f"{k[0]}|{k[1]}": v for k, v in ROUTE_DISTANCES.items()},
    }
    with open(os.path.join(output_dir, "reference_data.json"), "w") as f:
        json.dump(ref_data, f, indent=2, default=str)
    print("  Saved reference_data.json")
    
    print("Data generation complete!")
    return df, vessels


if __name__ == "__main__":
    save_data()
