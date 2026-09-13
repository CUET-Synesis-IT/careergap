# CareerGap — Complete Frontend Product & Page-by-Page Implementation Plan

**Purpose:** Complete text-based frontend specification for CareerGap.

This document describes:

- Every frontend page
- Every section on each page
- Every button
- Every form
- Every user interaction
- Every loading state
- Every empty state
- Every error state
- Every role-specific behavior
- Every backend API interaction
- Navigation between pages
- Analysis lifecycle behavior
- Reviewer workflow
- Admin workflow
- Authentication behavior
- Frontend responsibilities vs backend responsibilities

This document should be detailed enough that an AI coding agent or frontend developer with limited backend knowledge can build the frontend without guessing.

---

# 1. Product Overview

CareerGap is a career skill-gap analysis platform.

Main user journey:

```text
User
 ↓
Register
 ↓
Login
 ↓
Dashboard
 ↓
Upload Resume
 ↓
Select Career
 ↓
Start Analysis
 ↓
AI analyzes resume
 ↓
Initial result generated
 ↓
Human reviewer verifies result
 ↓
Final result published
 ↓
User sees final career match
```

The application has three roles:

```text
USER
REVIEWER
SUPER_ADMIN
```

Each role has a different application experience.

---

# 2. Frontend Must Follow Backend as Source of Truth

The frontend must display backend state.

The frontend must NOT independently determine:

```text
match percentage
matched skills
missing skills
analysis status
review task ownership
review lock validity
final result
```

The backend is responsible for these.

The frontend is responsible for:

```text
displaying information
collecting user input
calling API endpoints
showing loading states
showing errors
navigation
polling analysis status
showing role-specific pages
```

---

# 3. Application Areas

The complete frontend can be divided into:

```text
PUBLIC
│
├── Landing Page
├── Login
└── Register

USER
│
├── Dashboard
├── Analyze Resume
├── Analysis Details
└── Profile / Account

REVIEWER
│
├── Reviewer Dashboard
├── Review Task Details
└── Reviewer Account

SUPER ADMIN
│
├── Admin Dashboard
├── Reviewer Management
└── Admin Account
```

---

# 4. Recommended Route Structure

Use Next.js routes similar to:

```text
/
├── login
├── register
│
├── dashboard
├── analyze
├── analysis
│   └── [id]
│
├── reviewer
│   ├── tasks
│   └── tasks
│       └── [id]
│
└── admin
    └── reviewers
```

Optional account page:

```text
/account
```

The frontend should not create unnecessary pages.

---

# 5. Role-Based Application Structure

After login:

```text
USER
 ↓
/dashboard

REVIEWER
 ↓
/reviewer/tasks

SUPER_ADMIN
 ↓
/admin/reviewers
```

A user must not see another role's navigation.

For example:

```text
USER
Navigation:
Dashboard
Analyze Resume
History
Account
Logout
```

Reviewer:

```text
Navigation:
Review Queue
My Current Review
Account
Logout
```

Super Admin:

```text
Navigation:
Dashboard
Reviewers
Account
Logout
```

---

# 6. Authentication Pages

There are two public authentication pages:

```text
/register
/login
```

---

# 7. Register Page

## Purpose

Create a normal CareerGap user account.

Important:

> Registration creates only a `USER`.

A normal user must never be able to select:

```text
REVIEWER
SUPER_ADMIN
```

during registration.

Reviewer accounts are created by Super Admin.

---

# 8. Register Page — Main Content

The page should contain:

```text
CareerGap logo/name

Create Your Account

Name input
Email input
Password input
Confirm Password input

Create Account button

Already have an account?
Login
```

---

# 9. Register Form

Fields:

### Name

```text
Label:
Full Name

Input:
Your full name
```

Required.

Frontend validation:

```text
not empty
```

---

### Email

```text
Label:
Email

Input:
you@example.com
```

Required.

Frontend should validate email format.

Backend remains authoritative.

---

### Password

```text
Label:
Password

Input:
Create password
```

Required.

The frontend may display password requirements if those requirements are defined by backend validation.

---

### Confirm Password

```text
Label:
Confirm Password

Input:
Re-enter password
```

Required.

Frontend must check:

```text
password === confirmPassword
```

If not:

```text
Passwords do not match.
```

Do not send `confirmPassword` to backend.

---

# 10. Register Button

Button:

```text
Create Account
```

Before submission:

```text
Validate form
```

If valid:

```text
POST /api/auth/register
```

Request:

```json
{
  "name": "...",
  "email": "...",
  "password": "..."
}
```

Do not send:

```text
confirmPassword
role
```

---

# 11. Register Loading State

After clicking:

```text
Create Account
```

button becomes disabled.

Display:

```text
Creating account...
```

Prevent duplicate submissions.

---

# 12. Register Success

After successful registration:

```text
Registration successful.
```

Then navigate to:

```text
/login
```

The frontend should not assume that registration automatically logs the user in unless the backend actually returns authentication credentials.

---

# 13. Register Errors

### Email already exists

Backend:

```text
409
EMAIL_ALREADY_EXISTS
```

Frontend:

```text
An account with this email already exists.
```

Provide:

```text
Go to Login
```

---

### Validation error

Display the relevant field error.

---

### Server error

Display:

```text
Unable to create your account right now.
Please try again.
```

---

# 14. Login Page

The login page is special because the product has three roles:

```text
User
Reviewer
Super Admin
```

The page should therefore visually allow the user to choose which type of account they are trying to access.

Example conceptual layout:

```text
CareerGap

Welcome Back

Choose Account Type

[ User ]
[ Reviewer ]
[ Super Admin ]

Email
Password

[ Login ]

Don't have a user account?
Create Account
```

---

# 15. Important Login Role Rule

The three role choices are a **frontend login mode**, not a security mechanism.

The frontend should still call:

```text
POST /api/auth/login
```

with:

```json
{
  "email": "...",
  "password": "..."
}
```

Do NOT send:

```json
{
  "role": "SUPER_ADMIN"
}
```

unless the backend API is explicitly changed to support that field.

The backend returns:

```text
user.role
```

The frontend uses that returned role.

---

# 16. Login Role Selection Behavior

### User selected

Expected returned role:

```text
USER
```

If backend returns:

```text
USER
```

navigate to:

```text
/dashboard
```

If backend returns:

```text
REVIEWER
```

or:

```text
SUPER_ADMIN
```

while User mode was selected:

```text
Show:
"This account belongs to a different account type."
```

Do not enter the dashboard.

---

### Reviewer selected

Expected:

```text
REVIEWER
```

After successful login:

```text
/reviewer/tasks
```

---

### Super Admin selected

Expected:

```text
SUPER_ADMIN
```

After successful login:

```text
/admin/reviewers
```

---

# 17. Login Form

Fields:

```text
Email
Password
```

Buttons:

```text
Login
```

Additional links:

```text
Forgot password
```

should NOT be implemented unless backend support exists.

Do not create fake password-reset functionality.

---

# 18. Login Success

Backend returns:

```text
user
accessToken
```

Store the `accessToken` and send it as `Authorization: Bearer <accessToken>` on every authenticated request.

Then:

```text
USER → /dashboard
REVIEWER → /reviewer/tasks
SUPER_ADMIN → /admin/reviewers
```

---

# 19. Login Errors

### Invalid credentials

```text
Invalid email or password.
```

### Inactive reviewer

If backend rejects inactive reviewer:

```text
This reviewer account is currently inactive.
Please contact an administrator.
```

### Unauthorized role mismatch

```text
This account does not belong to the selected account type.
```

### Server failure

```text
Unable to log in right now.
Please try again.
```

---

# 20. Application Startup Authentication

When the frontend starts:

```text
Application loads
 ↓
Authentication provider initializes
 ↓
GET /api/auth/me
```

If successful:

```text
authenticated
```

If unauthenticated:

```text
public state
```

If unauthenticated or the token is expired:

```text
clear auth state and remain in public state
```

---

# 21. Protected Route Behavior

Protected pages:

```text
/dashboard
/analyze
/analysis/*
/reviewer/*
/admin/*
```

If unauthenticated:

```text
redirect /login
```

If authenticated but wrong role:

```text
show unauthorized page
```

or redirect to the correct role dashboard.

---

# 22. Global Navigation

Authenticated users should have a common application shell.

However, navigation items depend on role.

---

# 23. USER Navigation

```text
CareerGap

Dashboard
Analyze Resume
Analysis History
Account

Logout
```

