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
            print("⚠️  TensorFlow is not available. Cannot load model. Will use fallback heuristic.")
            return
            
        models_dir = Path(settings.ML_MODELS_DIR)
        
        model_path = models_dir / "cognitive_load_model" / "cognitive_load_model.h5"
        features_path = models_dir / "cognitive_load_model" / "feature_order.json"
        
        try:
            if model_path.exists():
                self.model = keras.models.load_model(model_path)
                print(f"✅ Loaded model from '{model_path.name}'")
            else:
                print(f"⚠️  Model not found at {model_path}. Will use fallback heuristic.")
                return
            
            if features_path.exists():
                with open(features_path, 'r') as f:
                    self.feature_order = json.load(f)
                print(f"✅ Loaded feature order from '{features_path.name}'")
            else:
                print(f"⚠️  Feature order not found at {features_path}. Will use fallback heuristic.")
                
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            print("⚠️  Will use fallback heuristic for cognitive load prediction.")
            self.model = None
            # Try to still load feature order for reference
            try:
                if features_path.exists():
                    with open(features_path, 'r') as f:
                        self.feature_order = json.load(f)
            except Exception:
                pass
    
    def _predict_fallback(self, features: Dict[str, float]) -> Tuple[str, float, Dict[str, float]]:
        """
        Fallback heuristic-based prediction when model is not available
        
        Uses simple rules based on behavioral features to estimate cognitive load:
        - High load: Low accuracy, high errors, many answer changes, high variability
        - Medium load: Medium accuracy, some errors
        - Low load: High accuracy, few errors, low variability
        
        Args:
            features: Dictionary of feature names and values
            
        Returns:
            Tuple of (predicted_load, confidence, confidence_scores)
        """
        # Extract key features
        accuracy_rate = features.get('accuracyRate', 0.5)
        errors = features.get('errors', 0.0)
        answer_changes = features.get('answerChanges', 0.0)
        error_streak = features.get('currentErrorStreak', 0.0)
        response_variability = features.get('responseTimeVariability', 0.0)
        idle_gaps = features.get('idleGapsOverThreshold', 0.0)
        
        # Calculate a cognitive load score (0-100, higher = more load)
        load_score = 0.0
        
        # Accuracy component (inverse: lower accuracy = higher load)
        load_score += (1.0 - accuracy_rate) * 40.0
        
        # Error component
        if errors > 0:
            load_score += min(errors * 5.0, 20.0)
        
        # Answer changes component (indicates uncertainty)
        load_score += min(answer_changes * 2.0, 15.0)
        
        # Error streak component
        load_score += min(error_streak * 3.0, 10.0)
        
        # Response variability component (high variability = struggling)
        load_score += min(response_variability * 5.0, 10.0)
        
        # Idle gaps component (many long pauses = difficulty)
        load_score += min(idle_gaps * 2.0, 5.0)
        
        # Normalize to 0-100
        load_score = min(load_score, 100.0)
        
        # Map to cognitive load levels
        if load_score >= 70:
            predicted_load = 'High'
            confidence = 0.75
            confidence_scores = {'Low': 0.05, 'Medium': 0.20, 'High': 0.75}
        elif load_score >= 40:
            predicted_load = 'Medium'
            confidence = 0.70
            confidence_scores = {'Low': 0.15, 'Medium': 0.70, 'High': 0.15}
        else:
            predicted_load = 'Low'
            confidence = 0.75
            confidence_scores = {'Low': 0.75, 'Medium': 0.20, 'High': 0.05}
        
        return predicted_load, confidence, confidence_scores
    
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
        # Use fallback if model is not available
        if self.model is None:
            return self._predict_fallback(features)
        
        if self.feature_order is None:
            # Try to use fallback if feature order is missing
            return self._predict_fallback(features)
        
        try:
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
        except Exception as e:
            print(f"⚠️  Error during model prediction: {str(e)}. Falling back to heuristic.")
            return self._predict_fallback(features)
    
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

