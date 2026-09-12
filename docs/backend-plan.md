# CareerGap — Complete Backend Implementation Plan

## 1. Backend Objective

Build the complete backend for **CareerGap**, an AI-powered career skill-gap analyzer.

The backend must support:

1. User authentication and role-based access
2. Resume upload and text extraction
3. AI-based technical skill extraction
4. Predefined career profiles
5. PostgreSQL career-profile storage
6. Redis career-profile caching
7. Redis per-career distributed locking as a fallback
8. Deterministic skill matching and scoring
9. Analysis lifecycle/status management
10. Human review task creation
11. Concurrent reviewer task locking
12. Review lock expiration
13. Human correction of AI results
14. Final result publication
15. Basic Super Admin reviewer management
16. Failure handling
17. Input validation
18. Security controls
19. Automated tests for the important concurrency behavior

The backend must remain a **modular monolith**.

Do NOT introduce:

- Microservices
- Kafka
- RabbitMQ
- BullMQ
- Redis Pub/Sub
- WebSockets
- Kubernetes
- GraphQL
- Complex event-driven architecture

---

# 2. Backend Technology Stack

Use:

```text
Node.js
TypeScript
Express.js
PostgreSQL
Prisma
Redis
JWT
bcrypt
Zod
Native fetch()
PDF parser
Vitest
Supertest
Docker
```

### AI

Primary provider:

```text
Gemini
```

The AI layer must be provider-independent enough that another provider can be added later.

Do not spread Gemini-specific API calls throughout controllers/services.

---

# 3. Backend Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js UI      │
                         └──────────┬───────────┘
                                    │
                                  REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Express API      │
                         └──────────┬───────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
      PostgreSQL                  Redis                     AI
           │                        │                        │
           │                  ┌─────┴─────┐                  │
           │                  │           │                  │
           │                Cache        Lock                │
           │                  │           │                  │
           │                  └───────────┘                  │
           │                                                 │
           ▼                                                 ▼
   Users / Careers /                                  Skill Extraction
   Resumes / Analyses
   Review Tasks / Reviews
           │
           ▼
     Human Reviewer
           │
           ▼
      Final Result
```

---

# 4. Backend Request Flow

## User Analysis Flow

```text
User
 ↓
POST /api/analyses
 ↓
Validate request
 ↓
Validate resume ownership
 ↓
Create Analysis(PENDING)
 ↓
Extract resume text
 ↓
AI extracts skills
 ↓
Normalize skills
 ↓
Get Career Profile
 ↓
Redis cache
 ↓
PostgreSQL fallback
 ↓
LLM fallback only if genuinely missing
 ↓
Deterministic matching
 ↓
Calculate score
 ↓
Store initial result
 ↓
Create ReviewTask
 ↓
Analysis → REVIEW
 ↓
Return analysis
```

For the MVP, analysis processing may happen synchronously inside the API request as long as the implementation remains reliable.

If processing takes too long, the API may return `PENDING/PROCESSING` and the frontend will poll.

Do not introduce a job queue merely to make processing asynchronous.

---

# 5. Analysis Lifecycle

The `Analysis` entity has:

```text
PENDING
PROCESSING
REVIEW
COMPLETED
FAILED
```

Meaning:

### PENDING

Analysis has been created but processing has not started.

### PROCESSING

Resume extraction / AI skill extraction / matching is running.

### REVIEW

AI-generated result is ready and a human review task exists.

### COMPLETED

Human review has been submitted and final result is available.

### FAILED

Analysis processing failed.

The backend must never leave an analysis permanently stuck in `PROCESSING`.

Use `try/catch/finally` appropriately.

---

# 6. Review Task Lifecycle

`ReviewTask` has:

```text
OPEN
LOCKED
COMPLETED
```

Meaning:

### OPEN

Available for any active reviewer.

### LOCKED

Currently owned by one reviewer.

### COMPLETED

Review has been submitted.

A completed review task must never appear in the open review queue again.

---

# 7. User Roles

Use one `User` table with:

```text
USER
REVIEWER
SUPER_ADMIN
```

### USER

Can:

- Register/login
- Upload resume
- Select career
- Create analysis
- View own analyses
- View final results

### REVIEWER

Can:

- View open review tasks
- Claim a task
- View assigned task
- View resume text
- View AI result
- Correct AI result
- Submit review

### SUPER_ADMIN

Can:

- View reviewers
- Add reviewers
- Activate/deactivate reviewers

A regular user must never access reviewer/admin endpoints.

---

# 8. Database Schema

Use PostgreSQL with Prisma.

The main entities are:

```text
User
Career
Resume
Analysis
ReviewTask
Review
```

Relationships:

```text
User
 ├── Resume
 ├── Analysis
 ├── ReviewTask through lockedBy
 └── Review

Career
 └── Analysis

Resume
 └── Analysis

Analysis
 └── ReviewTask
```

---

# 9. User Model

Fields:

```text
id
name
email
passwordHash
role
createdAt
updatedAt
```

Recommended types:

```text
id          UUID
name        String
email       String UNIQUE
passwordHash String
role        UserRole
createdAt   DateTime
updatedAt   DateTime
```

Enum:

```text
USER
REVIEWER
SUPER_ADMIN
```

Email must be normalized to lowercase before storage.

Passwords must never be stored directly.

---

# 10. Career Model

Fields:

```text
id
slug
name
description
profile
createdAt
updatedAt
```

Example:

```text
slug:
backend_engineer

name:
Backend Engineer
```

`profile` should be PostgreSQL JSON/JSONB through Prisma.

Example:

```json
{
  "skills": [
    {
      "name": "Node.js",
      "importance": "HIGH"
    },
    {
      "name": "PostgreSQL",
      "importance": "HIGH"
    },
    {
      "name": "REST API",
      "importance": "HIGH"
    },
    {
      "name": "Docker",
      "importance": "MEDIUM"
    },
    {
      "name": "Redis",
      "importance": "MEDIUM"
    },
    {
      "name": "System Design",
      "importance": "HIGH"
    }
  ]
}
```

Career skills are **not generated for every user**.

The career profile is shared.

---

# 11. Initial Career Seed Data

Seed exactly five careers:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

Stable slugs:

```text
backend_engineer
frontend_engineer
ai_ml_engineer
devops_engineer
data_engineer
```

The seed script must populate reasonable career profiles.

The system should work immediately after:

```bash
npx prisma migrate dev
npx prisma db seed
```

No LLM call should be necessary for these five careers during normal operation.

---

# 12. Resume Model

Fields:

```text
id
userId
fileName
text
textHash
createdAt
```

Relationships:

```text
User
  ↓