---

# 24. REVIEWER Navigation

```text
CareerGap

Review Queue
My Review

Account

Logout
```

---

# 25. SUPER_ADMIN Navigation

```text
CareerGap

Dashboard
Reviewers

Account

Logout
```

---

# 26. Logout Behavior

When user clicks:

```text
Logout
```

call:

```text
POST /api/auth/logout
```

Then:

```text
clear authentication state
clear user-specific cached data
redirect /login
```

Do not leave previous user's analysis data in client cache.

---

# 27. USER Dashboard

Route:

```text
/dashboard
```

Purpose:

Main landing page after USER login.

The dashboard should answer:

```text
Who am I?
What have I analyzed?
What is currently processing?
What is waiting for review?
What is my latest completed result?
How do I start another analysis?
```

---

# 28. Dashboard Sections

Recommended sections:

```text
1. Welcome section
2. Quick action
3. Analysis summary
4. Latest analysis
5. Analysis history
```

---

# 29. Dashboard Welcome Section

Display:

```text
Welcome, <user name>
```

Example:

```text
Welcome, Munzir
```

Also display a short explanation:

```text
Upload your resume and discover how well your skills match your target career.
```

Main button:

```text
Analyze New Resume
```

Click:

```text
/analyze
```

---

# 30. Dashboard Summary

Show simple counts derived from:

```text
GET /api/analyses
```

Possible cards:

```text
Total Analyses
Completed
In Review
Processing
```

These are frontend-derived values.

Do not create separate backend endpoints just for these counts.

---

# 31. Dashboard Latest Analysis

If there is at least one analysis:

Display:

```text
Latest Analysis

Career:
Backend Engineer

Status:
COMPLETED

Match:
75%

Created:
September 12, 2026

[View Result]
```

Click:

```text
/analysis/<id>
```

---

# 32. Dashboard When Latest Analysis Is Processing

Display:

```text
Latest Analysis

Backend Engineer

Status:
Analyzing...

[View Analysis]
```

Click:

```text
/analysis/<id>
```

---

# 33. Dashboard When Latest Analysis Is Under Review

Display:

```text
Latest Analysis

Backend Engineer

Status:
Waiting for human review

[View Analysis]
```

---

# 34. Dashboard When No Analysis Exists

Display:

```text
No analysis yet.

Upload your resume and compare your skills
with a career you're interested in.

[Analyze My Resume]
```

---

# 35. Analysis History Section

Display previous analyses.

Columns/items:

```text
Career
Status
Match
Date
Action
```

Example:

```text
Backend Engineer
Completed
75%
Sep 12, 2026
View Result
```

For:

```text
PENDING
PROCESSING
REVIEW
```

display:

```text
—
```

for final match if no final result exists.

---

# 36. Analyze Page

Route:

```text
/analyze
```

Purpose:

Start a new CareerGap analysis.

The page should guide the user through:

```text
Step 1: Resume
Step 2: Career
Step 3: Start Analysis
```

---

# 37. Analyze Page — Initial State

Display:

```text
Analyze Your Resume

Step 1
Upload your resume

Step 2
Choose your target career

Step 3
Start analysis
```

Initially:

```text
resume not selected
career not selected
Analyze button disabled
```

---

# 38. Resume Upload Section

Display:

```text
Upload Resume

Supported format:
PDF

Choose File
```

After file selection:

```text
Selected:
john-resume.pdf

[Remove]
```

---

# 39. Frontend File Validation

Before calling backend:

Check:

```text
file exists
file type is PDF
file size is within frontend limit
```

If invalid:

```text
Please upload a PDF resume.
```

If too large:

```text
Your resume is too large.
Please upload a smaller PDF.
```

Backend remains final authority.

---

# 40. Upload Button

Depending on UX, either:

```text
[Upload Resume]
```

then career selection appears,

or automatically upload after file selection.

For clearer implementation, use:

```text
[Upload Resume]
```

After clicking:

```text
POST /api/resumes
```

with:

```text
multipart/form-data
file
```

---

# 41. Resume Upload Loading State

Show:

```text
Uploading resume...
```

Disable:

```text
Upload
Analyze
```

until upload completes.

---

# 42. Resume Upload Success

Backend returns:

```text
resume.id
```

Store:

```text
resumeId
```

Frontend state:

```text
resumeUploaded = true
```

Display:

```text
Resume uploaded successfully.

john-resume.pdf
```

Then enable career selection.

---

# 43. Resume Upload Failure

If:

```text
INVALID_FILE_TYPE
```

show:

```text
Only PDF resumes are supported.
```

If:

```text
RESUME_EXTRACTION_FAILED
```

show:

```text
We couldn't read this PDF.
Please upload a text-based PDF.
```

If:

```text
413
```

show:

```text
File is too large.
```

---

# 44. Career Selection Section

Once resume upload succeeds:

```text
Step 2
Choose Your Target Career
```

Call:

```text
GET /api/careers
```

---

# 45. Career Loading State

Display:

```text
Loading available careers...
```

Do not show an empty career selector while the request is pending.

---

# 46. Career List

Display all predefined careers returned by backend.

Expected initial careers:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

Do not hardcode IDs.

---

# 47. Career Card Content

Each career option should show:

```text
Career Name
Description
Select button/radio
```

Example:

```text
Backend Engineer

Build server-side applications, APIs and backend systems.

[Select]
```

---

# 48. Career Selection Behavior

When user selects:

```text
Backend Engineer
```

store:

```text
careerId
```

Do not send:

```text
career name
```

to analysis API if API requires `careerId`.

---

# 49. Analyze Button

Button:

```text
Analyze Resume
```

Enabled only when:

```text
resumeId exists
AND
careerId exists
```

Clicking it calls:

```text
POST /api/analyses
```

Body:

```json
{
  "resumeId": "...",
  "careerId": "..."
}
```

---

# 50. Double-Click Protection

When user clicks:

```text
Analyze Resume
```

immediately:

```text
disable button
```

Show:

```text
Starting analysis...
```

This is UX protection.

Backend also protects against duplicate active analyses.

---

# 51. Analysis Creation Success

Backend returns:

```text
analysis.id
analysis.status
```

Frontend navigates to:

```text
/analysis/<analysisId>
```

---

# 52. Analysis Page

Route:

```text
/analysis/[id]
```

This is one of the most important pages.

It must display different content depending on:

```text
PENDING
PROCESSING
REVIEW
COMPLETED
FAILED
```

---

# 53. Analysis Page — PENDING

Display:

```text
Your Analysis

Status:
Preparing your analysis...

Your resume:
john-resume.pdf

Target career:
Backend Engineer
```

Show progress indicator:

```text
Preparing analysis...
```

Start polling.

---

# 54. Analysis Page — PROCESSING

Display:

```text
Analyzing Your Resume

Target Career:
Backend Engineer

Status:
Analysis in progress
```

Possible explanation:

```text
We're extracting your skills and comparing them
with the selected career.
```

Do not display fake progress percentages.

Do not claim:

```text
80% complete
```

unless backend provides actual progress.

---

# 55. Processing Polling

Call:

```text
GET /api/analyses/:id
```

every approximately:

```text
2–3 seconds
```

Continue while:

```text
PENDING
PROCESSING
REVIEW
```

Stop when:

```text
COMPLETED
FAILED
```

---

# 56. Analysis Page — REVIEW

When backend returns:

```text
status = REVIEW
```

display:

```text
AI Analysis Complete

Your initial result has been generated.

It is now waiting for human verification.
```

Then display:

```text
Initial AI Match
72.73%
```

---

# 57. REVIEW Result Sections

Display:

```text
Initial Match
Matched Skills
Missing Skills
Review Status
```

Example:

```text
Initial AI Match

72.73%

Matched Skills
✓ Node.js
✓ PostgreSQL

Missing Skills
○ Redis
○ System Design

Status:
Waiting for human review
```

---

# 58. Important REVIEW Label

Do NOT write:

```text
Final Result
```

At this stage.

Use:

```text
AI Result
```

or:

```text
Initial Analysis
```

because a human reviewer has not yet verified it.

---

# 59. Analysis Page — REVIEW Polling

Continue polling.

Why?

Because the reviewer may finish the task while the user is looking at this page.

Flow:

```text
REVIEW
 ↓
Frontend waits
 ↓
GET /analyses/:id
 ↓
REVIEW
 ↓
wait
 ↓
GET /analyses/:id
 ↓
COMPLETED
```

