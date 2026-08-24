from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.calendar_service import calendar_service
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])

@router.get("/auth-url")
def get_auth_url():
    url = calendar_service.get_auth_url()
    return {"success": True, "url": url}

@router.get("/status")
def get_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    has_token = current_user.google_oauth_token is not None
    return {
        "success": True,
        "connected": has_token,
        "connectedAt": current_user.google_oauth_token.created_at.isoformat() + "Z" if has_token else None
    }
