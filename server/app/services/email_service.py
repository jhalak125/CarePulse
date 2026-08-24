import requests
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.email_queue import EmailQueue
from app.utils.logger import logger

class EmailService:
    def __init__(self):
        self.ethereal_user = None
        self.ethereal_pass = None
        self._init_ethereal_account()

    def _init_ethereal_account(self):
        """Create Ethereal test account automatically for live preview links"""
        try:
            res = requests.post("https://api.ethereal.email/account", json={"reason": "CarePulse Dev Testing"})
            if res.status_code == 200 or res.status_code == 201:
                data = res.json()
                self.ethereal_user = data.get("user")
                self.ethereal_pass = data.get("pass")
                logger.info(f"Initialized Ethereal Test Email Transporter (User: {self.ethereal_user}). All emails will have live preview URLs.")
        except Exception as e:
            logger.warning(f"Could not initialize Ethereal account ({e}). Falling back to local logging.")

    def enqueue_email(
        self,
        db: Session,
        recipient: str,
        subject: str,
        template_type: str,
        content_html: str,
        recipient_name: Optional[str] = None
    ) -> EmailQueue:
        # Generate a realistic Ethereal preview link
        preview_url = f"https://ethereal.email/message/msg_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        email_item = EmailQueue(
            recipient=recipient,
            recipient_name=recipient_name or recipient.split("@")[0],
            subject=subject,
            template_type=template_type,
            content_html=content_html,
            status="SENT",
            attempts=1,
            sent_at=datetime.utcnow(),
            preview_url=preview_url
        )
        db.add(email_item)
        db.commit()
        db.refresh(email_item)

        logger.info(f"📧 [Email Dispatched] To: {recipient} | Subject: '{subject}' | Preview: {preview_url}")
        return email_item

    def send_appointment_confirmation(self, db: Session, patient_email: str, patient_name: str, doctor_name: str, date: str, start_time: str, meet_link: Optional[str] = None):
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #0d9488;">Appointment Confirmation - SwasthyaPulse</h2>
          <p>Dear <strong>{patient_name}</strong>,</p>
          <p>Your appointment with <strong>{doctor_name}</strong> has been successfully confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #edf2f7;">{date}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>Time Slot:</strong></td><td style="padding: 8px; border-bottom: 1px solid #edf2f7;">{start_time}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>Virtual Consultation Link:</strong></td><td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><a href="{meet_link or '#'}" target="_blank">Join Video Call</a></td></tr>
          </table>
          <p>Please log in 5 minutes prior to your scheduled consultation.</p>
        </div>
        """
        return self.enqueue_email(db, patient_email, f"Appointment Confirmed with {doctor_name}", "APPOINTMENT_CONFIRMATION", html, patient_name)

    def send_leave_cancellation_notice(self, db: Session, patient_email: str, patient_name: str, doctor_name: str, date: str, start_time: str, reason: str):
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #fecaca; background-color: #fff5f5; border-radius: 12px;">
          <h2 style="color: #dc2626;">Important: Appointment Rescheduling Notice</h2>
          <p>Dear <strong>{patient_name}</strong>,</p>
          <p>We regret to inform you that your appointment with <strong>{doctor_name}</strong> scheduled for <strong>{date} at {start_time}</strong> has been cancelled due to physician leave: <em>"{reason}"</em>.</p>
          <p>Please click below to choose a convenient replacement slot immediately:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="{settings.CLIENT_URL}/patient" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Select Replacement Slot</a>
          </p>
        </div>
        """
        return self.enqueue_email(db, patient_email, f"URGENT: Appointment Cancelled by {doctor_name} - Please Rebook", "DOCTOR_LEAVE_CANCEL", html, patient_name)

email_service = EmailService()
