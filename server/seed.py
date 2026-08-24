import json
from datetime import datetime, timedelta
from app.database import engine, Base, SessionLocal
from app.models import User, DoctorProfile, Appointment, Prescription, MedicationReminder, SlotHold, DoctorLeave, EmailQueue
from app.middleware.auth import hash_password
from app.utils.logger import logger

def seed_database():
    logger.info("🌱 Seeding SwasthyaPulse database with Python...")
    
    # Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    default_pw = hash_password("Password123!")

    # 1. Admin User
    admin = User(
        name="Sunita Agarwal (Chief Administrator)",
        email="admin@carepulse.demo",
        password=default_pw,
        role="ADMIN",
        phone="+91 98201 45982"
    )
    db.add(admin)

    # 2. Indian Specialist Doctors
    doctors_data = [
        {
            "name": "Dr. Rajesh Swaminathan, MD",
            "email": "doctor@carepulse.demo",
            "specialisation": "Cardiology",
            "experience_years": 16,
            "consultation_fee": 1200.0,
            "slot_duration_minutes": 30,
            "bio": "Senior Consultant Cardiologist specializing in preventative cardiology, hypertension control, and arrhythmia management.",
            "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80"
        },
        {
            "name": "Dr. Ananya Deshmukh, MD",
            "email": "ananya.dermatology@carepulse.demo",
            "specialisation": "Dermatology",
            "experience_years": 11,
            "consultation_fee": 900.0,
            "slot_duration_minutes": 20,
            "bio": "Consultant Dermatologist focusing on clinical dermatology, acute eczema, contact allergy management, and trichology.",
            "avatar_url": "https://images.unsplash.com/photo-1594824813629-87a41c4f6974?w=200&auto=format&fit=crop&q=80"
        },
        {
            "name": "Dr. Vikramaditya Kulkarni, MD",
            "email": "vikram.pediatrics@carepulse.demo",
            "specialisation": "Pediatrics",
            "experience_years": 14,
            "consultation_fee": 800.0,
            "slot_duration_minutes": 30,
            "bio": "Senior Pediatrician devoted to child growth milestones, newborn care, and childhood allergy management.",
            "avatar_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80"
        },
        {
            "name": "Dr. Meera Iyer, DM",
            "email": "meera.neurology@carepulse.demo",
            "specialisation": "Neurology",
            "experience_years": 18,
            "consultation_fee": 1500.0,
            "slot_duration_minutes": 45,
            "bio": "Leading Neurologist with expertise in migraine management, peripheral neuropathy, and sleep medicine.",
            "avatar_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80"
        },
        {
            "name": "Dr. Siddharth Sengupta, MS",
            "email": "siddharth.ortho@carepulse.demo",
            "specialisation": "Orthopedics",
            "experience_years": 13,
            "consultation_fee": 1000.0,
            "slot_duration_minutes": 30,
            "bio": "Orthopedic surgeon specializing in joint mobility, sports injuries, knee pain management, and spinal alignment.",
            "avatar_url": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80"
        }
    ]

    created_docs = []
    for d in doctors_data:
        u = User(
            name=d["name"],
            email=d["email"],
            password=default_pw,
            role="DOCTOR",
            avatar_url=d["avatar_url"]
        )
        db.add(u)
        db.flush()

        prof = DoctorProfile(
            user_id=u.id,
            specialisation=d["specialisation"],
            experience_years=d["experience_years"],
            consultation_fee=d["consultation_fee"],
            slot_duration_minutes=d["slot_duration_minutes"],
            bio=d["bio"]
        )
        db.add(prof)
        db.flush()
        created_docs.append(prof)

    # 3. Patients
    patient1 = User(
        name="Aarav Sharma (Demo Patient)",
        email="patient@carepulse.demo",
        password=default_pw,
        role="PATIENT",
        phone="+91 98765 43210",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
    )
    patient2 = User(
        name="Priya Patel",
        email="priya.patel@carepulse.demo",
        password=default_pw,
        role="PATIENT",
        phone="+91 98112 34567"
    )
    db.add(patient1)
    db.add(patient2)
    db.flush()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    past_str = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")

    main_doc = created_docs[0] # Dr. Rajesh Swaminathan

    # 4. Completed Past Appointment with Prescription & Reminders
    past_appt = Appointment(
        patient_id=patient1.id,
        doctor_id=main_doc.id,
        date=past_str,
        start_time="10:00",
        end_time="10:30",
        status="COMPLETED",
        symptoms="Mild chest heaviness after evening walk and occasional palpitations after drinking tea.",
        urgency_level="MEDIUM",
        chief_complaint="Occasional exertional chest heaviness and mild palpitations",
        suggested_questions=json.dumps([
            "How frequently do these chest palpitations occur during physical activity?",
            "Do you have a personal or family history of high blood pressure or diabetes?",
            "Have you noticed any shortness of breath or dizziness while climbing stairs?"
        ]),
        ai_triage_summary="Patient presents with mild exertional chest heaviness. Triage urgency evaluated as MEDIUM.",
        clinical_notes="ECG demonstrated normal sinus rhythm. BP 128/84 mmHg. Prescribed Metoprolol 25mg and Pantoprazole 40mg. Advised reduction in tea/coffee.",
        post_visit_summary="Dr. Swaminathan reviewed your ECG and confirmed normal cardiac rhythm. You have been prescribed Metoprolol to keep your heart rate steady.",
        follow_up_steps=json.dumps([
            "Take Metoprolol 25mg once daily in the morning after breakfast.",
            "Take Pantoprazole 40mg before breakfast.",
            "Schedule a 3-week follow-up review or visit immediately if chest pain worsens."
        ]),
        meet_link="https://meet.google.com/swasthya-rajesh-med"
    )
    db.add(past_appt)
    db.flush()

    presc = Prescription(
        appointment_id=past_appt.id,
        medication_name="Metoprolol 25mg (Betaloc)",
        dosage="25mg",
        frequency="Once Daily Morning",
        duration_days=14,
        instructions="Take 1 tablet every morning with breakfast and water."
    )
    db.add(presc)
    db.flush()

    rem = MedicationReminder(
        prescription_id=presc.id,
        patient_id=patient1.id,
        scheduled_date=today_str,
        scheduled_time="08:30",
        status="PENDING"
    )
    db.add(rem)

    # 5. Confirmed Appointment for Today (High Urgency)
    today_appt = Appointment(
        patient_id=patient1.id,
        doctor_id=main_doc.id,
        date=today_str,
        start_time="14:30",
        end_time="15:00",
        status="CONFIRMED",
        symptoms="Sudden onset sharp chest tightness lasting 15 minutes radiating to left shoulder with sweating.",
        urgency_level="HIGH",
        chief_complaint="Acute sharp chest tightness with shoulder radiation and profuse sweating",
        suggested_questions=json.dumps([
            "Did the tightness start while resting or during strenuous activity?",
            "Are you feeling associated nausea, breathlessness, or lightheadedness?",
            "Do you have any existing hypertension or family cardiac history?"
        ]),
        ai_triage_summary="Patient reports acute chest tightness with radiation. HIGH URGENCY triage assigned.",
        meet_link="https://meet.google.com/swasthya-rajesh-urg"
    )
    db.add(today_appt)

    # 6. Confirmed Appointment for Tomorrow with Dr. Ananya
    tomorrow_appt = Appointment(
        patient_id=patient2.id,
        doctor_id=created_docs[1].id,
        date=tomorrow_str,
        start_time="11:00",
        end_time="11:20",
        status="CONFIRMED",
        symptoms="Itchy red skin rash across forearms after gardening, mild swelling.",
        urgency_level="LOW",
        chief_complaint="Allergic contact dermatitis with erythematous skin rash",
        suggested_questions=json.dumps([
            "Have you encountered unusual plants or new chemical detergents?",
            "Have you applied any topical ointments or taken antihistamines?",
            "Is there any warmth, oozing, or spreading to other parts of the body?"
        ]),
        ai_triage_summary="Mild contact dermatitis symptoms. LOW urgency triage assigned.",
        meet_link="https://meet.google.com/swasthya-ananya-derm"
    )
    db.add(tomorrow_appt)

    db.commit()
    db.close()
    logger.info("✅ Python Database Seeding Complete!")

if __name__ == "__main__":
    seed_database()