Then update the page automatically.

---

# 60. Analysis Page — COMPLETED

This is the final result state.

Display prominently:

```text
CareerGap Result

Backend Engineer

75%
Career Match
```

Then:

```text
Matched Skills
```

and:

```text
Missing Skills
```

---

# 61. Completed Result — Matched Skills

Example:

```text
Skills You Have

✓ Node.js
✓ PostgreSQL
✓ Docker
```

Use the exact backend array.

Do not add skills from frontend assumptions.

---

# 62. Completed Result — Missing Skills

Example:

```text
Skills to Improve

○ Redis
○ System Design
```

Use exact backend result.

---

# 63. AI vs Final Result on Completed Page

Optionally show:

```text
AI Initial Match: 72.73%
Final Verified Match: 75%
```

This is useful because it demonstrates the human-in-the-loop architecture.

Then emphasize:

```text
Final Verified Result
75%
```

The final result is authoritative.

---

# 64. Reviewer Verification Information

Completed page may contain:

```text
Verified by human reviewer
```

Do not expose unnecessary reviewer identity unless backend explicitly provides it.

---

# 65. Analysis Page — FAILED

Display:

```text
Analysis Failed

We couldn't complete your analysis.

Please try again.
```

Button:

```text
Try Again
```

---

# 66. Retry Analysis Behavior

Do not blindly resend the same POST request without considering duplicate protection.

Recommended:

```text
Try Again
 ↓
Return to /analyze
 ↓
User selects existing/uploaded resume
 ↓
User selects career
 ↓
Create new analysis
```

Alternatively, if backend later exposes a retry endpoint, use it.

Do not invent:

```text
POST /analyses/:id/retry
```

unless backend supports it.

---

# 67. Analysis Back Navigation

Provide:

```text
Back to Dashboard
```

or:

```text
Back to Analysis History
```

Do not navigate away automatically while analysis is processing.

---

# 68. Analysis History Page

If you want a dedicated page:

```text
/dashboard/history
```

However, this is optional.

The current API already supports:

```text
GET /api/analyses
```

so the history can also remain inside Dashboard.

For a 10-day project, keeping history inside Dashboard is simpler.

---

# 69. USER Account Page

Optional simple page:

```text
/account
```

Display:

```text
Name
Email
Role
```

Example:

```text
Account

Name:
John Doe

Email:
john@example.com

Account Type:
User
```

No password-changing feature unless backend supports it.

No fake settings.

---

# 70. REVIEWER Application

Reviewer has a separate workflow.

Main route:

```text
/reviewer/tasks
```

Purpose:

```text
See available AI analyses
Claim one
Review it
Submit corrected result
```

---

# 71. Reviewer Dashboard

Header:

```text
Review Queue
```

Description:

```text
Review AI-generated career analyses and verify their results.
```

---

# 72. Reviewer Queue API

Call:

```text
GET /api/reviews/tasks
```

Display returned tasks.

---

# 73. Reviewer Queue Item

Each task should show:

```text
Career
Analysis ID
Created time
Status
Action
```

Example:

```text
Backend Engineer

Analysis:
#abc123

Status:
OPEN

Created:
5 minutes ago

[Review Task]
```

---

# 74. Reviewer Queue Loading

Display:

```text
Loading review tasks...
```

---

# 75. Reviewer Queue Empty State

If no tasks:

```text
No review tasks are currently available.
```

Optionally provide:

```text
Refresh
```

button.

Refresh simply refetches:

```text
GET /api/reviews/tasks
```

---

# 76. Reviewer Claim Flow

When reviewer clicks:

```text
Review Task
```

There are two possible frontend approaches.

### Recommended

First attempt:

```text
POST /api/reviews/tasks/:id/claim
```

Then:

```text
GET /api/reviews/tasks/:id
```

after successful claim.

---

# 77. Claim Loading

While claiming:

```text
Claiming task...
```

Disable the claim button.

---

# 78. Claim Success

Backend returns:

```text
status = LOCKED
lockedBy = current reviewer
lockExpiresAt = timestamp
```

Navigate:

```text
/reviewer/tasks/<taskId>
```

---

# 79. Claim Conflict

If backend returns:

```text
409
REVIEW_TASK_LOCKED
```

display:

```text
This task has already been claimed by another reviewer.
```

Then:

```text
refresh task queue
```

Do not open the review editor.

---

# 80. Why Claim Must Be Backend-Controlled

Two reviewers can click simultaneously.

Example:

```text
Reviewer A → Claim
Reviewer B → Claim
```

Backend:

```text
A → 200 SUCCESS
B → 409 CONFLICT
```

Frontend simply reflects this result.

Never implement frontend-only locking.

---

# 81. Reviewer Task Detail Page

Route:

```text
/reviewer/tasks/[id]
```

This page is the complete review workspace.

---

# 82. Reviewer Task Page Sections

Use these logical sections:

```text
1. Task header
2. Lock information
3. Resume
4. Career
5. AI result
6. Reviewer correction form
7. Submit
```

---

# 83. Task Header

Display:

```text
Review Career Analysis

Career:
Backend Engineer

Task Status:
LOCKED
```

If locked by current reviewer:

```text
You are currently reviewing this task.
```

---

# 84. Lock Timer

Backend returns:

```text
lockExpiresAt
```

Display:

```text
Review reserved for you

Time remaining:
14:32
```

The timer is calculated by frontend only for display.

Backend remains authoritative.

---

# 85. Lock Timer Behavior

While time remains:

```text
Review form enabled
Submit enabled
```

When timer reaches zero:

```text
Disable submit
```

Display:

```text
Your review lock has expired.
Please return to the queue and claim the task again.
```

---

# 86. Expired Lock Submission

Even if frontend timer is slightly wrong, backend will enforce expiration.

If submit returns:

```text
409
REVIEW_LOCK_EXPIRED
```

display:

```text
Your review lock has expired.

Please claim this task again.
```

Then:

```text
[Return to Review Queue]
```

---

# 87. Resume Section

Display:

```text
Candidate Resume

File:
john-resume.pdf
```

Then display extracted resume text.

Example:

```text
John Doe

Software Engineer

Experience
...

Skills
...
```

The reviewer needs the resume content to verify AI extraction.

---

# 88. Career Section

Display:

```text
Target Career

Backend Engineer

Description:
...
```

This tells reviewer what career requirements the AI result was evaluated against.

---

# 89. AI Result Section

Display:

```text
AI Generated Result
```

Then:

```text
Match:
72.73%
```

Matched:

```text
Node.js
PostgreSQL
```

Missing:

```text
Redis
System Design
```

---

# 90. Reviewer Must See AI Result Separately

Do not immediately replace AI values with form values.

The reviewer should clearly understand:

```text
AI said:
72.73%

Matched:
Node.js
PostgreSQL

Missing:
Redis
System Design
```

Then:

```text
Reviewer Decision
```

---

# 91. Reviewer Correction Form

Fields:

```text
Final Match Percentage
Final Matched Skills
Final Missing Skills
Comment
```

---

# 92. Final Match Percentage Input

Label:

```text
Final Match Percentage
```

Input:

```text
[number]
```

Allowed:

```text
0–100
```

Frontend validation:

```text
number
minimum 0
maximum 100
```

---

# 93. Final Matched Skills Input

The reviewer should be able to modify the AI list.

Example:

```text
Final Matched Skills

[ Node.js ] [x]
[ PostgreSQL ] [x]
[ Docker ] [x]

[ Add Skill ]
```

Click:

```text
Add Skill
```

creates an input for a new skill.

---

# 94. Final Missing Skills Input

Same concept:

```text
Final Missing Skills

[ Redis ] [x]
[ System Design ] [x]

[ Add Skill ]
```

Reviewer can:

```text
add
remove
correct
```

skills.

---

# 95. Reviewer Comment

Field:

```text
Reviewer Comment
```

Example:

```text
AI missed Docker because it appeared in the experience section.
```

Comment can be optional if backend allows it.

---

# 96. Reviewer Form Initial Values

When task loads:

```text
Final Match Percentage
= AI match percentage

Final Matched Skills
= AI matched skills

Final Missing Skills
= AI missing skills

Comment
= empty
```

This means reviewer only changes what is wrong.

---

# 97. Reviewer Submit Button

Button:

```text
Submit Final Review
```

Before submit:

```text
Validate form
```

Then:

```text
POST /api/reviews/tasks/:id/submit
```

