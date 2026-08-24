from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.jobs.scheduler import start_scheduler
from app.routers import auth, doctors, appointments, leaves, ai, calendar, admin
from app.utils.logger import logger
from seed import seed_database
from app.models.user import User

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SwasthyaPulse Healthcare API",
    description="Full-stack Healthcare Appointment & Follow-up Manager API in Python FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(leaves.router)
app.include_router(ai.router)
app.include_router(calendar.router)
app.include_router(admin.router)

@app.on_event("startup")
def on_startup():
    logger.info(f"🚀 SwasthyaPulse Python Backend starting on port {settings.PORT}...")
    
    # Auto-seed database if empty
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Empty database detected on startup. Auto-seeding Indian demo accounts...")
            seed_database()
    except Exception as e:
        logger.error(f"Error checking database user count: {e}")
    finally:
        db.close()

    start_scheduler()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SwasthyaPulse Python Backend",
        "environment": settings.NODE_ENV
    }
