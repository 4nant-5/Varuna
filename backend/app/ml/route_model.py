import math
import random

class MaritimeRouteOptimizer:
    """
    ML Route Optimization Engine (Simulated for MVP).
    In a real-world scenario, this would interface with a Navigational Mesh,
    A* pathfinding algorithms avoiding landmasses, and predictive weather modeling.
    """
    
    # Predefined Port Coordinates (Lat, Lon)
    PORT_COORDS = {
        "Port Hedland, Australia": (-20.31, 118.57),
        "Hay Point, Australia": (-21.26, 149.30),
        "Gladstone, Australia": (-23.83, 151.25),
        "Newcastle, Australia": (-32.92, 151.78),
        "Tubarao, Brazil": (-20.28, -40.23),
        "Ponta da Madeira, Brazil": (-2.56, -44.37),
        "Richards Bay, South Africa": (-28.80, 32.08),
        "Saldanha Bay, South Africa": (-33.02, 17.98),
        "Tanjung Bara, Indonesia": (0.53, 117.65),
        "Muara Pantai, Indonesia": (2.12, 117.80),
        "Paradip, India": (20.26, 86.67),
        "Dhamra, India": (20.81, 87.05),
        "Haldia, India": (22.02, 88.06),
        "Visakhapatnam, India": (17.69, 83.28)
    }

    def __init__(self):
        self.weather_anomalies = ["Typhoon Risk", "Heavy Swell", "Monsoon Headwinds", "Clear", "Clear", "Clear"]
        
    def _generate_great_circle_waypoints(self, start_lat, start_lon, end_lat, end_lon, num_points=10, origin_region="", dest_region=""):
        """Generate intermediate waypoints avoiding major landmasses for specific routes."""
        via_points = []
        
        # Simple heuristics for major trade lanes to avoid land
        if "Australia" in origin_region and "India" in dest_region:
            # Route via Sunda Strait/South of Java to avoid Indonesian archipelago
            via_points = [[-10.0, 110.0], [-6.0, 105.0], [5.0, 95.0]]
        elif "Brazil" in origin_region and "India" in dest_region:
            # Route via Cape of Good Hope
            via_points = [[-35.0, 20.0], [-35.0, 45.0], [5.0, 75.0]]
        elif "South Africa" in origin_region and "India" in dest_region:
            # Route South of Madagascar
            via_points = [[-30.0, 40.0], [-10.0, 65.0]]
        elif "Indonesia" in origin_region and "India" in dest_region:
            # Route via Malacca Strait or Andaman Sea
            via_points = [[5.8, 97.5], [10.0, 93.0]]
            
        full_path = [[start_lat, start_lon]] + via_points + [[end_lat, end_lon]]
        waypoints = []
        segments = len(full_path) - 1
        points_per_segment = max(2, num_points // segments)
        
        for s in range(segments):
            p1 = full_path[s]
            p2 = full_path[s+1]
            for i in range(points_per_segment):
                fraction = i / points_per_segment
                lat = p1[0] + (p2[0] - p1[0]) * fraction
                lon = p1[1] + (p2[1] - p1[1]) * fraction
                if not (s == 0 and i == 0): 
                    lat += random.uniform(-0.3, 0.3)
                    lon += random.uniform(-0.3, 0.3)
                waypoints.append([lat, lon])
                
        waypoints.append([end_lat, end_lon])
        return waypoints
        
    def _calculate_distance_nm(self, start_lat, start_lon, end_lat, end_lon):
        """Calculate approximate distance in nautical miles using Haversine."""
        R = 3440.065 # Radius of earth in nautical miles
        lat1, lon1, lat2, lon2 = map(math.radians, [start_lat, start_lon, end_lat, end_lon])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def predict_route(self, origin, destination, vessel_speed=13.5):
        """
        Main ML prediction function. Returns waypoints, ETA, distance, and environmental factors.
        """
        # Cleanup input port names in case they have commas
        clean_origin = origin.split(",")[0].strip() if origin else "Port Hedland"
        clean_dest = destination.split(",")[0].strip() if destination else "Paradip"
        
        # Find closest match in PORT_COORDS or default
        start_key = next((k for k in self.PORT_COORDS.keys() if clean_origin in k), "Port Hedland, Australia")
        end_key = next((k for k in self.PORT_COORDS.keys() if clean_dest in k), "Paradip, India")
        
        start_coords = self.PORT_COORDS.get(start_key)
        end_coords = self.PORT_COORDS.get(end_key)
        
        # 1. Generate Waypoints avoiding land
        waypoints = self._generate_great_circle_waypoints(
            start_coords[0], start_coords[1], 
            end_coords[0], end_coords[1],
            num_points=15,
            origin_region=origin,
            dest_region=destination
        )
        
        # 2. Distance Calculation
        distance_nm = self._calculate_distance_nm(start_coords[0], start_coords[1], end_coords[0], end_coords[1])
        # Add typical routing overhead (avoiding land)
        distance_nm *= 1.15 
        
        # 3. Simulate Weather Impact on Speed
        weather = random.choice(self.weather_anomalies)
        speed_modifier = 0.85 if weather != "Clear" else 1.0
        effective_speed = vessel_speed * speed_modifier
        
        # 4. ETA & Fuel Calculation
        sea_days = distance_nm / (effective_speed * 24)
        daily_fuel_consumption = 32.0 # Baseline Panamax
        total_fuel = sea_days * daily_fuel_consumption
        
        return {
            "origin": origin,
            "destination": destination,
            "waypoints": waypoints,
            "distance_nm": round(distance_nm, 1),
            "estimated_sea_days": round(sea_days, 1),
            "total_fuel_mt": round(total_fuel, 1),
            "weather_forecast": weather,
            "effective_speed_knots": round(effective_speed, 1),
            "confidence_score": random.randint(85, 98)
        }

route_optimizer = MaritimeRouteOptimizer()
