from typing import Optional
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "PATIENT"
    phone: Optional[str] = None
    specialisation: Optional[str] = None
    experienceYears: Optional[int] = 5
    consultationFee: Optional[float] = 600.0

class LoginRequest(BaseModel):
    email: str
    password: str

class DemoLoginRequest(BaseModel):
    role: Optional[str] = "PATIENT"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None
    doctorProfileId: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    token: Optional[str] = None
    user: Optional[UserResponse] = None
