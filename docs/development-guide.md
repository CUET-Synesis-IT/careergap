# CareerGap — Practical Development Guide & Runbook

This document is the practical developer handbook for **CareerGap**. It contains instructions, workflows, architectural boundaries, setup scripts, debugging procedures, and guidelines for building, maintaining, and testing the CareerGap codebase.

---

## 1. Project Overview

CareerGap is a career skill-gap analysis application that evaluates technical resumes against target career requirements and delivers a human-verified score.

```text
User Uploads Resume (PDF)
        ↓
Text Extraction & Cleaning (pdf-parse)
        ↓
Single AI Skill Extraction (Google Gemini)
        ↓
Target Career Selection (Predefined Profiles)
        ↓
Deterministic Match & Gap Scoring (Backend Logic)
        ↓
Initial AI Baseline Result (Status: REVIEW)
        ↓
Human Reviewer Workspace (Atomic PostgreSQL Lock)
        ↓
Score Calibration & Verification by Expert
        ↓
Final Published Analysis (Status: COMPLETED)
```

---

## 2. Architecture Quick Reference

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Client (App Router)          │
│                      (React 19, TanStack Query)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API Calls (/api/...)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express.js Backend API Service             │
│            (Node.js v20, TypeScript, Prisma ORM)            │
└──────────────┬───────────────┬──────────────────┬───────────┘
               │               │                  │
               ▼               ▼                  ▼
