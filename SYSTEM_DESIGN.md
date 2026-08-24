# System Design Write-Up: Healthcare Appointment & Follow-up Manager

## 1. Concurrency & Double-Booking Prevention

### Architecture & Mechanics
Double-booking in healthcare scheduling typically occurs when two patients attempt to book the exact same slot concurrently. CarePulse prevents race conditions through a two-tiered strategy: **Atomic Database Isolation** and **Pre-Commit Slot Reservations**.

```
[Patient Request A] ──┐                          ┌──► [Atomic Tx Check] ──► [Confirmed Appt]
                      ├──► [Prisma $transaction] ┤
[Patient Request B] ──┘                          └──► [Collision Exception] ──► [400 Slot Held]
```

1. **Transactional Isolation (`prisma.$transaction`)**: All slot confirmation logic executes within serializable database transactions. Before inserting an appointment, the system evaluates:
   $$\text{Conflict} = \exists \text{ Appt} \text{ WHERE } \text{doctorId} = d \land \text{date} = D \land \text{startTime} = T \land \text{status} = \text{'CONFIRMED'}$$
   If a parallel thread successfully committed an appointment for slot $(d, D, T)$ a millisecond earlier, the second transaction catches the violation and aborts safely.

2. **Index-Backed Search Constraints**: Composite database indexes on `[doctorId, date, status]` optimize lookup times to $O(1)$ indexed reads, ensuring instantaneous conflict checks even under heavy API load.

---

## 2. Slot Hold Mechanism (Temporary Lock Engine)

### Problem & Solution
Without a hold mechanism, a patient filling out an extensive symptom intake form risks losing their slot to another user before clicking "Confirm". CarePulse implements an ephemeral **10-Minute Slot Hold Lock**.

```
[Select Slot] ──► [Create SlotHold (TTL: 10m)] ──► [Fill Symptoms] ──► [Confirm & Commit]
                      │                                                   │
                      └──► [Background Expiry Worker (1 min)] ────────────┘
```

- **Reservation Allocation**: When Patient $A$ selects slot $(d, D, T)$, an entry is written to `SlotHold` with `expiresAt = Now() + 10 mins` and `status = 'ACTIVE'`.
- **Exclusivity Enforcement**: Any subsequent query by Patient $B$ for doctor $d$ on date $D$ evaluates slot states:
  $$\text{SlotState} = \begin{cases} 
  \text{BOOKED} & \text{if Confirmed Appointment exists} \\
  \text{HELD\_BY\_OTHER} & \text{if } \text{SlotHold.expiresAt} > \text{Now()} \land \text{patientId} \neq A \\
  \text{AVAILABLE} & \text{otherwise}
  \end{cases}$$
- **Automated Expired Hold Worker**: A background scheduler (`node-cron`) executes every 60 seconds (`slotCleanup.job.ts`), scanning for `SlotHold` records where `status = 'ACTIVE' AND expiresAt < Now()`, marking them `EXPIRED` to immediately return abandoned slots to the available pool.

---

## 3. Doctor Leave Conflict Handling & Patient Rescheduling

### Conflict Detection & Automated Resolution
When a doctor or clinic administrator submits a leave request for range $[D_{\text{start}}, D_{\text{end}}]$:

```
[Doctor Requests Leave] ──► [Query Conflicting Appts] ──► [Atomic Status Update: CANCELLED_LEAVE]
                                                                  │
                                                                  ├──► [Release Google Calendar Evt]
                                                                  └──► [High-Priority Email Alert]
```

1. **Identification Phase**: System queries all `CONFIRMED` appointments where $D_{\text{appt}} \in [D_{\text{start}}, D_{\text{end}}]$ for `doctorId`.
2. **Atomic Status Transition**: Conflicting appointments are updated to `status = 'CANCELLED_DOCTOR_LEAVE'`.
3. **Calendar & Slot Cleanup**: Active Google Calendar events associated with the appointments are deleted via `calendarService.deleteEvent`.
4. **Automated Patient Notification**: High-priority emails are enqueued with direct 1-click rebooking links, explaining the doctor's absence and preserving patient trust.

---

## 4. Notification Failure Handling & Retry Architecture

### Fault-Tolerant Asynchronous Pipeline
External API integrations (SMTP / Email providers, Google Calendar API, LLM endpoints) are susceptible to network latency, rate limits, or service outages. CarePulse handles notifications asynchronously via persistent database queueing.

```
[Trigger Event] ──► [Write to EmailQueue (PENDING)] ──► [Immediate Dispatch Attempt]
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                                   [Success: SENT]                    [Failure: Record Error]
                                  (Save Preview URL)                                 │
                                                                                     ▼
                                                                     [Backoff Scheduler (2 min)]
                                                                     (Retry up to 5 attempts)
```

1. **Queue Persistence (`EmailQueue`)**: Outgoing notifications are logged to `EmailQueue` prior to network transmission, storing `recipient`, `subject`, `templateType`, `contentHtml`, `attempts`, and `status`.
2. **Exponential Backoff Retries**: Failed email deliveries trigger backoff scheduling:
   $$T_{\text{next}} = \text{Now()} + (2^{\text{attempts}} \times 60 \text{ seconds})$$
   A background worker (`emailRetry.job.ts`) runs every 2 minutes, picking up pending items up to a maximum limit of 5 attempts.
3. **LLM Fail-Safe Resilience Engine**: If Google Gemini API is unreachable or unconfigured, the system seamlessly redirects calls to a deterministic medical heuristic classifier (`ai.service.ts`). It analyzes symptom severity keywords to output structured triage JSON (Urgency Level, Chief Complaint, 3 Clinical Questions), ensuring zero application crashes.
