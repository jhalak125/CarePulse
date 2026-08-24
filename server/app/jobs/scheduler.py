from apscheduler.schedulers.background import BackgroundScheduler
from app.jobs.slot_cleanup import cleanup_expired_slot_holds
from app.jobs.medication import dispatch_medication_reminders
from app.jobs.email_retry import process_email_retries
from app.jobs.reminder import dispatch_appointment_reminders
from app.utils.logger import logger

scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(cleanup_expired_slot_holds, 'interval', seconds=60, id='slot_cleanup')
    scheduler.add_job(dispatch_medication_reminders, 'interval', minutes=2, id='medication_reminders')
    scheduler.add_job(process_email_retries, 'interval', minutes=2, id='email_retries')
    scheduler.add_job(dispatch_appointment_reminders, 'interval', minutes=15, id='appointment_reminders')
    
    scheduler.start()
    logger.info("All 4 background workers (Slot Holds, Medication, Email Retries, Appointment Reminders) actively scheduled via APScheduler.")
