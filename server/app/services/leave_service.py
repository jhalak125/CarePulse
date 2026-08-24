from datetime import datetime
from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import DoctorProfile
from app.models.appointment import Appointment
from app.models.leave import DoctorLeave
from app.services.email_service import email_service
from app.services.calendar_service import calendar_service
from app.utils.logger import logger

class LeaveService:
    def preview_conflicts(self, db: Session, doctor_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
        conflicts = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.date >= start_date,
            Appointment.date <= end_date,
            Appointment.status == "CONFIRMED"
        ).all()

        return {
            "conflictCount": len(conflicts),
            "conflicts": [
                {
                    "id": a.id,
                    "patientName": a.patient.name,
                    "date": a.date,
                    "startTime": a.start_time,
                    "symptoms": a.symptoms
                }
                for a in conflicts
            ]
        }

    def apply_leave(self, db: Session, doctor_id: str, start_date: str, end_date: str, reason: str) -> DoctorLeave:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")

        # Query conflicting appointments
        conflicting_appts = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.date >= start_date,
            Appointment.date <= end_date,
            Appointment.status == "CONFIRMED"
        ).all()

        # Update appointment statuses and notify patients
        for appt in conflicting_appts:
            appt.status = "CANCELLED_DOCTOR_LEAVE"
            appt.cancellation_reason = f"Physician scheduled leave: {reason}"

            if appt.google_calendar_event_id:
                calendar_service.delete_event(appt.google_calendar_event_id)

            email_service.send_leave_cancellation_notice(
                db,
                patient_email=appt.patient.email,
                patient_name=appt.patient.name,
                doctor_name=doctor.user.name,
                date=appt.date,
                start_time=appt.start_time,
                reason=reason
            )

        leave = DoctorLeave(
            doctor_id=doctor_id,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            status="APPROVED",
            affected_appointments_count=len(conflicting_appts)
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)

        logger.info(f"🏖️ Doctor leave applied for {doctor.user.name} ({start_date} to {end_date}). Affected appointments: {len(conflicting_appts)}")
        return leave

leave_service = LeaveService()