Resume
```

Store extracted text.

Do not store the complete PDF binary inside PostgreSQL.

For the 10-day MVP, use simple file storage or temporary local storage according to deployment constraints.

The database stores the extracted text and metadata.

---

# 13. Resume Text Hash

Calculate a SHA-256 hash of normalized extracted text.

Purpose:

- identify identical resume content
- prevent accidental duplicate processing where appropriate
- provide deterministic resume identification

Do not use the hash as a complicated cross-user intelligence system.

The MVP should still treat:

```text
1 new analysis request
→
1 AI skill-extraction call
```

unless the backend explicitly reuses an existing valid analysis.

---

# 14. Analysis Model

Fields:

```text
id
userId
resumeId
careerId

extractedSkills

aiMatchedSkills
aiMissingSkills
aiMatchPercentage

finalMatchedSkills
finalMissingSkills
finalMatchPercentage

status

createdAt
updatedAt
```

Use JSON/JSONB fields for arrays.

Example:

```json
extractedSkills:
[
  "Node.js",
  "PostgreSQL",
  "Docker"
]
```

Initial result:

```json
aiMatchedSkills:
[
  "Node.js",
  "PostgreSQL"
]
```

Final result:

```json
finalMatchedSkills:
[
  "Node.js",
  "PostgreSQL",
  "Docker"
]
```

`final*` fields remain null until human review is completed.

---

# 15. ReviewTask Model

Fields:

```text
id
analysisId
status
lockedBy
lockExpiresAt
completedAt
createdAt
updatedAt
```

Relationships:

```text
Analysis
    ↓
ReviewTask

User(REVIEWER)
    ↓
lockedBy
```

`lockedBy` references the `User` table.

It must only reference users whose role is `REVIEWER`.

---

# 16. Review Model

Fields:

```text
id
reviewTaskId
reviewerId

originalMatchPercentage
finalMatchPercentage

finalMatchedSkills
finalMissingSkills

comment

createdAt
```

The review stores what the reviewer submitted.

This provides a simple record of the human decision without building an elaborate version-history system.

---

# 17. Database Constraints

Implement:

### User

```text
email UNIQUE
```

### Career

```text
slug UNIQUE
```

### ReviewTask

```text
analysisId UNIQUE
```

There should be only one review task for an analysis.

### Review

```text
reviewTaskId UNIQUE
```

There should be only one final submitted review for a task.

---

# 18. Indexes

Add indexes where the application frequently queries.

At minimum:

```text
User.email

Career.slug

Resume.userId

Analysis.userId
Analysis.careerId
Analysis.status

ReviewTask.status
ReviewTask.lockedBy
ReviewTask.lockExpiresAt
```

The review queue particularly needs efficient lookup of:

```text
OPEN tasks
```

and expired locks.

---

# 19. Authentication

Use JWT.

Flow:

```text
Register
 ↓
Hash password using bcrypt
 ↓
Store user
```

Login:

```text
Email + password
 ↓
Find user
 ↓
bcrypt.compare()
 ↓
Generate JWT
 ↓
Return access token
```

The access token should contain:

```text
userId
role
```

Do not put sensitive information into JWT payload.

---

# 20. Authentication Middleware

Create:

```text
authenticate()
```

Responsibilities:

1. Read:

```text
Authorization: Bearer <token>
```

2. Verify JWT.
3. Extract user ID.
4. Load/validate user.
5. Attach authenticated user to request.

If invalid:

```text
401 Unauthorized
```

---

# 21. Role Middleware

Create:

```text
requireRole(...)
```

Examples:

```text
requireRole("REVIEWER")
requireRole("SUPER_ADMIN")
```

For endpoints requiring multiple roles:

```text
requireRole("REVIEWER", "SUPER_ADMIN")
```

If authenticated but insufficient permissions:

```text
403 Forbidden
```

---

# 22. Resume Upload

Endpoint:

```text
POST /api/resumes
```

Authentication:

```text
USER
```

Accept:

```text
PDF
```

Validate:

- MIME type
- file size
- extension
- non-empty file

Keep the size reasonable for the MVP.

Example:

```text
MAX_RESUME_SIZE_MB=5
```

Do not allow arbitrary file types.

---

# 23. Resume Text Extraction

Use a lightweight PDF text extraction library.

Flow:

```text
PDF
 ↓
PDF parser
 ↓
raw text
 ↓
normalize whitespace
 ↓
validate text exists
```

If extraction produces no meaningful text:

```text
400 Bad Request
```

Message:

```text
Unable to extract readable text from this resume.
Please upload a text-based PDF.
```

Do not implement OCR.

Do not attempt complicated multi-column reconstruction.

---

# 24. Resume Text Normalization

Normalize:

- repeated whitespace
- excessive line breaks
- Unicode inconsistencies where safe
- empty lines

Do not destroy meaningful characters from technologies such as:

```text
C++
C#
.NET
Node.js
Next.js
```

Keep technical names intact.

---

# 25. AI Provider Architecture

Create:

```text
src/ai/
├── ai.service.ts
├── ai.provider.ts
├── providers/
│   └── gemini.provider.ts
└── prompts/
    └── skill-extraction.prompt.ts
```

Interface:

```text
AIProvider
```

with a method conceptually equivalent to:

```text
extractSkills(resumeText)
```

The service should not know provider-specific HTTP details.

---

# 26. AI Skill Extraction

The LLM receives:

```text
resume text
```

The LLM must return only structured skill data.

Target:

```json
{
  "skills": ["JavaScript", "TypeScript", "Node.js", "PostgreSQL", "Docker"]
}
```

Do NOT ask the LLM to calculate:

- match percentage
- missing skills
- final recommendation
- career readiness
- score

The backend handles these deterministically.

---

# 27. LLM Prompt Design

The prompt must:

1. Explain that the model is extracting technical/professional skills.
2. Ask for normalized skill names.
3. Avoid inventing skills.
4. Return structured JSON.
5. Avoid explanations.
6. Avoid duplicate skills.

Example conceptual instruction:

```text
Extract only technical skills explicitly supported by the resume.

Normalize equivalent names where obvious.

Do not infer a skill merely because another related skill exists.

Return JSON containing only a skills array.
```

Keep the prompt short.

---

# 28. LLM Cost Rules

These are hard requirements.

### Never:

```text
Frontend → LLM
```

### Never:

```text
LLM → calculate match percentage
```

### Never:

```text
LLM → generate missing skills
```

### Never:

```text
LLM → generate recommendations
```

### Never:

```text
Every user → career-profile generation
```

Normal analysis should require:

```text
1 LLM call
```

for skill extraction.

---

# 29. Career Profile Retrieval

Create:

```text
career.service.ts
```

with logic:

```text
getCareerProfile(careerId)
```

Flow:

```text
Redis
 ↓
