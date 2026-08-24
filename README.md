# CarePulse | Healthcare Appointment & Follow-up Manager (Python FastAPI)

An enterprise-grade, full-stack healthcare appointment and follow-up management platform featuring a **Python FastAPI backend**, role-based portals for **Patients**, **Doctors**, and **Admins**, powered by **AI clinical pre-visit triage & post-visit care plans**, **atomic slot booking with 10-minute hold locks**, **doctor leave conflict resolution**, **Google Calendar OAuth 2.0 sync**, and **automated APScheduler background medication & email notification queues**.

---

## 🌟 Key Features & Architectural Highlights

- **Python FastAPI Backend**:
  - Built with **Python 3.10+**, **FastAPI**, **SQLAlchemy 2.0**, **Pydantic v2**, and **APScheduler**.
  - Interactive OpenAPI / Swagger documentation automatically generated at **`http://localhost:5000/docs`**.
- **Three Dedicated Portals with Quick Demo Switcher**:
  - **Patient Portal**: Doctor search by specialisation, interactive slot availability picker with 10-minute hold reservation clock, AI symptom triage form, appointment manager, and daily medication adherence tracker.
  - **Doctor Portal**: Priority consultation queue with urgency markers, AI pre-visit clinical briefing card (Urgency Level, Chief Complaint, 3 Clinical Questions), consultation workspace with structured prescription builder, and leave manager.
  - **Admin Portal**: Executive KPI analytics, AI triage distribution metrics, doctor roster management, doctor leave registry, and real-time email audit queue with live HTML web previews.
- **Double-Booking Prevention & 10-Minute Slot Hold Engine**:
  - Prevents race conditions using transactional database locks (`SQLAlchemy Session`) and ephemeral `SlotHold` reservations (`expires_at = Now() + 10 mins`).
- **Doctor Leave Conflict Resolver**:
  - Automatically detects all conflicting appointments when a doctor requests leave, updates status to `CANCELLED_DOCTOR_LEAVE`, releases Google Calendar events, and dispatches high-priority email alerts with 1-click rebooking links.
- **LLM Clinical Engine & Fail-Safe Architecture**:
  - Google Gemini API (`google-generativeai`) integration with prompt-engineered structured JSON outputs.
  - Features an intelligent deterministic medical heuristic classifier fallback so the system **never crashes or hangs** if network or API keys are unavailable.
- **Dual Email Engine & Ethereal Live Web Previews**:
  - Integrated Nodemailer / Ethereal Email test accounts (generates clickable web preview URLs for every email in console and admin audit logs).
- **Google Calendar OAuth 2.0 Sync**:
  - Google Calendar API v3 event creation, rescheduling, and deletion with Google Meet integration and mock mode fallback.
- **Automated Background Cron Workers (`APScheduler`)**:
  - Expired slot hold release worker (60 sec)
  - Medication reminder dispatcher (2 min)
  - Email retry queue processor with exponential backoff (2 min)
  - 24h & 2h appointment reminder worker (15 min)

---

## 🚀 Quick Setup & Local Execution Guide

### Prerequisites
- **Python**: v3.9+ or v3.10+
- **Node.js**: v18.x or v20.x

### 1-Step Installation & Database Setup
Clone the repository and run:

```bash
# Install root, server (Python virtualenv), and client dependencies
npm run install:all

# Seed database with authentic Indian doctors, patients, and rupee fees
npm run setup
```

### Run Application Locally
```bash
# Starts both Python FastAPI Backend (Port 5000) and Vite React Frontend (Port 5173) concurrently
npm run dev
```

- **React Web App**: `http://localhost:5173`
- **FastAPI Interactive Docs**: `http://localhost:5000/docs`

---

## 🔑 Demo Quick-Login Accounts

You can instantly switch personas using the top banner bar in the web app, or sign in using these credentials:

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@carepulse.demo` | `Password123!` | Aarav Sharma: Book slots, 10m hold timer, AI symptom triage, medication checklist |
| **Doctor** | `doctor@carepulse.demo` | `Password123!` | Dr. Rajesh Swaminathan: View queue, AI briefs, 3 clinical questions, submit care plans |
| **Admin** | `admin@carepulse.demo` | `Password123!` | Sunita Agarwal: KPI dashboard, doctor management, leave conflict audit, email previews |

---

## ⚙️ Environment Variables Reference (`.env`)

A `.env.example` file is included in the project root:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (SQLite default for zero-config run, PostgreSQL supported)
DATABASE_URL="sqlite:///./dev.db"

# JWT Secret
JWT_SECRET=super_secret_healthcare_jwt_key_2026_pulse_secure
JWT_EXPIRES_IN_DAYS=7

# Google Gemini API Key for LLM Summaries (Optional: Fallback heuristic engine active if empty)
GEMINI_API_KEY=

# Google Calendar OAuth 2.0 Credentials (Optional: Mock mode active if empty)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth-callback

# Email Configuration (Optional: Ethereal preview URLs generated automatically if empty)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="SwasthyaPulse Healthcare <no-reply@swasthyapulse.in>"
```

