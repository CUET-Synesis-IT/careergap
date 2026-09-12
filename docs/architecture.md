Yes. Now I would lock the architecture around **10-day feasibility + minimum LLM usage + two genuine concurrency problems**.

The biggest change I recommend is this:

> **Do not use LLM for every stage.**
> Use LLM only where language understanding is actually needed. Everything else should be deterministic code/database logic.

# CareerGap — Full Architecture Plan

## 1. Core Product

```text
User uploads resume
        ↓
Resume text extraction
        ↓
AI extracts user's technical skills
        ↓
User selects target career
        ↓
System gets predefined career profile
        ↓
Deterministic skill matching
        ↓
Initial result
        ↓
Human review queue
        ↓
Reviewer locks task
        ↓
Reviewer verifies/corrects result
        ↓
Final result
        ↓
User sees final analysis
```

The system has **two genuine concurrency problems** and a clear **cost-optimization strategy**:

> CareerGap uses LLMs only for resume skill extraction, while deterministic matching handles career-gap scoring. Redis caching reduces repeated career-profile computation, and atomic database operations coordinate concurrent reviewer task assignment.

---

# 2. Recommended Technology Stack

## Frontend

| Technology      | Purpose              |
| --------------- | -------------------- |
| Next.js         | Web application      |
| TypeScript      | Type safety          |
| Tailwind CSS    | Styling              |
| shadcn/ui       | UI components        |
| TanStack Query  | Server state/cache   |
| React Hook Form | Forms                |
| Zod             | Frontend validation  |
| Recharts        | Result visualization |
| Lucide React    | Icons                |

No Redux.

No Socket.IO.

No unnecessary state-management library.

---

# 3. Backend

| Technology                                    | Purpose                                 |
| --------------------------------------------- | --------------------------------------- |
| Node.js                                       | Runtime                                 |
| TypeScript                                    | Backend language                        |
| Express.js                                    | REST API                                |
| Prisma                                        | ORM                                     |
| PostgreSQL                                    | Persistent database                     |
| Redis                                         | Career-profile cache + distributed lock |
| JWT                                           | Authentication                          |
| bcrypt                                        | Password hashing                        |
| Zod                                           | Backend validation                      |
| Native `fetch()`                              | LLM/API requests                        |
| pdf-parse / equivalent lightweight PDF parser | Resume text extraction                  |

No Axios.

No BullMQ.

No Kafka.

No microservices.

---

# 4. AI Layer

This is where we need to be careful because you're using **free API quotas**.

I recommend designing the AI layer so that the LLM provider is replaceable:

```text
src/
└── ai/
    ├── ai.service.ts
    ├── ai.provider.ts
    ├── providers/
    │   ├── gemini.provider.ts
    │   └── openai.provider.ts
    └── prompts/
        ├── skill-extraction.prompt.ts
        └── career-profile.prompt.ts
```

Your application talks to:

```text
AIService
```

not directly to Gemini/OpenAI everywhere.

That means if one free API reaches its limit, you can switch provider without rewriting the application.

---

# 5. MOST IMPORTANT: Minimize LLM Calls

Don't design:

```text
User 1 → LLM
User 2 → LLM
User 3 → LLM
User 4 → LLM
```

Instead:

```text
                 Career Profile
                       │
              ┌────────┴────────┐
              │                 │
           Redis             PostgreSQL
           Cache             Permanent
              │
              ▼
        Shared by users
```

The LLM should generate **career requirements**, not repeat them for every user.

---

# 6. Career Profile Strategy

Use a **predefined career catalog**.

Start with only:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

Don't support arbitrary careers in the MVP.

Each career has a stable identifier:

```text
backend_engineer
frontend_engineer
ai_ml_engineer
devops_engineer
data_engineer
```

---

# 7. Two-Level Career Profile Storage

This is where we save lots of LLM calls.

Use:

```text
PostgreSQL = persistent source
Redis = fast cache
```

Flow:

```text
Request
   ↓
Redis?
   │
   ├── YES → use profile
   │
   └── NO
        ↓
      DB?
        │
        ├── YES → put into Redis → use
        │
        └── NO → generate once with LLM
```

