import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Prescription(Base):
    __tablename__ = "Prescription"

    id = Column(String, primary_key=True, default=generate_uuid)
    appointment_id = Column(String, ForeignKey("Appointment.id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration_days = Column(Integer, default=7)
    instructions = Column(Text, nullable=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    appointment = relationship("Appointment", back_populates="prescriptions")
    reminders = relationship("MedicationReminder", back_populates="prescription", cascade="all, delete-orphan")

class MedicationReminder(Base):
    __tablename__ = "MedicationReminder"

    id = Column(String, primary_key=True, default=generate_uuid)
    prescription_id = Column(String, ForeignKey("Prescription.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    scheduled_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    scheduled_time = Column(String, nullable=False)              # HH:mm
    status = Column(String, default="PENDING", nullable=False)   # PENDING, TAKEN, SKIPPED, SENT
    sent_at = Column(DateTime, nullable=True)
    taken_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prescription = relationship("Prescription", back_populates="reminders")
    patient = relationship("User", back_populates="medication_reminders")