Request:

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
  "comment": "Docker experience was present."
}
```

---

# 98. Reviewer Submit Loading

Button becomes:

```text
Submitting review...
```

Disable:

```text
all review form controls
```

This prevents duplicate submission.

---

# 99. Reviewer Submit Success

Backend returns:

```text
Review created
Analysis COMPLETED
ReviewTask COMPLETED
```

Frontend:

```text
show success message
invalidate review queries
navigate /reviewer/tasks
```

---

# 100. Reviewer Queue After Submission

The submitted task must disappear from:

```text
Open Tasks
```

because its status is:

```text
COMPLETED
```

Refresh:

```text
GET /api/reviews/tasks
```

---

# 101. Reviewer Task Completed

If reviewer somehow opens a completed task:

Display:

```text
This review has already been completed.
```

Do not allow editing/submission.

---

# 102. Reviewer Task Locked by Another Reviewer

If task detail returns a conflict:

Display:

```text
This task is currently being reviewed by another reviewer.
```

Button:

```text
Back to Review Queue
```

---

# 103. Reviewer Account

Simple account page:

```text
Name
Email
Role
Account status
```

No complex reviewer profile.

---

# 104. SUPER_ADMIN Application

Super Admin exists primarily to manage reviewers.

Main route:

```text
/admin/reviewers
```

---

# 105. Admin Dashboard

The admin dashboard can be very small.

Display:

```text
CareerGap Administration

Reviewer Management

Total Reviewers
Active Reviewers
Inactive Reviewers
```

These counts can be derived from:

```text
GET /api/admin/reviewers
```

---

# 106. Reviewer Management Page

Route:

```text
/admin/reviewers
```

API:

```text
GET /api/admin/reviewers
```

Display:

```text
Reviewer Name
Email
Status
Created
Action
```

---

# 107. Reviewer Status

Possible:

```text
ACTIVE
INACTIVE
```

Based on:

```text
isActive
```

---

# 108. Add Reviewer Button

Button:

```text
Add Reviewer
```

Opens a form/modal/page containing:

```text
Name
Email
Temporary Password
```

---

# 109. Add Reviewer Form

Fields:

```text
Full Name
Email
Temporary Password
Confirm Password
```

`confirmPassword` is frontend-only.

Send only:

```json
{
  "name": "...",
  "email": "...",
  "password": "..."
}
```

---

# 110. Add Reviewer API

Call:

```text
POST /api/admin/reviewers
```

The backend automatically creates:

```text
role = REVIEWER
```

Frontend must not allow:

```text
SUPER_ADMIN
```

selection.

---

# 111. Add Reviewer Success

After success:

```text
Reviewer created successfully.
```

Then:

```text
refresh reviewer list
```

---

# 112. Add Reviewer Error

If email already exists:

```text
A user with this email already exists.
```

If validation error:

```text
Show field-level errors.
```

---

# 113. Activate/Deactivate Reviewer

Each reviewer row has an action:

```text
Deactivate
```

if active.

or:

```text
Activate
```

if inactive.

---

# 114. Deactivate Flow

Click:

```text
Deactivate
```

Show confirmation:

```text
Deactivate this reviewer?

They will no longer be able to claim new review tasks.

[Cancel]
[Deactivate]
```

After confirmation:

```text
PATCH /api/admin/reviewers/:id
```

Body:

```json
{
  "isActive": false
}
```

---

# 115. Activate Flow

Click:

```text
Activate
```

Call:

```text
PATCH /api/admin/reviewers/:id
```

Body:

```json
{
  "isActive": true
}
```

Then refresh list.

---

# 116. Admin Unauthorized Behavior

If a USER tries:

```text
/admin/reviewers
```

frontend should redirect/show unauthorized.

If user directly calls API:

```text
403
```

backend must reject.

Frontend route protection is not the security mechanism.

---

# 117. Global Loading States

Every API-driven screen needs an explicit loading state.

Examples:

```text
Loading account...
Loading careers...
Loading analyses...
Loading review tasks...
Loading review task...
Loading reviewers...
```

Never leave blank white content while data loads.

---

# 118. Global Error State

Every API-driven screen needs an error state.

Example:

```text
Something went wrong.

We couldn't load your analyses.

[Try Again]
```

Retry should repeat the relevant GET request.

---

# 119. Network Offline State

If request fails because server cannot be reached:

```text
Unable to connect to CareerGap.

Please check your connection and try again.
```

Do not display raw JavaScript errors.

---

# 120. Empty States

The application should intentionally design empty states.

### No analyses

```text
No analyses yet.

Start your first career analysis.

[Analyze Resume]
```

### No review tasks

```text
No review tasks are currently available.
```

### No reviewers

```text
No reviewers have been added.
```

---

# 121. 401 Behavior

When API returns:

```text
401 Unauthorized
```

frontend should:

```text
clear auth state
redirect /login
```

Do not repeatedly retry.

---

# 122. 403 Behavior

When API returns:

```text
403 Forbidden
```

display:

```text
You don't have permission to access this page.
```

Do not automatically log out.

---

# 123. 404 Behavior

For missing analysis:

```text
Analysis not found.
```

For missing task:

```text
Review task not found.
```

Provide:

```text
Back to Dashboard
```

or:

```text
Back to Review Queue
```

depending on role.

---

# 124. 409 Behavior

Treat `409` as a business conflict.

Examples:

```text
Duplicate analysis
Review task already claimed
Review lock expired
```

Display a meaningful explanation rather than:

```text
Server Error
```

---

# 125. 413 Behavior

Resume too large:

```text
This resume file is too large.
Please upload a smaller PDF.
```

---

# 126. 422 Behavior

Validation error:

```text
Please correct the highlighted fields.
```

Show specific fields if backend provides field-level validation information.

---

# 127. 500 Behavior

Display:

```text
Something went wrong on our side.

Please try again later.
```

Do not display stack traces.

---

# 128. 503 Behavior

Temporary service issue:

```text
CareerGap is temporarily unavailable.