So even if Redis expires:

```text
Redis expired
     ↓
PostgreSQL still has profile
     ↓
NO LLM CALL
```

This is important.

### Do NOT make TTL expiration mean:

> “Generate again.”

Instead:

> **Redis is a performance cache, PostgreSQL is the durable career-profile source.**

That dramatically reduces API usage.

---

# 8. When Should LLM Generate Career Profile?

Ideally:

### First-ever setup

You can manually generate the 5 career profiles once using the free API and save them into PostgreSQL.

Then your production/demo system starts with:

```text
PostgreSQL
├── Backend Engineer
├── Frontend Engineer
├── AI/ML Engineer
├── DevOps Engineer
└── Data Engineer
```

Now:

```text
User → Career
       ↓
DB
       ↓
Redis
```

**Zero LLM calls during normal career selection.**

### Then why keep distributed locking?

Keep it as a **fallback mechanism**.

If a career profile is genuinely missing:

```text
DB MISS
   ↓
Redis Lock
   ↓
One request → LLM
Other requests → wait
   ↓
Save DB + Redis
```

So your project can still demonstrate shared LLM computation without wasting API quota during normal operation.

This is the best balance.

---

# 9. Career Profile Structure

Don't store just:

```text
["Node.js", "Docker", "Redis"]
```

Give each skill an importance level.

Example:

```json
{
  "career": "Backend Engineer",
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
      "name": "Docker",
      "importance": "MEDIUM"
    },
    {
      "name": "Redis",
      "importance": "MEDIUM"
    },
    {
      "name": "Kubernetes",
      "importance": "LOW"
    }
  ]
}
```

This gives you the option of a slightly better scoring formula later.

But for MVP, you can still use:

```text
matched / total × 100
```

---

# 10. Resume Processing — 1 Analysis = 1 LLM Call

Don't overcomplicate reuse. Instead of caching extractions based on resume text hashes (which introduces edge cases around identifying same vs different users), simply do:

```text
1 resume analysis = 1 LLM call
```

That is highly reasonable for an MVP.

### Idempotency (Crucial Feature)
What if the user double-clicks the "[Analyze]" button? You don't want:
```text
Analysis #101
Analysis #102
```
both calling the LLM simultaneously. 

For the MVP:
1. Disable the button on the frontend upon click.
2. Make the backend reject duplicate **active** analysis requests for the same resume/user/career combination.

---

# 11. Resume LLM Call & Skill Normalization

Use **one LLM call** for skill extraction.

Input:
```text
Raw resume text
```

Output should strictly be:
```json
{
  "skills": [
    "JavaScript",
    "Node.js",
    "PostgreSQL",
    "Docker"
  ]
}
```

Don't ask the LLM to output `match %`, `missing skills`, `recommendations`, `ranking`, or `career readiness`. Your backend does those deterministically.

### Skill Normalization
Implement a small deterministic mapping dictionary in code to noticeably improve matching quality.
You do not need an ML-based ontology, just maintain:

```typescript
const skillNormalization: Record<string, string> = {
  "node": "Node.js",
  "nodejs": "Node.js",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL"
}
```
Normalizing the extracted array before matching keeps the app logic predictable.

---

# 12. Deterministic Matching & Scoring

Don't make the scoring complicated or use importance weighting for the match percentage initially. 

For the MVP matching version:
```text
matchPercentage = matchedSkills.length / requiredSkills.length * 100
```

Suppose a career requires 6 skills.
Resume has 4 of them.
Backend calculates: `4 / 6 * 100 = 66.67%`.

Then use importance weights *only* for displaying recommendations in the UI:
```text
Missing:
Redis        HIGH
Kafka        MEDIUM
Kubernetes   LOW
```

**No LLM calls are involved in this matching stage.**

---

# 14. Complete AI Call Budget

Normal scenario:

```text
Career profile:
0 LLM calls
        +
Resume:
1 LLM call
        +
Matching:
0 LLM calls
        +
Recommendations:
0 LLM calls
```