┌───────────────────┐ ┌─────────────────┐ ┌───────────────────┐
│ PostgreSQL 16 DB  │ │ Redis 7 Cache   │ │ Google Gemini API │
│ (Source of Truth) │ │ & Locking       │ │ (Skill Extractor) │
└───────────────────┘ └─────────────────┘ └───────────────────┘
```

### System Component Responsibilities

- **Frontend (`/frontend`)**: Handles UI presentation, forms, client-side route guards, React Hook Form state, and server state synchronization via TanStack Query.
- **Backend (`/backend`)**: Enforces business logic, authentication, role-based authorization, PDF parsing, AI provider calls, deterministic scoring, and review task state machines.
- **PostgreSQL**: Acts as the single source of truth for users, resumes, careers, analyses, review tasks, and audit logs.
- **Redis**: Caches parsed career profiles (`career:profile:<slug>`) and provides fast distributed cache storage.
- **Google Gemini**: Performs raw technical skill keyword extraction from candidate resume text (**strictly 1 LLM call per analysis**).

---

## 3. Prerequisites

Ensure your system meets the following requirements:

- **Node.js**: `v20.x` LTS or higher
- **npm**: `v10.x` or higher
- **Docker Engine**: `v24.x` or higher
- **Docker Compose**: `v2.x` or higher
- **PostgreSQL**: `v16.x` (if developing outside Docker)
- **Redis**: `v7.x` or Redis Stack (if developing outside Docker)
- **Git**: `v2.x` or higher

---

## 4. Repository Structure

```text
careergap/
├── backend/                  # Node.js + Express + Prisma REST API
│   ├── prisma/               # Schema, migrations, and database seeder
│   │   ├── migrations/       # SQL migration steps
│   │   ├── schema.prisma     # Prisma ORM data models
│   │   └── seed.ts           # Seeder script (Careers & Admin)
│   ├── src/                  # Express source code
│   │   ├── ai/               # AI provider abstraction layer
│   │   ├── cache/            # Redis connection and caching functions
│   │   ├── config/           # Database, Redis, and env validation
│   │   ├── controllers/      # Express route handlers
│   │   ├── middleware/       # Auth, roles, upload, error handlers
│   │   ├── routes/           # Express router declarations
│   │   ├── services/         # Core business logic services
│   │   ├── types/            # DTOs and internal type contracts
│   │   └── utils/            # Hashing, token, and scoring utilities
│   ├── tests/                # Vitest & Supertest automated test suites
│   ├── .env.example          # Environment template for backend
│   ├── Dockerfile            # Production Docker image build
│   └── package.json          # Backend npm scripts and dependencies
├── frontend/                 # Next.js 16 App Router application
│   ├── app/                  # Pages, layouts, error & not-found boundaries
│   ├── components/           # UI components, forms, icons, charts
│   ├── context/              # Authentication React Context
│   ├── lib/                  # Centralized REST API client and types
│   ├── .env.example          # Environment template for frontend
│   ├── Dockerfile            # Standalone Next.js Docker build
│   └── package.json          # Frontend npm scripts and dependencies
├── docs/                     # Architectural specs and developer documentation
│   ├── api-documentation.md
│   ├── architecture.md
│   ├── backend-plan.md
│   ├── database-schema.md
│   ├── development-guide.md
│   └── frontend-plan.md
├── docker-compose.yml        # Local development & production orchestration
├── LICENSE                   # MIT License
└── README.md                 # Main repository entry point
```

---

## 5. Environment Setup

Environment settings are configured via `.env` files created from their respective `.env.example` templates.

### 1. Backend Environment Configuration (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

| Variable                   | Description                  | Recommended Dev Value                                       |
| -------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`                 | Environment stage            | `development`                                               |
| `PORT`                     | Backend server port          | `5000`                                                      |
| `DATABASE_URL`             | PostgreSQL connection string | `postgresql://careergap:careergap@localhost:5432/careergap` |
| `REDIS_URL`                | Redis connection URL         | `redis://localhost:6379`                                    |
| `JWT_SECRET`               | Secret key for JWT signing   | _32+ character random string_                               |
| `JWT_EXPIRES_IN`           | Token expiration time        | `15m` (or `7d` for testing)                                 |
| `BCRYPT_ROUNDS`            | Password hashing complexity  | `12`                                                        |
| `AI_PROVIDER`              | AI provider module           | `gemini`                                                    |
| `AI_API_KEY`               | Google Gemini API Key        | _Your Gemini API Key_                                       |
| `AI_MODEL`                 | Gemini model ID              | `gemini-1.5-flash`                                          |
| `AI_TIMEOUT_MS`            | AI HTTP request timeout      | `30000`                                                     |
| `CAREER_CACHE_TTL_SECONDS` | Career cache TTL             | `3600`                                                      |
| `CAREER_LOCK_TTL_SECONDS`  | Distributed lock TTL         | `30`                                                        |
| `REVIEW_LOCK_MINUTES`      | Review task lock TTL         | `15`                                                        |
| `MAX_RESUME_SIZE_MB`       | Upload file size limit       | `5`                                                         |
| `MAX_RESUME_TEXT_CHARS`    | Resume character limit       | `50000`                                                     |
| `CORS_ORIGIN`              | Allowed client URL           | `http://localhost:3000`                                     |
| `ADMIN_EMAIL`              | Initial admin account email  | `admin@careergap.local`                                     |
| `ADMIN_PASSWORD`           | Initial admin password       | `AdminPassword123!`                                         |

### 2. Frontend Environment Configuration (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

> **Security Rule**: Never commit `.env` files or API secrets into source control.

---

## 6. Local Development Workflow

Follow this procedure to run CareerGap locally outside Docker:

### Step 1: Start Supporting Infrastructure (PostgreSQL & Redis)

```bash
docker compose up -d postgres redis
```

### Step 2: Setup and Launch Backend Server

```bash
cd backend

# Install dependencies
npm ci

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed default careers and initial admin user
npm run prisma:seed

# Start backend in development mode (live reloading with tsx)
npm run dev
```

_(Backend will start on `http://localhost:5000/api`)_

### Step 3: Setup and Launch Frontend Client

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm ci

# Start Next.js development server
npm run dev
```

_(Frontend will start on `http://localhost:3000`)_

---

## 7. Docker Development