Please try again in a moment.
```

---

# 129. Analysis Polling Rules

Only the analysis page should automatically poll.

Poll:

```text
GET /api/analyses/:id
```

while:

```text
PENDING
PROCESSING
REVIEW
```

Stop when:

```text
COMPLETED
FAILED
```

Recommended:

```text
every 3 seconds
```

---

# 130. Do Not Poll Other Pages Unnecessarily

Do not continuously poll:

```text
dashboard
career list
reviewer list
admin reviewers
```

Use normal React Query refetch/invalidation.

The analysis page is the special polling case.

---

# 131. Reviewer Queue Refresh

Reviewer queue does not need WebSockets.

Use:

```text
manual Refresh
```

and normal query refetch.

After claim/submission:

```text
invalidate review queue
```

---

# 132. Frontend State Categories

Use three broad state categories.

### Authentication state

```text
user
role
authenticated
```

### Server state

Use TanStack Query for:

```text
careers
resumes
analyses
review tasks
reviewers
```

### Local UI state

Use React state for:

```text
selected career
selected file
form fields
modal open/closed
role selection
review timer display
```

Do not put all server data into global React state.

---

# 133. Suggested Frontend Folder Structure

```text
frontend/
├── app/
│   ├── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── register/
│   │   └── page.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── analyze/
│   │   └── page.tsx
│   │
│   ├── analysis/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── reviewer/
│   │   ├── tasks/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   └── account/
│   │       └── page.tsx
│   │
│   └── admin/
│       ├── page.tsx
│       └── reviewers/
│           └── page.tsx
│
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── resume/
│   ├── career/
│   ├── analysis/
│   ├── review/
│   ├── admin/
│   ├── navigation/
│   ├── common/
│   └── ui/
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-careers.ts
│   ├── use-resumes.ts
│   ├── use-analyses.ts
│   ├── use-review-tasks.ts
│   └── use-reviewers.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── types.ts
│   │   ├── auth.api.ts
│   │   ├── resume.api.ts
│   │   ├── career.api.ts
│   │   ├── analysis.api.ts
│   │   ├── review.api.ts
│   │   └── admin.api.ts
│   │
│   └── utils/
│
├── providers/
│   ├── query-provider.tsx
│   └── auth-provider.tsx
│
└── middleware.ts
```

---

# 134. Common Components

Create reusable components such as:

```text
PageHeader
LoadingState
ErrorState
EmptyState
StatusBadge
ConfirmDialog
FormError
ProtectedRoute
RoleGuard
```

---

# 135. Resume Components

```text
ResumeUploader
ResumeFilePreview
ResumeUploadStatus
```

---

# 136. Career Components

```text
CareerSelector
CareerCard
CareerList
```

---

# 137. Analysis Components

```text
AnalysisStatus
AnalysisProgress
AnalysisResult
MatchPercentage
MatchedSkills
MissingSkills
AnalysisHistory
```

---

# 138. Review Components

```text
ReviewTaskCard
ReviewTaskList
ReviewTaskHeader
LockTimer
ResumeViewer
AIResultPanel
ReviewForm
SkillEditor
```

---

# 139. Admin Components

```text
ReviewerTable
ReviewerForm
ReviewerStatus
ReviewerActions
```

---

# 140. API Module Mapping

## auth.api.ts

```text
register()
login()
me()
logout()
```

## resume.api.ts

```text
upload()
getById()
```

## career.api.ts

```text
getAll()
getById()
```

## analysis.api.ts

```text
create()
getAll()
getById()
```

## review.api.ts

```text
getTasks()
claimTask()
getTask()
submitReview()
```

## admin.api.ts

```text
getReviewers()
createReviewer()
updateReviewer()
```

---

# 141. Query Mapping

### Authentication

```text
["auth", "me"]
```

### Careers

```text
["careers"]
["careers", careerId]
```

### Analyses

```text
["analyses"]
["analyses", analysisId]
```

### Reviews

```text
["review-tasks"]
["review-tasks", taskId]
```

### Admin

```text
["admin", "reviewers"]
```

---

# 142. Mutation Mapping

### Register

```text
registerMutation
```

### Login

```text
loginMutation
```

### Resume

```text
uploadResumeMutation
```

### Analysis

```text
createAnalysisMutation
```

### Reviewer

```text
claimTaskMutation
submitReviewMutation
```

### Admin

```text
createReviewerMutation
updateReviewerMutation
```

---

# 143. Dashboard Data Flow

When USER opens:

```text
/dashboard
```

load:

```text
GET /api/auth/me
GET /api/analyses
```

Do not unnecessarily call:

```text
GET /api/careers
```

unless dashboard actually needs career data that isn't already included in analysis history.

---

# 144. Analyze Page Data Flow

On page load:

```text
GET /api/careers
```

When file selected:

```text
local state only
```

When Upload clicked:

```text
POST /api/resumes
```

After successful upload:

```text
resumeId stored
```

When Analyze clicked:

```text
POST /api/analyses
```

Then:

```text
navigate /analysis/:id
```

---

# 145. Analysis Detail Data Flow

On page load:

```text
GET /api/analyses/:id
```

Then:

```text
PENDING
PROCESSING
REVIEW
```

continue polling.

When:

```text
COMPLETED
```

display final result.

When:

```text
FAILED
```

display error state.

---

# 146. Reviewer Queue Data Flow

On:

```text
/reviewer/tasks
```

call:

```text
GET /api/reviews/tasks
```

Click claim:

```text
POST /api/reviews/tasks/:id/claim
```

Success:

```text
GET /api/reviews/tasks/:id
```

Then show review page.

---

# 147. Reviewer Detail Data Flow

Call:

```text
GET /api/reviews/tasks/:id
```

Receive:

```text
task
resume
career
analysis
AI result
lock information
```

Initialize review form from AI result.

Submit:

```text
POST /api/reviews/tasks/:id/submit
```

Then:

```text
invalidate queue
navigate queue
```

---

# 148. Admin Data Flow

Open:

```text
/admin/reviewers
```

call:

```text
GET /api/admin/reviewers
```

Add reviewer:

```text
POST /api/admin/reviewers
```

Toggle:

```text
PATCH /api/admin/reviewers/:id
```

Then invalidate:

```text
["admin", "reviewers"]
```

---

# 149. Frontend Form Rules

All forms should have:

```text
initial state
validation
loading state
success state
error state
disabled state
```

Never allow:

```text
double submission
```

for mutations.

---

# 150. Register Form State

```text
name
email
password
confirmPassword
```

---

# 151. Login Form State

```text
selectedRole
email
password
```

Important:

```text
selectedRole
```

is frontend UI state.

Do not automatically send it to backend.

---

# 152. Analyze Form State

```text
selectedFile
resumeId
selectedCareerId
```

---

# 153. Review Form State

```text
finalMatchPercentage
finalMatchedSkills
finalMissingSkills
comment
```

---

# 154. Admin Reviewer Form State

```text
name
email
password
confirmPassword
```

---

# 155. Confirmation Dialogs

Use confirmation for potentially destructive/admin actions.

Example:

```text
Deactivate Reviewer?
```

Do not require confirmation for:

```text
Login
Upload
Career selection
View analysis
```

---

# 156. Status Representation

Create one centralized status mapping.

Example:

```text
PENDING
→ Preparing

PROCESSING
→ Analyzing

REVIEW
→ Waiting for Review

COMPLETED
→ Completed

FAILED
→ Failed
```

Do not scatter status strings throughout components.

---

# 157. Role Representation

Centralize:

```text
USER
REVIEWER
SUPER_ADMIN
```

Do not use inconsistent values like:

```text
admin
administrator
reviewer_user
normal_user
```

Use exactly backend role values.

---

# 158. Skill List Editing

For reviewer skill editing:

Each skill should be individually removable.

Example:

```text
Node.js       [x]
PostgreSQL    [x]
Docker        [x]
```

Add:

```text
[+ Add Skill]
```

Do not require reviewer to manually type a JSON array.

The frontend converts the editor state into:

```json
[
  "Node.js",
  "PostgreSQL",
  "Docker"
]
```

---

# 159. Prevent Duplicate Skills in Reviewer Form

Frontend should prevent:

```text
Node.js
Node.js
```

appearing twice.

Normalize simple whitespace.

Backend remains authoritative.

---

# 160. Match Percentage Input

Use number input.

Validation:

```text
required
number
0–100
```

Do not allow:

```text
-10
150
abc
```

---

# 161. Analysis Result Display

Create one reusable component:

```text
AnalysisResult
```

Props conceptually:

```text
result
variant:
  AI
  FINAL
```

This avoids duplicating rendering logic.

---

# 162. AI Result Display

Label:

```text
AI Analysis
```

Use:

```text
AI match percentage
AI matched skills
AI missing skills
```

---

# 163. Final Result Display

Label:

```text
Final Verified Result
```

Use:

```text
final match percentage
final matched skills
final missing skills
```

---

# 164. Difference Between AI and Final

If:

```text
AI = 72.73%
Final = 75%
```

the page can show:

```text
AI Initial Assessment
72.73%

Human Verified Result
75%
```

This visually demonstrates CareerGap's human-in-the-loop architecture.

---

# 165. No Fake AI UI

Do not create UI saying:

```text
AI Confidence: 98%
```

unless backend provides confidence.

Do not create:

```text
AI Explanation
```

unless backend provides it.

Do not invent:

```text
AI Recommendation Score
```

---

# 166. No Fake Progress

Backend only exposes status.

Therefore:

```text
PENDING
PROCESSING
REVIEW
COMPLETED
FAILED
```

Use status-based progress.

Do not create fake:

```text
35%
48%
76%
```

progress unless API supports it.

---

# 167. Career Page Behavior

The frontend does not need a separate public career browsing page.

Career selection can happen directly inside:

```text
/analyze
```

This keeps the application smaller.

---

# 168. Landing Page

Route:

```text
/
```

The landing page should explain CareerGap.

Sections:

```text
Hero
How It Works
Main Features
Supported Career Types
Call to Action
```

---

# 169. Landing Hero

Display:

```text
Find the gap between your skills
and your target career.

Upload your resume.
Choose a career.
Get a verified skill-gap analysis.

[Analyze Your Resume]
[Login]
```

Primary CTA:

```text
Analyze Your Resume
```

If unauthenticated:

```text
→ /register
```

or:

```text
→ /login
```

---

# 170. How It Works Section

Show four conceptual steps:

```text
1. Upload Resume
2. Choose Career
3. AI Analysis
4. Human Verification
```

Then:

```text
Final Career Result
```

This accurately represents the backend architecture.

---

# 171. Feature Section

Features:

```text
AI-powered skill extraction
Career-specific matching
Human-verified results
Skill-gap identification
```

Do not claim functionality not implemented.

---

# 172. Supported Careers Section

Display:

```text
Backend Engineer
Frontend Engineer
AI/ML Engineer
DevOps Engineer
Data Engineer
```

These correspond to seeded career profiles.

---

# 173. Landing CTA

Display:

```text
Ready to discover your career skill gap?

