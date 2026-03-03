"""
Cognitive Load API – Real-time Classifier
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.schemas.cognitive import PredictRequest, PredictResponse
from app.ml.processors.feature_extractor import extract_features_from_behavior_log
from app.ml.processors.cognitive_load_predictor import predict_cognitive_load
from app.utils.dependencies import get_current_user


router = APIRouter()


@router.post(
    "/v1/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_cognitive_state(
    payload: PredictRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Predict current cognitive load from recent behavioral proxies.

    The app should call this after each mini-activity or section, then use the
    returned state to choose the next content variant (text/visual/haptics).
    """
    try:
        behavior_dict = {
            "total_time_seconds": payload.total_time_seconds,
            "total_questions": payload.total_questions,
            "question_interactions": payload.question_interactions or [],
            "back_navigations": payload.back_navigations,
            "forward_navigations": payload.forward_navigations,
            "answer_changes": payload.answer_changes,
            "correct_answers": payload.correct_answers,
            "incorrect_answers": payload.incorrect_answers,
        }

        features = extract_features_from_behavior_log(behavior_dict)
        predicted_load, confidence, _ = predict_cognitive_load(features)

        label = (predicted_load or "").upper()
        if label.startswith("LOW"):
            state = "LOW"
        elif label.startswith("HIGH") or label.startswith("OVER"):
            state = "OVERLOAD"
        else:
            state = "OPTIMAL"

        return PredictResponse(
            state=state,
            confidence=confidence,
            features=features,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error predicting cognitive load: {str(e)}",
        )

