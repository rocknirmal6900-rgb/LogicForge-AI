from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, field_validator
import re

LanguageType = Literal["python", "cpp", "java"]
ExperienceLevelType = Literal["beginner", "intermediate", "advanced"]
GoalType = Literal["college_exams", "dsa", "interview_prep", "general"]
ExplanationLangType = Literal["english", "hinglish"]

class UserPreferenceBase(BaseModel):
    preferred_language: LanguageType = "python"
    experience_level: ExperienceLevelType = "beginner"
    goal: GoalType = "dsa"
    explanation_language: ExplanationLangType = "english"

class UserPreferenceUpdate(UserPreferenceBase):
    pass

class UserPreferenceResponse(UserPreferenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    updated_at: datetime

class UserBase(BaseModel):
    email: str
    full_name: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email address format.")
        return v

class RegisterRequest(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    preferences: Optional[UserPreferenceResponse] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