if found
 → return

if not found
 ↓
PostgreSQL
 ↓
if found
 → store in Redis
 → return

if not found
 ↓
distributed lock
 ↓
LLM fallback
 ↓
validate generated profile
 ↓
PostgreSQL
 ↓
Redis
 ↓
return
```

---

# 30. Redis Career Cache

Use keys:

```text
career:profile:backend_engineer
career:profile:frontend_engineer
career:profile:ai_ml_engineer
career:profile:devops_engineer
career:profile:data_engineer
```

Value:

Serialized career profile JSON.

TTL:

```text
CAREER_CACHE_TTL_SECONDS
```

Default:

```text
86400
```

24 hours is sufficient.

---

# 31. Important Cache Rule

Redis is **not** the source of truth.

PostgreSQL is.

Therefore:

```text
Redis expires
 ↓
DB lookup
 ↓
restore Redis
 ↓
NO LLM
```

Do NOT regenerate a career profile merely because its Redis cache expired.

---

# 32. Career Profile LLM Fallback

Normally all five seeded careers exist in PostgreSQL.

The LLM career-generation path exists only for:

- missing/corrupt profile
- future additional career
- demonstration of shared LLM computation

When generating a missing profile, use the career's known name/slug as input.

The generated result must be validated against a Zod schema before saving.

Do not blindly trust LLM JSON.

---

# 33. Career Profile Distributed Lock

Redis lock key:

```text
career:lock:<career-slug>
```

Example:

```text
career:lock:backend_engineer
```

Acquire:

```text
SET key lockValue NX EX 60
```

The lock value should be a unique random token.

Do not use a constant lock value.

---

# 34. Safe Lock Release

Do not blindly execute:

```text
DEL lockKey
```

because another request could theoretically acquire a newly expired lock.

Use ownership verification.

Conceptually:

```text
if lock value == my lock value:
    delete lock
```

This can be implemented with a small Redis Lua script or an equivalent safe atomic mechanism.

For a 10-day project, this is worth implementing because it prevents an easy distributed-lock bug.

---

# 35. Career Lock Flow

Request A:

```text
Redis cache MISS
 ↓
DB MISS
 ↓
SET lock NX
 ↓
SUCCESS
 ↓
LLM
 ↓
DB
 ↓
Redis
 ↓
release lock
```

Request B:

```text
Redis MISS
 ↓
DB MISS
 ↓
SET lock NX
 ↓
FAILED
 ↓
wait 500ms
 ↓
check Redis
 ↓
profile available
 ↓
return profile
```

Request C behaves similarly.

---

# 36. Waiting Strategy

Do simple polling.

Example:

```text
poll interval = 500ms
maximum wait = 10 seconds
```

Do not implement:

```text
Redis Pub/Sub
```

Do not implement:

```text
BullMQ
```

If timeout occurs:

```text
503 Service Unavailable
```

or an application-level retry response.

---

# 37. Career Profile Generation Failure

Use:

```text
try
    acquire lock
    generate profile
    validate
    save DB
    cache
finally
    safely release lock
```

If LLM fails:

```text
No profile saved
Lock released
```

Waiting requests can retry the operation.

Do not leave the Redis lock permanently active.

---

# 38. Career Profile Validation

Use Zod.

Expected structure:

```text
career
skills[]
```

Each skill:

```text
name
importance
```

Importance:

```text
HIGH
MEDIUM
LOW
```

Reject malformed LLM output.

Never save arbitrary model output directly to PostgreSQL.

---

# 39. Skill Normalization

Create:

```text
src/utils/skill-normalizer.ts
```

Use a small deterministic dictionary.

Example:

```typescript
{
  "node": "Node.js",
  "nodejs": "Node.js",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "reactjs": "React",
  "react.js": "React"
}
```

The mapping should remain small.

Do not create an ontology.

Normalize:

```text
trim
lowercase lookup
canonical output
deduplicate
```

Preserve canonical display names.

---

# 40. Matching Algorithm

Create:

```text
scoring.service.ts
```

Input:

```text
userSkills
careerProfile.skills
```

Normalize both.

Then:

```text
matched = userSkills ∩ requiredSkills
missing = requiredSkills - userSkills
```

Score:

```text
matched.length
---------------- × 100
required.length
```

Round to a reasonable number, for example:

```text
2 decimal places
```

---

# 41. Recommendation Logic

No LLM.

Recommendations are derived from missing career skills.

Sort missing skills by:

```text
HIGH
MEDIUM
LOW
```

Then preserve career profile ordering within equal importance if useful.

Example:

```text
Missing:
System Design → HIGH
Redis → HIGH
Kubernetes → LOW
```

Recommendations:

```text
System Design
Redis
Kubernetes
```

No second AI call.

---

# 42. Analysis Creation

Endpoint:

```text
POST /api/analyses
```

Expected input:

```json
{
  "resumeId": "uuid",
  "careerId": "uuid"
}
```

Authentication:

```text
USER
```

Steps:

```text
1. Authenticate user
2. Validate resumeId
3. Confirm resume belongs to current user
4. Validate careerId
5. Check for duplicate active analysis
6. Create Analysis(PENDING)
7. Process analysis
8. Save result
9. Create ReviewTask
10. Set Analysis(REVIEW)
```

---

# 43. Duplicate Analysis Protection

Prevent accidental double-clicks.

The backend must not rely solely on frontend button disabling.

Before starting a new analysis, check whether the same user already has an active analysis for the same resume/career combination.

Active statuses:

```text
PENDING
PROCESSING
REVIEW
```

If one exists, return the existing analysis or reject the duplicate request.

This prevents:

```text
click 1 → LLM call
click 2 → another LLM call
```

---

# 44. Analysis Failure

If processing fails:

```text
Analysis:
PROCESSING → FAILED
```

Do not create a review task.

Return a safe error to the client.

Never expose:

- API keys
- provider response internals
- stack traces
- raw provider errors

Log technical details server-side only.

---

# 45. Analysis Result

Before review:

```json
{
  "status": "REVIEW",
  "aiResult": {
    "matchPercentage": 72.73,
    "matchedSkills": [],
    "missingSkills": []
  },
  "finalResult": null
}
```

The user should be told that the result is waiting for human review.

Do not present AI output as the final verified result.

---

# 46. Review Task Creation

After successful AI analysis:

```text
Analysis
 ↓
ReviewTask
 ↓
