# CareerGap — Complete Frontend API Documentation

**Document Version:** 1.0  
**Backend:** Node.js + TypeScript + Express  
**Database:** PostgreSQL + Prisma  
**Cache:** Redis  
**Authentication:** JWT  
**AI:** Gemini through backend provider abstraction  
**API Style:** REST  
**Base URL:** `http://localhost:5000/api`

---

# 1. Purpose of This Document

This document defines the complete contract between:

```text
CareerGap Frontend
        ↕
CareerGap Backend API
```

A frontend developer or AI coding agent should use this document as the **single API integration reference**.

The frontend must not guess:

- endpoint names
- HTTP methods
- request fields
- response fields
- authentication requirements
- user roles
- analysis statuses
- review statuses
- error formats
- ownership rules

If something is not documented here, the frontend should **not invent it**.

---

# 2. Important Architecture Rule

The frontend is a client of the backend.

The backend is responsible for:

```text
Authentication
Authorization
Resume processing
AI skill extraction
Career profiles
Skill normalization
Skill matching
Score calculation
Recommendations
Analysis lifecycle
Review lifecycle
Lock management
Final result
```

The frontend is responsible for:

```text
Displaying data
Collecting user input
Calling APIs
Managing loading states
Managing error states
Polling analysis status
Displaying reviewer UI
```

The frontend must NOT independently calculate:

```text
match percentage
missing skills
matched skills
analysis status
review lock expiration
```

The backend is the source of truth.

---

# 3. Base URL

Development:

```text
http://localhost:5000/api
```

Production:

```text
https://<your-backend-domain>/api
```

The frontend must store this in an environment variable.

Next.js example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Then API requests should use:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

Do not hardcode the production URL throughout the application.

---

# 4. API Route Groups

All endpoints belong to one of these groups:

```text
/api/auth
/api/resumes
/api/careers
/api/analyses
/api/reviews
/api/admin
```

Complete route map:

```text
AUTH
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

RESUME
POST   /api/resumes
GET    /api/resumes/:id

CAREER
GET    /api/careers
GET    /api/careers/:id

ANALYSIS
POST   /api/analyses
GET    /api/analyses
GET    /api/analyses/:id

REVIEW
GET    /api/reviews/tasks
POST   /api/reviews/tasks/:id/claim
GET    /api/reviews/tasks/:id
POST   /api/reviews/tasks/:id/submit

ADMIN
GET    /api/admin/reviewers
POST   /api/admin/reviewers
PATCH  /api/admin/reviewers/:id
```

Health check:

```text
GET /health
```

---

# 5. Authentication

CareerGap uses JWT authentication.

Protected requests require:

```http
Authorization: Bearer <accessToken>
```

Example:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

# 6. User Roles

There are three roles:

```text
USER
REVIEWER
SUPER_ADMIN
```

## USER

Can:

```text
Register
Login
Upload resume
View own resumes
Create analysis
View own analyses
View final result
```

## REVIEWER

Can:

```text
Login
View review tasks
Claim review task
View claimed task
Submit review
```

## SUPER_ADMIN

Can:

```text
Login
View reviewers
Create reviewer
Activate/deactivate reviewer
```

A frontend route should be protected according to the user's role.

---

# 7. Authentication Token Strategy

The backend returns:

```text
accessToken
refreshToken
```

The access token is short-lived.

The frontend should use the access token for normal API calls.

When the access token expires, the frontend should use the refresh mechanism defined by the backend implementation.

Do not assume that an expired access token means the user must immediately log in again.

The frontend API client should centralize authentication handling.

Recommended structure:

```text
src/
├── lib/
│   └── api/
│       ├── client.ts
│       ├── auth.api.ts
│       ├── resume.api.ts
│       ├── career.api.ts
│       ├── analysis.api.ts
│       ├── review.api.ts
│       └── admin.api.ts
```

---

# 8. Standard Success Response

Successful responses should follow:

```json
{
  "success": true,
  "data": {}
}
```

Example:

```json
{
  "success": true,
  "data": {
    "id": "..."
  }
}
```

The frontend should generally read:

```typescript
response.data.data
```

depending on how the API client unwraps responses.

A recommended frontend API client should unwrap the `data` property so UI code can simply work with the returned object.

---

# 9. Standard Error Response

Errors follow:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Example:

