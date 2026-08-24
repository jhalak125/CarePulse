from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, DoctorProfile
from app.models.leave import DoctorLeave
from app.schemas.leave import ApplyLeaveRequest, PreviewLeaveRequest
from app.services.leave_service import leave_service
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

@router.post("")
def apply_leave(
    data: ApplyLeaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc_id = data.doctorId
    if not doc_id and current_user.doctor_profile:
        doc_id = current_user.doctor_profile.id

    if not doc_id:
        raise HTTPException(status_code=400, detail="Doctor profile ID required")

    leave = leave_service.apply_leave(
        db,
        doctor_id=doc_id,
        start_date=data.startDate,
        end_date=data.endDate,
        reason=data.reason
    )

    return {
        "success": True,
        "message": f"Doctor leave recorded. {leave.affected_appointments_count} conflicting appointments notified.",
        "leave": {
            "id": leave.id,
            "doctorId": leave.doctor_id,
            "startDate": leave.start_date,
            "endDate": leave.end_date,
            "reason": leave.reason,
            "status": leave.status,
            "affectedAppointmentsCount": leave.affected_appointments_count
        },
        "affectedAppointmentsCount": leave.affected_appointments_count
    }

@router.post("/preview")
def preview_conflicts(
    data: PreviewLeaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc_id = data.doctorId
    if not doc_id and current_user.doctor_profile:
        doc_id = current_user.doctor_profile.id

    if not doc_id:
        raise HTTPException(status_code=400, detail="Doctor profile ID required")

    preview = leave_service.preview_conflicts(
        db,
        doctor_id=doc_id,
        start_date=data.startDate,
        end_date=data.endDate
    )

    return {"success": True, "preview": preview}

@router.get("")
def get_leaves(
    doctorId: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DoctorLeave)
    
    if current_user.role == "DOCTOR":
        if current_user.doctor_profile:
            query = query.filter(DoctorLeave.doctor_id == current_user.doctor_profile.id)
    elif doctorId:
        query = query.filter(DoctorLeave.doctor_id == doctorId)

    leaves = query.order_by(DoctorLeave.start_date.desc()).all()
    result = []
    for l in leaves:
        result.append({
            "id": l.id,
            "doctorId": l.doctor_id,
            "startDate": l.start_date,
            "endDate": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "affectedAppointmentsCount": l.affected_appointments_count,
            "doctor": {
                "id": l.doctor.id,
                "specialisation": l.doctor.specialisation,
                "user": {
                    "name": l.doctor.user.name,
                    "email": l.doctor.user.email
                }
            } if l.doctor else None
        })

    return {"success": True, "leaves": result}

@router.delete("/{id}")
def delete_leave(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    leave = db.query(DoctorLeave).filter(DoctorLeave.id == id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")

    db.delete(leave)
    db.commit()
    return {"success": True, "message": "Leave record deleted"}
