"""
Cognitive Load Predictor
Load trained model and predict cognitive load from behavioral features.
Supports both Keras (.h5) and scikit-learn (joblib .pkl or pickle-in-.h5) models.
"""
import json
import warnings

import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple, Any
from pathlib import Path
from app.config import settings

# Resolve model dir relative to project root (server/) so it works regardless of CWD
# __file__ = server/app/ml/processors/cognitive_load_predictor.py -> parent^4 = server
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_MODELS_DIR = _PROJECT_ROOT / settings.ML_MODELS_DIR
_COGNITIVE_LOAD_DIR = _MODELS_DIR / "cognitive_load_model"

try:
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

try:
    from sklearn.exceptions import InconsistentVersionWarning
except ImportError:
    InconsistentVersionWarning = type("InconsistentVersionWarning", (UserWarning,), {})


class CognitiveLoadPredictor:
    """Predict cognitive load from behavioral features"""

    def __init__(self):
        self.model: Any = None
        self.feature_order: Optional[list] = None
        self._model_kind: str = "none"  # "keras" | "sklearn" | "none"
        self._sklearn_classes: Optional[list] = None  # class order for predict_proba
        self.load_model()

    def load_model(self):
        """Load the trained cognitive load model and feature order."""
        features_path = _COGNITIVE_LOAD_DIR / "feature_order.json"
        if features_path.exists():
            try:
                with open(features_path, "r", encoding="utf-8") as f:
                    self.feature_order = json.load(f)
                print(f"✅ Loaded feature order from '{features_path.name}'")
            except Exception as e:
                print(f"⚠️  Could not load feature order: {e}. Will use fallback heuristic.")
        else:
            print(f"⚠️  Feature order not found at {features_path}. Will use fallback heuristic.")

        h5_path = _COGNITIVE_LOAD_DIR / "cognitive_load_model.h5"
        pkl_path = _COGNITIVE_LOAD_DIR / "cognitive_load_model.pkl"

        # 1) Try Keras .h5 (real HDF5 file)
        if TENSORFLOW_AVAILABLE and h5_path.exists():
            try:
                self.model = keras.models.load_model(h5_path)
                self._model_kind = "keras"
                print(f"✅ Loaded Keras model from '{h5_path.name}'")
                return
            except Exception as e:
                err = str(e).lower()
                # .h5 is often a misnamed pickle (e.g. from Git LFS or wrong save)
                if "file signature not found" in err or "unable to synchronously open" in err:
                    if JOBLIB_AVAILABLE:
                        try:
                            with warnings.catch_warnings():
                                warnings.simplefilter("ignore", InconsistentVersionWarning)
                                self.model = joblib.load(h5_path)
                            if hasattr(self.model, "predict_proba"):
                                self._model_kind = "sklearn"
                                self._sklearn_classes = getattr(
                                    self.model, "classes_", ["Low", "Medium", "High"]
                                )
                                print(f"✅ Loaded sklearn model from '{h5_path.name}' (file was pickle format)")
                                return
                        except Exception:
                            pass
                self.model = None
                print(f"⚠️  Could not load '{h5_path.name}' as Keras model: {e}")

        # 2) Try .pkl as sklearn/joblib model
        if JOBLIB_AVAILABLE and pkl_path.exists():
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", InconsistentVersionWarning)
                    self.model = joblib.load(pkl_path)
                if hasattr(self.model, "predict_proba"):
                    self._model_kind = "sklearn"
                    self._sklearn_classes = getattr(
                        self.model, "classes_", ["Low", "Medium", "High"]
                    )
                    print(f"✅ Loaded sklearn model from '{pkl_path.name}'")
                    return
            except Exception as e:
                print(f"⚠️  Could not load '{pkl_path.name}': {e}")

        if self.model is None:
            print("⚠️  No model loaded. Will use fallback heuristic for cognitive load prediction.")
    
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

        Returns:
            Tuple of (predicted_load, confidence, confidence_scores)
            predicted_load: "Low", "Medium", or "High"
            confidence: Prediction confidence (0-1)
            confidence_scores: Dictionary with confidence scores for each class
        """
        if self.model is None or self.feature_order is None:
            return self._predict_fallback(features)

        try:
            feature_array = [
                float(features.get(name, 0.0)) for name in self.feature_order
            ]

            if self._model_kind == "sklearn":
                # Pass DataFrame with feature names so sklearn doesn't warn and column order is explicit
                X = pd.DataFrame(
                    [feature_array],
                    columns=list(self.feature_order),
                )
                probabilities = self.model.predict_proba(X)[0]
                # Avoid "truth value of array is ambiguous": don't use (array or default)
                if self._sklearn_classes is None:
                    classes = ["Low", "Medium", "High"]
                else:
                    classes = list(np.atleast_1d(self._sklearn_classes))
                class_labels = [str(c).strip() for c in classes]
                idx = int(np.argmax(probabilities))
                predicted_load = class_labels[idx] if idx < len(class_labels) else "Medium"
                conf = np.max(probabilities)
                confidence = float(conf) if np.isscalar(conf) else float(conf.item())
                confidence_scores = {}
                for i in range(len(class_labels)):
                    p = probabilities[i]
                    confidence_scores[class_labels[i]] = float(p) if np.isscalar(p) else float(p.item())
                for key in ("Low", "Medium", "High"):
                    confidence_scores.setdefault(key, 0.0)
                return predicted_load, confidence, confidence_scores

            # Keras: numpy input
            X = np.array(feature_array).reshape(1, -1)
            probabilities = self.model.predict(X, verbose=0)[0]
            load_mapping = {0: "Low", 1: "Medium", 2: "High"}
            predicted_class = int(np.argmax(probabilities))
            predicted_load = load_mapping.get(predicted_class, "Medium")
            confidence = float(np.max(probabilities))
            confidence_scores = {
                "Low": float(probabilities[0]),
                "Medium": float(probabilities[1]),
                "High": float(probabilities[2]),
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

