This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# CareerGap Frontend

## Getting Started
The web application client for **CareerGap** built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, and TanStack Query. It provides role-tailored user interfaces for candidates, expert reviewers, and system administrators.

First, run the development server:
---

## 1. Frontend Overview

The frontend serves as the interactive client application for CareerGap. It communicates strictly with the backend REST API (`/api/...`) to:
- Allow candidates to register, log in, upload PDF resumes, select target careers, and view skill gap analyses.
- Present initial AI baseline scores and human-verified final analysis results with visual match gauge charts.
- Provide expert reviewers with an interface to inspect review task queues, claim tasks, calibrate matched/missing skills, and submit final evaluations.
- Offer administrators an interface to provision and manage reviewer accounts.

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS (`v4`), `clsx`, `tailwind-merge`, `class-variance-authority`
- **Data Fetching & Caching**: TanStack Query (`v5`)
- **Forms & Validation**: React Hook Form, Zod, `@hookform/resolvers`
- **Data Visualization**: Recharts
- **Icons**: Lucide React

---

## 3. Directory Structure

```text
frontend/
├── app/
│   ├── (auth)/             # Public authentication routes (Login, Register)
│   ├── (user)/             # Candidate user pages (Dashboard, Analyze, History, Analysis Details)
│   ├── (reviewer)/         # Reviewer pages (Task Queue, Workspace, Current Claimed Task)
│   ├── (admin)/            # Administrative management pages
│   ├── error.tsx           # Global application error boundary
│   ├── not-found.tsx       # Global 404 page
│   ├── layout.tsx          # Root HTML/Body layout with AppProviders wrapper
│   └── page.tsx            # Root landing / authentication redirect page
├── components/
│   ├── analysis/           # Visual gauge charts, AI results, and final verified components
│   ├── navigation/         # Header bars, user navigation, and reviewer nav widgets
│   ├── reviewer/           # Reviewer task workspace components
│   ├── ui/                 # Reusable primitive UI widgets
│   └── providers.tsx       # QueryClient & AuthContext provider wrappers
├── context/
│   └── auth-context.tsx    # Global user session & authentication context
├── lib/
│   ├── api/                # Centralized REST API client and domain endpoints
│   │   ├── admin.api.ts    # Admin reviewer management endpoints
│   │   ├── analysis.api.ts # Analysis submission and history endpoints
│   │   ├── auth.api.ts     # Login, register, logout, and me endpoints
│   │   ├── career.api.ts   # Career catalog endpoints
│   │   ├── client.ts       # Base fetch client wrapper with token injection
│   │   ├── resume.api.ts   # Resume upload and detail endpoints
│   │   ├── review.api.ts   # Review queue, task claim, and submission endpoints
│   │   ├── token.ts        # localStorage JWT token storage helpers
│   │   └── types.ts        # TypeScript DTO and API interfaces
│   └── config.ts           # Client environment configuration
├── Dockerfile              # Production frontend Docker configuration
├── package.json            # Dependencies and npm scripts
└── next.config.ts          # Next.js build configuration
```

---

## 4. Implemented Routes

Routes are organized using Next.js App Router route groups:

### Public Routes
- `/`: Root landing page (redirects authenticated users to their role-specific dashboard).
- `/login`: User authentication login page.
- `/register`: User account registration page.

### User Routes (`USER`)
- `/dashboard`: Candidate overview dashboard showing latest analysis and history.
- `/analyze`: Interactive step-by-step resume upload and career selection wizard.
- `/analysis/[id]`: Detailed analysis view (displays extracted skills, match gauge, AI baseline, and verified final results).
- `/history`: Full history listing of candidate's past analysis submissions.

### Reviewer Routes (`REVIEWER`)
- `/reviewer/tasks`: Available open review tasks queue.
- `/reviewer/tasks/[id]`: Reviewer task workspace (claim task, verify AI extractions, calibrate skills, submit final evaluation).
- `/reviewer/current`: Shortcut redirect page to reviewer's currently claimed active task.

### Admin Routes (`SUPER_ADMIN`)
- `/admin`: Administrative reviewer user management dashboard.

---

## 5. Role-Based Navigation

Upon logging in, the frontend inspects the user's role and automatically directs them:

- **`USER`** → `/dashboard`
- **`REVIEWER`** → `/reviewer/tasks`
- **`SUPER_ADMIN`** → `/admin`

Role-based layouts enforce page-level client access restrictions to prevent candidates from accessing reviewer or administrative views.

---

## 6. API Integration Layer

All backend communication is centralized inside `lib/api/`:

- `client.ts`: Low-level wrapper around native `fetch()`. Automatically injects `Authorization: Bearer <token>` headers, parses JSON envelopes, handles network errors, and clears expired tokens on `401 Unauthorized`.
- `auth.api.ts`: Authentication requests (`login`, `register`, `me`, `logout`).
- `resume.api.ts`: Multipart PDF upload (`upload`) and resume fetching (`getById`).
- `career.api.ts`: Predefined career catalog fetching (`getAll`, `getById`).
- `analysis.api.ts`: Analysis submission (`create`), listing (`getAll`), and retrieval (`getById`).
- `review.api.ts`: Review task queue fetching (`getTasks`), task locking (`claimTask`), task fetching (`getTask`), and submission (`submitReview`).
- `admin.api.ts`: Administrator reviewer management (`getReviewers`, `createReviewer`, `updateReviewer`).

