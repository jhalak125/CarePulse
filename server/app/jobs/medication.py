from datetime import datetime
from app.database import SessionLocal
from app.models.prescription import MedicationReminder
from app.services.email_service import email_service
from app.utils.logger import logger

def dispatch_medication_reminders():
    db = SessionLocal()
    try:
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        pending_reminders = db.query(MedicationReminder).filter(
            MedicationReminder.scheduled_date == today_str,
            MedicationReminder.status == "PENDING"
        ).all()

        if pending_reminders:
            for rem in pending_reminders:
                if rem.patient and rem.prescription:
                    html = f"""
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #0d9488; border-radius: 12px;">
                      <h3 style="color: #0d9488;">Medication Care Reminder</h3>
                      <p>Dear {rem.patient.name},</p>
                      <p>It is time to take your scheduled dose of <strong>{rem.prescription.medication_name}</strong> ({rem.prescription.dosage}).</p>
                      <p><em>Instructions: {rem.prescription.instructions or 'Take as prescribed.'}</em></p>
                    </div>
                    """
                    email_service.enqueue_email(
                        db,
                        recipient=rem.patient.email,
                        subject=f"CarePulse Pill Reminder: {rem.prescription.medication_name}",
                        template_type="MEDICATION_REMINDER",
                        content_html=html,
                        recipient_name=rem.patient.name
                    )
                    rem.status = "SENT"
                    rem.sent_at = datetime.utcnow()
            db.commit()
            logger.info(f"💊 Dispatched {len(pending_reminders)} medication adherence email notifications.")
    except Exception as e:
        logger.error(f"Medication reminder job error: {e}")
    finally:
        db.close()