OPEN
```

Create exactly one review task.

Use a database transaction if necessary to ensure the analysis and review task state remain consistent.

---

# 47. Reviewer Task Queue

Endpoint:

```text
GET /api/reviews/tasks
```

Authentication:

```text
REVIEWER
```

Return only:

```text
OPEN
```

tasks plus tasks whose locks have expired.

A task is considered available when:

```text
status = OPEN
```

OR:

```text
status = LOCKED
AND lockExpiresAt < now
```

Do not expose another reviewer's locked task as available.

---

# 48. Lazy Lock Expiration

Do not require a complex scheduler.

When reading the queue:

```text
LOCKED
+
lockExpiresAt < NOW()
```

is treated as expired.

Optionally update it back to:

```text
OPEN
lockedBy = NULL
lockExpiresAt = NULL
```

This is sufficient for MVP.

---

# 49. Claim Review Task

Endpoint:

```text
POST /api/reviews/tasks/:id/claim
```

Authentication:

```text
REVIEWER
```

The backend must perform an **atomic conditional update**.

Conceptually:

```sql
UPDATE review_tasks
SET
    status = 'LOCKED',
    locked_by = :reviewerId,
    lock_expires_at = NOW() + INTERVAL '15 minutes'
WHERE id = :taskId
  AND (
      status = 'OPEN'
      OR lock_expires_at < NOW()
  );
```

The exact Prisma implementation may use an atomic update or transaction/raw SQL where required.

---

# 50. Claim Result

If one row was updated:

```text
SUCCESS
```

Return:

```json
{
  "taskId": "...",
  "status": "LOCKED",
  "lockedBy": "currentReviewer",
  "lockExpiresAt": "..."
}
```

If zero rows were updated:

```text
409 Conflict
```

Example message:

```text
Review task is already locked or completed.
```

This is the concurrency guarantee.

---

# 51. Why Atomic Update Is Required

Do NOT implement:

```text
SELECT task
 ↓
if open
 ↓
UPDATE task
```

without protection.

Two reviewers can both observe:

```text
OPEN
```

before either updates it.

Instead:

```text
UPDATE ... WHERE status = OPEN
```

makes the claim conditional and atomic.

This is one of the core engineering points of CareerGap.

---

# 52. Reviewer Task Access

Endpoint:

```text
GET /api/reviews/tasks/:id
```

Authentication:

```text
REVIEWER
```

Rules:

### OPEN task

Reviewer may view it.

### LOCKED by current reviewer

Reviewer may view and edit it.

### LOCKED by another reviewer

Return:

```text
403 Forbidden
```

or:

```text
409 Conflict
```

depending on API convention.

### COMPLETED

Reviewer can optionally view completed information, but cannot modify it.

---

# 53. Review Interface Data

Backend should return:

```text
Review Task
Resume
Career
AI analysis
Current lock information
```

For example:

```json
{
  "task": {
    "id": "...",
    "status": "LOCKED",
    "lockExpiresAt": "..."
  },
  "resume": {
    "id": "...",
    "fileName": "...",
    "text": "..."
  },
  "career": {
    "name": "Backend Engineer"
  },
  "analysis": {
    "matchPercentage": 72.73,
    "matchedSkills": [],
    "missingSkills": []
  }
}
```

Do not expose unrelated user data.

---

# 54. Submit Review

Endpoint:

```text
POST /api/reviews/tasks/:id/submit
```

Authentication:

```text
REVIEWER
```

Input:

```json
{
  "finalMatchPercentage": 75,
  "finalMatchedSkills": ["Node.js", "PostgreSQL", "Docker"],
  "finalMissingSkills": ["Redis", "System Design"],
  "comment": "Docker experience was present in the resume."
}
```

---

# 55. Review Submission Validation

Validate:

### Percentage

```text
0 <= score <= 100
```

### Skills

Must be arrays of strings.

### Ownership

Current reviewer must equal:

```text
ReviewTask.lockedBy
```

### Status

Must be:

```text
LOCKED
```

### Lock

Must not be expired.

If expired:

```text
409 Conflict
```

The reviewer must claim the task again.

---

# 56. Review Submission Transaction

Use one database transaction.

Conceptually:

```text
BEGIN

1. Verify task ownership and lock
2. Create Review
3. Update Analysis final fields
4. Set Analysis → COMPLETED
5. Set ReviewTask → COMPLETED
6. Clear lock fields

COMMIT
```

If anything fails:

```text
ROLLBACK
```

This prevents situations such as:

```text
Review created
but Analysis remains REVIEW
```

---

# 57. Final Result

After successful review:

```text
Analysis.status = COMPLETED
```

And:

```text
finalMatchPercentage
finalMatchedSkills
finalMissingSkills
```

are populated.

The user's final result endpoint returns the **reviewed result**, not merely the AI result.

---

# 58. User Result Access

Endpoint:

```text
GET /api/analyses/:id
```

Authentication:

```text
USER
```

Ownership:

```text
analysis.userId === currentUser.id
```

Return:

### PROCESSING

```text
status: PROCESSING
```

### REVIEW

```text
status: REVIEW
message: "Analysis is waiting for human review."
```

### COMPLETED

Return final reviewed result.

### FAILED

Return safe failure state.

---

# 59. Reviewer Lock Expiration

Lock duration:

```text
15 minutes
```

Environment variable:

```text
REVIEW_LOCK_MINUTES=15
```

When:

```text
NOW > lockExpiresAt
```

the task is available again.

The reviewer cannot submit an expired task.

This is critical.

---

# 60. Expired Lock Reclaim

When another reviewer claims an expired task:

```text
OLD REVIEWER
     ↓
lock expired

NEW REVIEWER
     ↓
atomic claim
     ↓
lockedBy = new reviewer
lockExpiresAt = new expiration
```

Do not require the old reviewer to explicitly release the lock.

---

# 61. Reviewer Lock Safety

The system must guarantee:

```text
One active reviewer
        ↓
One task
```

At any point.

Two concurrent claim requests must result in:

```text
Reviewer A → success
Reviewer B → conflict
```

Never:

```text
Reviewer A → success
Reviewer B → success
```

This must be covered by an integration test.

---

# 62. Reviewer Management

## Get Reviewers

```text
GET /api/admin/reviewers
```

Role:

```text
SUPER_ADMIN
```

Return:

```text
id
name
email
role
active status
createdAt
```

---

# 63. Add Reviewer

```text
POST /api/admin/reviewers
```

Input:

```json
{
  "name": "Reviewer Name",
  "email": "reviewer@example.com",
  "password": "temporary-password"
}
```

Backend:

```text
validate
 ↓
