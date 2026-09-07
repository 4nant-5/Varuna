"""
Train the freight forecasting model on generated data.
Run: python -m app.ml.train_model
"""

import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.ml.data_generator import save_data, generate_training_data
from app.ml.freight_model import FreightForecastModel


def main():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    model_path = os.path.join(data_dir, "freight_model.pkl")
    
    # Step 1: Generate data
    print("=" * 60)
    print("STEP 1: Generating Training Data")
    print("=" * 60)
    save_data(data_dir)
    
    # Step 2: Load and train
    print("\n" + "=" * 60)
    print("STEP 2: Training XGBoost Model")
    print("=" * 60)
    
    import pandas as pd
    df = pd.read_csv(os.path.join(data_dir, "freight_training_data.csv"))
    print(f"Loaded {len(df)} training records")
    print(f"Routes: {df['loading_port'].nunique()} loading ports → {df['discharge_port'].nunique()} discharge ports")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    model = FreightForecastModel()
    metrics = model.train(df)
    
    print("\n" + "=" * 60)
    print("TRAINING RESULTS")
    print("=" * 60)
    print(f"  MAE:  ${metrics['mae']:.2f}/MT")
    print(f"  RMSE: ${metrics['rmse']:.2f}/MT")
    print(f"  MAPE: {metrics['mape']:.1f}%")
    print(f"\nTop Features:")
    for feat, imp in list(metrics['feature_importance'].items())[:5]:
        print(f"  {feat}: {imp:.4f}")
    
    # Step 3: Save model
    model.save(model_path)
    
    # Step 4: Test prediction
    print("\n" + "=" * 60)
    print("STEP 3: Test Prediction")
    print("=" * 60)
    
    test_input = {
        "loading_port": "Port Hedland",
        "discharge_port": "Paradip",
        "cargo_type": "Iron Ore",
        "vessel_class": "Capesize",
        "quantity_mt": 170000,
        "distance_nm": 4250,
        "sea_days": 12.6,
        "port_days": 5.0,
        "bdi": 1500,
        "bunker_price": 580,
        "iron_ore_price": 110,
        "coking_coal_price": 220,
        "thermal_coal_price": 90,
        "steel_hrc_price": 580,
        "port_congestion": 30,
        "date": "2026-09-15",
    }
    
    result = model.predict(test_input)
    print(f"  Route: Port Hedland → Paradip (Capesize, 170K MT Iron Ore)")
    print(f"  Predicted Rate: ${result['predicted_rate']:.2f}/MT")
    print(f"  95% CI: ${result['confidence_interval']['lower']:.2f} — ${result['confidence_interval']['upper']:.2f}/MT")
    print(f"  Confidence: {result['confidence_pct']}%")
    
    print("\n✅ Model training complete!")


if __name__ == "__main__":
    main()
