from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, DoctorProfile
from app.schemas.auth import RegisterRequest, LoginRequest, DemoLoginRequest, AuthResponse
from app.middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from seed import seed_database

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=AuthResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=data.email,
        password=hash_password(data.password),
        name=data.name,
        role=data.role or "PATIENT",
        phone=data.phone
    )
    db.add(user)
    db.flush()

    if user.role == "DOCTOR":
        profile = DoctorProfile(
            user_id=user.id,
            specialisation=data.specialisation or "General Medicine",
            experience_years=data.experienceYears or 5,
            consultation_fee=data.consultationFee or 600.0
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email, user.role)
    doc_id = user.doctor_profile.id if user.doctor_profile else None

    return {
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "avatarUrl": user.avatar_url,
            "doctorProfileId": doc_id
        }
    }

@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.email, user.role)
    doc_id = user.doctor_profile.id if user.doctor_profile else None

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "avatarUrl": user.avatar_url,
            "doctorProfileId": doc_id
        }
    }

@router.post("/demo-login", response_model=AuthResponse)
def demo_login(data: DemoLoginRequest, db: Session = Depends(get_db)):
    role_target = data.role.upper() if data.role else "PATIENT"
    user = db.query(User).filter(User.role == role_target).first()
    
    if not user:
        try:
            seed_database()
            user = db.query(User).filter(User.role == role_target).first()
        except Exception as e:
            pass

    if not user:
        # Fallback dummy account generation if DB issue
        if role_target == "ADMIN":
            user = User(id="demo-admin", name="Sunita Agarwal (Chief Administrator)", email="admin@carepulse.demo", role="ADMIN")
        elif role_target == "DOCTOR":
            user = User(id="demo-doc-user", name="Dr. Rajesh Swaminathan, MD", email="doctor@carepulse.demo", role="DOCTOR")
        else:
            user = User(id="demo-patient", name="Aarav Sharma (Demo Patient)", email="patient@carepulse.demo", role="PATIENT")

    token = create_access_token(user.id, user.email, user.role)
    doc_id = user.doctor_profile.id if getattr(user, 'doctor_profile', None) else "demo-doc-id"

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": getattr(user, 'phone', '+91 98765 43210'),
            "avatarUrl": getattr(user, 'avatar_url', None),
            "doctorProfileId": doc_id if user.role == "DOCTOR" else None
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = current_user.doctor_profile
    doc_dict = None
    if doc:
        doc_dict = {
            "id": doc.id,
            "specialisation": doc.specialisation,
            "experienceYears": doc.experience_years,
            "consultationFee": doc.consultation_fee,
            "slotDurationMinutes": doc.slot_duration_minutes,
            "workingHoursStart": doc.working_hours_start,
            "workingHoursEnd": doc.working_hours_end,
            "breakStart": doc.break_start,
            "breakEnd": doc.break_end,
            "workingDays": doc.working_days,
            "bio": doc.bio,
            "rating": doc.rating
        }

    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "phone": current_user.phone,
            "avatarUrl": current_user.avatar_url,
            "doctorProfile": doc_dict,
            "hasGoogleCalendar": current_user.google_oauth_token is not None
        }
    }
