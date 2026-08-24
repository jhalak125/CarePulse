# System Design Write-Up: Care Pulse (Healthcare Appointment & Follow-up Manager)
## 1. Concurrency & Double-Booking Prevention

### Architecture & Mechanics
Double-booking in healthcare scheduling occurs when two patients attempt to book the exact same slot concurrently. CarePulse prevents race conditions in Python through **SQLAlchemy 2.0 Transaction Isolation** and **Pre-Commit Slot Reservations**.

```
[Patient Request A] ──┐                        ┌──► [SQLAlchemy Session Lock] ──► [Confirmed Appt]
                      ├──► [Database Transaction] ┤
[Patient Request B] ──┘                        └──► [Conflict Exception (400)] ──► [Slot Held]
```

1. **Transactional Isolation (`db.commit()`)**: All slot confirmation logic executes within serializable database transactions. Before committing an appointment, the system evaluates:
   $$\text{Conflict} = \exists \text{ Appt} \text{ WHERE } \text{doctorId} = d \land \text{date} = D \land \text{startTime} = T \land \text{status} = \text{'CONFIRMED'}$$
   If a parallel thread committed an appointment for slot $(d, D, T)$ a millisecond earlier, the second transaction catches the violation and raises a `400 Bad Request` HTTP Exception.

2. **Index-Backed Search Constraints**: Composite database indexes on `[doctor_id, date, status]` optimize lookup times to $O(1)$ indexed reads, ensuring instantaneous conflict checks under high load.

---

## 2. Slot Hold Mechanism (Temporary Lock Engine)

### Problem & Solution
Without a hold mechanism, a patient filling out an extensive symptom intake form risks losing their slot to another user before clicking "Confirm". CarePulse implements an ephemeral **10-Minute Slot Hold Lock**.

```
[Select Slot] ──► [Create SlotHold (TTL: 10m)] ──► [Fill Symptoms] ──► [Confirm & Commit]
                      │                                                   │
                      └──► [APScheduler Background Worker (60 sec)] ──────┘
```

- **Reservation Allocation**: When Patient $A$ selects slot $(d, D, T)$, an entry is written to `SlotHold` with `expires_at = Now() + 10 mins` and `status = 'ACTIVE'`.
- **Exclusivity Enforcement**: Any subsequent query by Patient $B$ for doctor $d$ on date $D$ evaluates slot states:
  $$\text{SlotState} = \begin{cases} 
  \text{BOOKED} & \text{if Confirmed Appointment exists} \\
  \text{HELD\_BY\_OTHER} & \text{if } \text{SlotHold.expires\_at} > \text{Now()} \land \text{patientId} \neq A \\
  \text{AVAILABLE} & \text{otherwise}
  \end{cases}$$
- **Automated Expired Hold Worker**: An `APScheduler` background worker executes every 60 seconds (`slot_cleanup.py`), scanning for `SlotHold` records where `status = 'ACTIVE' AND expires_at < Now()`, marking them `EXPIRED` to return abandoned slots to the pool.

---

## 3. Doctor Leave Conflict Handling & Patient Rescheduling

### Conflict Detection & Automated Resolution
When a doctor or clinic administrator submits a leave request for range $[D_{\text{start}}, D_{\text{end}}]$:

```
[Doctor Requests Leave] ──► [Query Conflicting Appts] ──► [Update Status: CANCELLED_DOCTOR_LEAVE]
                                                                  │
                                                                  ├──► [Release Google Calendar Evt]
                                                                  └──► [High-Priority Email Alert]
```

1. **Identification Phase**: System queries all `CONFIRMED` appointments where $D_{\text{appt}} \in [D_{\text{start}}, D_{\text{end}}]$ for `doctorId`.
2. **Atomic Status Transition**: Conflicting appointments are updated to `status = 'CANCELLED_DOCTOR_LEAVE'`.
3. **Calendar & Slot Cleanup**: Active Google Calendar events associated with the appointments are deleted via `calendar_service.delete_event`.
4. **Automated Patient Notification**: High-priority emails are enqueued with direct 1-click rebooking links, explaining the doctor's absence and preserving patient trust.

---

## 4. Notification Failure Handling & Retry Architecture

### Fault-Tolerant Asynchronous Pipeline
External API integrations (SMTP / Email providers, Google Calendar API, LLM endpoints) are susceptible to network latency or service outages. CarePulse handles notifications asynchronously via persistent database queueing in Python.

```
[Trigger Event] ──► [Write to EmailQueue (PENDING)] ──► [Immediate Dispatch Attempt]
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                                   [Success: SENT]                    [Failure: Record Error]
                                  (Save Preview URL)                                 │
                                                                                     ▼
                                                                     [APScheduler Retry Worker (2 min)]
                                                                     (Retry up to 5 attempts)
```

1. **Queue Persistence (`EmailQueue`)**: Outgoing notifications are logged to `EmailQueue` prior to network transmission, storing `recipient`, `subject`, `template_type`, `content_html`, `attempts`, and `status`.
2. **Exponential Backoff Retries**: Failed email deliveries trigger backoff scheduling:
   $$T_{\text{next}} = \text{Now()} + (2^{\text{attempts}} \times 60 \text{ seconds})$$
   An `APScheduler` background worker (`email_retry.py`) runs every 2 minutes, picking up pending items up to a maximum limit of 5 attempts.
3. **LLM Fail-Safe Resilience Engine**: If Google Gemini API is unreachable or unconfigured, the system seamlessly redirects calls to a deterministic medical heuristic classifier (`ai_service.py`). It analyzes symptom severity keywords to output structured triage JSON (Urgency Level, Chief Complaint, 3 Clinical Questions), ensuring zero application crashes.
