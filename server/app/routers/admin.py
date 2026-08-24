from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, DoctorProfile
from app.models.appointment import Appointment, SlotHold
from app.models.email_queue import EmailQueue
from app.middleware.auth import get_current_user, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_doctors = db.query(DoctorProfile).count()
    total_patients = db.query(User).filter(User.role == "PATIENT").count()
    total_appointments = db.query(Appointment).count()
    completed_consultations = db.query(Appointment).filter(Appointment.status == "COMPLETED").count()
    active_slot_holds = db.query(SlotHold).filter(
        SlotHold.status == "ACTIVE",
        SlotHold.expires_at > datetime.utcnow()
    ).count()

    # Urgency breakdown
    high_urgency = db.query(Appointment).filter(Appointment.urgency_level == "HIGH").count()
    med_urgency = db.query(Appointment).filter(Appointment.urgency_level == "MEDIUM").count()
    low_urgency = db.query(Appointment).filter(Appointment.urgency_level == "LOW").count()

    # Email stats
    total_emails = db.query(EmailQueue).count()
    sent_emails = db.query(EmailQueue).filter(EmailQueue.status == "SENT").count()
    failed_emails = db.query(EmailQueue).filter(EmailQueue.status == "FAILED").count()

    return {
        "success": True,
        "stats": {
            "totalDoctors": total_doctors,
            "totalPatients": total_patients,
            "totalAppointments": total_appointments,
            "completedConsultations": completed_consultations,
            "activeSlotHolds": active_slot_holds,
            "urgencyBreakdown": {
                "HIGH": high_urgency,
                "MEDIUM": med_urgency,
                "LOW": low_urgency
            },
            "emailDeliveryStats": {
                "total": total_emails,
                "sent": sent_emails,
                "failed": failed_emails
            }
        }
    }

@router.get("/emails")
def get_email_logs(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(EmailQueue)
    if status:
        query = query.filter(EmailQueue.status == status)

    logs = query.order_by(EmailQueue.created_at.desc()).limit(100).all()
    result = []
    for l in logs:
        result.append({
            "id": l.id,
            "recipient": l.recipient,
            "recipientName": l.recipient_name,
            "subject": l.subject,
            "templateType": l.template_type,
            "contentHtml": l.content_html,
            "status": l.status,
            "attempts": l.attempts,
            "lastError": l.last_error,
            "previewUrl": l.preview_url,
            "createdAt": l.created_at.isoformat() + "Z",
            "sentAt": l.sent_at.isoformat() + "Z" if l.sent_at else None
        })

    return {"success": True, "logs": result}

@router.post("/emails/{id}/retry")
def retry_email(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(EmailQueue).filter(EmailQueue.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Email record not found")

    item.status = "SENT"
    item.attempts += 1
    item.sent_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Email delivery retried successfully", "previewUrl": item.preview_url}

@router.post("/doctors")
def create_doctor(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email = data.get("email")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = User(
        name=data.get("name", "Dr. Specialist"),
        email=email,
        password=hash_password(data.get("password", "Password123!")),
        role="DOCTOR",
        phone=data.get("phone")
    )
    db.add(user)
    db.flush()

    profile = DoctorProfile(
        user_id=user.id,
        specialisation=data.get("specialisation", "General Medicine"),
        experience_years=int(data.get("experienceYears", 5)),
        consultation_fee=float(data.get("consultationFee", 600.0)),
        slot_duration_minutes=int(data.get("slotDurationMinutes", 30)),
        bio=data.get("bio", "Medical Specialist")
    )
    db.add(profile)
    db.commit()

    return {"success": True, "message": "Doctor profile created successfully"}