### Total:

**1 LLM call per new resume analysis.**

That is excellent for free API limits.

And if the same resume was already analyzed:

**0 LLM calls.**

---

# 15. Optional AI Optimization

You can also put a limit on resume text.

For example:

```text
Maximum extracted text → X characters
```

Don't send a 30-page resume to the LLM.

For your demo:

```text
Normal resume
→ 1–2 pages
→ small prompt
→ low token usage
```

---

# 16. Career Profile Cache Architecture

Use Redis keys like:

```text
career:profile:backend_engineer
career:profile:frontend_engineer
career:profile:ai_ml_engineer
```

TTL could be:

```text
24 hours
```

or longer.

But remember:

```text
Redis expiration
       ↓
PostgreSQL fallback
       ↓
No LLM
```

So TTL is mainly for demonstrating cache behavior/performance, not controlling AI generation.

---

# 17. Career Generation Lock

For a missing career profile:

```text
career:lock:backend_engineer
```

Use Redis:

```text
SET key value NX EX 60
```

Meaning:

> Acquire lock only if it doesn't already exist.

### Request A

```text
SET lock NX
→ SUCCESS
```

A calls LLM.

### Request B

```text
SET lock NX
→ FAILED
```

B waits.

### Request C

```text
SET lock NX
→ FAILED
```

C waits.

Then:

```text
A → LLM
  → PostgreSQL
  → Redis
  → release lock
```

B/C retrieve the generated profile.

---

# 18. Redis Constraint

For this project Redis has exactly **two jobs**:
1. Career profile cache
2. Career generation / reviewer coordination lock

That's enough. Do not introduce:
❌ Redis queues (BullMQ)
❌ Redis Pub/Sub
❌ Redis sessions
❌ Redis rate limiters
❌ Redis result caches

Use simple polling instead of WebSockets.
```text
while career profile unavailable:
    wait 500ms
    check Redis
    if profile available: return profile
```
Maximum wait: 10-15 seconds.

---

# 19. Review Architecture

Now the second major system problem.

After AI analysis:

```text
Analysis
   ↓
ReviewTask
   ↓
OPEN
```

Reviewer dashboard:

```text
Open Tasks
──────────────
Task #101
Task #102
Task #103
```

---

# 20. Review Task Database

Use:

```text
ReviewTask
```

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

Statuses:

```text
OPEN
LOCKED
COMPLETED
```

---

# 21. Reviewer Lock

Reviewer A:

```text
Take Task #101
```

Backend performs atomic update:

```text
UPDATE review_tasks
SET
    status = 'LOCKED',
    locked_by = reviewerId,
    lock_expires_at = ...
WHERE
    id = taskId
    AND (
        status = 'OPEN'
        OR lock_expires_at < NOW()
    );
```

If:

```text
affected rows = 1
```

Reviewer gets task.

If:

```text
affected rows = 0
```

Someone else owns it.

---

# 22. Reviewer Lock Expiration

Suppose:

```text
lock duration = 15 minutes
```

Reviewer A takes task:

```text
10:00
```

Expiration:

```text
10:15
```

At:

```text
10:16
```

another reviewer can claim it.

No complicated lock service required.

---

# 23. Review Completion

Reviewer submits:

```text
Review
```

Backend verifies:

```text
task.status == LOCKED
task.lockedBy == currentReviewer
lock not expired
```

Then transaction:

```text
ReviewTask → COMPLETED

Analysis → FINAL
```

This is important.

The reviewer shouldn't be able to modify somebody else's task.

---

# 24. Analysis State Machine

Keep this explicit.

```text
PENDING
   ↓
PROCESSING
   ↓
REVIEW
   ↓
LOCKED
   ↓
COMPLETED
```

But note:

`LOCKED` is technically the **ReviewTask state**, not necessarily the Analysis state.

A cleaner separation is:

### Analysis

```text
PENDING
PROCESSING
REVIEW
COMPLETED
FAILED
```

### ReviewTask

```text
OPEN
LOCKED
COMPLETED
```