[Get Started]
```

Unauthenticated:

```text
/register
```

Authenticated:

```text
/dashboard
```

---

# 174. Global Navigation on Public Pages

Unauthenticated:

```text
CareerGap
Home
Login
Register
```

Authenticated:

Role-specific navigation.

---

# 175. Page Access Matrix

| Page | USER | REVIEWER | SUPER_ADMIN | Public |
|---|---:|---:|---:|---:|
| `/` | ✓ | ✓ | ✓ | ✓ |
| `/login` | ✓ | ✓ | ✓ | ✓ |
| `/register` | ✓ | optional | optional | ✓ |
| `/dashboard` | ✓ | ✗ | ✗ | ✗ |
| `/analyze` | ✓ | ✗ | ✗ | ✗ |
| `/analysis/:id` | ✓ | ✗ | ✗ | ✗ |
| `/reviewer/tasks` | ✗ | ✓ | ✗ | ✗ |
| `/reviewer/tasks/:id` | ✗ | ✓ | ✗ | ✗ |
| `/admin` | ✗ | ✗ | ✓ | ✗ |
| `/admin/reviewers` | ✗ | ✗ | ✓ | ✗ |
| `/account` | ✓ | ✓ | ✓ | ✗ |

---

# 176. Complete USER Navigation

```text
Landing
 ↓
Register
 ↓
Login
 ↓
Dashboard
 ├── Analyze Resume
 │     ↓
 │   Upload
 │     ↓
 │   Career
 │     ↓
 │   Analysis
 │     ↓
 │   Review
 │     ↓
 │   Final Result
 │
 ├── Analysis History
 │     ↓
 │   Analysis Detail
 │
 └── Account
```

---

# 177. Complete REVIEWER Navigation

```text
Login
 ↓
Reviewer Dashboard
 ↓
Review Queue
 ↓
Claim Task
 ↓
Review Task
 ├── Resume
 ├── AI Result
 ├── Review Form
 └── Submit
       ↓
Review Queue
```

---

# 178. Complete ADMIN Navigation

```text
Login
 ↓
Admin Dashboard
 ↓
Reviewer Management
 ├── View Reviewers
 ├── Add Reviewer
 ├── Activate Reviewer
 └── Deactivate Reviewer
```

---

# 179. User Analysis State Diagram

```text
/analyze
    │
    ▼
POST /analyses
    │
    ▼
 PENDING
    │
    ▼
PROCESSING
    │
    ├──────────────► FAILED
    │
    ▼
 REVIEW
    │
    ▼
COMPLETED
```

---

# 180. Reviewer Task State Diagram

```text
OPEN
 │
 │ Claim
 ▼
LOCKED
 │
 ├──────────────► COMPLETED
 │
 │ expiration
 ▼
OPEN
```

The frontend displays these states but does not control them.

---

# 181. Dashboard Status Actions

For each analysis:

### PENDING

```text
[View Analysis]
```

### PROCESSING

```text
[View Progress]
```

### REVIEW

```text
[View Initial Result]
```

### COMPLETED

```text
[View Final Result]
```

### FAILED

```text
[View Details]
[Try Again]
```

---

# 182. User Experience for REVIEW

Do not make user think the system is broken.

Display:

```text
Your AI analysis is ready.

A human reviewer is now verifying the result.

You can leave this page. Your result will remain available
from your dashboard.
```

This is important because human review may not happen immediately.

---

# 183. User Can Leave During Review

If user leaves:

```text
/analysis/:id
```

and later returns:

```text
GET /api/analyses/:id
```

will show current state.

No frontend state should be required to preserve analysis progress.

The backend owns the analysis state.

---

# 184. Refreshing Browser During Processing

If browser refreshes:

```text
/analysis/:id
```

frontend loads:

```text
GET /api/analyses/:id
```

and resumes the appropriate UI/polling.

Do not store processing state only in React memory.

---

# 185. Closing Browser During Review

If user closes browser while status is:

```text
REVIEW
```

nothing breaks.

The reviewer can still complete it.

When user returns:

```text
GET /api/analyses/:id
```

will eventually show:

```text
COMPLETED
```

---

# 186. Reviewer Refresh During Review

If reviewer refreshes:

```text
/reviewer/tasks/:id
```

frontend requests:

```text
GET /api/reviews/tasks/:id
```

If lock is still valid:

```text
continue review
```

If expired:

```text
show expired state
```

---

# 187. Reviewer Leaves Page

If reviewer leaves without submitting:

```text
LOCKED
```

until:

```text
lockExpiresAt
```

Then another reviewer can claim it.

No explicit release endpoint is required by the current architecture.

---

# 188. Prevent Accidental Reviewer Navigation

If reviewer has unsaved changes, frontend may optionally show:

```text
You have unsaved review changes.
Are you sure you want to leave?
```

This is optional UX.

It must not modify backend locking behavior.

---

# 189. API Error Display Strategy

Create one reusable:

```text
ApiErrorMessage
```

It receives:

```text
error.code
error.message
```

Map known errors to friendly messages.

Unknown error:

```text
Something went wrong. Please try again.
```

---

# 190. No Backend Logic in Components

Bad:

```text
if matchedSkills.length / careerSkills.length ...
```

Good:

```text
analysis.finalResult.matchPercentage
```

Bad:

```text
if lockExpiresAt < Date.now()
then task is definitely free
```

Good:

```text
Use timer only for display.
Backend decides whether submission is valid.
```

---

# 191. No Direct Fetch Calls in UI Components

Bad:

```text
page.tsx
 ↓
fetch(...)
```

everywhere.

Preferred:

```text
page
 ↓
hook
 ↓
API module
 ↓
API client
```

This makes frontend maintainable and AI-agent-friendly.

---

# 192. API Client Responsibilities

Central API client:

```text
base URL
authentication
request headers
JSON parsing
FormData handling
error parsing
401 handling
```

The page should not care about these details.

---

# 193. Authentication Provider

Create:

```text
AuthProvider
```

Responsibilities:

```text
current user
loading
login
logout
authentication initialization
```

The backend remains source of truth.

---

# 194. Role Guard

Create:

```text
RoleGuard
```

Conceptually:

```text
<RoleGuard allowedRoles={["REVIEWER"]}>
   ...
</RoleGuard>
```

But remember:

> This is UX protection only. Backend authorization remains mandatory.

---

# 195. Server State Management

Use TanStack Query.

Recommended:

```text
useQuery
useMutation
invalidateQueries
refetch
```

Avoid adding Redux unless a real requirement appears.

---

# 196. Frontend Caching

Cache:

```text
careers
analyses
review tasks
reviewers
current user
```

Do not cache sensitive information unnecessarily.

After logout:

```text
clear user-specific query cache
```

---

# 197. Career Query Caching

Careers change rarely.

Use normal TanStack Query caching.

The frontend does not need to know that backend uses Redis.

---

# 198. Analysis Query

Analysis detail:

```text
["analyses", analysisId]
```

Polling is controlled by backend status.

---

# 199. Review Query

Task detail:

```text
["review-tasks", taskId]
```

Do not poll continuously unless there is a specific need.

---

# 200. Admin Reviewer Query

```text
["admin", "reviewers"]
```

Invalidate after:

```text
create
activate
deactivate
```

---

# 201. Form Submission Rules

Every mutation:

```text
click
 ↓
disable controls
 ↓
API request
 ↓
success/error
 ↓
re-enable if necessary
```

Prevent duplicate requests.

---

# 202. User Experience After Resume Upload

Success should make the next step obvious.

Example:

```text
✓ Resume uploaded

john-resume.pdf

Next:
Choose your target career
```

Then career selector becomes active.

---

# 203. User Experience After Career Selection

Once career selected:

```text
✓ Resume uploaded
✓ Backend Engineer selected

Ready to analyze.

[Analyze Resume]
```

---

# 204. User Experience During Analysis

Display:

```text
Your analysis is being prepared.

Resume:
john-resume.pdf

Career:
Backend Engineer

Status:
Analyzing
```

Do not expose internal infrastructure:

```text
Redis
Prisma
Gemini
PostgreSQL
```

Users don't need to see implementation details.

---

# 205. User Experience During Human Review

Display:

```text
AI analysis complete.

Your result is now being verified by a human reviewer.

Initial match:
72.73%

