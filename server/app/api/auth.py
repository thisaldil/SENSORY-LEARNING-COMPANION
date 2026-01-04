"""
Authentication API Routes
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserSignup, UserResponse, UserLogin, LoginResponse
from app.services.auth_service import register_user, login_user
from app.models.user import User
from app.utils.security import create_access_token

router = APIRouter()


def user_to_response(user: User) -> UserResponse:
    """Convert User document to UserResponse schema"""
    import json
    user_json = user.model_dump_json(exclude={"hashed_password"})
    user_dict = json.loads(user_json)
    user_dict["id"] = str(user.id)
    user_dict.pop("_id", None)
    return UserResponse.model_validate(user_dict)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserSignup):
    """
    User registration endpoint
    
    Creates a new user account with the provided information.
    Only minimal fields are required for signup.
    Additional profile details can be updated later in profile settings.
    """
    try:
        user = await register_user(user_data)
        return user_to_response(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin):
    """
    User login endpoint
    
    Authenticates a user with email and password, returns JWT token and user data.
    """
    try:
        # Authenticate user
        user = await login_user(credentials.email, credentials.password)
        
        # Create JWT token
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(data=token_data)
        
        # Convert user to response
        user_response = user_to_response(user)
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during login: {str(e)}"
        )


@router.post("/refresh")
async def refresh_token():
    """Refresh JWT token endpoint"""
    # TODO: Implement token refresh
    return {"message": "Refresh token endpoint - TODO"}


@router.post("/logout")
async def logout():
    """User logout endpoint"""
    # TODO: Implement user logout
    return {"message": "Logout endpoint - TODO"}
