from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, DoctorProfile
from app.models.appointment import Appointment, SlotHold
from app.models.leave import DoctorLeave
from app.utils.date_utils import generate_discrete_slots, get_day_name, is_date_in_range
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

@router.get("")
def get_doctors(
    specialisation: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DoctorProfile).join(User)

    if specialisation:
        query = query.filter(DoctorProfile.specialisation == specialisation)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) | 
            (DoctorProfile.specialisation.ilike(search_pattern)) |
            (DoctorProfile.bio.ilike(search_pattern))
        )

    profiles = query.all()
    result = []
    for p in profiles:
        result.append({
            "id": p.id,
            "userId": p.user_id,
            "specialisation": p.specialisation,
            "experienceYears": p.experience_years,
            "consultationFee": p.consultation_fee,
            "slotDurationMinutes": p.slot_duration_minutes,
            "workingHoursStart": p.working_hours_start,
            "workingHoursEnd": p.working_hours_end,
            "breakStart": p.break_start,
            "breakEnd": p.break_end,
            "workingDays": p.working_days,
            "bio": p.bio,
            "rating": p.rating,
            "user": {
                "id": p.user.id,
                "name": p.user.name,
                "email": p.user.email,
                "phone": p.user.phone,
                "avatarUrl": p.user.avatar_url
            }
        })

    return {"success": True, "doctors": result}

@router.get("/{id}")
def get_doctor_by_id(id: str, db: Session = Depends(get_db)):
    p = db.query(DoctorProfile).filter(DoctorProfile.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")

    return {
        "success": True,
        "doctor": {
            "id": p.id,
            "userId": p.user_id,
            "specialisation": p.specialisation,
            "experienceYears": p.experience_years,
            "consultationFee": p.consultation_fee,
            "slotDurationMinutes": p.slot_duration_minutes,
            "workingHoursStart": p.working_hours_start,
            "workingHoursEnd": p.working_hours_end,
            "breakStart": p.break_start,
            "breakEnd": p.break_end,
            "workingDays": p.working_days,
            "bio": p.bio,
            "rating": p.rating,
            "user": {
                "id": p.user.id,
                "name": p.user.name,
                "email": p.user.email,
                "phone": p.user.phone,
                "avatarUrl": p.user.avatar_url
            }
        }
    }

@router.get("/{id}/availability")
def get_doctor_availability(
    id: str,
    date: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    p = db.query(DoctorProfile).filter(DoctorProfile.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Doctor not found")

    day_name = get_day_name(date)
    working_days = [d.strip() for d in p.working_days.split(",")]
    is_working_day = day_name in working_days

    # Check leave status
    leaves = db.query(DoctorLeave).filter(DoctorLeave.doctor_id == id).all()
    on_leave = any(is_date_in_range(date, l.start_date, l.end_date) for l in leaves)

    if not is_working_day or on_leave:
        return {
            "success": True,
            "date": date,
            "dayName": day_name,
            "isWorkingDay": is_working_day,
            "isOnLeave": on_leave,
            "leaveReason": "Physician on out-of-office leave" if on_leave else None,
            "message": "Doctor is off-duty on this date." if not is_working_day else "Doctor is on leave.",
            "slots": []
        }

    raw_slots = generate_discrete_slots(
        working_start=p.working_hours_start,
        working_end=p.working_hours_end,
        break_start=p.break_start,
        break_end=p.break_end,
        slot_duration_minutes=p.slot_duration_minutes
    )

    # Confirmed appointments
    confirmed_appts = db.query(Appointment).filter(
        Appointment.doctor_id == id,
        Appointment.date == date,
        Appointment.status == "CONFIRMED"
    ).all()
    booked_times = {a.start_time for a in confirmed_appts}

    # Active holds
    now = datetime.utcnow()
    active_holds = db.query(SlotHold).filter(
        SlotHold.doctor_id == id,
        SlotHold.date == date,
        SlotHold.status == "ACTIVE",
        SlotHold.expires_at > now
    ).all()
    held_times = {h.start_time for h in active_holds}

    formatted_slots = []
    for s in raw_slots:
        st = s["startTime"]
        slot_status = "AVAILABLE"
        if st in booked_times:
            slot_status = "BOOKED"
        elif st in held_times:
            slot_status = "HELD"

        formatted_slots.append({
            "startTime": st,
            "endTime": s["endTime"],
            "status": slot_status
        })

    return {
        "success": True,
        "date": date,
        "dayName": day_name,
        "isWorkingDay": True,
        "isOnLeave": False,
        "slots": formatted_slots
    }

@router.put("/{id}")
def update_doctor_profile(
    id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(DoctorProfile).filter(DoctorProfile.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    if "specialisation" in data: p.specialisation = data["specialisation"]
    if "experienceYears" in data: p.experience_years = int(data["experienceYears"])
    if "consultationFee" in data: p.consultation_fee = float(data["consultationFee"])
    if "slotDurationMinutes" in data: p.slot_duration_minutes = int(data["slotDurationMinutes"])
    if "workingHoursStart" in data: p.working_hours_start = data["workingHoursStart"]
    if "workingHoursEnd" in data: p.working_hours_end = data["workingHoursEnd"]
    if "breakStart" in data: p.break_start = data["breakStart"]
    if "breakEnd" in data: p.break_end = data["breakEnd"]
    if "workingDays" in data: p.working_days = data["workingDays"]
    if "bio" in data: p.bio = data["bio"]

    db.commit()
    db.refresh(p)
    return {"success": True, "message": "Doctor schedule updated successfully"}