We'll update this page when verification is complete.
```

---

# 206. Final Result Experience

Display:

```text
Your CareerGap Result

Backend Engineer

75%
Career Match

You already have:
Node.js
PostgreSQL
Docker

Skills to improve:
Redis
System Design
```

Then:

```text
[View Analysis History]
[Analyze Another Resume]
```

---

# 207. Analyze Another Resume

Button:

```text
Analyze Another Resume
```

Navigate:

```text
/analyze
```

Do not automatically reuse old form state.

---

# 208. View History

Button:

```text
View Analysis History
```

Navigate:

```text
/dashboard
```

and scroll/open history section if desired.

---

# 209. Reviewer UX — Main Goal

Reviewer should be able to answer:

```text
What resume am I reviewing?
What career is being evaluated?
What did AI say?
Is AI correct?
What should the final result be?
```

The reviewer page should make these answers obvious.

---

# 210. Admin UX — Main Goal

Admin should be able to:

```text
See reviewers
Add reviewer
Deactivate reviewer
Activate reviewer
```

Nothing more is required for MVP.

---

# 211. No Unimplemented Features

Do not show UI buttons for:

```text
Forgot Password
Change Password
Export PDF
Share Result
Email Result
Delete Account
Edit Career
AI Chat
AI Explanation
Skill Recommendations generated by AI
```

unless corresponding backend functionality exists.

A visible button implies working functionality.

---

# 212. No Fake Dashboard Metrics

Do not display:

```text
AI accuracy
total platform users
average career match
reviewer performance
system health
```

unless backend provides actual data.

The dashboard should use real API data.

---

# 213. Responsive Behavior

All pages should work on:

```text
desktop
tablet
mobile
```

But responsive implementation is presentation-only.

API behavior remains identical.

---

# 214. Accessibility

Forms should have:

```text
labels
keyboard navigation
visible focus
error messages
```

Buttons should clearly describe their actions.

Examples:

Good:

```text
Submit Final Review
```

Bad:

```text
Submit
```

when multiple submission actions exist.

---

# 215. Frontend Security Rules

Never put:

```text
GEMINI_API_KEY
DATABASE_URL
REDIS_URL
JWT_SECRET
```

in frontend environment variables.

Only expose safe client configuration such as:

```text
NEXT_PUBLIC_API_URL
```

---

# 216. Resume Security

Do not make uploaded resumes publicly accessible.

Normal USER frontend should only retrieve its own resume through authenticated backend APIs.

Reviewer should only access resume information associated with the review task.

---

# 217. Authentication Security

Do not store passwords.

Do not log passwords.

Do not place secrets in URL query parameters.

Do not expose JWT secrets.

Use secure authentication storage according to backend implementation.

---

# 218. Frontend Environment

At minimum:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Production:

```env
NEXT_PUBLIC_API_URL=<production-api-url>
```

Nothing sensitive should be stored in `NEXT_PUBLIC_*`.

---

# 219. Complete Page Inventory

The minimum complete frontend is:

```text
PUBLIC
────────────────────────
1. Landing Page
2. Login
3. Register

USER
────────────────────────
4. User Dashboard
5. Analyze Resume
6. Analysis Details

REVIEWER
────────────────────────
7. Reviewer Queue
8. Review Task Details

ADMIN
────────────────────────
9. Admin Dashboard
10. Reviewer Management

OPTIONAL
────────────────────────
11. Account
```

---

# 220. Page-by-Page API Mapping

| Page | API |
|---|---|
| Landing | None |
| Login | POST `/auth/login` |
| Register | POST `/auth/register` |
| User Dashboard | GET `/auth/me`, GET `/analyses` |
| Analyze | GET `/careers`, POST `/resumes`, POST `/analyses` |
| Analysis Detail | GET `/analyses/:id` |
| Reviewer Queue | GET `/reviews/tasks` |
| Review Task | POST `/reviews/tasks/:id/claim`, GET `/reviews/tasks/:id`, POST `/reviews/tasks/:id/submit` |
| Admin Dashboard | GET `/admin/reviewers` |
| Reviewer Management | GET/POST/PATCH `/admin/reviewers` |

---

# 221. Complete User Journey

```text
/
 │
 └── Get Started
       │
       ▼
/register
       │
       ▼
/login
       │
       ▼
/dashboard
       │
       ├── Analyze New Resume
       │
       ▼
/analyze
       │
       ├── Upload PDF
       │
       ├── Select Career
       │
       └── Analyze
              │
              ▼
       /analysis/:id
              │
              ├── PENDING
              ├── PROCESSING
              ├── REVIEW
              └── COMPLETED
```

---

# 222. Complete Reviewer Journey

```text
/login
   │
   ▼
select Reviewer
   │
   ▼
/reviewer/tasks
   │
   ▼
Claim Task
   │
   ▼
/reviewer/tasks/:id
   │
   ├── Read Resume
   ├── Check AI Result
   ├── Correct Result
   └── Submit
         │
         ▼
 /reviewer/tasks
```

---

# 223. Complete Admin Journey

```text
/login
   │
   ▼
select Super Admin
   │
   ▼
/admin
   │
   ▼
/admin/reviewers
   │
   ├── Add Reviewer
   ├── Activate Reviewer
   └── Deactivate Reviewer
```

---

# 224. Backend/Frontend Responsibility Table

| Feature | Frontend | Backend |
|---|---|---|
| Registration form | ✓ | ✓ validation/storage |
| Password hashing | ✗ | ✓ |
| Login UI | ✓ | ✓ authentication |
| JWT verification | ✗ | ✓ |
| Role authorization | display/route UX | ✓ |
| Resume selection | ✓ | — |
| Resume upload | ✓ | ✓ |
| PDF extraction | ✗ | ✓ |
| AI skill extraction | ✗ | ✓ |
| Career list | display | ✓ |
| Career profile cache | ✗ | ✓ |
| Match percentage | display | ✓ |
| Missing skills | display | ✓ |
| Review queue | display | ✓ |
| Review lock | timer display | ✓ |
| Lock ownership | ✗ | ✓ |
| Review submission | form | ✓ |
| Final result | display | ✓ |
| Admin reviewer management | UI | ✓ |

---

# 225. Frontend Must Never Implement

Never implement:

```text
AI skill extraction
career profile generation
match calculation
skill-gap calculation
reviewer locking
analysis state transitions
final-result calculation
Redis logic
PostgreSQL logic
Gemini API calls
```

---

# 226. Frontend Must Implement

Must implement:

```text
forms
validation UX
navigation
API integration
loading states
error states
empty states
role-specific routes
analysis polling
review countdown display
result visualization
review editing interface
admin management interface
```

---

# 227. Definition of Done — USER

USER flow is complete when:

```text
[ ] User can register
[ ] User can login
[ ] User can logout
[ ] User can see dashboard
[ ] User can upload PDF
[ ] User can see upload errors
[ ] User can load careers
[ ] User can select career
[ ] User can start analysis
[ ] User cannot double-submit analysis
[ ] User can see PENDING
[ ] User can see PROCESSING
[ ] User can see REVIEW
[ ] User can see COMPLETED
[ ] User can see FAILED
[ ] Analysis polling works
[ ] User can see AI result
[ ] User can see final result
[ ] User can view history
```

---

# 228. Definition of Done — REVIEWER

```text
[ ] Reviewer can login
[ ] Reviewer sees reviewer navigation
[ ] Reviewer sees task queue
[ ] Reviewer sees empty queue
[ ] Reviewer can claim task
[ ] Reviewer sees lock timer
[ ] Reviewer can read resume
[ ] Reviewer can see career
[ ] Reviewer can see AI result
[ ] Reviewer can edit match percentage
[ ] Reviewer can edit matched skills
[ ] Reviewer can edit missing skills
[ ] Reviewer can add comment
[ ] Reviewer can submit
[ ] Completed task disappears
[ ] Expired lock is handled
[ ] Concurrent claim conflict is handled
```

---

# 229. Definition of Done — SUPER_ADMIN

```text
[ ] Admin can login
[ ] Admin sees admin navigation
[ ] Admin sees reviewer list
[ ] Admin sees active/inactive status
[ ] Admin can add reviewer
[ ] Admin can deactivate reviewer
[ ] Admin can activate reviewer
[ ] Admin cannot accidentally create SUPER_ADMIN through reviewer form
```

---

# 230. Definition of Done — Authentication

```text
[ ] USER registration only
[ ] Login supports all three roles
[ ] Returned backend role determines access
[ ] Protected pages require authentication
[ ] Wrong role cannot access page
[ ] 401 handled
[ ] 403 handled
[ ] Logout clears authentication
[ ] User-specific cached data cleared after logout
```

---

# 231. Definition of Done — Analysis

```text
[ ] Resume upload works
[ ] Career loading works
[ ] Analysis creation works
[ ] analysisId navigation works
[ ] Status polling works
[ ] Polling stops on COMPLETED
[ ] Polling stops on FAILED
[ ] REVIEW continues polling
[ ] AI result displayed correctly
[ ] Final result displayed correctly
[ ] No frontend scoring logic exists
```

---

# 232. Definition of Done — Review

```text
[ ] Task queue works
[ ] Atomic claim conflict is represented correctly
[ ] Lock timer works visually
[ ] Expiration handled
[ ] Reviewer can modify AI result
[ ] Submit works
[ ] Duplicate submission prevented
[ ] Queue refreshes after submission
```

---

# 233. Definition of Done — API Integration

The frontend must successfully communicate with:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

POST   /api/resumes
GET    /api/resumes/:id

GET    /api/careers
GET    /api/careers/:id

POST   /api/analyses
GET    /api/analyses
GET    /api/analyses/:id

GET    /api/reviews/tasks
POST   /api/reviews/tasks/:id/claim
GET    /api/reviews/tasks/:id
POST   /api/reviews/tasks/:id/submit

GET    /api/admin/reviewers
POST   /api/admin/reviewers
PATCH  /api/admin/reviewers/:id
```