This avoids mixing two different concepts.

---

# 25. Failure Handling

You need:

```text
PENDING
PROCESSING
REVIEW
COMPLETED
FAILED
```

If LLM fails:

```text
PROCESSING
     ↓
FAILED
```

User gets:

> Analysis failed. Please try again.

If review task expires:

```text
LOCKED
 ↓
OPEN
```

If reviewer successfully submits:

```text
LOCKED
 ↓
COMPLETED
```

---

# 26. Database Design

I recommend these main tables:

```text
User
Career
Resume
Analysis
ReviewTask
Review
```

### User

```text
id
name
email
passwordHash
role
createdAt
updatedAt
```

Roles:

```text
USER
REVIEWER
SUPER_ADMIN
```

---

### Career

```text
id
slug
name
description
profile
createdAt
updatedAt
```

`profile` contains the predefined career requirements.

You can use PostgreSQL `JSONB` for the skill structure.

---

### Resume

```text
id
userId
fileName
text
textHash
createdAt
```

For your 10-day project, don't build a complicated file-storage architecture.

You can keep uploaded files locally during development or use simple object storage later.

---

### Analysis

```text
id
userId
resumeId
careerId
aiMatchPercentage
aiMatchedSkills
aiMissingSkills
finalMatchPercentage
finalMatchedSkills
finalMissingSkills
status
createdAt
updatedAt
```

---

### ReviewTask

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

---

### Review

```text
id
reviewTaskId
reviewerId
originalMatchPercentage
finalMatchPercentage
finalSkills
comment
createdAt
```

This lets you preserve the final reviewed output without building elaborate version history.

---

# 27. API Architecture

Keep REST.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Resume

```text
POST /api/resumes
GET  /api/resumes/:id
```

### Analysis

```text
POST /api/analyses
GET  /api/analyses/:id
```

### Review

```text
GET   /api/reviews/tasks
POST  /api/reviews/tasks/:id/claim
GET   /api/reviews/tasks/:id
POST  /api/reviews/tasks/:id/submit
```

### Admin

```text
GET  /api/admin/reviewers
POST /api/admin/reviewers
PATCH /api/admin/reviewers/:id
```

That's enough.

---

# 28. Frontend Pages

Keep it small.

```text
/
├── login
├── register
│
├── dashboard
│
├── analyze
│
├── analysis/[id]
│
├── review
│
├── review/[taskId]
│
└── admin/reviewers
```

### User Dashboard

Show:

```text
Previous analyses
Current analysis status
Final results
```

### Analyze page

```text
Upload Resume
Select Career
[Analyze]
```

### Result page

Before review:

```text
AI analysis completed

Status:
Waiting for human review
```

After review:

```text
Final Career Match: 75%

Existing Skills
Missing Skills
Recommendations
Reviewer-approved result
```

---

# 29. Reviewer Dashboard

The review process needs to be meaningful. Don't just give them an [Approve] button.
Give them the ability to manually change the AI's determinations.

```text
Review Dashboard

Open Tasks
──────────────────
Backend Engineer
AI Match: 72%
[Take Task]
```

Once claimed:

```text
Task #102
Status: LOCKED BY YOU
Time remaining: 12:31

Resume Text
──────────────────
...

AI Result
──────────────────
Matched Skills: Node.js, PostgreSQL
Missing Skills: Docker, Redis
AI Match %: 50%

Adjustments
──────────────────
Match %:           [ 75% ]
Matched skills:    [ Node.js, PostgreSQL, Docker ]
Missing skills:    [ Redis ]
Recommendations:   [ 1. Redis ]
Reviewer comment:  [ AI missed Docker. Corrected. ]

[ Submit Final Result ]
```
This tells a clear story in a demo: the AI does the heavy lifting, but the human validates and corrects.

---

# 30. Super Admin

Very small.

```text
Reviewer Management

Name          Status
────────────────────────
Reviewer A    Active
Reviewer B    Active
Reviewer C    Inactive

[Add Reviewer]
```

That's all.

---

# 31. Polling Instead of WebSockets

