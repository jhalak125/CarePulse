import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.config import settings
from app.models.user import User, DoctorProfile
from app.models.appointment import Appointment, SlotHold
from app.models.prescription import Prescription, MedicationReminder
from app.services.ai_service import ai_service
from app.services.email_service import email_service
from app.services.calendar_service import calendar_service
from app.utils.logger import logger

class BookingService:
    def hold_slot(self, db: Session, doctor_id: str, patient_id: str, date: str, start_time: str, end_time: str) -> SlotHold:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")

        # 1. Check existing confirmed appointment collision
        existing_appt = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.date == date,
            Appointment.start_time == start_time,
            Appointment.status == "CONFIRMED"
        ).first()

        if existing_appt:
            raise HTTPException(status_code=400, detail="This slot has already been booked by another patient.")

        # 2. Check active slot holds by other patients
        now = datetime.utcnow()
        active_hold = db.query(SlotHold).filter(
            SlotHold.doctor_id == doctor_id,
            SlotHold.date == date,
            SlotHold.start_time == start_time,
            SlotHold.status == "ACTIVE",
            SlotHold.expires_at > now,
            SlotHold.patient_id != patient_id
        ).first()

        if active_hold:
            raise HTTPException(status_code=400, detail="Another patient is currently holding this slot. Please try again shortly.")

        # 3. Create or update user's hold
        expires_at = now + timedelta(minutes=settings.SLOT_HOLD_DURATION_MINUTES)
        hold = SlotHold(
            doctor_id=doctor_id,
            patient_id=patient_id,
            date=date,
            start_time=start_time,
            end_time=end_time,
            expires_at=expires_at,
            status="ACTIVE"
        )
        db.add(hold)
        db.commit()
        db.refresh(hold)
        return hold

    def release_hold(self, db: Session, hold_id: str, patient_id: str) -> bool:
        hold = db.query(SlotHold).filter(SlotHold.id == hold_id, SlotHold.patient_id == patient_id).first()
        if hold:
            hold.status = "EXPIRED"
            db.commit()
        return True

    def confirm_booking(self, db: Session, hold_id: str, patient_id: str, symptoms: str) -> Appointment:
        hold = db.query(SlotHold).filter(SlotHold.id == hold_id, SlotHold.patient_id == patient_id).first()
        if not hold or hold.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Slot hold has expired or is invalid. Please select your slot again.")

        if hold.expires_at < datetime.utcnow():
            hold.status = "EXPIRED"
            db.commit()
            raise HTTPException(status_code=400, detail="10-minute slot hold reservation timed out. Please select the slot again.")

        # Double booking check
        existing_appt = db.query(Appointment).filter(
            Appointment.doctor_id == hold.doctor_id,
            Appointment.date == hold.date,
            Appointment.start_time == hold.start_time,
            Appointment.status == "CONFIRMED"
        ).first()

        if existing_appt:
            raise HTTPException(status_code=400, detail="This slot was confirmed by another user.")

        doctor = db.query(DoctorProfile).filter(DoctorProfile.id == hold.doctor_id).first()
        patient = db.query(User).filter(User.id == patient_id).first()

        # Run AI Symptom Triage
        triage = ai_service.preview_symptoms(symptoms)

        # Calendar event sync
        cal_evt = calendar_service.create_event(
            summary=f"Consultation: {patient.name} with {doctor.user.name}",
            description=symptoms,
            date=hold.date,
            start_time=hold.start_time,
            end_time=hold.end_time,
            doctor_name=doctor.user.name,
            patient_name=patient.name
        )

        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=hold.doctor_id,
            date=hold.date,
            start_time=hold.start_time,
            end_time=hold.end_time,
            status="CONFIRMED",
            symptoms=symptoms,
            urgency_level=triage["urgencyLevel"],
            chief_complaint=triage["chiefComplaint"],
            suggested_questions=json.dumps(triage["suggestedQuestions"]),
            ai_triage_summary=triage["summary"],
            google_calendar_event_id=cal_evt["eventId"],
            meet_link=cal_evt["meetLink"]
        )

        hold.status = "CONFIRMED"
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        # Dispatch email notification
        email_service.send_appointment_confirmation(
            db,
            patient_email=patient.email,
            patient_name=patient.name,
            doctor_name=doctor.user.name,
            date=appointment.date,
            start_time=appointment.start_time,
            meet_link=appointment.meet_link
        )

        return appointment

    def submit_consultation(self, db: Session, appointment_id: str, doctor_user_id: str, clinical_notes: str, prescriptions_data: Optional[List[dict]] = None) -> Appointment:
        appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Run AI Care Plan summary
        care_plan = ai_service.preview_notes(clinical_notes)

        appt.clinical_notes = clinical_notes
        appt.post_visit_summary = care_plan["friendlySummary"]
        appt.follow_up_steps = json.dumps(care_plan["followUpSteps"])
        appt.status = "COMPLETED"

        # Create prescriptions if provided
        if prescriptions_data:
            for p in prescriptions_data:
                presc = Prescription(
                    appointment_id=appt.id,
                    medication_name=p.get("medicationName", "Prescribed Medicine"),
                    dosage=p.get("dosage", "1 tablet"),
                    frequency=p.get("frequency", "Daily"),
                    duration_days=int(p.get("durationDays", 7)),
                    instructions=p.get("instructions", "Take after meals")
                )
                db.add(presc)
                db.flush()

                # Add medication reminder for today
                rem = MedicationReminder(
                    prescription_id=presc.id,
                    patient_id=appt.patient_id,
                    scheduled_date=datetime.utcnow().strftime("%Y-%m-%d"),
                    scheduled_time="09:00",
                    status="PENDING"
                )
                db.add(rem)

        db.commit()
        db.refresh(appt)
        return appt

booking_service = BookingService()