---

# 234. AI Coding Agent — Frontend Instructions

The following should be given directly to an AI coding agent:

```text
You are building the CareerGap frontend.

Read:
1. architecture.md
2. backend-plan.md
3. Complete Frontend API Documentation
4. Complete Frontend Product & Page-by-Page Implementation Plan

Treat these documents as the source of truth.

Do not redesign the backend.

Do not invent API endpoints.

Do not invent API request fields.

Do not invent API response fields.

Do not call Gemini directly.

Do not connect directly to PostgreSQL.

Do not connect directly to Redis.

Do not calculate match percentages.

Do not calculate missing skills.

Do not generate career skills.

Do not implement reviewer locking.

Do not implement backend state transitions.

Use the backend response as the source of truth.

Build all pages described in the frontend plan.

Implement:
- Landing page
- Login
- Register
- User dashboard
- Analyze page
- Analysis detail page
- Reviewer queue
- Reviewer task page
- Admin dashboard
- Reviewer management

Registration must create only USER accounts.

Login must support the three account types:
USER
REVIEWER
SUPER_ADMIN

However, do not send a role to the login API unless the backend contract explicitly supports it.

Use the role returned by the backend after login.

USER:
→ /dashboard

REVIEWER:
→ /reviewer/tasks

SUPER_ADMIN:
→ /admin/reviewers

Use TypeScript.

Use a centralized API client.

Use TanStack Query for server state.

Use React Hook Form for forms.

Use Zod for frontend validation.

Create separate API modules:
- auth.api.ts
- resume.api.ts
- career.api.ts
- analysis.api.ts
- review.api.ts
- admin.api.ts

Create reusable components.

Every API request must have:
- loading state
- success behavior
- error behavior

Implement analysis polling.

Poll:
GET /api/analyses/:id

while status is:
PENDING
PROCESSING
REVIEW

Stop when:
COMPLETED
FAILED

Do not create fake progress percentages.

Do not create fake AI confidence values.

Do not create fake recommendation data.

Do not create buttons for backend functionality that does not exist.

For review tasks:
The frontend lock timer is only visual.
The backend is authoritative.

If task claim returns 409:
show that another reviewer claimed the task
and return to the queue.

If review submission returns REVIEW_LOCK_EXPIRED:
show that the lock expired
and require the reviewer to reclaim the task.

After successful review submission:
invalidate review queries
navigate back to reviewer queue.

After logout:
clear authentication
clear user-specific query cache
redirect to login.

Before final completion:
test the complete real API flow.

Do not finish with mock data.

Verify:
register
login
resume upload
career selection
analysis creation
analysis polling
review queue
review claiming
review submission
final result
admin reviewer management

The frontend must work with the real CareerGap backend.
```

---

# 235. Final Frontend Architecture

The complete system should feel like this:

```text
                         CAREERGAP FRONTEND
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
      USER                   REVIEWER               ADMIN
        │                       │                       │
        ▼                       ▼                       ▼
   Dashboard              Review Queue           Admin Dashboard
        │                       │                       │
        ▼                       ▼                       ▼
 Analyze Resume            Claim Task            Reviewer List
        │                       │                       │
        ▼                       ▼                       ▼
 Upload Resume             Review Resume          Add Reviewer
        │                       │                       │
        ▼                       ▼                       ▼
 Select Career              AI Result              Activate/
        │                       │                   Deactivate
        ▼                       │                   Reviewer
 Start Analysis                ▼
        │                  Correct Result
        ▼                       │
 Analysis Status               ▼
        │                  Submit Review
        ▼                       │
 AI Result                      ▼
        │                   Task Complete
        ▼
 Human Review
        │
        ▼
 Final Result
```

---

# 236. Final UX Architecture

The frontend should communicate one simple product story:

```text
UPLOAD
   ↓
CHOOSE CAREER
   ↓
ANALYZE
   ↓
AI RESULT
   ↓
HUMAN VERIFICATION
   ↓
FINAL VERIFIED RESULT
```

For the user:

```text
"What skills do I have?"
"What career am I targeting?"
"How close am I?"
"What skills am I missing?"
```

For the reviewer:

```text
"What did AI find?"
"Is AI correct?"
"What should the final result be?"
```

For the admin:

```text
"Who can review analyses?"
"Who is active?"
```

---

# 237. Final Rule

The frontend should **not feel like a collection of API screens**.

It should feel like one continuous application:

```text
CareerGap
   ↓
Create Account
   ↓
Choose Account Type at Login
   ↓
Role-specific Dashboard
   ↓
Complete Role-specific Workflow
```

And every page should have exactly one clear purpose.

The most important implementation principle is:

```text
Frontend = UI + User Interaction + API Integration

Backend = Business Logic + AI + Database + Redis + Authorization
```

The frontend never duplicates backend intelligence.

---

# 238. Final Implementation Order

Build the frontend in this order:

```text
PHASE 1
────────────────────────
Project setup
API client
TypeScript types
TanStack Query
Auth provider

PHASE 2
────────────────────────
Landing
Login
Register
Protected routing

PHASE 3
────────────────────────
User dashboard
Resume upload
Career selection

PHASE 4
────────────────────────
Analysis creation
Analysis detail
Status UI
Polling
AI result
Final result

PHASE 5
────────────────────────
Reviewer queue
Claim flow
Reviewer task
Lock timer
Review form
Submit

PHASE 6
────────────────────────
Admin dashboard
Reviewer management
Add reviewer
Activate/deactivate

PHASE 7
────────────────────────
Error handling
Empty states
Loading states
Responsive behavior
Accessibility

PHASE 8
────────────────────────
Real backend integration
End-to-end testing
Remove mocks
Final verification
```

---

# 239. Final End-to-End Definition

The frontend is finished when this exact sequence works against the real backend:

```text
                    PUBLIC
                       │
                       ▼
                  Landing Page
                       │
                       ▼
                    Register
                       │
                       ▼
                     Login
                       │
             ┌─────────┼─────────┐
             │         │         │
             ▼         ▼         ▼
            USER    REVIEWER   ADMIN
             │         │         │
             ▼         ▼         ▼
         Dashboard   Queue    Admin Panel
             │         │         │
             ▼         ▼         ▼
          Analyze   Claim     Reviewers
             │         │         │
             ▼         ▼         ▼
          Upload    Review     Add/Edit
             │       Resume    Reviewer
             ▼         │
          Career       ▼
             │      AI Result
             ▼         │
         Analysis      ▼
             │      Correction
             ▼         │
          AI Result    ▼
             │       Submit
             ▼         │
        Human Review   ▼
             │      Complete
             ▼
       Final Result
```

The end result should allow a frontend developer or AI coding agent to build the complete CareerGap interface **without opening backend source code just to figure out what a page, button, form, state, or API interaction is supposed to do**.

This plan should be used together with the API documentation: **API documentation defines the exact API contract; this document defines how that contract becomes the actual frontend product.**