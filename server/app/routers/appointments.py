import json
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, DoctorProfile
from app.models.appointment import Appointment, SlotHold
from app.models.prescription import Prescription, MedicationReminder
from app.schemas.appointment import (
    HoldSlotRequest,
    ConfirmBookingRequest,
    RescheduleRequest,
    CancelRequest,
    ConsultationRequest
)
from app.services.booking_service import booking_service
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.post("/hold")
def hold_slot(
    data: HoldSlotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hold = booking_service.hold_slot(
        db,
        doctor_id=data.doctorId,
        patient_id=current_user.id,
        date=data.date,
        start_time=data.startTime,
        end_time=data.endTime
    )

    return {
        "success": True,
        "message": f"Slot reserved for {hold.expires_at.strftime('%H:%M:%S')} UTC",
        "hold": {
            "id": hold.id,
            "doctorId": hold.doctor_id,
            "patientId": hold.patient_id,
            "date": hold.date,
            "startTime": hold.start_time,
            "endTime": hold.end_time,
            "expiresAt": hold.expires_at.isoformat() + "Z",
            "status": hold.status
        }
    }

@router.post("/release-hold")
def release_hold(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hold_id = data.get("holdId")
    if hold_id:
        booking_service.release_hold(db, hold_id, current_user.id)
    return {"success": True, "message": "Slot hold released"}

@router.post("/confirm")
def confirm_booking(
    data: ConfirmBookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = booking_service.confirm_booking(
        db,
        hold_id=data.holdId,
        patient_id=current_user.id,
        symptoms=data.symptoms
    )

    return {
        "success": True,
        "message": "Appointment booked and AI triage summary generated successfully",
        "appointment": serialize_appointment(appt)
    }

@router.get("")
def get_appointments(
    status: Optional[str] = None,
    date: Optional[str] = None,
    urgency: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)

    if current_user.role == "PATIENT":
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == "DOCTOR":
        doc = current_user.doctor_profile
        if not doc:
            return {"success": True, "appointments": []}
        query = query.filter(Appointment.doctor_id == doc.id)

    if status:
        query = query.filter(Appointment.status == status)
    if date:
        query = query.filter(Appointment.date == date)
    if urgency:
        query = query.filter(Appointment.urgency_level == urgency)

    appts = query.order_by(Appointment.date.desc(), Appointment.start_time.asc()).all()
    return {"success": True, "appointments": [serialize_appointment(a) for a in appts]}

@router.get("/patient/medications")
def get_patient_medications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch completed appointments for this patient with prescriptions
    appts = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.status == "COMPLETED"
    ).all()

    prescriptions = []
    for a in appts:
        for p in a.prescriptions:
            prescriptions.append({
                "id": p.id,
                "appointmentId": p.appointment_id,
                "medicationName": p.medication_name,
                "dosage": p.dosage,
                "frequency": p.frequency,
                "durationDays": p.duration_days,
                "instructions": p.instructions,
                "doctorName": a.doctor.user.name if a.doctor else "Attending Doctor",
                "specialisation": a.doctor.specialisation if a.doctor else "General",
                "createdAt": p.created_at.isoformat() + "Z"
            })

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    reminders = db.query(MedicationReminder).filter(
        MedicationReminder.patient_id == current_user.id,
        MedicationReminder.scheduled_date == today_str
    ).all()

    today_reminders = []
    for r in reminders:
        today_reminders.append({
            "id": r.id,
            "medicationName": r.prescription.medication_name if r.prescription else "Medication",
            "dosage": r.prescription.dosage if r.prescription else "1 dose",
            "scheduledTime": r.scheduled_time,
            "status": r.status,
            "takenAt": r.taken_at.isoformat() + "Z" if r.taken_at else None
        })

    return {
        "success": True,
        "prescriptions": prescriptions,
        "todayReminders": today_reminders
    }

@router.post("/medications/{reminder_id}/taken")
def mark_medication_taken(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rem = db.query(MedicationReminder).filter(
        MedicationReminder.id == reminder_id,
        MedicationReminder.patient_id == current_user.id
    ).first()

    if not rem:
        raise HTTPException(status_code=404, detail="Medication reminder not found")

    rem.status = "TAKEN"
    rem.taken_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Medication marked as taken."}

@router.get("/{id}")
def get_appointment_by_id(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"success": True, "appointment": serialize_appointment(appt)}

@router.post("/{id}/reschedule")
def reschedule_appointment(
    id: str,
    data: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.date = data.newDate
    appt.start_time = data.newStartTime
    appt.end_time = data.newEndTime
    appt.status = "RESCHEDULED"
    db.commit()
    db.refresh(appt)

    return {"success": True, "message": "Appointment rescheduled", "appointment": serialize_appointment(appt)}

@router.post("/{id}/cancel")
def cancel_appointment(
    id: str,
    data: CancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = "CANCELLED_PATIENT"
    appt.cancellation_reason = data.reason or "Cancelled by patient"
    db.commit()
    db.refresh(appt)

    return {"success": True, "message": "Appointment cancelled", "appointment": serialize_appointment(appt)}

@router.post("/{id}/consultation")
def submit_consultation(
    id: str,
    data: ConsultationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc_id = current_user.doctor_profile.id if current_user.doctor_profile else None
    prescs = [p.dict() for p in data.prescriptions] if data.prescriptions else []
    
    appt = booking_service.submit_consultation(
        db,
        appointment_id=id,
        doctor_user_id=current_user.id,
        clinical_notes=data.clinicalNotes,
        prescriptions_data=prescs
    )

    return {"success": True, "message": "Consultation finalized", "result": serialize_appointment(appt)}

def serialize_appointment(a: Appointment) -> dict:
    suggested_q = []
    if a.suggested_questions:
        try: suggested_q = json.loads(a.suggested_questions)
        except: pass

    follow_up = []
    if a.follow_up_steps:
        try: follow_up = json.loads(a.follow_up_steps)
        except: pass

    prescripts = []
    for p in a.prescriptions:
        prescripts.append({
            "id": p.id,
            "medicationName": p.medication_name,
            "dosage": p.dosage,
            "frequency": p.frequency,
            "durationDays": p.duration_days,
            "instructions": p.instructions
        })

    return {
        "id": a.id,
        "patientId": a.patient_id,
        "doctorId": a.doctor_id,
        "date": a.date,
        "startTime": a.start_time,
        "endTime": a.end_time,
        "status": a.status,
        "symptoms": a.symptoms,
        "urgencyLevel": a.urgency_level,
        "chiefComplaint": a.chief_complaint,
        "suggestedQuestions": suggested_q,
        "aiTriageSummary": a.ai_triage_summary,
        "clinicalNotes": a.clinical_notes,
        "postVisitSummary": a.post_visit_summary,
        "followUpSteps": follow_up,
        "googleCalendarEventId": a.google_calendar_event_id,
        "meetLink": a.meet_link,
        "cancellationReason": a.cancellation_reason,
        "patient": {
            "id": a.patient.id,
            "name": a.patient.name,
            "email": a.patient.email,
            "phone": a.patient.phone,
            "avatarUrl": a.patient.avatar_url
        } if a.patient else None,
        "doctor": {
            "id": a.doctor.id,
            "specialisation": a.doctor.specialisation,
            "user": {
                "id": a.doctor.user.id,
                "name": a.doctor.user.name,
                "email": a.doctor.user.email,
                "phone": a.doctor.user.phone,
                "avatarUrl": a.doctor.user.avatar_url
            }
        } if a.doctor else None,
        "prescriptions": prescripts
    }