You can run the entire CareerGap stack inside Docker containers using Docker Compose.

### Docker Commands

```bash
# Build and start all services (Postgres, Redis, Backend, Frontend)
docker compose up -d --build

# View container status
docker compose ps

# View live logs for all services
docker compose logs -f

# View logs for backend only
docker compose logs -f backend

# Stop all containers (preserving database and cache data)
docker compose down
```

> **CAUTION**: Avoid running `docker compose down -v` unless you intentionally want to delete all local PostgreSQL and Redis persistent volumes!

---

## 8. Backend Development

All backend code lives in the `backend/` directory.

### Available Scripts

| Command                   | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | Starts server with `tsx watch` for live TypeScript reloading. |
| `npm run build`           | Compiles TypeScript files into production JS in `dist/`.      |
| `npm start`               | Executes compiled JavaScript server (`node dist/server.js`).  |
| `npm test`                | Runs automated backend test suite once using Vitest.          |
| `npm run test:watch`      | Runs Vitest in interactive watch mode.                        |
| `npm run lint`            | Runs ESLint to check for code style issues.                   |
| `npm run format`          | Formats codebase using Prettier.                              |
| `npm run prisma:generate` | Generates Prisma Client.                                      |
| `npm run prisma:migrate`  | Applies Prisma migrations in dev environment.                 |
| `npm run prisma:seed`     | Seeds database with predefined careers & admin user.          |

---

## 9. Frontend Development

All frontend code lives in the `frontend/` directory.

### Available Scripts

| Command         | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `npm run dev`   | Launches Next.js dev server with Turbopack on port 3000. |
| `npm run build` | Builds optimized production Next.js application.         |
| `npm start`     | Runs production Next.js server.                          |
| `npm run lint`  | Checks TypeScript and Next.js ESLint rules.              |

---

## 10. Database Development & Prisma Guide

CareerGap uses **PostgreSQL 16** managed via **Prisma ORM**.

### Workflow Commands

1. **Schema Changes**: When modifying `backend/prisma/schema.prisma`, generate a migration:
   ```bash
   npx prisma migrate dev --name describe_change_here
   ```
2. **Syncing Client**: After pulling changes from Git, regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. **Deploying Migrations (CI/Production)**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Database Reset**: To clean and re-apply all migrations from scratch in development:
   ```bash
   npx prisma migrate reset
   ```
5. **Prisma Studio**: Launch interactive visual database management GUI:
   ```bash
   npx prisma studio
   ```

---

## 11. Seed Data

Running `npm run prisma:seed` populates the catalog with predefined career profiles and provisions default system roles.

### Seeded Predefined Careers

1. **Software Engineer / Backend Engineer (Node.js)**
2. **Frontend Engineer (React / Next.js)**
3. **AI/ML Engineer**
4. **DevOps Engineer**
5. **Data Engineer**

Each career profile stores a structured JSON array of required skills with assigned importance levels:

- `HIGH`: Core required technical skills (heavily weighted).
- `MEDIUM`: Standard role requirements.
- `LOW`: Bonus skills.

### Development Admin Credentials

Admin credentials are created during seeding using the environment variables defined in `backend/.env`:

- **Email**: `ADMIN_EMAIL` (default: `admin@careergap.local`)
- **Password**: `ADMIN_PASSWORD` (default: `AdminPassword123!`)

---

## 12. Redis Architecture & Roles

Redis is strictly used as an auxiliary cache and lock server. **It is NOT the primary database.**

### Redis Keys & Usage

1. **Career Profile Cache**:
   - **Key**: `career:profile:<slug>`
   - **TTL**: Configured by `CAREER_CACHE_TTL_SECONDS` (default: 3600s).
   - **Purpose**: Prevents redundant PostgreSQL queries during skill matching calculation.
