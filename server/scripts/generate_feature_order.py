"""
Helper script to generate feature_order.json from training data
Run this after training your cognitive load model
"""
import pandas as pd
import json
import os
from pathlib import Path


def generate_feature_order_from_csv(csv_path: str, output_path: str = None):
    """
    Generate feature_order.json from training CSV
    
    Args:
        csv_path: Path to training CSV file
        output_path: Output path for feature_order.json (default: app/ml/models/feature_order.json)
    """
    # Read CSV
    df = pd.read_csv(csv_path)
    
    # Remove identifiers and target
    if 'Document ID' in df.columns:
        df.drop(columns=['Document ID'], inplace=True)
    
    # Remove leakage columns
    leakage_cols = ['totalScore', 'accuracyRate', 'errors', 'cognitiveLoad']
    df.drop(columns=[c for c in leakage_cols if c in df.columns], inplace=True)
    
    # Get feature order
    feature_order = list(df.columns)
    
    # Set output path
    if output_path is None:
        # Default to app/ml/models/feature_order.json
        script_dir = Path(__file__).parent
        project_root = script_dir.parent
        output_path = project_root / "app" / "ml" / "models" / "feature_order.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save feature order
    with open(output_path, 'w') as f:
        json.dump(feature_order, f, indent=2)
    
    print(f"✅ Feature order saved to: {output_path}")
    print(f"📊 Total features: {len(feature_order)}")
    print(f"📋 Features: {feature_order}")
    
    return feature_order


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python generate_feature_order.py <csv_path> [output_path]")
        print("\nExample:")
        print("  python generate_feature_order.py new22_dataset.csv")
        print("  python generate_feature_order.py new22_dataset.csv custom/path/feature_order.json")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found: {csv_path}")
        sys.exit(1)
    
    generate_feature_order_from_csv(csv_path, output_path)