```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

The frontend should display `message` to the user when appropriate.

The frontend should use `code` for programmatic handling.

Do not build logic based on matching the English `message`.

Bad:

```typescript
if (error.message === "Invalid email or password") {
}
```

Good:

```typescript
if (error.code === "INVALID_CREDENTIALS") {
}
```

---

# 10. Common HTTP Status Codes

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

Frontend behavior:

| Status | Meaning | Frontend action |
|---|---|---|
| 200 | Successful request | Use response |
| 201 | Resource created | Update UI / navigate |
| 400 | Invalid request | Show validation/error |
| 401 | Not authenticated | Refresh token or login |
| 403 | No permission | Show forbidden page/message |
| 404 | Resource missing | Show not found |
| 409 | Conflict | Explain conflict |
| 413 | File too large | Tell user to upload smaller file |
| 422 | Validation failure | Show form errors |
| 429 | Too many requests | Ask user to wait |
| 500 | Backend error | Show generic error |
| 503 | Temporary service unavailable | Retry later |

---

# 11. UUIDs

All primary resources use IDs.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

Frontend should treat IDs as opaque strings.

Do not:

```text
parseInt(id)
```

Do not assume IDs are sequential.

---

# 12. DATE/TIME FORMAT

All timestamps should be treated as ISO 8601 timestamps.

Example:

```text
2026-09-12T14:30:00.000Z
```

Frontend should convert timestamps to the user's local timezone for display.

Do not manually parse dates with string slicing.

Use:

```text
Date
date-fns
Day.js
```

or another existing frontend date utility if already included.

---

# 13. Authentication API

# 13.1 Register

```http
POST /api/auth/register
```

Authentication:

```text
NONE
```

Purpose:

Create a new normal user.

---

## Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | Yes | User's display name |
| email | string | Yes | Valid email |
| password | string | Yes | Password |

The frontend should validate basic requirements before submitting.

The backend remains the final validator.

---

## Success

HTTP:

```text
201 Created
```

Example:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

The frontend should not expect:

```text
password
passwordHash
```

in the response.

---

## Possible Errors

### Email already exists

```text
409 Conflict
```

```json
{
  "success": false,
  "message": "An account with this email already exists.",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

### Invalid data

```text
422 Unprocessable Entity
```

---

# 14. Login

```http
POST /api/auth/login
```

Authentication:

```text
NONE
```

---

## Request

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

---

## Success

```text
200 OK
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "accessToken": "JWT_ACCESS_TOKEN",
    "refreshToken": "REFRESH_TOKEN"
  }
}
```

The frontend should store authentication information using the project's secure token strategy.

For browser security, prefer HttpOnly cookies if the backend implementation supports them.

---

# 15. Get Current User

```http
GET /api/auth/me
```

Authentication:

```text
REQUIRED
```

---

## Request Headers

```http
Authorization: Bearer <accessToken>
```

---

## Success

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

Use this endpoint when the application starts to restore the authenticated user's session.

---

# 16. Logout

```http
POST /api/auth/logout
```

Authentication:

```text
REQUIRED
```

Purpose:

Invalidate the current refresh-token session.

---

## Request

Usually no request body is required.

```json
{}
```

---

## Success

```text
200 OK
```

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

After logout the frontend must:

```text
Clear local authentication state
Clear user-specific query cache
Redirect to login/home
```

---

# 17. Resume API

A resume belongs to one user.

Therefore:

```text
User A
  ↓
Resume A

User B
  ↓
Resume B
```

User A cannot retrieve User B's resume.

---

# 18. Upload Resume

```http
POST /api/resumes
```

Authentication:

```text
USER
```

Content type:

```http
multipart/form-data
```

---

## Form Data

Field:

```text
file
```

Example frontend:

```typescript
const formData = new FormData();

formData.append("file", file);

await api.post("/resumes", formData);
```

Do NOT manually set:

```http
Content-Type: multipart/form-data
```

when using browser `FormData`.

Let the browser/client set the boundary.

---

# 19. Resume Requirements

Accepted:

```text
PDF
```

The backend validates:

```text
file type
file size
file content
text extraction
```

Maximum file size is configured by the backend.

The frontend should show the configured maximum if the backend exposes it.

Otherwise use a UI limit consistent with the backend plan.

---

# 20. Resume Upload Success

```text
201 Created
```

Example:

```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "uuid",
      "fileName": "john-resume.pdf",
      "createdAt": "2026-09-12T14:30:00.000Z"
    }
  }
}
```

The frontend does not need the full extracted resume text for normal user screens.

---

# 21. Resume Upload Errors

### Invalid file

```text
400 Bad Request
```

Example:

```json
{
  "success": false,
  "message": "Only PDF files are supported.",
  "code": "INVALID_FILE_TYPE"
}
```

### File too large

```text
413 Payload Too Large
```

### Text extraction failed

```text
422 Unprocessable Entity
```

Example:

```json
{
  "success": false,
  "message": "Unable to extract readable text from this resume.",
  "code": "RESUME_EXTRACTION_FAILED"
}
```

The frontend should tell the user to upload a text-based PDF.

---

# 22. Get Resume

```http
GET /api/resumes/:id
```

Authentication:

```text
USER
```

Ownership:

```text
Current user must own resume.
```

---

## Success

```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "uuid",
      "fileName": "john-resume.pdf",
      "createdAt": "2026-09-12T14:30:00.000Z"
    }
  }
}
```

The frontend should not assume the extracted resume text is returned here.

Resume text is primarily needed by the reviewer interface.

---

# 23. Career API

Careers are predefined system profiles.

The initial system contains:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

Career profiles are stored in PostgreSQL and cached in Redis according to the architecture. The normal frontend career-selection flow should therefore **not trigger an LLM request**.

---

# 24. Get Careers

```http
GET /api/careers
```

Authentication:

```text
USER
```

---

## Success

```json
{
  "success": true,
  "data": {
    "careers": [
      {
        "id": "uuid",
        "slug": "backend_engineer",
        "name": "Backend Engineer",
        "description": "Builds server-side applications, APIs and backend systems."
      },
      {
        "id": "uuid",
        "slug": "frontend_engineer",
        "name": "Frontend Engineer",
        "description": "Builds user interfaces and frontend applications."
      }
    ]
  }
}
```

The frontend should populate the career-selection dropdown/card grid from this endpoint.

Do not hardcode career IDs.

---

# 25. Career Object

A career returned to the frontend contains:

```typescript
interface Career {
  id: string;
  slug: string;
  name: string;
  description: string;
}
```

The frontend should use:

```text
id
```

when creating an analysis.

Use:

```text
name
```

for display.

Use:

```text
slug
```

for stable UI references/URLs if needed.

---

# 26. Get One Career

```http
GET /api/careers/:id
```

Authentication:

```text
USER
```

---

## Success

```json
{
  "success": true,
  "data": {
    "career": {
      "id": "uuid",
      "slug": "backend_engineer",
      "name": "Backend Engineer",
      "description": "..."
    }
  }
}
```

The frontend does not need to know how Redis or PostgreSQL retrieves this profile.

---

# 27. Analysis API

The analysis is the central CareerGap workflow.

Flow:

```text
Resume
   +
Career
   ↓
POST /api/analyses
   ↓
PENDING
   ↓
PROCESSING
   ↓
AI skill extraction
   ↓
Deterministic matching
   ↓
REVIEW
   ↓
Human reviewer
   ↓
COMPLETED
```

The backend plan explicitly defines these analysis lifecycle states.

---

# 28. Analysis Status Enum

The frontend must support:

```text
PENDING
PROCESSING
REVIEW
COMPLETED
FAILED
```

Never assume only:

```text
loading
success
error
```

because the analysis has meaningful intermediate states.

---

# 29. Status Display Rules

Recommended UI:

| Backend status | UI |
|---|---|
| PENDING | Waiting to start |
| PROCESSING | Analyzing resume |
| REVIEW | Waiting for human review |
| COMPLETED | Analysis completed |
| FAILED | Analysis failed |

Example:

```text
PENDING
→ "Preparing your analysis..."

PROCESSING
→ "AI is analyzing your resume..."

REVIEW
→ "Your analysis is waiting for human verification."

COMPLETED
→ "Analysis completed."

FAILED
→ "Analysis failed. Please try again."
```

---

# 30. Create Analysis

```http
POST /api/analyses
```

Authentication:

```text
USER
```

---

## Request

```json
{
  "resumeId": "resume-uuid",
  "careerId": "career-uuid"
}
```

Both IDs are required.

---

# 31. Create Analysis — Important Frontend Rule

The frontend must NOT send:

```text
skills
matchPercentage
missingSkills
matchedSkills
recommendations
```

The backend calculates those.

The frontend only sends:

```text
resumeId
careerId
```

---

# 32. Create Analysis Success

```text
201 Created
```

Example:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid",
      "status": "PENDING",
      "resumeId": "resume-uuid",
      "careerId": "career-uuid",
      "createdAt": "2026-09-12T14:30:00.000Z"
    }
  }
}
```

The frontend should navigate to:

```text
/analysis/<analysisId>
```

and begin polling.

---

# 33. Analysis Processing

After creation:

```text
PENDING
```

may quickly become:

```text
PROCESSING
```

The backend then:

```text
Extracts resume text
       ↓
Calls LLM
       ↓
Normalizes skills
       ↓
Loads career profile
       ↓
Calculates match
       ↓
Stores AI result
       ↓
Creates ReviewTask
       ↓
REVIEW
```

The frontend does not need to know the internal steps.

---

# 34. Analysis Polling

There is intentionally no WebSocket requirement in the locked architecture.

Therefore the frontend should poll:

```http
GET /api/analyses/:id
```

Recommended interval:

```text
2–3 seconds
```

Example:

```text
GET /api/analyses/abc
      ↓
PROCESSING
      ↓
wait 2 seconds
      ↓
GET /api/analyses/abc
      ↓
PROCESSING
      ↓
wait 2 seconds
      ↓
GET /api/analyses/abc
      ↓
