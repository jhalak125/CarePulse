import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="PATIENT", nullable=False)  # PATIENT, DOCTOR, ADMIN
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    patient_appointments = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")
    slot_holds = relationship("SlotHold", back_populates="patient")
    medication_reminders = relationship("MedicationReminder", back_populates="patient")
    google_oauth_token = relationship("GoogleOAuthToken", back_populates="user", uselist=False, cascade="all, delete-orphan")

class DoctorProfile(Base):
    __tablename__ = "DoctorProfile"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialisation = Column(String, nullable=False)
    experience_years = Column(Integer, default=5)
    consultation_fee = Column(Float, default=500.0)
    slot_duration_minutes = Column(Integer, default=30)
    working_hours_start = Column(String, default="09:00")
    working_hours_end = Column(String, default="17:00")
    break_start = Column(String, default="13:00")
    break_end = Column(String, default="14:00")
    working_days = Column(String, default="Monday,Tuesday,Wednesday,Thursday,Friday")
    bio = Column(Text, nullable=True)
    rating = Column(Float, default=4.8)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", foreign_keys="Appointment.doctor_id", back_populates="doctor")
    slot_holds = relationship("SlotHold", back_populates="doctor")
    leaves = relationship("DoctorLeave", back_populates="doctor")