2. **Distributed Lock (Career Profile Computation)**:
   - **Key**: `lock:career:profile:<slug>`
   - **TTL**: Configured by `CAREER_LOCK_TTL_SECONDS` (default: 30s).
   - **Purpose**: Prevents race conditions during cache initialization.

---

## 13. AI / Gemini Development Guidelines

CareerGap integrates with **Google Gemini** using a provider abstraction pattern (`src/ai/provider.factory.ts`).

### The 1-LLM-Call Rule

To ensure cost predictability and speed, CareerGap enforces **exactly ONE LLM call per analysis**:

```text
Candidate Resume PDF
        ↓
Text Extraction (pdf-parse)
        ↓
Single AI Call: extractResumeSkills()
        ↓
Normalized Technical Skill Keywords
        ↓
Backend Deterministic Matching Engine (No AI used)
```

### What AI DOES NOT Do:

- ❌ **No AI for Matching**: Match percentage scores are calculated deterministically by backend logic based on skill importance weights.
- ❌ **No AI for Career Profiles**: Careers are predefined in PostgreSQL/Redis.
- ❌ **No AI for Recommendations**: Career recommendations or skill gap lists are generated deterministically by comparing sets.

---

## 14. Analysis Lifecycle

An Analysis transitions through a strict state machine:

```text
[ PENDING ]
     │
     ▼ (Upload validated & DB row created)
[ PROCESSING ]
     │
     ▼ (AI extracts skills & backend calculates initial score)
[ REVIEW ]
     │
     ▼ (Human Reviewer verifies & submits corrections)
[ COMPLETED ]

* Any processing failure transitions status to [ FAILED ]
```

### Transition Triggers

- `PENDING`: Created upon `POST /api/analyses`.
- `PROCESSING`: Updated as backend begins PDF text extraction & AI call.
- `REVIEW`: AI extraction succeeded; review task created in `OPEN` status.
- `COMPLETED`: Reviewer submits verified score via `POST /api/reviews/tasks/:id/submit`.
- `FAILED`: Unhandled PDF parsing failure or AI provider timeout.

---

## 15. Reviewer Workflow & Concurrency

Review task claiming uses **atomic PostgreSQL updates** to enforce exclusive reviewer ownership.

```text
Review Queue (OPEN)
        ↓
Reviewer Claims Task (POST /api/reviews/tasks/:id/claim)
        ↓
Atomic DB Lock: Status -> LOCKED, lockedById -> reviewer.id, lockExpiresAt -> Now + 15m
        ↓
Reviewer Workspace (/reviewer/tasks/[id])
        ↓
Reviewer Submits Final Score (POST /api/reviews/tasks/:id/submit)
        ↓
Analysis & Task Status -> COMPLETED, Lock Cleared
```

### Concurrency Rules

- **Exclusive Lock**: When a task is claimed, `lockedById` is set. A second reviewer attempting to claim or fetch the task receives a `409 Conflict` error.
- **Lock Expiration**: If `lockExpiresAt` passes without submission, the task lock expires. Another reviewer can claim the task.
- **Submission Guard**: Submitting a review verifies that `lockedById` matches the requesting reviewer and `lockExpiresAt` has not elapsed.

---

## 16. API Development Rules

1. **Strict Endpoints**: All API endpoints are defined in `docs/api-documentation.md`. Do not invent unapproved routes.
2. **Authorization Middleware**: Apply `authenticateToken` and `requireRole(...)` on all protected endpoints.
3. **Ownership Checks**: Always verify resource ownership (e.g., candidate user ID matches `resume.userId` or `analysis.userId`).
4. **No Business Logic in Controllers**: Controllers must parse input via Zod, call service functions, and format JSON responses.
5. **Response Format Envelope**: All API endpoints return standardized JSON:
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Optional message"
   }
   ```

---

## 17. Testing Strategy

### Backend Automated Testing

Backend unit and integration tests are powered by **Vitest** and **Supertest**:

```bash
cd backend

# Run full backend test suite
npm test

