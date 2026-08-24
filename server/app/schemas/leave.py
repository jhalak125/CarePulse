from typing import Optional
from pydantic import BaseModel

class ApplyLeaveRequest(BaseModel):
    doctorId: Optional[str] = None
    startDate: str
    endDate: str
    reason: str

class PreviewLeaveRequest(BaseModel):
    doctorId: Optional[str] = None
    startDate: str
    endDate: str
