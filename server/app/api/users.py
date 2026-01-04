"""
User Management API Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth_service import update_user
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter()


def user_to_response(user: User) -> UserResponse:
    """Convert User document to UserResponse schema"""
    import json
    user_json = user.model_dump_json(exclude={"hashed_password"})
    user_dict = json.loads(user_json)
    user_dict["id"] = str(user.id)
    user_dict.pop("_id", None)
    return UserResponse.model_validate(user_dict)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update current user profile
    
    Allows users to update their profile information including:
    - Personal info (first_name, last_name, gender, avatar_url)
    - Learning preferences (learning_style, preferred_subjects, difficulty_level, accessibility_needs, language)
    - Settings (timezone, parental_consent, consent_date)
    
    Only provided fields will be updated. Fields set to null will clear those values.
    """
    try:
        # Update user
        updated_user = await update_user(current_user, update_data)
        
        # Return updated user
        return user_to_response(updated_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating profile: {str(e)}"
        )

