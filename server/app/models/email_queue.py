import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class EmailQueue(Base):
    __tablename__ = "EmailQueue"

    id = Column(String, primary_key=True, default=generate_uuid)
    recipient = Column(String, nullable=False, index=True)
    recipient_name = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    template_type = Column(String, nullable=False)
    content_html = Column(Text, nullable=False)
    status = Column(String, default="PENDING", nullable=False, index=True)  # PENDING, SENT, FAILED
    attempts = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    next_attempt_at = Column(DateTime, default=datetime.utcnow, index=True)
    preview_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)

class GoogleOAuthToken(Base):
    __tablename__ = "GoogleOAuthToken"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    expiry_date = Column(DateTime, nullable=False)
    scope = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="google_oauth_token")