REVIEW
```

Once status becomes:

```text
COMPLETED
```

stop polling.

If:

```text
FAILED
```

stop polling.

---

# 35. Get Analysis

```http
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

---

# 36. Analysis — Processing Response

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid",
      "status": "PROCESSING",
      "resumeId": "resume-uuid",
      "careerId": "career-uuid",
      "createdAt": "2026-09-12T14:30:00.000Z",
      "updatedAt": "2026-09-12T14:30:05.000Z"
    }
  }
}
```

There may be no result yet.

Frontend should show a loading state.

---

# 37. Analysis — Review Response

When AI processing finishes:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid",
      "status": "REVIEW",
      "career": {
        "id": "career-uuid",
        "name": "Backend Engineer",
        "slug": "backend_engineer"
      },
      "aiResult": {
        "matchPercentage": 72.73,
        "matchedSkills": [
          "Node.js",
          "PostgreSQL"
        ],
        "missingSkills": [
          "Redis",
          "System Design"
        ]
      },
      "createdAt": "2026-09-12T14:30:00.000Z",
      "updatedAt": "2026-09-12T14:30:20.000Z"
    }
  }
}
```

The result is still an **initial AI result**.

It is not yet the verified final result.

The frontend should clearly indicate:

```text
Waiting for human review
```

---

# 38. Analysis — Completed Response

After reviewer approval:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid",
      "status": "COMPLETED",
      "career": {
        "id": "career-uuid",
        "name": "Backend Engineer",
        "slug": "backend_engineer"
      },
      "aiResult": {
        "matchPercentage": 72.73,
        "matchedSkills": [
          "Node.js",
          "PostgreSQL"
        ],
        "missingSkills": [
          "Redis",
          "System Design"
        ]
      },
      "finalResult": {
        "matchPercentage": 75,
        "matchedSkills": [
          "Node.js",
          "PostgreSQL",
          "Docker"
        ],
        "missingSkills": [
          "Redis",
          "System Design"
        ]
      },
      "createdAt": "2026-09-12T14:30:00.000Z",
      "updatedAt": "2026-09-12T14:45:00.000Z"
    }
  }
}
```

---

# 39. AI Result vs Final Result

This distinction is important.

## AI result

Generated automatically:

```text
aiResult
```

## Final result

Verified/corrected by reviewer:

```text
finalResult
```

Before review:

```text
finalResult = null
```

After review:

```text
finalResult = object
```

The final user dashboard should prioritize:

```text
finalResult
```

when available.

---

# 40. Final Result Fields

```typescript
interface AnalysisResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}
```

Example:

```json
{
  "matchPercentage": 75,
  "matchedSkills": [
    "Node.js",
    "PostgreSQL",
    "Docker"
  ],
  "missingSkills": [
    "Redis",
    "System Design"
  ]
}
```

---

# 41. Match Percentage

The backend calculates this.

Frontend must NOT recalculate it.

Conceptually:

```text
matched required skills
----------------------- × 100
total required skills
```

The frontend simply displays:

```text
75%
```

or:

```text
75.00%
```

according to the design.

---

# 42. Matched Skills

`matchedSkills` is an array of strings.

Example:

```json
[
  "Node.js",
  "PostgreSQL",
  "Docker"
]
```

UI example:

```text
✓ Node.js
✓ PostgreSQL
✓ Docker
```

---

# 43. Missing Skills

`missingSkills` is an array of strings.

Example:

```json
[
  "Redis",
  "System Design"
]
```

UI:

```text
Missing Skills

○ Redis
○ System Design
```

The frontend must not generate additional missing skills.

---

# 44. Recommendations

Recommendations are derived from missing career skills by backend deterministic logic.

The frontend should not call an AI model for recommendations.

If the backend exposes recommendations in the analysis response, render them exactly as returned.

If recommendations are not included in the final API schema, the frontend should not invent a separate recommendation endpoint.

---

# 45. Get User's Analysis History

```http
GET /api/analyses
```

Authentication:

```text
USER
```

Returns only the current user's analyses.

---

## Example

```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis-1",
        "status": "COMPLETED",
        "career": {
          "id": "career-1",
          "name": "Backend Engineer",
          "slug": "backend_engineer"
        },
        "matchPercentage": 75,
        "createdAt": "2026-09-12T14:30:00.000Z"
      },
      {
        "id": "analysis-2",
        "status": "REVIEW",
        "career": {
          "id": "career-2",
          "name": "AI/ML Engineer",
          "slug": "ai_ml_engineer"
        },
        "matchPercentage": 64.29,
        "createdAt": "2026-09-11T18:20:00.000Z"
      }
    ]
  }
}
```

For:

```text
PROCESSING
PENDING
REVIEW
```

the final match percentage may be absent/null.

---

# 46. Analysis List UI

Recommended columns:

```text
Career
Status
Match
Created
Action
```

Example:

```text
Backend Engineer
COMPLETED
75%
Sep 12, 2026
View Result
```

---

# 47. Duplicate Analysis

The backend protects against accidental duplicate active analysis requests.

If the same user submits the same resume/career combination while an active analysis exists, the backend may return:

```text
409 Conflict
```

Example:

```json
{
  "success": false,
  "message": "An active analysis already exists for this resume and career.",
  "code": "DUPLICATE_ANALYSIS"
}
```

Frontend behavior:

```text
Do not create another analysis.

Navigate to the existing analysis if the response provides its ID.

Otherwise refresh the user's analysis list.
```

---

# 48. Failed Analysis

If AI processing fails:

```text
status = FAILED
```

Example:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid",
      "status": "FAILED",
      "error": {
        "code": "ANALYSIS_FAILED",
        "message": "The analysis could not be completed."
      }
    }
  }
}
```

Frontend:

```text
Analysis failed.

[Try Again]
```

Do not show technical provider errors.

---

# 49. Review System

Reviewers verify AI-generated results.

Flow:

```text
Analysis
   ↓
ReviewTask OPEN
   ↓
Reviewer claims
   ↓
LOCKED
   ↓
Reviewer checks result
   ↓
Reviewer submits
   ↓
COMPLETED
```

The backend plan requires atomic task claiming so two reviewers cannot successfully claim the same task.

---

# 50. Review Task Status

Possible values:

```text
OPEN
LOCKED
COMPLETED
```

---

# 51. Review Queue

```http
GET /api/reviews/tasks
```

Authentication:

```text
REVIEWER
```

Returns available review tasks.

Available means:

```text
OPEN
```

or:

```text
LOCKED + expired lock
```

---

# 52. Review Queue Response

Example:

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-uuid",
        "status": "OPEN",
        "analysisId": "analysis-uuid",
        "career": {
          "name": "Backend Engineer"
        },
        "createdAt": "2026-09-12T14:35:00.000Z"
      }
    ]
  }
}
```

The frontend can display:

```text
Backend Engineer
Analysis #123
Waiting for review
[Review]
```

---

# 53. Claim Review Task

```http
POST /api/reviews/tasks/:id/claim
```

Authentication:

```text
REVIEWER
```

Request body:

```json
{}
```

No additional information is required.

The backend determines the current reviewer from the JWT.

---

# 54. Successful Task Claim

```text
200 OK
```

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-uuid",
      "status": "LOCKED",
      "lockedBy": "reviewer-uuid",
      "lockExpiresAt": "2026-09-12T15:00:00.000Z"
    }
  }
}
```