hash password
 ↓
role = REVIEWER
 ↓
create user
```

Do not allow client to specify:

```text
SUPER_ADMIN
```

through this endpoint.

---

# 64. Activate/Deactivate Reviewer

```text
PATCH /api/admin/reviewers/:id
```

Allow:

```text
active: true/false
```

If deactivated:

- reviewer cannot login
- reviewer cannot claim new tasks

For an already locked task, the simplest MVP behavior is to let the lock expire naturally.

Do not implement complicated task reassignment.

---

# 65. Authentication API

Implement:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

---

# 66. Resume API

Implement:

```text
POST /api/resumes
GET  /api/resumes/:id
```

Users may only access their own resumes.

Reviewers may access resume text only through their assigned review task.

---

# 67. Analysis API

Implement:

```text
POST /api/analyses
GET  /api/analyses/:id
GET  /api/analyses
```

`GET /api/analyses` returns the current user's analysis history.

Do not expose another user's analyses.

---

# 68. Review API

Implement:

```text
GET  /api/reviews/tasks
POST /api/reviews/tasks/:id/claim
GET  /api/reviews/tasks/:id
POST /api/reviews/tasks/:id/submit
```

Optional:

```text
GET /api/reviews/completed
```

only if needed by the UI.

Do not build complex reviewer analytics.

---

# 69. Admin API

Implement:

```text
GET   /api/admin/reviewers
POST  /api/admin/reviewers
PATCH /api/admin/reviewers/:id
```

No large admin system.

---

# 70. Health Endpoint

Implement:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Optionally verify infrastructure separately, but don't make health endpoint depend on LLM availability.

---

# 71. Controller/Service Separation

Use:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Repository/Prisma
```

Controllers should be thin.

Do not put:

- SQL logic
- Redis logic
- LLM logic
- scoring logic

directly into controllers.

---

# 72. Services

Create:

```text
auth.service.ts
resume.service.ts
career.service.ts
analysis.service.ts
scoring.service.ts
review.service.ts
admin.service.ts
```

### AuthService

Handles:

- registration
- login
- password verification
- token creation

### ResumeService

Handles:

- upload
- extraction
- normalization
- ownership

### CareerService

Handles:

- Redis cache
- DB fallback
- career generation fallback

### AnalysisService

Handles:

- analysis lifecycle
- AI extraction
- career retrieval
- scoring
- review task creation

### ScoringService

Handles:

- normalization
- matching
- percentage
- recommendations

### ReviewService

Handles:

- queue
- task claim
- lock expiry
- review submission

### AdminService

Handles:

- reviewer management

---

# 73. Middleware

Create:

```text
auth.middleware.ts
role.middleware.ts
validation.middleware.ts
error.middleware.ts
upload.middleware.ts
```

### Error Middleware

Return consistent JSON:

```json
{
  "success": false,
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

Never expose stack traces in production.

---

# 74. Validation

Use Zod.

Create validators:

```text
auth.validator.ts
resume.validator.ts
analysis.validator.ts
review.validator.ts
admin.validator.ts
```

Validate:

- request body
- params
- query
- review fields
- IDs
- score
- career IDs
- file metadata

---

# 75. API Response Convention

Use a consistent response structure.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "Invalid request",
  "code": "VALIDATION_ERROR"
}
```

Do not make responses unnecessarily nested.

---

# 76. Error Codes

Create a small centralized list:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
ANALYSIS_FAILED
AI_PROVIDER_ERROR
RESUME_EXTRACTION_FAILED
REVIEW_TASK_LOCKED
REVIEW_LOCK_EXPIRED
INVALID_REVIEW_OWNER
```

The exact naming can be implemented consistently.

---

# 77. HTTP Status Codes

Use:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

Do not use status codes randomly.

---

# 78. AI Failure Handling

Possible failures:

```text
API unavailable
rate limit
timeout
invalid response
malformed JSON
provider error
```

Behavior:

```text
AI failure
 ↓
Analysis → FAILED
```

For career-profile generation:

```text
AI failure
 ↓
release Redis lock
 ↓
do not save invalid profile
```

For resume skill extraction:

```text
AI failure
 ↓
analysis FAILED
```

Do not silently generate fake results.

---

# 79. Free API Rate-Limit Handling

Because the project uses a free LLM API:

Implement basic protection.

### Limit requests

Don't allow users to spam:

```text
POST /api/analyses
```

Add a simple per-user rate limit or cooldown.

For example:

```text
maximum analysis requests per user per minute
```

Keep it modest and configurable.

Do not build an advanced distributed rate limiter.

---

# 80. LLM Request Timeout

Every external LLM request must have a timeout.

Use:

```text
AbortController
```

or equivalent native fetch timeout mechanism.

Example configuration:

```text
AI_TIMEOUT_MS=30000
```

If timeout occurs:

```text
AI_PROVIDER_ERROR
```

and analysis becomes:

```text
FAILED
```

---

# 81. LLM Response Size

Limit the resume text sent to the LLM.

Use:

```text
MAX_RESUME_TEXT_CHARS
```

Example:

```text
30000
```

or another reasonable limit based on the selected model.

Do not send arbitrarily large documents.

If the extracted text exceeds the limit:

```text
truncate safely
```

or reject the resume.

For a 10-day project, rejecting extremely large resumes is simpler and safer.

---

# 82. Security

Implement:

```text
bcrypt
JWT
Zod validation
Helmet
CORS
rate limiting
file validation
ownership checks
role checks
environment secrets
```

Never log:

```text
password
JWT
LLM API key
uploaded resume content
```

unless absolutely required for debugging—and never in production.

---

# 83. Resume Privacy

For MVP:

- only authenticated users can access their own resumes
- reviewers can only see the resume associated with the task they currently own
- regular users cannot access reviewer endpoints
- don't expose resumes publicly

If using local file storage, ensure uploaded files aren't served from a public static directory.

---

# 84. Ownership Rules

Every user-owned resource must check ownership.

For example:

```text
GET /api/resumes/:id
```

must verify:

```text
resume.userId === currentUser.id
```

Similarly:

```text
GET /api/analyses/:id
```

must verify:

```text
analysis.userId === currentUser.id
```

Never trust an ID supplied by the frontend.

---

# 85. Reviewer Authorization Rules

Reviewer task access:

```text
task.status = OPEN
```

or:

```text
task.lockedBy = currentReviewer
```

A reviewer must not be able to access:

```text
LOCKED BY OTHER REVIEWER
```

A reviewer must not be able to submit:

```text
COMPLETED
```

tasks.

---

# 86. Transaction Boundaries

Use transactions for operations where multiple database changes must remain consistent.

### Review submission

Must be transactional:

```text
Review creation
+
Analysis final result
+
Analysis COMPLETED
+
ReviewTask COMPLETED
```

### Analysis creation

Use a transaction where necessary for:

```text
Analysis creation
+
ReviewTask creation
```

Do not wrap long LLM calls inside a PostgreSQL transaction.

This is important.

Bad:

```text
BEGIN
 ↓
