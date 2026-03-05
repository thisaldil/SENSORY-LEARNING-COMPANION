"""
Calibration API – Baseline Neuro-Diagnostic Handshake

Takes aggregated interaction data from the three baseline tasks and computes
an initial cognitive load profile for the user.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.schemas.cognitive_load.calibration import CalibrationRequest, CalibrationResponse
from app.ml.processors.feature_extractor import extract_features_from_behavior_log
from app.ml.processors.cognitive_load_predictor import predict_cognitive_load
from app.utils.dependencies import get_current_user


router = APIRouter()


@router.post(
    "/calibration",
    response_model=CalibrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def calibrate_baseline(
    payload: CalibrationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Compute and store the user's baseline cognitive load profile.

    The mobile app should call this once after the three baseline tasks
    (NLP, Visual, Haptic) are completed and aggregated.
    """
    try:
        # Build a behavior-like dict so we can reuse the ML pipeline
        behavior_dict = {
            "total_time_seconds": payload.total_time_seconds,
            "total_questions": payload.total_questions,
            "question_interactions": payload.question_interactions or [],
            "back_navigations": payload.back_navigations,
            "forward_navigations": payload.forward_navigations,
            "answer_changes": payload.answer_changes,
            # Performance fields default to 0; calibration can be purely behavioral
            "correct_answers": 0,
            "incorrect_answers": 0,
        }

        features = extract_features_from_behavior_log(behavior_dict)
        predicted_load, confidence, _ = predict_cognitive_load(features)

        # Map model string labels to canonical discrete states
        label = (predicted_load or "").upper()
        if label.startswith("LOW"):
            state = "LOW"
        elif label.startswith("HIGH") or label.startswith("OVER"):
            state = "OVERLOAD"
        else:
            state = "OPTIMAL"

        # Derive a simple neuro profile label (can be made more sophisticated later)
        if current_user.learning_style:
            style = current_user.learning_style.lower()
            if style == "visual":
                profile_name = "Visual Learner"
            elif style == "auditory":
                profile_name = "Auditory Learner"
            elif style == "kinesthetic":
                profile_name = "Sensory-Tactile Learner"
            else:
                profile_name = "Multisensory Learner"
        else:
            profile_name = "Balanced Learner"

        # Compact calibration data snapshot (for quick dashboards / Brain Insights)
        calibration_data = {
            "avg_response_time": features.get("avgResponseTime"),
            "completion_time": features.get("completionTime"),
            "response_time_variability": features.get("responseTimeVariability"),
            "idle_gaps_over_threshold": features.get("idleGapsOverThreshold"),
            "answer_changes": features.get("answerChanges"),
        }

        # Persist on the user profile
        current_user.baseline_cognitive_load = state
        current_user.baseline_features = features
        current_user.is_calibrated = True
        current_user.neuro_profile = profile_name
        current_user.calibration_data = calibration_data
        await current_user.save()

        return CalibrationResponse(
            baseline_state=state,
            confidence=confidence,
            baseline_features=features,
            profile_name=profile_name,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing baseline calibration: {str(e)}",
        )

