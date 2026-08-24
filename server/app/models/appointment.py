import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Appointment(Base):
    __tablename__ = "Appointment"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String, ForeignKey("DoctorProfile.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String, nullable=False)        # HH:mm
    end_time = Column(String, nullable=False)          # HH:mm
    status = Column(String, default="CONFIRMED", nullable=False, index=True)  # CONFIRMED, COMPLETED, CANCELLED_PATIENT, CANCELLED_DOCTOR_LEAVE, RESCHEDULED
    
    # Symptom & Intake
    symptoms = Column(Text, nullable=True)
    urgency_level = Column(String, default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    chief_complaint = Column(Text, nullable=True)
    suggested_questions = Column(Text, nullable=True)  # JSON string array
    ai_triage_summary = Column(Text, nullable=True)
    
    # Post-visit care plan
    clinical_notes = Column(Text, nullable=True)
    post_visit_summary = Column(Text, nullable=True)
    follow_up_steps = Column(Text, nullable=True)     # JSON string array
    
    # Integrations & Reminders
    google_calendar_event_id = Column(String, nullable=True)
    meet_link = Column(String, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    reminder_sent_24h = Column(Boolean, default=False)
    reminder_sent_2h = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="patient_appointments")
    doctor = relationship("DoctorProfile", foreign_keys=[doctor_id], back_populates="appointments")
    prescriptions = relationship("Prescription", back_populates="appointment", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_doctor_date_status", "doctor_id", "date", "status"),
    )

class SlotHold(Base):
    __tablename__ = "SlotHold"

    id = Column(String, primary_key=True, default=generate_uuid)
    doctor_id = Column(String, ForeignKey("DoctorProfile.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False, index=True)      # YYYY-MM-DD
    start_time = Column(String, nullable=False)            # HH:mm
    end_time = Column(String, nullable=False)              # HH:mm
    expires_at = Column(DateTime, nullable=False, index=True)
    status = Column(String, default="ACTIVE", nullable=False)  # ACTIVE, EXPIRED, CONFIRMED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctor = relationship("DoctorProfile", back_populates="slot_holds")
    patient = relationship("User", back_populates="slot_holds")
