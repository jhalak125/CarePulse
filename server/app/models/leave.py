import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class DoctorLeave(Base):
    __tablename__ = "DoctorLeave"

    id = Column(String, primary_key=True, default=generate_uuid)
    doctor_id = Column(String, ForeignKey("DoctorProfile.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    end_date = Column(String, nullable=False, index=True)    # YYYY-MM-DD
    reason = Column(Text, nullable=False)
    status = Column(String, default="APPROVED", nullable=False)
    affected_appointments_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctor = relationship("DoctorProfile", back_populates="leaves")