After successful claim, navigate to:

```text
/reviewer/tasks/<taskId>
```

---

# 55. Task Claim Conflict

If another reviewer already claimed it:

```text
409 Conflict
```

Example:

```json
{
  "success": false,
  "message": "Review task is already locked or completed.",
  "code": "REVIEW_TASK_LOCKED"
}
```

Frontend behavior:

```text
Do not show review editor.

Refresh task queue.

Show:
"This task was already claimed by another reviewer."
```

This behavior is directly required by the concurrency design.

---

# 56. Why Frontend Must Not Implement Locking

The frontend must never decide:

```typescript
if (task.status === "OPEN") {
  claimTask();
}
```

and assume it owns the task.

The backend performs the atomic operation.

Two reviewers may click at exactly the same time.

Backend decides:

```text
Reviewer A → success
Reviewer B → 409
```

The frontend only displays the result.

---

# 57. Get Review Task

```http
GET /api/reviews/tasks/:id
```

Authentication:

```text
REVIEWER
```

---

# 58. Review Task Response

Example:

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-uuid",
      "status": "LOCKED",
      "lockedBy": "current-reviewer-uuid",
      "lockExpiresAt": "2026-09-12T15:00:00.000Z"
    },
    "resume": {
      "id": "resume-uuid",
      "fileName": "john-resume.pdf",
      "text": "John Doe\nSoftware Engineer..."
    },
    "career": {
      "id": "career-uuid",
      "name": "Backend Engineer",
      "slug": "backend_engineer"
    },
    "analysis": {
      "id": "analysis-uuid",
      "status": "REVIEW",
      "aiResult": {
        "matchPercentage": 72.73,
        "matchedSkills": [
          "Node.js",
          "PostgreSQL"
        ],
        "missingSkills": [
          "Redis",
          "System Design"
        ]
      }
    }
  }
}
```

The reviewer page can therefore contain:

```text
Resume
Career
AI Match
Matched Skills
Missing Skills
Review Form
Lock Expiration
```

---

# 59. Reviewer Task Locked by Another Reviewer

If the task is currently locked by another reviewer:

```text
403 Forbidden
```

or:

```text
409 Conflict
```

The frontend should handle both as a task-access conflict if the backend uses either convention.

Recommended UI:

```text
This review task is currently being reviewed
by another reviewer.
```

Then return to:

```text
/reviewer/tasks
```

---

# 60. Review Lock Expiration

Default lock duration:

```text
15 minutes
```

The frontend receives:

```json
{
  "lockExpiresAt": "2026-09-12T15:00:00.000Z"
}
```

The frontend may display:

```text
Time remaining: 12:31
```

However:

> The frontend timer is only visual.

The backend remains the authority.

---

# 61. Expired Lock

When the lock expires:

```text
Reviewer cannot submit.
```

Submission returns:

```text
409 Conflict
```

Example:

```json
{
  "success": false,
  "message": "Review lock has expired. Please claim the task again.",
  "code": "REVIEW_LOCK_EXPIRED"
}
```

Frontend:

```text
Disable submit.

Show:
"Your review lock expired."

[Return to Queue]
```

---

# 62. Submit Review

```http
POST /api/reviews/tasks/:id/submit
```

Authentication:

```text
REVIEWER
```

---

# 63. Submit Review Request

```json
{
  "finalMatchPercentage": 75,
  "finalMatchedSkills": [
    "Node.js",
    "PostgreSQL",
    "Docker"
  ],
  "finalMissingSkills": [
    "Redis",
    "System Design"
  ],
  "comment": "Docker experience was present in the resume."
}
```

---

# 64. Review Form

Frontend fields:

```text
Final Match Percentage
Matched Skills
Missing Skills
Comment
```

Example:

```text
Final Match Percentage
[ 75 ]

Matched Skills
[Node.js] [PostgreSQL] [Docker]

Missing Skills
[Redis] [System Design]

Comment
[Docker experience was present in the resume.]

[Submit Review]
```

---

# 65. Review Validation

Backend requires:

```text
0 <= finalMatchPercentage <= 100
```

Skills:

```text
string[]
```

Comment:

```text
optional string
```

The frontend can validate these before submission, but backend validation remains authoritative.

---

# 66. Review Submission Success

```text
200 OK
```

Example:

```json
{
  "success": true,
  "data": {
    "review": {
      "id": "review-uuid",
      "reviewTaskId": "task-uuid",
      "createdAt": "2026-09-12T14:55:00.000Z"
    },
    "analysis": {
      "id": "analysis-uuid",
      "status": "COMPLETED",
      "finalResult": {
        "matchPercentage": 75,
        "matchedSkills": [
          "Node.js",
          "PostgreSQL",
          "Docker"
        ],
        "missingSkills": [
          "Redis",
          "System Design"
        ]
      }
    }
  }
}
```

The backend performs these operations transactionally:

```text
Create Review
     +
Update Analysis
     +
Analysis → COMPLETED
     +
ReviewTask → COMPLETED
```

The backend plan explicitly requires this transaction.

---

# 67. After Review Submission

Reviewer frontend should:

```text
Show success toast
       ↓
Invalidate review-task queries
       ↓
Invalidate analysis queries
       ↓
Navigate to reviewer queue
```

User frontend will see:

```text
REVIEW
```

become:

```text
COMPLETED
```

the next time it requests the analysis.

---

# 68. Admin — Reviewer List

```http
GET /api/admin/reviewers
```

Authentication:

```text
SUPER_ADMIN
```

---

## Success

```json
{
  "success": true,
  "data": {
    "reviewers": [
      {
        "id": "uuid",
        "name": "Reviewer One",
        "email": "reviewer@example.com",
        "role": "REVIEWER",
        "isActive": true,
        "createdAt": "2026-09-12T14:00:00.000Z"
      }
    ]
  }
}
```

---

# 69. Admin — Add Reviewer

```http
POST /api/admin/reviewers
```

Authentication:

```text
SUPER_ADMIN
```

---

## Request

```json
{
  "name": "Reviewer One",
  "email": "reviewer@example.com",
  "password": "TemporaryPassword123!"
}
```

The backend automatically assigns:

```text
role = REVIEWER
```

The frontend must NOT send:

```json
{
  "role": "SUPER_ADMIN"
}
```

The client cannot promote itself or another user.

---

# 70. Add Reviewer Success

```text
201 Created
```

```json
{
  "success": true,
  "data": {
    "reviewer": {
      "id": "uuid",
      "name": "Reviewer One",
      "email": "reviewer@example.com",
      "role": "REVIEWER",
      "isActive": true,
      "createdAt": "2026-09-12T14:00:00.000Z"
    }
  }
}
```

---

# 71. Admin — Activate/Deactivate Reviewer

```http
PATCH /api/admin/reviewers/:id
```

Authentication:

```text
SUPER_ADMIN
```

---

## Request

```json
{
  "isActive": false
}
```

or:

```json
{
  "isActive": true
}
```

---

## Success

```json
{
  "success": true,
  "data": {
    "reviewer": {
      "id": "uuid",
      "name": "Reviewer One",
      "email": "reviewer@example.com",
      "role": "REVIEWER",
      "isActive": false
    }
  }
}
```

A deactivated reviewer cannot claim new review tasks.

---

# 72. Health Check

```http
GET /health
```

Authentication:

```text NONE
```

Success:

```json
{
  "status": "ok"
}
```

This endpoint is mainly for deployment/infrastructure checks.

Frontend normally does not need to call it.

---

# 73. Complete TypeScript API Types

The frontend agent should create types similar to:

```typescript
export type UserRole =
  | "USER"
  | "REVIEWER"
  | "SUPER_ADMIN";