After analysis submission:

```text
POST /analyses
```

returns:

```json
{
  "analysisId": "...",
  "status": "PROCESSING"
}
```

Frontend polls:

```text
GET /analyses/:id
```

every:

```text
5 seconds
```

Until:

```text
REVIEW
```

Then stop.

After reviewer submits, user can poll again or simply refresh.

No Socket.IO.

---

# 32. Authentication

Simple JWT.

```text
Login
 ↓
Access Token
 ↓
Protected API
```

Roles:

```text
USER
REVIEWER
SUPER_ADMIN
```

Backend middleware:

```text
authenticate()
requireRole("REVIEWER")
requireRole("SUPER_ADMIN")
```

Don't over-engineer authentication.

---

# 33. Backend Folder Structure

I would now use:

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
│   │   ├── analysis.service.ts
│   │   ├── career.service.ts
│   │   ├── review.service.ts
│   │   └── scoring.service.ts
│   │
│   ├── ai/
│   │   ├── ai.service.ts
│   │   ├── ai.provider.ts
│   │   └── providers/
│   │       └── gemini.provider.ts
│   │
│   ├── cache/
│   │   ├── career-cache.ts
│   │   └── career-lock.ts
│   │
│   ├── parsers/
│   │   └── resume-parser.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── resume.routes.ts
│   │   ├── analysis.routes.ts
│   │   ├── review.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── validators/
│   │
│   ├── utils/
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
├── tests/
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

No workers/queues/schedulers unless you later discover you genuinely need one.

---

# 34. Docker

For local development:

```text
Docker Compose
│
├── PostgreSQL
└── Redis
```

Backend and frontend can run directly with npm during development.

You don't need to containerize every process for this project.

Eventually:

```text
Frontend → Vercel
Backend → Render/Railway/etc.
PostgreSQL → hosted PostgreSQL
Redis → hosted Redis
```

depending on available free tiers.

---

# 35. LLM Provider Strategy

Because free API limits are your biggest concern, make provider configuration environment-based:

```text
AI_PROVIDER=gemini
AI_MODEL=...
```

And keep:

```text
AIService
    ↓
Provider Interface
    ↓
GeminiProvider
```

Later:

```text
AIService
    ↓
OpenAIProvider
```

without changing analysis logic.

---

# 36. Cost-Saving Rules

I would make these **hard architectural rules**:

### Rule 1

**Never call LLM from frontend.**

### Rule 2

**Never call LLM for deterministic calculations.**

### Rule 3

**Never generate the same career profile repeatedly.**

### Rule 4

**Check PostgreSQL before generating a missing career profile.**

### Rule 5

**Check Redis before PostgreSQL.**

### Rule 6

**Only one request can generate a missing career profile.**

### Rule 7

**One resume analysis = one LLM call maximum.**

### Rule 8

**Cache extracted skills/results where practical.**

### Rule 9

**Keep prompts short and request structured JSON.**

### Rule 10

**Limit resume text sent to LLM.**

---

# 37. Expected LLM Usage

For a normal demo:

Suppose:

```text
5 careers
20 users
20 analyses
```

Career profiles:

```text
5 × 0 = 0 calls
```

because they're pre-seeded.

Resume analysis:

```text
20 × 1 = 20 calls
```

So approximately:

```text
20 LLM calls
```

instead of something like:

```text
20 career generations
+
20 resume analyses
+
20 matching calls
+
20 recommendation calls

= 80 calls
```

That's a **4× reduction** in this simple example.

And if you cache identical resume analyses, it can be even lower.

---

# 38. What Makes This Project Technically Interesting

Don't advertise 20 technologies.

Your actual story is:

### **1. Shared AI computation**

```text
Multiple users
      ↓
Same career
      ↓
One generation
      ↓
Shared profile
```

### **2. Cost-aware AI architecture**

```text
LLM
 ↓
Only when necessary

Everything else
 ↓
DB / Redis / deterministic code
```

### **3. Concurrent human review**

```text
Reviewer A ──┐
             ├── Task
Reviewer B ──┘

Only one succeeds
```

