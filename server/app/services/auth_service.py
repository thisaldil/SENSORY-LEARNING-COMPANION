"""
Authentication Service
"""
from datetime import datetime
from app.models.user import User
from app.schemas.user import UserSignup, UserUpdate
from app.utils.security import get_password_hash, verify_password, create_access_token

async def register_user(user_data: UserSignup) -> User:
    """
    Register a new user
    
    Args:
        user_data: User signup data
        
    Returns:
        Created user object
        
    Raises:
        ValueError: If email or username already exists
    """
    # Check if email already exists
    existing_user = await User.find_one({"email": user_data.email})
    if existing_user:
        raise ValueError("Email already registered")
    
    # Check if username already exists
    existing_user = await User.find_one({"username": user_data.username})
    if existing_user:
        raise ValueError("Username already taken")
    
    # Create new user with hashed password
    # user_data.date_of_birth is already a datetime (Pydantic parses date strings as datetime)
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        date_of_birth=user_data.date_of_birth,  # Already a datetime object
        gender=user_data.gender.value if user_data.gender else None,
        # Set default values for fields not in signup
        language="en",
        email_verified=False,
        is_active=True,
        parental_consent=False,  # Will be set based on age verification later
    )
    
    # Save user to database
    await user.insert()
    
    return user


async def login_user(email: str, password: str) -> User:
    """
    Authenticate a user and return the user object
    
    Args:
        email: User email
        password: Plain text password
        
    Returns:
        Authenticated user object
        
    Raises:
        ValueError: If email/password is invalid or user is inactive
    """
    # Find user by email
    user = await User.find_one({"email": email})
    if not user:
        raise ValueError("Invalid email or password")
    
    # Check if user is active
    if not user.is_active:
        raise ValueError("User account is inactive")
    
    # Verify password
    if not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    
    # Update last_login timestamp
    user.last_login = datetime.utcnow()
    await user.save()
    
    return user


async def update_user(user: User, update_data: UserUpdate) -> User:
    """
    Update user profile data
    
    Args:
        user: User object to update
        update_data: UserUpdate schema with fields to update
        
    Returns:
        Updated user object
    """
    from enum import Enum
    
    # Convert update_data to dict, excluding unset values but including None
    update_dict = update_data.model_dump(exclude_unset=True, exclude_none=False)
    
    # Handle enum fields - convert to string values
    if "gender" in update_dict and update_dict["gender"] is not None:
        if isinstance(update_dict["gender"], Enum):
            update_dict["gender"] = update_dict["gender"].value
    
    if "learning_style" in update_dict and update_dict["learning_style"] is not None:
        if isinstance(update_dict["learning_style"], Enum):
            update_dict["learning_style"] = update_dict["learning_style"].value
    
    if "difficulty_level" in update_dict and update_dict["difficulty_level"] is not None:
        if isinstance(update_dict["difficulty_level"], Enum):
            update_dict["difficulty_level"] = update_dict["difficulty_level"].value
    
    # Update only provided fields
    for field, value in update_dict.items():
        setattr(user, field, value)  # Set the value (can be None to clear fields)
    
    # Update updated_at timestamp
    user.updated_at = datetime.utcnow()
    
    # Save changes
    await user.save()
    
    return user