# Run tests in watch mode
npm run test:watch
```

Tests cover authentication, PDF processing logic, deterministic scoring calculations, duplicate analysis prevention, and concurrent reviewer task locking.

### Frontend Verification

Automated component test suites are currently not included in the frontend. Frontend quality is verified via:

1. Static type checking (`tsc`).
2. ESLint checks (`npm run lint`).
3. Production build validation (`npm run build`).
4. Manual end-to-end user flow testing against a running backend API.

---

## 18. Code Quality Standards

Before committing code, verify that all static quality checks pass without warnings or errors:

```bash
# 1. Backend Verification
cd backend
npm run lint
npm run build
npm test

# 2. Frontend Verification
cd frontend
npm run lint
npm run build
```

---

## 19. Security Rules

- **Secret Confidentiality**: Never commit secrets, passwords, or JWT secrets to Git repositories.
- **AI Credentials**: Gemini API keys must remain strictly on the backend. Never expose AI API keys to the browser.
- **Client Boundaries**: The frontend must never attempt direct connections to PostgreSQL or Redis.
- **Stateless Auth**: Authorization is managed via HTTPS-only headers using short-lived JWT tokens (`Authorization: Bearer <token>`).

---

## 20. Git Workflow

Follow this standard developer Git workflow:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and run verification
cd backend && npm test && npm run lint
cd ../frontend && npm run lint && npm run build

# 4. Review staged changes
git diff

# 5. Commit changes with clear message
git add .
git commit -m "feat: implement reviewer task countdown timer"

# 6. Push branch
git push origin feature/your-feature-name
```

---

## 21. Common Troubleshooting

### 1. Port Already in Use (`EADDRINUSE: 5000` or `3000`)

```bash
# Find process on port 5000 and terminate
lsof -i :5000
kill -9 <PID>
```

### 2. PostgreSQL Connection Error (`ECONNREFUSED 127.0.0.1:5432`)

- Ensure PostgreSQL container is running: `docker compose ps`.
- Restart container: `docker compose restart postgres`.

### 3. Redis Connection Error (`ECONNREFUSED 127.0.0.1:6379`)

- Ensure Redis container is running: `docker compose ps`.
- Restart container: `docker compose restart redis`.

### 4. Prisma Migration Out of Sync

```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### 5. Frontend Cannot Connect to Backend API (`NETWORK_ERROR`)

- Check `frontend/.env` is set to `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.
- Ensure backend server is running and accessible on port 5000.

---

## 22. Development Completion Checklist

Before submitting a Pull Request, verify:

- [ ] Backend ESLint passes (`npm run lint`).
- [ ] Backend TypeScript compiles (`npm run build`).
- [ ] Backend Vitest automated tests pass (`npm test`).
- [ ] Frontend ESLint passes (`npm run lint`).
- [ ] Frontend production build compiles (`npm run build`).
- [ ] Database schema changes include Prisma migrations.
- [ ] Docker Compose builds cleanly (`docker compose up -d --build`).
- [ ] End-to-end workflow (Resume upload → Analysis → Reviewer claim → Final result) succeeds.

---

## 23. Architectural Boundaries ("Rules Never to Break")

1. **Modular Monolith**: Do not introduce microservices, message queues (Kafka, RabbitMQ, BullMQ), or WebSockets.
2. **No Direct Frontend Access**: The frontend must never connect directly to PostgreSQL, Redis, or Gemini APIs.
3. **Deterministic Match Scoring**: AI is used strictly for skill extraction; match percentage scoring must remain 100% deterministic on the backend.
4. **PostgreSQL Concurrency Control**: Review task claiming must be governed atomically by PostgreSQL database updates.
5. **Redis is Not Source of Truth**: Redis is an ephemeral cache/lock layer. All permanent entity data belongs in PostgreSQL.
6. **Cost Control**: Strictly maintain the 1-LLM-call limit per analysis.
