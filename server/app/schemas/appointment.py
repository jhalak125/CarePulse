from typing import Optional, List
from pydantic import BaseModel

class HoldSlotRequest(BaseModel):
    doctorId: str
    date: str
    startTime: str
    endTime: str

class ConfirmBookingRequest(BaseModel):
    holdId: str
    symptoms: str

class RescheduleRequest(BaseModel):
    newDate: str
    newStartTime: str
    newEndTime: str

class CancelRequest(BaseModel):
    reason: Optional[str] = None

class PrescriptionInput(BaseModel):
    medicationName: str
    dosage: str
    frequency: str
    durationDays: int
    instructions: Optional[str] = None

class ConsultationRequest(BaseModel):
    clinicalNotes: str
    prescriptions: Optional[List[PrescriptionInput]] = []