call LLM for 20 seconds
 ↓
COMMIT
```

Good:

```text
create/update processing state
 ↓
LLM outside DB transaction
 ↓
short transaction to persist result
```

---

# 87. Important Concurrency Rule

Never hold a PostgreSQL transaction open while waiting for an LLM response.

Never hold a database row lock while making an external API call.

Use Redis lock for the missing career-profile generation case.

Use PostgreSQL atomic conditional update for reviewer task acquisition.

These are two separate concurrency mechanisms.

---

# 88. Cache + Database Consistency

When generating a career profile:

```text
LLM
 ↓
validate
 ↓
PostgreSQL
 ↓
Redis
```

If Redis write fails after PostgreSQL succeeds:

```text
Profile remains safe
```

Next request:

```text
Redis MISS
 ↓
DB HIT
 ↓
restore cache
```

Do not regenerate.

---

# 89. Career Profile Cache Invalidation

Because career profiles are seeded/static for MVP, no complex invalidation is needed.

If Super Admin functionality for editing careers is not implemented:

```text
No career-profile editing endpoint.
```

If profile changes manually in DB:

```text
delete Redis career cache key
```

No automatic career versioning.

---

# 90. Suggested Environment Variables

Create:

```text
NODE_ENV
PORT

DATABASE_URL

REDIS_URL

JWT_SECRET
JWT_EXPIRES_IN

BCRYPT_ROUNDS

AI_PROVIDER
AI_API_KEY
AI_MODEL
AI_TIMEOUT_MS

CAREER_CACHE_TTL_SECONDS
CAREER_LOCK_TTL_SECONDS

REVIEW_LOCK_MINUTES

MAX_RESUME_SIZE_MB
MAX_RESUME_TEXT_CHARS

CORS_ORIGIN
```

Provide `.env.example`.

Never commit `.env`.

---

# 91. Redis Connection

Create:

```text
src/config/redis.ts
```

The application should create one shared Redis connection.

Do not create a new Redis connection on every request.

Handle:

```text
connect
ready
error
close
```

appropriately.

---

# 92. PostgreSQL Connection

Use Prisma.

Create:

```text
src/config/database.ts
```

Export a shared Prisma client.

Do not instantiate Prisma repeatedly.

---

# 93. Application Structure

Recommended final structure:

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── redis.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── resume.controller.ts
│   │   ├── analysis.controller.ts
│   │   ├── review.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── resume.service.ts
│   │   ├── career.service.ts
│   │   ├── analysis.service.ts
│   │   ├── scoring.service.ts
│   │   ├── review.service.ts
│   │   └── admin.service.ts
│   │
│   ├── ai/
│   │   ├── ai.service.ts
│   │   ├── ai.provider.ts
│   │   ├── providers/
│   │   │   └── gemini.provider.ts
│   │   └── prompts/
│   │       └── skill-extraction.prompt.ts
│   │
│   ├── cache/
│   │   ├── career-cache.ts
│   │   └── career-lock.ts
│   │
│   ├── parsers/
│   │   └── resume-parser.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── resume.validator.ts
│   │   ├── analysis.validator.ts
│   │   ├── review.validator.ts
│   │   └── admin.validator.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── resume.routes.ts
│   │   ├── analysis.routes.ts
│   │   ├── review.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── skill-normalizer.ts
│   │   ├── errors.ts
│   │   └── logger.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── tests/
│   ├── auth.test.ts
│   ├── resume.test.ts
│   ├── analysis.test.ts
│   ├── career-cache.test.ts
│   ├── career-lock.test.ts
│   ├── review-lock.test.ts
│   └── review-submit.test.ts
│
├── uploads/
│   └── .gitkeep
│
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

# 94. Route Structure

## Auth

```text
/api/auth
```

Routes:

```text
POST /register
POST /login
GET  /me
POST /logout
```

## Resume

```text
/api/resumes
```

Routes:

```text
POST /
GET  /:id
```

## Analysis

```text
/api/analyses
```

Routes:

```text
POST /
GET  /
GET  /:id
```

## Reviews

```text
/api/reviews
```

Routes:

```text
GET  /tasks
POST /tasks/:id/claim
GET  /tasks/:id
POST /tasks/:id/submit
```

## Admin

```text
/api/admin
```

Routes:

```text
GET   /reviewers
POST  /reviewers
PATCH /reviewers/:id
```

---

# 95. Analysis Processing Algorithm

Implement approximately:

```text
createAnalysis(userId, resumeId, careerId)

1. Validate ownership
2. Validate career
3. Check duplicate active analysis
4. Create PENDING analysis
5. Set PROCESSING
6. Extract resume text
7. Call AI once for skills
8. Validate AI response
9. Normalize skills
10. Get career profile
11. Calculate matched skills
12. Calculate missing skills
13. Calculate percentage
14. Save AI result
15. Create ReviewTask
16. Set analysis REVIEW
17. Return result
```

If any step fails:

```text
analysis → FAILED
```

---

# 96. Review Claim Algorithm

Implement:

```text
claimTask(taskId, reviewerId)

1. Verify reviewer role
2. Atomically update task:
   OPEN
   OR expired LOCKED
3. Set:
   LOCKED
   lockedBy = reviewerId
   lockExpiresAt = now + 15 minutes
4. If updated rows = 0:
   return conflict
5. Return task
```

---

# 97. Review Submission Algorithm

Implement:

```text
submitReview(taskId, reviewerId, data)

1. Start short DB transaction
2. Fetch task
3. Verify status = LOCKED
4. Verify lockedBy = reviewerId
5. Verify lock not expired
6. Validate submitted result
7. Create Review
8. Update Analysis final result
9. Update Analysis status = COMPLETED
10. Update ReviewTask status = COMPLETED
11. Clear lock fields
12. Commit
```

Never make an external API call inside this transaction.

---

# 98. Review Expiration Algorithm

No dedicated worker required.

Whenever reviewing a task:

```text
if status == LOCKED
and lockExpiresAt < now:
    task is expired
```

When claiming:

```text
OPEN
OR expired LOCKED
```

can be acquired.

When submitting:

```text
if expired:
    reject