export type AnalysisStatus =
  | "PENDING"
  | "PROCESSING"
  | "REVIEW"
  | "COMPLETED"
  | "FAILED";

export type ReviewTaskStatus =
  | "OPEN"
  | "LOCKED"
  | "COMPLETED";
```

---

# 74. User Type

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
```

Never include:

```typescript
password
passwordHash
```

in frontend user types.

---

# 75. Career Type

```typescript
export interface Career {
  id: string;
  slug: string;
  name: string;
  description: string;
}
```

---

# 76. Resume Type

```typescript
export interface Resume {
  id: string;
  fileName: string;
  createdAt: string;
}
```

---

# 77. Analysis Result Type

```typescript
export interface AnalysisResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}
```

---

# 78. Analysis Type

```typescript
export interface Analysis {
  id: string;
  status: AnalysisStatus;
  resumeId: string;
  careerId: string;

  career?: Career;

  aiResult?: AnalysisResult | null;

  finalResult?: AnalysisResult | null;

  createdAt: string;
  updatedAt: string;

  error?: {
    code: string;
    message: string;
  } | null;
}
```

---

# 79. Review Task Type

```typescript
export interface ReviewTask {
  id: string;
  status: ReviewTaskStatus;
  analysisId: string;
  lockedBy?: string | null;
  lockExpiresAt?: string | null;
  createdAt: string;
}
```

---

# 80. Review Task Detail Type

```typescript
export interface ReviewTaskDetail {
  task: {
    id: string;
    status: ReviewTaskStatus;
    lockedBy?: string | null;
    lockExpiresAt?: string | null;
  };

  resume: {
    id: string;
    fileName: string;
    text: string;
  };

  career: Career;

  analysis: {
    id: string;
    status: AnalysisStatus;
    aiResult: AnalysisResult;
  };
}
```

---

# 81. API Client Architecture

Do not make API requests directly inside every component.

Bad:

```typescript
fetch("/api/analyses/123")
```

inside random components.

Recommended:

```text
Component
    ↓
TanStack Query hook
    ↓
API function
    ↓
API client
    ↓
Backend
```

Example:

```text
useAnalysis()
   ↓
analysisApi.getById()
   ↓
apiClient.get()
```

---

# 82. Recommended Frontend API Files

```text
src/
├── lib/
│   └── api/
│       ├── client.ts
│       ├── types.ts
│       ├── auth.api.ts
│       ├── resume.api.ts
│       ├── career.api.ts
│       ├── analysis.api.ts
│       ├── review.api.ts
│       └── admin.api.ts
│
└── hooks/
    ├── use-auth.ts
    ├── use-resumes.ts
    ├── use-careers.ts
    ├── use-analyses.ts
    ├── use-review-tasks.ts
    └── use-reviewers.ts
```

---

# 83. API Client Responsibilities

`apiClient` should handle:

```text
Base URL
Authorization
JSON serialization
FormData
Error parsing
401 handling
```

Example conceptual interface:

```typescript
apiClient.get<T>(url)
apiClient.post<T>(url, body)
apiClient.patch<T>(url, body)
apiClient.delete<T>(url)
```

---

# 84. Authentication Header

Protected request:

```http
GET /api/analyses/123
Authorization: Bearer <token>
```

The API client should automatically add this header.

Components should not manually construct:

```text
Authorization
```

for every request.

---

# 85. TanStack Query Recommendations

Use queries for:

```text
Current user
Careers
Resume list
Analysis list
Analysis detail
Review task queue
Review task detail
Reviewer list
```

Use mutations for:

```text
Register
Login
Logout
Upload resume
Create analysis
Claim task
Submit review
Create reviewer
Activate/deactivate reviewer
```

---

# 86. Query Keys

Use predictable query keys.

Example:

```typescript
["auth", "me"]

["careers"]

["resumes"]

["analyses"]

["analyses", analysisId]

["review-tasks"]

["review-tasks", taskId]

["admin", "reviewers"]
```

After creating an analysis:

```text
invalidate ["analyses"]
```

After submitting a review:

```text
invalidate ["review-tasks"]
invalidate ["review-tasks", taskId]
invalidate ["analyses", analysisId]
```

---

# 87. Analysis Polling Hook

Recommended behavior:

```typescript
useQuery({
  queryKey: ["analyses", analysisId],
  queryFn: () => analysisApi.getById(analysisId),

  refetchInterval: (query) => {
    const status = query.state.data?.status;

    if (
      status === "PENDING" ||
      status === "PROCESSING" ||
      status === "REVIEW"
    ) {
      return 3000;
    }

    return false;
  }
});
```

The frontend may stop polling on `COMPLETED` or `FAILED`.

For `REVIEW`, polling is useful because the reviewer may complete the task at any time.

---

# 88. Analysis Page State Machine

Frontend behavior:

```text
                 ┌───────────┐
                 │  PENDING  │
                 └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐
                 │ PROCESSING│
                 └─────┬─────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        ┌─────────┐        ┌─────────┐
        │  REVIEW │        │ FAILED  │
        └────┬────┘        └─────────┘
             │
             ▼
        ┌───────────┐
        │ COMPLETED │
        └───────────┘
```

UI must handle every state.

---

# 89. Loading State

During:

```text
PENDING
PROCESSING
```

show:

```text
Analyzing your resume...
```

Optionally show:

```text
Step 1: Reading resume ✓
Step 2: Extracting skills ...
Step 3: Comparing with career ...
Step 4: Human review pending
```

However, only display steps that are actually known from the API.

Do not pretend the backend provides progress percentages if it does not.

---

# 90. Review State UI

When:

```text
status = REVIEW
```

show:

```text
AI analysis complete

Your result is waiting for human verification.

Initial Match:
72.73%

Matched Skills:
...

Missing Skills:
...
```

Do not label it:

```text
Final Result
```

until:

```text
status = COMPLETED
```

---

# 91. Completed State UI

When:

```text
status = COMPLETED
```

show:

```text
Your CareerGap Result

75%

Career:
Backend Engineer

Matched Skills:
✓ Node.js
✓ PostgreSQL
✓ Docker

Missing Skills:
○ Redis
○ System Design
```

This is the verified final result.

---

# 92. Failed State UI

When:

```text
status = FAILED
```

show:

```text
Analysis Failed

We couldn't complete your analysis.

[Try Again]
```

If the backend provides an error message intended for users, display it.

Do not display raw stack traces.

---

# 93. Resume Upload UI Flow

Recommended:

