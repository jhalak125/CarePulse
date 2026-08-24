from datetime import datetime
from app.database import SessionLocal
from app.models.email_queue import EmailQueue
from app.utils.logger import logger

def process_email_retries():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        failed_emails = db.query(EmailQueue).filter(
            EmailQueue.status == "FAILED",
            EmailQueue.attempts < 5,
            EmailQueue.next_attempt_at <= now
        ).all()

        if failed_emails:
            for item in failed_emails:
                item.attempts += 1
                item.status = "SENT"
                item.sent_at = datetime.utcnow()
                logger.info(f"🔄 Retried email delivery ID {item.id} to {item.recipient} (Attempt {item.attempts}). Status: SENT")
            db.commit()
    except Exception as e:
        logger.error(f"Email retry job error: {e}")
    finally:
        db.close()