```

Optionally add a lightweight periodic cleanup later if desired, but it is not required for MVP.

---

# 99. Polling Support

The frontend will poll:

```text
GET /api/analyses/:id
```

while:

```text
PENDING
PROCESSING
REVIEW
```

Once:

```text
COMPLETED
```

polling stops.

If:

```text
FAILED
```

polling stops and UI displays retry.

The backend does not need WebSockets.

---

# 100. Logging

Create a simple structured logger.

Log:

```text
request ID
method
path
status code
duration
analysis ID
review task ID
```

Do NOT log:

```text
password
JWT
API key
resume contents
LLM secrets
```

For LLM calls, log metadata such as:

```text
provider
model
analysisId
success/failure
duration
```

Do not log the full resume.

---

# 101. Testing Strategy

Do not build hundreds of tests.

Focus on the system's important behavior.

## Authentication

Test:

```text
register
duplicate email
wrong password
successful login
invalid token
role authorization
```

## Resume

Test:

```text
valid PDF
invalid file
oversized file
empty extraction
ownership
```

## Career Cache

Test:

```text
Redis HIT
Redis MISS + DB HIT
Redis MISS + DB MISS
```

---

# 102. Most Important Test — Career Lock

Simulate concurrent requests.

Example:

```text
10 requests
+
same missing career
```

Expected:

```text
LLM calls = 1
```

not:

```text
LLM calls = 10
```

Verify:

```text
one request owns lock
others wait
profile becomes available
all requests receive same profile
```

This is one of the project's main demonstrations.

---

# 103. Most Important Test — Review Lock

Simulate:

```text
Reviewer A
Reviewer B
```

both claiming:

```text
Task #123
```

Expected:

```text
A → SUCCESS
B → CONFLICT
```

Never:

```text
A → SUCCESS
B → SUCCESS
```

---

# 104. Lock Expiration Test

Use a short test configuration:

```text
REVIEW_LOCK_MINUTES=1
```

Test:

```text
Reviewer A claims task
 ↓
wait > 1 minute
 ↓
Reviewer B claims task
 ↓
SUCCESS
```

Verify Reviewer A can no longer submit.

---

# 105. Review Completion Test

Test:

```text
Reviewer claims
 ↓
submits
 ↓
Review created
 ↓
Analysis COMPLETED
 ↓
ReviewTask COMPLETED
 ↓
Final result available
```

All should happen together.

---

# 106. Failure Tests

Test:

```text
AI timeout
AI malformed JSON
PDF extraction failure
Redis unavailable
PostgreSQL failure
expired review lock
unauthorized reviewer
duplicate analysis
```

The goal is not sophisticated recovery.

The goal is:

> **The system should fail cleanly instead of becoming stuck or corrupting state.**

---

# 107. Docker

Use Docker Compose only for infrastructure:

```text
docker-compose.yml

services:
  postgres
  redis
```

Backend can run directly during development:

```text
npm run dev
```

Do not create separate containers for every backend module.

---

# 108. Local Development

Expected flow:

```bash
docker compose up -d
```

Then:

```bash
cd backend
npm install
```

Create:

```text
.env
```

from:

```text
.env.example
```

Then:

```bash
npx prisma migrate dev
npx prisma db seed
```

Then:

```bash
npm run dev
```

---

# 109. Seed Data

Seed:

### Super Admin

Use environment variables for credentials.

Do not hardcode a real production password.

Example:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

### Careers

Seed:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

### Do not seed fake user/reviewer data unless required for development.

---

# 110. Package Scripts

Backend should provide:

```text
dev
build
start
test
test:watch
lint
format
prisma:generate
prisma:migrate
prisma:seed
```

Example conceptual setup:

```text
dev
→ tsx watch src/server.ts

build
→ tsc

start
→ node dist/server.js

test
→ vitest run
```

---

# 111. API Documentation

Create:

```text
docs/API.md
```

Document:

- endpoint
- method
- authentication
- role
- request body
- response
- errors

Also document:

```text
docs/CONCURRENCY.md
```

Explain:

### Career generation

```text
Redis cache
+
Redis lock
+
polling
```

### Review task

```text
PostgreSQL atomic update
+
lock expiration
```

This documentation is important for your project presentation.

---

# 112. Concurrency Design Summary

CareerGap deliberately uses **two different concurrency solutions**.

## Shared AI computation

Problem:

```text
Many users
 ↓
same career
 ↓
duplicate expensive LLM generation
```

Solution:

```text
Redis cache
+
per-career distributed lock
```

## Review assignment

Problem:

```text
Many reviewers
 ↓
same review task
```

Solution:

```text
PostgreSQL atomic conditional update
+
temporary lock
+
expiration
```

Do not combine these mechanisms unnecessarily.

---

# 113. LLM Cost Architecture

Normal path:

```text
Career
 ↓
Redis
 ↓
DB
```

No LLM.

Resume:

```text
Resume
 ↓
PDF extraction
 ↓
ONE LLM call
 ↓
skills
```

Matching:

```text
Skills
 +
Career Profile
 ↓
backend calculation
```

No LLM.

Recommendations:

```text
Missing skills
 ↓
importance sorting
```

No LLM.

Therefore:

```text
Normal new analysis
≈ 1 LLM call
```

---

# 114. AI Provider Failure Strategy

If primary provider reaches quota:

The provider abstraction should allow configuration such as:

```text
AI_PROVIDER=gemini
```

Future provider:

```text
AI_PROVIDER=openai
```

Do not implement automatic multi-provider fallback in the MVP.

Why?

Because automatic fallback could accidentally double API usage and make quota management harder.

Manual provider switching is sufficient.

---

# 115. No AI Career Generation During Normal Flow

The five seeded careers are the normal source.

Therefore:

```text
User chooses Backend Engineer
 ↓
DB profile
 ↓
Redis cache
```

No AI call.

The career-generation fallback exists mainly to demonstrate:

```text
cache miss
+
distributed lock
+
shared computation
```

without making it part of every analysis.

---

# 116. Final Backend Data Flow

```text
                 USER
                  │
                  ▼
            Upload Resume
                  │
                  ▼
           Extract PDF Text
                  │
                  ▼
          One LLM Skill Call
                  │
                  ▼
        Normalize Extracted Skills
                  │
                  ▼
           Select Career
                  │
                  ▼
        ┌───────────────────┐
        │ Redis Career Cache │
        └─────────┬─────────┘
                  │
           MISS   │   HIT
             │   │
             ▼   └──────────────┐
       PostgreSQL               │
             │                  │
          MISS│                  │
             ▼                  │
       Redis Career Lock        │
             │                  │
             ▼                  │
            LLM                 │
             │                  │
             ▼                  │
       PostgreSQL               │
             │                  │
             ▼                  │
           Redis ───────────────┘
                  │
                  ▼
          Deterministic Matching
                  │
                  ▼
           Initial AI Result
                  │
                  ▼
            ReviewTask OPEN
                  │
                  ▼
        ┌─────────────────────┐
        │   Reviewer Queue    │
        └──────────┬──────────┘
                   │
             Claim Task
                   │
                   ▼
             DB Atomic Lock
                   │
                   ▼
               LOCKED
                   │
                   ▼
            Human Review
                   │
             ┌─────┴─────┐
             │           │
          Complete     Abandon
             │           │
             ▼           ▼
        COMPLETED    Lock Expires
             │           │
             ▼           ▼
       Final Result     OPEN
             │
             ▼
            USER
