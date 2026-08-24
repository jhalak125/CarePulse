from typing import Optional, List
from pydantic import BaseModel

class UserBrief(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None

class DoctorProfileResponse(BaseModel):
    id: str
    userId: str
    specialisation: str
    experienceYears: int
    consultationFee: float
    slotDurationMinutes: int
    workingHoursStart: str
    workingHoursEnd: str
    breakStart: str
    breakEnd: str
    workingDays: str
    bio: Optional[str] = None
    rating: float
    user: UserBrief

class SlotResponse(BaseModel):
    startTime: str
    endTime: str
    status: str  # AVAILABLE, HELD, BOOKED
    heldByCurrentUser: Optional[bool] = False
