from app.models.user import User, DoctorProfile
from app.models.appointment import Appointment, SlotHold
from app.models.leave import DoctorLeave
from app.models.prescription import Prescription, MedicationReminder
from app.models.email_queue import EmailQueue, GoogleOAuthToken

__all__ = [
    "User",
    "DoctorProfile",
    "Appointment",
    "SlotHold",
    "DoctorLeave",
    "Prescription",
    "MedicationReminder",
    "EmailQueue",
    "GoogleOAuthToken",
]