```text
Upload Resume
      ↓
Select PDF
      ↓
Client validates extension/type/size
      ↓
POST /api/resumes
      ↓
Upload successful
      ↓
Receive resumeId
      ↓
Career selection
```

The important returned value is:

```text
resume.id
```

Save it in the form state.

---

# 94. Create Analysis UI Flow

```text
Resume selected
      ↓
Career selected
      ↓
Click "Analyze"
      ↓
POST /api/analyses
      ↓
Receive analysisId
      ↓
Navigate:
 /analysis/<analysisId>
      ↓
Poll
```

Do not wait for the entire AI operation inside the button request if the backend returns a processing state.

---

# 95. Career Selection

Use:

```http
GET /api/careers
```

Display:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

When selected:

```text
selectedCareerId = career.id
```

Then:

```json
{
  "resumeId": "...",
  "careerId": "..."
}
```

is sent to:

```text
POST /api/analyses
```

---

# 96. User Dashboard

Recommended API calls:

```text
GET /api/auth/me
GET /api/analyses
GET /api/careers
```

Dashboard can show:

```text
Total Analyses
Completed
In Review
Processing
Latest Result
```

These values should be derived from API data.

Do not create a backend endpoint solely for simple counts unless actually required later.

---

# 97. Analysis History

Use:

```http
GET /api/analyses
```

Display:

```text
Career
Date
Status
Match
```

For incomplete analyses:

```text
Match:
—
```

For completed analyses:

```text
Match:
75%
```

---

# 98. Reviewer Dashboard

Recommended API:

```text
GET /api/reviews/tasks
```

Display:

```text
Open Review Tasks
```

Each task:

```text
Career
Created
Status
[Claim]
```

After claiming:

```text
GET /api/reviews/tasks/:id
```

---

# 99. Reviewer Page

The reviewer page should display three areas.

### Resume

```text
Resume text
```

### AI Result

```text
Match %
Matched skills
Missing skills
```

### Review Form

```text
Final Match %
Final Matched Skills
Final Missing Skills
Comment
Submit
```

---

# 100. Reviewer Lock Timer

When a task is successfully claimed:

```text
lockExpiresAt
```

is available.

Frontend can calculate:

```text
remaining = lockExpiresAt - currentTime
```

Display:

```text
Review reserved for you
12:43 remaining
```

When timer reaches zero:

```text
disable submit
```

But still rely on backend validation.

---

# 101. Reviewer Task Race Condition

Possible scenario:

```text
Reviewer A opens task
Reviewer B opens same task

A clicks Claim
B clicks Claim
```

Backend:

```text
A → 200
B → 409
```

Frontend A:

```text
Open review editor
```

Frontend B:

```text
Task unavailable
Refresh queue
```

This is expected behavior.

---

# 102. Admin Dashboard

API:

```text
GET /api/admin/reviewers
```

Display:

```text
Reviewer
Email
Status
Created
Action
```

Example:

```text
John Doe
john@example.com
ACTIVE
[Deactivate]
```

---

# 103. Admin Add Reviewer

Form:

```text
Name
Email
Temporary Password
```

Submit:

```text
POST /api/admin/reviewers
```

After success:

```text
invalidate ["admin", "reviewers"]
```

---

# 104. Admin Toggle Reviewer

When admin clicks:

```text
Deactivate
```

send:

```json
{
  "isActive": false
}
```

When active:

```text
Activate
```

send:

```json
{
  "isActive": true
}
```

---

# 105. Authorization Matrix

| Endpoint | USER | REVIEWER | SUPER_ADMIN |
|---|:---:|:---:|:---:|
| Register | ✓ | ✓ | ✓ |
| Login | ✓ | ✓ | ✓ |
| `/auth/me` | ✓ | ✓ | ✓ |
| Upload resume | ✓ | ✗ | ✗ |
| Get own resume | ✓ | ✗ | ✗ |
| Careers | ✓ | optional | optional |
| Create analysis | ✓ | ✗ | ✗ |
| Get own analysis | ✓ | ✗ | ✗ |
| Analysis history | ✓ | ✗ | ✗ |
| Review queue | ✗ | ✓ | ✗ |
| Claim task | ✗ | ✓ | ✗ |
| Get review task | ✗ | ✓ | ✗ |
| Submit review | ✗ | ✓ | ✗ |
| Reviewer management | ✗ | ✗ | ✓ |

The backend remains the final authorization authority.

---

# 106. Frontend Route Protection

Recommended:

```text
/
 /login
 /register

/dashboard
/analysis/[id]

/reviewer
/reviewer/tasks/[id]

/admin
/admin/reviewers
```

Rules:

```text
USER
→ /dashboard
→ /analysis/*

REVIEWER
→ /reviewer/*
 
SUPER_ADMIN
→ /admin/*
```

If the user navigates manually to an unauthorized page:

```text
403-style UI
```

or redirect to their appropriate dashboard.

---

# 107. Important Security Rule

Frontend route protection is for UX.

It is NOT security.

For example, hiding:

```text
/admin
```

from normal users does not secure it.

Backend must still reject:

```text
USER → POST /api/admin/reviewers
```

with:

```text
403 Forbidden
```

---

# 108. API Error Handling Strategy

Create one frontend error type:

```typescript
interface ApiError {
  success: false;
  message: string;
  code: string;
}
```

API client should convert HTTP errors into this format.

Example:

```typescript
try {
  await analysisApi.create(data);
} catch (error) {
  // use error.code
}
```

---

# 109. Important Error Codes

Frontend should understand at least:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT

EMAIL_ALREADY_EXISTS
INVALID_CREDENTIALS

INVALID_FILE_TYPE
RESUME_EXTRACTION_FAILED

DUPLICATE_ANALYSIS
ANALYSIS_FAILED
AI_PROVIDER_ERROR

REVIEW_TASK_LOCKED
REVIEW_LOCK_EXPIRED
INVALID_REVIEW_OWNER
```

The backend may add additional internal codes later.

Unknown codes should still show a generic error message.

---

# 110. Error Handling by Feature

## Login

```text
INVALID_CREDENTIALS
→ "Invalid email or password."
```

## Resume

```text
INVALID_FILE_TYPE
→ "Please upload a PDF."

RESUME_EXTRACTION_FAILED
→ "We couldn't read this PDF."
```

## Analysis

```text
DUPLICATE_ANALYSIS
→ Open existing analysis.

ANALYSIS_FAILED
→ Show retry.
```

## Review

```text
REVIEW_TASK_LOCKED
→ Return to queue.

REVIEW_LOCK_EXPIRED
→ Ask reviewer to reclaim task.
```

---

# 111. Do Not Retry Everything

Frontend should not automatically retry:

```text
400
401
403
404
409
422
```

Retry may be appropriate for temporary:

```text
503
network error
```

Polling analysis status is different from retrying a failed request.

---

# 112. Network Error

If there is no response:

```text
Network Error
```

show:

```text
Unable to connect to CareerGap server.

Please check your internet connection and try again.
```

Do not display:

```text
undefined
```

or raw fetch errors.

---

# 113. File Upload Progress

Optional frontend enhancement:

```text
Uploading...
██████████░░ 80%
```

This is frontend behavior.

It does not require a new backend endpoint.

---

# 114. Empty States

## No analyses

```text
You haven't analyzed a resume yet.

