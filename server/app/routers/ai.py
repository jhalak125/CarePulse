from fastapi import APIRouter
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/preview-symptoms")
def preview_symptoms(data: dict):
    symptoms = data.get("symptoms", "")
    analysis = ai_service.preview_symptoms(symptoms)
    return {"success": True, "analysis": analysis}

@router.post("/preview-notes")
def preview_notes(data: dict):
    notes = data.get("notes", "")
    care_plan = ai_service.preview_notes(notes)
    return {"success": True, "carePlan": care_plan}