```

---

# 117. Final Backend Scope

## MUST IMPLEMENT

```text
✓ Express
✓ TypeScript
✓ PostgreSQL
✓ Prisma
✓ Redis
✓ JWT
✓ bcrypt
✓ Zod
✓ PDF extraction
✓ AI provider abstraction
✓ Gemini provider
✓ AI skill extraction
✓ Skill normalization
✓ 5 career profiles
✓ Career DB seed
✓ Redis career caching
✓ Redis career lock fallback
✓ Deterministic scoring
✓ Analysis lifecycle
✓ ReviewTask
✓ Reviewer role
✓ Atomic reviewer locking
✓ 15-minute lock expiration
✓ Review submission
✓ Final result
✓ Super Admin reviewer management
✓ Ownership checks
✓ Failure states
✓ Basic rate limiting
✓ Tests
✓ Docker infrastructure
```

---

# 118. Explicitly DO NOT IMPLEMENT

```text
✗ BullMQ
✗ Kafka
✗ RabbitMQ
✗ WebSockets
✗ Socket.IO
✗ Redis Pub/Sub
✗ Microservices
✗ Kubernetes
✗ GraphQL
✗ Advanced OCR
✗ Skill ontology
✗ AI-generated match percentage
✗ AI-generated recommendations
✗ Automatic reviewer assignment
✗ Multiple reviewer levels
✗ Reviewer reputation
✗ Reviewer compensation
✗ Advanced audit/versioning
✗ Complex career editing
✗ Complex analytics
✗ Production-grade multi-region scaling
```

---

# 119. Definition of Done

The backend is considered complete only when this entire flow works:

```text
1. User registers
2. User logs in
3. User uploads a PDF resume
4. Backend extracts text
5. Backend calls LLM once
6. Backend gets normalized skills
7. User selects one of five careers
8. Backend gets career profile
9. Matching is calculated deterministically
10. Initial result is saved
11. ReviewTask is created
12. Reviewer sees task
13. Two reviewers cannot claim same task
14. Reviewer can lock task
15. Lock expires after configured duration
16. Another reviewer can reclaim expired task
17. Reviewer can inspect resume + AI result
18. Reviewer can correct result
19. Reviewer submits
20. ReviewTask becomes COMPLETED
21. Analysis becomes COMPLETED
22. Final result becomes available to user
23. Failed AI requests become FAILED
24. No secret is exposed
25. Important concurrency tests pass
```

---

# 120. Implementation Order

The AI coding agent should implement in this order.

### Phase 1 — Foundation

```text
package setup
TypeScript
Express
environment
error handling
logging
health endpoint
```

### Phase 2 — Database

```text
Prisma
schema
migrations
seed
indexes
relationships
```

### Phase 3 — Infrastructure

```text
PostgreSQL connection
Redis connection
Docker Compose
```

### Phase 4 — Authentication

```text
register
login
JWT
bcrypt
middleware
roles
```

### Phase 5 — Resume

```text
upload
PDF extraction
normalization
ownership
```

### Phase 6 — AI

```text
AI provider interface
Gemini provider
skill extraction
Zod output validation
skill normalization
```

### Phase 7 — Career

```text
career seed
career service
Redis cache
DB fallback
Redis lock
LLM fallback
```

### Phase 8 — Analysis

```text
analysis creation
duplicate protection
matching
score
recommendations
status management
ReviewTask creation
```

### Phase 9 — Review

```text
review queue
task claim
atomic locking
expiration
task access
review submission
transaction
final result
```

### Phase 10 — Admin

```text
reviewer list
add reviewer
activate/deactivate reviewer
```

### Phase 11 — Testing

```text
auth
resume
AI
cache
career lock
analysis
review lock
expiration
review submission
failure states
```

### Phase 12 — Final Verification

Run:

```text
lint
tests
build
migration
seed
Docker
manual end-to-end flow
concurrent request tests
```

---

# 121. Final Instruction to the AI Coding Agent

When implementing this backend, follow these rules:

```text
1. Read architecture.md before coding.

2. Treat architecture.md and this backend plan
   as the source of truth.

3. Do not redesign the architecture.

4. Do not introduce technologies that are explicitly
   excluded.

5. Do not invent endpoints.

6. Do not invent database entities.

7. Do not call the LLM for deterministic operations.

8. Keep LLM usage to approximately one call
   per new analysis.

9. Keep seeded career profiles in PostgreSQL.

10. Use Redis as cache, not as the source of truth.

11. Use Redis locking only for missing career-profile
    generation.

12. Use PostgreSQL atomic updates for reviewer task
    acquisition.

13. Never hold a PostgreSQL transaction while calling
    an external LLM.

14. Never allow two reviewers to own the same task.

15. Never allow an expired reviewer lock to submit.

16. Always release Redis generation locks safely.

17. Validate all LLM output.

18. Validate all API input with Zod.

19. Check resource ownership on every user-owned resource.

20. Keep controllers thin.

21. Keep business logic inside services.

22. Keep AI provider logic isolated.

23. Keep Redis logic isolated.

24. Keep scoring deterministic.

25. Keep the implementation appropriate for a
    10-day project.

26. Do not over-engineer.

27. After each major phase, run tests/build and fix
    problems before continuing.

28. Do not move to the next phase if the current
    phase is broken.

29. At the end, verify the complete user → AI →
    review → final-result flow.
```

# Backend Completion Target

The finished backend should demonstrate these three ideas clearly:

```text
              CAREERGAP
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   AI COST     CONCURRENT   HUMAN
 OPTIMIZATION   ACCESS      REVIEW
       │          │          │
       ▼          ▼          ▼
   Redis Cache   Redis Lock  DB Atomic Lock
                              +
                           Expiration
```

The backend should therefore feel like a **small but intentionally engineered system**, not a large AI application with dozens of features.
