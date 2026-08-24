from datetime import datetime
from app.database import SessionLocal
from app.models.appointment import SlotHold
from app.utils.logger import logger

def cleanup_expired_slot_holds():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        expired_holds = db.query(SlotHold).filter(
            SlotHold.status == "ACTIVE",
            SlotHold.expires_at < now
        ).all()

        if expired_holds:
            for hold in expired_holds:
                hold.status = "EXPIRED"
            db.commit()
            logger.info(f"🧹 Background Slot Cleanup: Released {len(expired_holds)} expired slot holds back to available pool.")
    except Exception as e:
        logger.error(f"Slot cleanup job error: {e}")
    finally:
        db.close()