### **4. Temporary ownership**

```text
LOCKED
   ↓
15 min
   ↓
expired
   ↓
OPEN
```

### **5. Human-in-the-loop AI**

```text
AI
 ↓
Initial result
 ↓
Human
 ↓
Final result
```

That's enough.

---

# 39. 10-Day Implementation Plan

## Day 1 — Foundation

* Repository
* Backend
* Frontend
* PostgreSQL
* Prisma
* Redis
* authentication foundation

## Day 2 — Resume

* Upload
* PDF text extraction
* Resume storage


## Day 3 — AI Skill Extraction

* AI provider abstraction
* prompt
* structured JSON output
* skill normalization

## Day 4 — Career Profiles

* 5 careers
* PostgreSQL seed
* Redis cache
* career service

## Day 5 — Shared LLM Generation

* Redis lock
* cache miss handling
* waiting/polling
* failure/release handling
* concurrency testing

## Day 6 — Matching

* deterministic scoring
* matched skills
* missing skills
* recommendations
* analysis status

## Day 7 — Review System

* reviewer role
* review tasks
* reviewer dashboard
* task claiming

## Day 8 — Concurrency Review

* atomic locking
* lock expiration
* review submission
* final result

## Day 9 — Frontend Polish

* dashboard
* analysis status
* final result
* reviewer UI
* admin reviewer management
* polling

## Day 10 — Demo + Testing

Test:

```text
✓ Resume upload
✓ AI extraction
✓ Career cache
✓ Concurrent career requests
✓ One LLM generation
✓ Reviewer race
✓ Lock expiration
✓ Review completion
✓ Final result
✓ Failure state
```

Then deployment.

---

# 40. Final Architecture

This is the version I would **lock** for your 10-day project:

```text
                         ┌───────────────────┐
                         │      Next.js      │
                         │     Frontend      │
                         └─────────┬─────────┘
                                   │
                              REST API
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Express + Node   │
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
        PostgreSQL              Redis                  AI
              │                    │                    │
              │              ┌─────┴─────┐              │
              │              │           │              │
              │            Cache        Lock            │
              │              │           │              │
              │              └─────┬─────┘              │
              │                    │                    │
              │                    │                    │
              ▼                    ▼                    ▼
       Users/Careers          Shared Career       Skill Extraction
       Resumes/Analysis       Profiles             Only when needed
       ReviewTasks
              │
              │
              ▼
       Human Review
              │
              ▼
        Final Result
```

### The key optimization

```text
                    LLM
                     │
              ONLY WHEN NEEDED
                     │
          ┌──────────┴──────────┐
          │                     │
   Career profile          Resume skills
   first-time only         one analysis
          │                     │
          ▼                     ▼
      PostgreSQL              Analysis
          │
          ▼
         Redis
          │
          ▼
      Reuse forever
```

This is the balance I'd choose.

**Product scope stays small. LLM usage stays low. Redis has a real purpose. PostgreSQL locking has a real purpose. Human review has a real product justification. And you still have enough system-design material to defend the project in an interview.**


# 41. Final Scope Validation

Freeze the architecture here. For a 10-day project, additional nice-to-haves will kill the final product.

```text
MUST HAVE
────────────────────────
✓ Auth + roles
✓ Resume PDF extraction
✓ One LLM skill-extraction call
✓ 5 predefined career profiles 
✓ Redis career caching
✓ Career generation lock fallback
✓ Deterministic matching
✓ Review queue
✓ Atomic reviewer locking
✓ 15-minute lock expiry
✓ Reviewer corrections (meaningful review)
✓ Final result vs AI result split
✓ Idempotency (basic analysis failure/duplicate handling)
```

```text
CUT
────────────────────────
✗ Resume-hash intelligence (reuse extractions)
✗ Weighted scoring calculation
✗ AI-generated recommendations
✗ Arbitrary career generation
✗ WebSockets
✗ Queues / BullMQ
✗ Microservices
✗ Advanced audit system
✗ Automated reviewer assignment
✗ AI confidence system
```
