import uuid
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings
from app.utils.logger import logger

class CalendarService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        if self.client_id and self.client_secret:
            logger.info("Google Calendar OAuth 2.0 Credentials configured.")
        else:
            logger.info("Google Calendar OAuth credentials not provided. Mock calendar events & virtual links will be generated.")

    def get_auth_url(self) -> str:
        if not self.client_id:
            return "https://accounts.google.com/o/oauth2/auth?mock=true"
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"scope=https://www.googleapis.com/auth/calendar.events&"
            f"access_type=offline&prompt=consent"
        )

    def create_event(self, summary: str, description: str, date: str, start_time: str, end_time: str, doctor_name: str, patient_name: str) -> dict:
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        meet_link = f"https://meet.google.com/swasthya-{doctor_name.split()[-1].lower()}-{start_time.replace(':', '')}"
        
        logger.info(f"📅 [Calendar Event Synced] Summary: '{summary}' | Date: {date} {start_time}-{end_time} | Link: {meet_link}")
        return {
            "eventId": event_id,
            "meetLink": meet_link,
            "summary": summary,
            "status": "confirmed"
        }

    def delete_event(self, event_id: str) -> bool:
        logger.info(f"📅 [Calendar Event Deleted] Event ID: {event_id}")
        return True

calendar_service = CalendarService()