[Analyze My Resume]
```

## No review tasks

```text
No review tasks are currently available.
```

## No reviewers

```text
No reviewers have been added yet.
```

---

# 115. Loading States

Every API-driven page needs loading states.

Examples:

```text
Loading careers...
Loading analyses...
Loading review tasks...
Loading reviewers...
```

For analysis:

```text
Analyzing your resume...
```

Do not show an empty page while waiting.

---

# 116. Optimistic Updates

Do NOT use optimistic updates for:

```text
Review claim
Review submission
Analysis creation
```

because these operations have important backend state/concurrency behavior.

Wait for backend confirmation.

---

# 117. API Calls That Change Server State

These should be mutations:

```text
POST /register
POST /login
POST /logout

POST /resumes

POST /analyses

POST /reviews/tasks/:id/claim
POST /reviews/tasks/:id/submit

POST /admin/reviewers
PATCH /admin/reviewers/:id
```

---

# 118. API Calls That Read State

These should be queries:

```text
GET /auth/me

GET /careers
GET /careers/:id

GET /resumes/:id

GET /analyses
GET /analyses/:id

GET /reviews/tasks
GET /reviews/tasks/:id

GET /admin/reviewers
```

---

# 119. Complete Frontend-to-Backend Flow

## New User

```text
Register
 ↓
POST /auth/register
 ↓
Login
 ↓
POST /auth/login
 ↓
Store authentication state
 ↓
GET /auth/me
 ↓
Dashboard
```

---

# 120. Complete Resume Analysis Flow

```text
Dashboard
 ↓
Upload resume
 ↓
POST /resumes
 ↓
resumeId
 ↓
GET /careers
 ↓
User selects career
 ↓
POST /analyses
 ↓
analysisId
 ↓
Navigate /analysis/:id
 ↓
GET /analyses/:id
 ↓
PENDING
 ↓
Poll
 ↓
PROCESSING
 ↓
Poll
 ↓
REVIEW
 ↓
Display:
"Waiting for human review"
 ↓
Poll
 ↓
COMPLETED
 ↓
Display final result
```

---

# 121. Complete Reviewer Flow

```text
Reviewer Login
 ↓
GET /reviews/tasks
 ↓
Display OPEN tasks
 ↓
Reviewer clicks Claim
 ↓
POST /reviews/tasks/:id/claim
 ↓
200?
 │
 ├── YES
 │    ↓
 │  GET /reviews/tasks/:id
 │    ↓
 │  Display resume + AI result
 │    ↓
 │  Reviewer edits result
 │    ↓
 │  POST /reviews/tasks/:id/submit
 │    ↓
 │  SUCCESS
 │    ↓
 │  Return queue
 │
 └── NO
      ↓
    409
      ↓
    "Task already claimed"
      ↓
    Refresh queue
```

---

# 122. Complete Admin Flow

```text
Admin Login
 ↓
GET /admin/reviewers
 ↓
Display reviewers
 ↓
Add reviewer
 ↓
POST /admin/reviewers
 ↓
Refresh reviewer list
```

Activation:

```text
Click deactivate
 ↓
PATCH /admin/reviewers/:id
 ↓
{ isActive: false }
 ↓
Refresh list
```

---

# 123. Frontend Must Never Implement

The AI coding agent must NOT implement these calculations:

```text
Match percentage
Missing skills generation
Career skill generation
AI extraction
Review lock ownership
Review lock expiration authority
Analysis state transitions
Review task assignment
```

Those belong to the backend.

---

# 124. Frontend Must Never Call Gemini

Wrong:

```text
Frontend
 ↓
Gemini API
```

Correct:

```text
Frontend
 ↓
CareerGap Backend
 ↓
Gemini
```

API keys must never be included in frontend code.

---

# 125. Frontend Must Never Access PostgreSQL

Wrong:

```text
Next.js
 ↓
PostgreSQL
```

Correct:

```text
Next.js
 ↓
Express API
 ↓
Prisma
 ↓
PostgreSQL
```

---

# 126. Frontend Must Not Know Redis Details

The frontend should never know:

```text
career cache key
career lock key
Redis TTL
lock implementation
```

Those are backend implementation details.

---

# 127. Career Cache Is Invisible to Frontend

Frontend:

```text
GET /api/careers
```

Backend:

```text
Redis
 ↓
PostgreSQL
 ↓
Redis
```

The frontend always sees the same API contract.

This separation is important.

---

# 128. Review Lock Is Backend-Owned

Frontend may display:

```text
lockExpiresAt
```

but cannot extend or manipulate it.

There is intentionally no frontend endpoint such as:

```text
POST /extend-lock
```

unless the backend architecture is explicitly changed.

---

# 129. Recommended Axios/fetch Abstraction

The architecture uses native backend `fetch()` for AI/monitoring concerns; that does not dictate the frontend HTTP client.

For the frontend, either:

```text
fetch
```

or:

```text
Axios
```

may be used.

For a simple project, native `fetch()` is sufficient.

Example:

```typescript
async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw body;
  }

  return body.data;
}
```

For `FormData`, do not force JSON headers.

---

# 130. Suggested API Function Definitions

```typescript
// auth.api.ts

register(data: RegisterRequest): Promise<User>

login(data: LoginRequest): Promise<LoginResponse>

me(): Promise<User>

logout(): Promise<void>
```

```typescript
// resume.api.ts

upload(file: File): Promise<Resume>

getById(id: string): Promise<Resume>
```

```typescript
// career.api.ts

getAll(): Promise<Career[]>

getById(id: string): Promise<Career>
```

```typescript
// analysis.api.ts

create(data: CreateAnalysisRequest): Promise<Analysis>

getAll(): Promise<Analysis[]>

getById(id: string): Promise<Analysis>
```

```typescript
// review.api.ts

getTasks(): Promise<ReviewTask[]>

claimTask(id: string): Promise<ReviewTask>

getTask(id: string): Promise<ReviewTaskDetail>

submitReview(
  id: string,
  data: SubmitReviewRequest
): Promise<SubmitReviewResponse>
```

```typescript
// admin.api.ts

getReviewers(): Promise<Reviewer[]>

createReviewer(
  data: CreateReviewerRequest
): Promise<Reviewer>

updateReviewer(
  id: string,
  data: UpdateReviewerRequest
): Promise<Reviewer>
```

---

# 131. Request Types

```typescript
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateAnalysisRequest {
  resumeId: string;
  careerId: string;
}

export interface SubmitReviewRequest {
  finalMatchPercentage: number;
  finalMatchedSkills: string[];
  finalMissingSkills: string[];
  comment?: string;
}

export interface CreateReviewerRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateReviewerRequest {
  isActive: boolean;
}
```

---

# 132. Reviewer Type

```typescript
export interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: "REVIEWER";
  isActive: boolean;
  createdAt: string;
}
```

---

# 133. Login Response Type

```typescript
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

---

# 134. Generic API Types

```typescript
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
}
```

---

# 135. Form Validation

Frontend may use Zod.

Example:

```typescript
const createAnalysisSchema = z.object({
  resumeId: z.string().uuid(),
  careerId: z.string().uuid(),
});
```