---

## 7. Environment Variables

Frontend environment variables are stored in `.env` (template at `.env.example`):

| Variable | Description | Example Default |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_API_URL` | Full URL prefix for backend REST API | `http://localhost:5000/api` |

> Note: All environment variables exposed to the browser must start with `NEXT_PUBLIC_`. Never include secret API keys or backend credentials in frontend environment files.

---

## 8. Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm ci
```

---

## 9. Local Development

Start Next.js development server with Turbopack:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
The application will be accessible at `http://localhost:3000`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
---

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
## 10. Production Build

## Learn More
To build and test the production bundle locally:

To learn more about Next.js, take a look at the following resources:
```bash
# Compile optimized Next.js build
npm run build

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
# Start production server
npm start
```

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
---

## Deploy on Vercel
## 11. Linting

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
Run ESLint to check for code style issues and unused imports:

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
```bash
npm run lint
```

---

## 12. Candidate Analysis Flow

```text
Upload PDF Resume ──> Select Target Career ──> Submit Analysis
                                                    │
                                                    ▼
Display Verified Result <── Poll/Fetch Status <── Processing / Review
```

1. **Upload**: User selects a PDF file. The frontend calls `resumeApi.upload()` using `FormData`.
2. **Career Selection**: Candidate selects a target career from `careerApi.getAll()`.
3. **Creation**: Candidate clicks "Analyze", triggering `analysisApi.create()`.
4. **Processing & State Display**: The frontend polls or retrieves analysis data.
   - If status is `REVIEW`, the frontend shows extracted skills and initial AI baseline metrics.
   - If status is `COMPLETED`, the frontend displays the verified final score gauge and reviewer adjustments.
5. **No Client Calculations**: The frontend **never** calculates match percentages or filters skills locally; it displays values computed deterministically by the backend.

---

## 13. Reviewer Workflow

1. **Queue Listing**: Reviewer visits `/reviewer/tasks` to view available `OPEN` tasks.
2. **Claiming**: Reviewer clicks "Review Task", calling `reviewApi.claimTask(id)`. This locks the task to the current reviewer. If another reviewer claimed it simultaneously, a `409 Conflict` banner is displayed.
3. **Workspace Inspection**: Reviewer inspects candidate resume text alongside the AI skill extractions.
4. **Calibration**: Reviewer toggles skill checkboxes or updates the final match percentage score.
5. **Submission**: Reviewer submits the evaluation via `reviewApi.submitReview(id, data)`, finalizing the analysis.

---

## 14. Admin Workflow

Administrators access `/admin` to view all system users with the `REVIEWER` role, provision new reviewer credentials via `adminApi.createReviewer()`, or update active status using `adminApi.updateReviewer()`.

---

## 15. Handling Loading, Error & Empty States

- **Loading States**: Displayed using animated Lucide spinner icons (`Loader2`) and skeleton cards during server queries.
- **Empty States**: Clear messages and call-to-action buttons when queues or history listings return empty arrays.
- **Error Handling**: Network and API error messages are captured via `ApiError` and rendered in alert components.
- **Global Boundaries**: Global runtime errors and unknown routes are handled by `app/error.tsx` and `app/not-found.tsx`.

---

## 16. Verification & Quality Assurance

- **Type Safety & Build Verification**: Verified via `npm run build` TypeScript compilation.
- **Code Linting**: Enforced via `npm run lint`.
- *Note: Automated frontend unit/component tests were intentionally omitted in favor of end-to-end integration testing against the live backend API.*

---

## 17. Docker Setup

The frontend includes a production `Dockerfile` utilizing Next.js standalone output mode.

It is orchestrated alongside backend services in the root `docker-compose.yml`:

```bash
# Launch full stack
docker compose up -d --build frontend
```

---

## 18. Frontend Architectural Rules

Developers contributing to the frontend must follow these core guidelines:

1. **No Direct External Calls**: Never invoke Gemini or external AI SDKs directly from the browser.
2. **No Direct Database/Redis Connections**: Communicates exclusively through the backend Express API.
3. **No Local Result Scoring**: Never re-calculate match percentages or skill matching logic in React components; rely strictly on backend payloads.
4. **Centralized API Layer**: All HTTP calls must use module functions defined in `lib/api/`.
5. **Server State Management**: Use TanStack Query (`useQuery`, `useMutation`) for server data fetching, caching, and cache invalidation.

---

## 19. Related Documentation

- 🎨 [Frontend Product & Page Implementation Plan](../docs/frontend-plan.md)
- 🔌 [Complete API Documentation](../docs/api-documentation.md)
- 🏗️ [Architecture Documentation](../docs/architecture.md)
- 🛠️ [Development Guide](../docs/development-guide.md)
