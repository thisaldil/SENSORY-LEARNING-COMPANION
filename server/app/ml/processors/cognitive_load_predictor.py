"""
Cognitive Load Predictor
Load trained model and predict cognitive load from behavioral features
"""
import os
import json
import joblib
import numpy as np
from typing import Dict, Optional, Tuple
from pathlib import Path
from app.config import settings


class CognitiveLoadPredictor:
    """Predict cognitive load from behavioral features"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_order = None
        self.load_model()
    
    def load_model(self):
        """Load the trained cognitive load model, scaler, and feature order"""
        models_dir = Path(settings.ML_MODELS_DIR)
        
        model_path = models_dir / "cognitive_load_model" / "cognitive_load_model.pkl"
        scaler_path = models_dir / "cognitive_load_model" / "scaler.pkl"
        features_path = models_dir / "cognitive_load_model" / "feature_order.json"
        
        try:
            if model_path.exists():
                self.model = joblib.load(model_path)
                print(f"✅ Loaded cognitive load model from {model_path}")
            else:
                print(f"⚠️  Model not found at {model_path}. Please train the model first.")
                return
            
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                print(f"✅ Loaded scaler from {scaler_path}")
            else:
                print(f"⚠️  Scaler not found at {scaler_path}")
            
            if features_path.exists():
                with open(features_path, 'r') as f:
                    self.feature_order = json.load(f)
                print(f"✅ Loaded feature order from {features_path}")
            else:
                print(f"⚠️  Feature order not found at {features_path}")
                
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            raise
    
    def predict(self, features: Dict[str, float]) -> Tuple[str, float]:
        """
        Predict cognitive load from features
        
        Args:
            features: Dictionary of feature names and values
            
        Returns:
            Tuple of (predicted_load, confidence)
            predicted_load: "Low", "Medium", or "High"
            confidence: Prediction confidence (0-1)
        """
        if self.model is None:
            raise ValueError("Model not loaded. Please ensure model files are in place.")
        
        if self.scaler is None:
            raise ValueError("Scaler not loaded. Please ensure scaler file is in place.")
        
        if self.feature_order is None:
            raise ValueError("Feature order not loaded. Please ensure feature_order.json exists.")
        
        # Convert features dict to array in the correct order
        feature_array = []
        for feature_name in self.feature_order:
            value = features.get(feature_name, 0.0)
            feature_array.append(value)
        
        # Convert to numpy array and reshape for single sample
        X = np.array(feature_array).reshape(1, -1)
        
        # Scale features (suppress warnings about feature names)
        import warnings
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
            X_scaled = self.scaler.transform(X)
        
        # Predict
        prediction = self.model.predict(X_scaled)[0]
        
        # Get prediction probabilities for confidence
        probabilities = self.model.predict_proba(X_scaled)[0]
        confidence = float(np.max(probabilities))
        
        # Map prediction to label
        load_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        predicted_load = load_mapping.get(prediction, 'Medium')
        
        return predicted_load, confidence
    
    def is_ready(self) -> bool:
        """Check if model is loaded and ready"""
        return (
            self.model is not None and
            self.scaler is not None and
            self.feature_order is not None
        )


# Global predictor instance
_predictor_instance: Optional[CognitiveLoadPredictor] = None


def get_predictor() -> CognitiveLoadPredictor:
    """Get or create the global predictor instance"""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = CognitiveLoadPredictor()
    return _predictor_instance


def predict_cognitive_load(features: Dict[str, float]) -> Tuple[str, float]:
    """
    Main function to predict cognitive load from features
    
    Args:
        features: Dictionary of feature names and values
        
    Returns:
        Tuple of (predicted_load, confidence)
    """
    predictor = get_predictor()
    return predictor.predict(features)