However:

> Frontend validation improves UX. Backend validation is authoritative.

---

# 136. Authentication State

Recommended state:

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

Prefer deriving authentication state from:

```text
GET /api/auth/me
```

rather than trusting only local storage.

---

# 137. After Login

After successful login:

```text
Save authentication credentials according to secure strategy
 ↓
Set current user
 ↓
Redirect based on role
```

Role routing:

```text
USER
→ /dashboard

REVIEWER
→ /reviewer

SUPER_ADMIN
→ /admin
```

---

# 138. Unauthorized Request

If backend returns:

```text
401
```

the API client should attempt the appropriate token-refresh flow if configured.

If refresh fails:

```text
Clear auth state
Redirect /login
```

Do not repeatedly retry forever.

---

# 139. Forbidden Request

If:

```text
403
```

show:

```text
You don't have permission to access this page.
```

Do not automatically log the user out.

`403` means authenticated but not authorized.

---

# 140. Not Found

If:

```text
404
```

for:

```text
GET /analyses/:id
```

show:

```text
Analysis not found.
```

If appropriate, provide:

```text
Back to Dashboard
```

---

# 141. Conflict

A `409` is not necessarily a server failure.

Examples:

```text
Duplicate analysis
Review task already claimed
Review lock expired
```

Frontend should show a specific explanation.

---

# 142. Mobile/Responsive Behavior

API contract does not change based on device.

The same endpoints are used by:

```text
Desktop
Tablet
Mobile
```

Only presentation changes.

---

# 143. No Mock API in Final Version

During development, mocks may be temporarily used.

Before final integration:

```text
Remove mock responses.
```

All production UI flows should call:

```text
CareerGap Backend API
```

---

# 144. No Hardcoded Fake Results

Do not create frontend code like:

```typescript
const match = 75;
const missingSkills = ["Redis"];
```

except in isolated development fixtures/tests.

The real dashboard must use backend data.

---

# 145. Frontend Integration Checklist

Before considering integration complete:

```text
[ ] Register works
[ ] Login works
[ ] Current user loads
[ ] Logout works
[ ] Protected routes work
[ ] Resume upload works
[ ] Invalid PDF handled
[ ] Careers load from API
[ ] Career selection works
[ ] Analysis creation works
[ ] Analysis ID navigation works
[ ] PENDING state works
[ ] PROCESSING state works
[ ] REVIEW state works
[ ] COMPLETED state works
[ ] FAILED state works
[ ] Analysis polling stops correctly
[ ] Analysis history works
[ ] Reviewer queue works
[ ] Claim task works
[ ] Claim conflict works
[ ] Lock countdown works
[ ] Expired lock handled
[ ] Review submission works
[ ] Reviewer queue refreshes
[ ] Admin reviewer list works
[ ] Add reviewer works
[ ] Activate/deactivate works
[ ] 401 handled
[ ] 403 handled
[ ] 404 handled
[ ] 409 handled
[ ] 422 handled
[ ] 500 handled
[ ] Mobile UI works
```

---

# 146. AI Coding Agent Instructions

Give the following instructions to any AI agent building the frontend:

```text
You are implementing only the CareerGap frontend.

Read the complete API documentation before writing API integration code.

The backend is the source of truth.

Do not invent endpoints.

Do not invent request fields.

Do not invent response fields.

Do not change backend architecture.

Do not connect directly to PostgreSQL.

Do not connect directly to Redis.

Do not call Gemini directly.

Do not implement AI skill extraction.

Do not calculate match percentages.

Do not generate missing skills.

Do not implement review locking.

Do not implement analysis state transitions.

Do not create WebSocket/Socket.IO functionality.

Use REST APIs exactly as documented.

Use TypeScript.

Create a centralized API client.

Create separate API modules for:
- auth
- resumes
- careers
- analyses
- reviews
- admin

Use TanStack Query for server state.

Use mutations for POST/PATCH operations.

Use queries for GET operations.

Poll GET /api/analyses/:id while analysis status is:
PENDING
PROCESSING
REVIEW

Stop polling when status is:
COMPLETED
FAILED

Treat backend matchPercentage as authoritative.

Treat backend finalResult as authoritative.

Treat backend lockExpiresAt as authoritative.

Handle HTTP 409 as a business conflict, not a generic crash.

Handle HTTP 401 through the authentication refresh/logout flow.

Handle HTTP 403 as permission denial.

Handle HTTP 404 as resource-not-found.

Handle HTTP 422 as validation failure.

Handle HTTP 500/503 as server/service errors.

Never expose API keys.

Never expose database credentials.

Never put Gemini credentials in frontend environment variables.

After implementing each API module, test it against the real backend.

Do not finish with mocked data.

Before completion, verify the entire:
register → login → upload → career → analysis → review → final result
flow.
```

---

# 147. Final API Contract Summary

```text
                         CAREERGAP API

AUTH
├── POST   /auth/register
├── POST   /auth/login
├── GET    /auth/me
└── POST   /auth/logout

RESUME
├── POST   /resumes
└── GET    /resumes/:id

CAREER
├── GET    /careers
└── GET    /careers/:id

ANALYSIS
├── POST   /analyses
├── GET    /analyses
└── GET    /analyses/:id

REVIEW
├── GET    /reviews/tasks
├── POST   /reviews/tasks/:id/claim
├── GET    /reviews/tasks/:id
└── POST   /reviews/tasks/:id/submit

ADMIN
├── GET    /admin/reviewers
├── POST   /admin/reviewers
└── PATCH  /admin/reviewers/:id

HEALTH
└── GET    /health
```

---

# 148. Core Data Flow

```text
USER
 │
 ├── Register/Login
 │
 ▼
AUTHENTICATED USER
 │
 ├── Upload Resume
 │       │
 │       ▼
 │    resumeId
 │
 ├── Get Careers
 │       │
 │       ▼
 │    careerId
 │
 └── Create Analysis
         │
         ▼
      analysisId
         │
         ▼
      PENDING
         │
         ▼
     PROCESSING
         │
         ▼
       REVIEW
         │
         ▼
   HUMAN REVIEWER
         │
         ▼
      COMPLETED
         │
         ▼
    FINAL RESULT
```

---

# 149. Most Important Contract Rules

Remember these seven rules:

```text
1. Frontend sends resumeId + careerId.
   Backend performs analysis.

2. Frontend never calls Gemini.

3. Backend calculates match percentage.

4. Backend owns analysis status.

5. Backend owns review-task locking.

6. Backend owns final result.

7. Frontend displays backend state.
```

---

# 150. Definition of Frontend/Backend Integration Complete

Integration is complete when a new developer can clone the frontend, read this document, configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

start the backend, and then successfully perform:

```text
Register
   ↓
Login
   ↓
Upload Resume
   ↓
Load Careers
   ↓
Select Career
   ↓
Create Analysis
   ↓
Poll Analysis
   ↓
See REVIEW
   ↓
Reviewer Claims Task
   ↓
Reviewer Reviews
   ↓
Reviewer Submits
   ↓
User Sees COMPLETED
   ↓
User Sees Final Match
```

without needing to inspect the backend source code to guess how the API works.

That is the standard this document is designed to provide.