---

## 🤖 LLM Prompts & Configuration

CarePulse utilizes Google Gemini API for clinical summaries.

### 1. Pre-Visit Symptom Analysis Prompt
- **Guided Prompt**:
  > `"Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>"`
- **Response Format**:
  ```json
  {
    "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
    "chiefComplaint": "Concise 1-sentence summary",
    "suggestedQuestions": [
      "Question 1 for doctor",
      "Question 2 for doctor",
      "Question 3 for doctor"
    ],
    "summary": "Clinical briefing string"
  }
  ```

### 2. Post-Visit Patient Care Plan Prompt
- **Guided Prompt**:
  > `"Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>"`
- **Response Format**:
  ```json
  {
    "friendlySummary": "Plain English compassionate recovery explanation",
    "medicationSchedule": [
      {
        "medicine": "Name",
        "dosage": "Dosage",
        "frequency": "Timing",
        "instructions": "Guidance"
      }
    ],
    "followUpSteps": ["Step 1", "Step 2"],
    "warningsToWatch": ["Warning sign 1"]
  }
  ```

---

## 📅 Google Calendar OAuth 2.0 Setup Steps

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `CarePulse Healthcare`.
3. Enable **Google Calendar API** under API & Services.
4. Configure **OAuth Consent Screen** (User Type: External, Scopes: `../auth/calendar.events`, `../auth/userinfo.email`).
5. Create **OAuth 2.0 Client ID** (Application Type: Web Application).
6. Set Authorized Redirect URI: `http://localhost:5000/api/calendar/oauth-callback`.
7. Copy `Client ID` and `Client Secret` to `server/.env`.

---

## 🗄️ Database Schema & Architecture

```
User (id, email, password, role: PATIENT|DOCTOR|ADMIN, phone)
  ├── DoctorProfile (id, userId, specialisation, workingHours, slotDurationMinutes, fee)
  │     ├── DoctorLeave (id, startDate, endDate, reason, affectedAppointmentsCount)
  │     └── Appointment (id, patientId, doctorId, date, startTime, status, urgencyLevel, symptoms, clinicalNotes, postVisitSummary)
  │           └── Prescription (id, medicationName, dosage, frequency, durationDays)
  │                 └── MedicationReminder (id, patientId, scheduledDate, scheduledTime, status)
  ├── SlotHold (id, doctorId, patientId, date, startTime, expiresAt, status: ACTIVE|EXPIRED|CONFIRMED)
  └── EmailQueue (id, recipient, subject, templateType, contentHtml, status: PENDING|SENT|FAILED, previewUrl)
```

---

## 📡 Complete REST API Documentation

FastAPI provides automated interactive Swagger UI at **`http://localhost:5000/docs`**.

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create patient/doctor account.
- `POST /api/auth/login`: Authenticate and receive JWT token.
- `POST /api/auth/demo-login`: 1-click login for demo role (`PATIENT`, `DOCTOR`, `ADMIN`).
- `GET /api/auth/me`: Get current user session info.

### Doctors & Schedules (`/api/doctors`)
- `GET /api/doctors`: List doctors with specialisation and search filters.
- `GET /api/doctors/{id}`: Get doctor profile details.
- `GET /api/doctors/{id}/availability?date=YYYY-MM-DD`: Generate discrete slots with availability, held, and booked statuses.
- `PUT /api/doctors/{id}`: Update working hours and slot durations.

### Appointments & Holds (`/api/appointments`)
- `POST /api/appointments/hold`: Reserve a slot for 10 minutes (`SlotHold`).
- `POST /api/appointments/release-hold`: Cancel active hold.
- `POST /api/appointments/confirm`: Confirm held slot atomically, trigger AI triage, and dispatch emails.
- `GET /api/appointments`: List appointments for current role.
- `POST /api/appointments/{id}/reschedule`: Reschedule appointment to a new slot.
- `POST /api/appointments/{id}/cancel`: Cancel appointment.
- `POST /api/appointments/{id}/consultation`: Doctor submits clinical notes, prescriptions, and generates AI post-visit plan.
- `GET /api/appointments/patient/medications`: Patient medication checklist and active prescriptions.
- `POST /api/appointments/medications/{reminderId}/taken`: Mark dose as taken.

### Doctor Leaves (`/api/leaves`)
- `POST /api/leaves`: Apply for leave, preview conflicts, auto-cancel affected bookings, and alert patients.
- `POST /api/leaves/preview`: Check conflicting appointment count for date range.
- `GET /api/leaves`: Get list of doctor leaves.

### Admin & System Audit (`/api/admin`)
- `GET /api/admin/stats`: Get dashboard KPI statistics and urgency distribution.
- `GET /api/admin/emails`: Get email delivery audit logs with live web preview links.
- `POST /api/admin/emails/{id}/retry`: Manually trigger email retry.

---

## 📦 Packaging Deliverable Zip Archive

To generate the complete source zip archive deliverable:

```bash
npm run package:zip
```
This generates `unthinkable-healthcare-appointment-manager.zip` in the root folder.
