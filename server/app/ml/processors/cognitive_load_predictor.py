"""
Cognitive Load Predictor
Load trained model and predict cognitive load from behavioral features
"""
import os
import json
import numpy as np
from typing import Dict, Optional, Tuple
from pathlib import Path
from app.config import settings

try:
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("⚠️  TensorFlow not available. Please install tensorflow.")


class CognitiveLoadPredictor:
    """Predict cognitive load from behavioral features"""
    
    def __init__(self):
        self.model = None
        self.feature_order = None
        self.load_model()
    
    def load_model(self):
        """Load the trained cognitive load model and feature order"""
        if not TENSORFLOW_AVAILABLE:
            print("⚠️  TensorFlow is not available. Cannot load model.")
            return
            
        models_dir = Path(settings.ML_MODELS_DIR)
        
        model_path = models_dir / "cognitive_load_model" / "cognitive_load_model.h5"
        features_path = models_dir / "cognitive_load_model" / "feature_order.json"
        
        try:
            if model_path.exists():
                self.model = keras.models.load_model(model_path)
                print(f"✅ Loaded model from '{model_path.name}'")
            else:
                print(f"⚠️  Model not found at {model_path}. Please train the model first.")
                return
            
            if features_path.exists():
                with open(features_path, 'r') as f:
                    self.feature_order = json.load(f)
                print(f"✅ Loaded feature order from '{features_path.name}'")
            else:
                print(f"⚠️  Feature order not found at {features_path}")
                
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            raise
    
    def predict(self, features: Dict[str, float]) -> Tuple[str, float, Dict[str, float]]:
        """
        Predict cognitive load from features
        
        Args:
            features: Dictionary of feature names and values
            
        Returns:
            Tuple of (predicted_load, confidence, confidence_scores)
            predicted_load: "Low", "Medium", or "High"
            confidence: Prediction confidence (0-1)
            confidence_scores: Dictionary with confidence scores for each class
        """
        if self.model is None:
            raise ValueError("Model not loaded. Please ensure model files are in place.")
        
        if self.feature_order is None:
            raise ValueError("Feature order not loaded. Please ensure feature_order.json exists.")
        
        # Convert features dict to array in the correct order
        feature_array = []
        for feature_name in self.feature_order:
            value = features.get(feature_name, 0.0)
            feature_array.append(float(value))
        
        # Convert to numpy array and reshape for single sample
        X = np.array(feature_array).reshape(1, -1)
        
        # Predict probabilities
        probabilities = self.model.predict(X, verbose=0)[0]
        
        # Get predicted class (index with highest probability)
        predicted_class = int(np.argmax(probabilities))
        
        # Map prediction to label
        load_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        predicted_load = load_mapping.get(predicted_class, 'Medium')
        
        # Get confidence (max probability)
        confidence = float(np.max(probabilities))
        
        # Create confidence scores dictionary
        confidence_scores = {
            'Low': float(probabilities[0]),
            'Medium': float(probabilities[1]),
            'High': float(probabilities[2])
        }
        
        return predicted_load, confidence, confidence_scores
    
    def is_ready(self) -> bool:
        """Check if model is loaded and ready"""
        return (
            self.model is not None and
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


def predict_cognitive_load(features: Dict[str, float]) -> Tuple[str, float, Dict[str, float]]:
    """
    Main function to predict cognitive load from features
    
    Args:
        features: Dictionary of feature names and values
        
    Returns:
        Tuple of (predicted_load, confidence, confidence_scores)
        predicted_load: "Low", "Medium", or "High"
        confidence: Prediction confidence (0-1)
        confidence_scores: Dictionary with confidence scores for each class
    """
    predictor = get_predictor()
    return predictor.predict(features)

