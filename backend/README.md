# CareerGap Backend

The backend service for **CareerGap** is a Node.js + TypeScript REST API built with Express.js and Prisma ORM. It manages user authentication, PDF resume parsing, AI-based skill extraction, deterministic career-gap matching, distributed reviewer task locking, and admin management.

---

## 1. Backend Overview

The backend acts as the core authority for the entire CareerGap application. It is responsible for:

- Managing user accounts, password hashing, and role-based JWT authentication (`USER`, `REVIEWER`, `SUPER_ADMIN`).
- Handling PDF resume file uploads and text extraction.
- Interfacing with AI providers (Google Gemini) strictly for extracting candidate technical skills from resumes.
- Storing and caching predefined career profiles in PostgreSQL and Redis.
- Performing deterministic skill matching and scoring based on career skill importance (`HIGH`, `MEDIUM`, `LOW`).
- Managing the complete Analysis lifecycle (`PENDING` → `PROCESSING` → `REVIEW` → `COMPLETED` / `FAILED`).
- Coordinating concurrent reviewer task assignment through distributed task locking.

---

## 2. Architecture

The backend follows a layered **Modular Monolith** architecture:

```text
HTTP Request
     ↓
Routes (Express Routers & Auth/Role Middleware)
     ↓
Controllers (Request parsing & response mapping)
     ↓
Services (Business logic, skill matching, review locks)
     ↓
Database / Cache / AI Providers
┌─────────────────┬────────────────┬──────────────────┐
│ Prisma ORM      │ Redis Client   │ AI Provider      │
│ (PostgreSQL)    │ (Cache & Lock) │ (Google Gemini)  │
└─────────────────┴────────────────┴──────────────────┘
```

- **Routes**: Define endpoints and apply authentication/validation middleware.
- **Controllers**: Handle HTTP input validation via Zod and structure API JSON responses.
- **Services**: Execute domain logic (e.g., deterministic scoring, review task claiming).
- **Prisma & PostgreSQL**: Persist core relational entities.
- **Redis**: Caches parsed career profiles and handles distributed reviewer locks.
- **AI Provider Abstraction**: Decouples Express services from specific AI SDKs/vendors.

---

## 3. Backend Technology Stack

- **Runtime**: Node.js (`v20.x`)
- **Language**: TypeScript (`v5.x`)
- **Web Framework**: Express.js (`v5.x`)
- **ORM**: Prisma ORM (`v6.x`)
- **Database**: PostgreSQL (`v16`)
- **Cache / Distributed Lock**: Redis (`v7` / Redis Stack)
- **Authentication**: JWT (`jsonwebtoken`), Password Hashing (`bcrypt`)
- **Validation**: Zod (`v4.x`)
- **PDF Parser**: `pdf-parse` (`v2.x`)
- **Testing**: Vitest (`v4.x`), Supertest (`v7.x`)

---

## 4. Directory Structure

```text
backend/
├── prisma/
│   ├── migrations/          # SQL database migration history
│   ├── schema.prisma        # Prisma ORM schema definition
│   └── seed.ts              # Database seeder (Careers, Admin accounts)
├── src/
│   ├── ai/                  # AI provider abstraction layer (Gemini implementation)
│   ├── cache/               # Redis cache & locking wrappers
│   ├── config/              # Environment variables, database, & Redis configuration
│   ├── controllers/         # Request handling & HTTP response mapping
│   ├── errors/              # Custom application error classes (ApiError)
│   ├── middleware/          # Auth, role check, upload, & error middleware
│   ├── routes/              # Express API route modules
│   ├── services/            # Core business logic services
│   ├── types/               # TypeScript interfaces & DTO definitions
│   ├── utils/               # Helper utilities (scoring, hashing, tokens)
│   ├── app.ts               # Express app configuration & global middleware
│   └── server.ts            # Application HTTP entry point
├── tests/                   # Integration and unit test suites
├── .env.example             # Template environment variable configuration
├── Dockerfile               # Production Docker container build file
├── package.json             # NPM dependencies and scripts
└── tsconfig.json            # TypeScript compiler configuration
```

---

## 5. Environment Variables

The backend relies on environment variables loaded from `.env`. A complete configuration template is available in `.env.example`:

| Environment Variable | Description | Example Default |
|----------------------|-------------|-----------------|
| `NODE_ENV` | Application environment (`development`, `test`, `production`) | `development` |
| `PORT` | HTTP server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://careergap:careergap@localhost:5432/careergap` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing authentication tokens | *Configured per environment* |
| `JWT_EXPIRES_IN` | Duration before JWT expires | `15m` |
| `BCRYPT_ROUNDS` | Salt rounds for password hashing | `12` |
| `AI_PROVIDER` | Active AI provider plugin | `gemini` |
| `AI_API_KEY` | API Key for Google Gemini | *Configured per environment* |
| `AI_MODEL` | Gemini model name | `gemini-1.5-flash` |
| `AI_TIMEOUT_MS` | AI HTTP request timeout in milliseconds | `30000` |
| `CAREER_CACHE_TTL_SECONDS` | TTL for cached career profiles in Redis | `3600` |
| `CAREER_LOCK_TTL_SECONDS` | Distributed lock TTL for career computation | `30` |
| `REVIEW_LOCK_MINUTES` | Review task lock expiration duration | `15` |
| `MAX_RESUME_SIZE_MB` | Maximum allowed PDF upload size in MB | `5` |
| `MAX_RESUME_TEXT_CHARS` | Character threshold for extracted resume text | `50000` |
| `CORS_ORIGIN` | Allowed client origin for CORS headers | `http://localhost:3000` |
| `ADMIN_EMAIL` | Default admin email used by seed script | `admin@careergap.local` |
| `ADMIN_PASSWORD` | Default admin password used by seed script | *Configured per environment* |

---

## 6. Installation

Ensure PostgreSQL and Redis are running locally or in Docker before initializing the backend:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm ci

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed default careers and initial admin user
npm run prisma:seed
```

---

## 7. Running Backend

### Development Mode (with Live Reloading)
```bash
npm run dev
```

### Production Mode
```bash
# Compile TypeScript to JavaScript in dist/
npm run build

# Start production server
npm start
```

---

## 8. Database & Prisma

CareerGap uses **PostgreSQL 16** managed via **Prisma ORM**.

- **Schema Definition**: `prisma/schema.prisma`
- **Seeding**: Populates initial career profiles (Software Engineer, Backend Engineer, Frontend Engineer, Data Engineer, DevOps Engineer, etc.) and the default `SUPER_ADMIN` user.

Useful Prisma Scripts:
```bash
# Apply pending migrations in dev mode
npx prisma migrate dev

# Apply migrations in production environments
npx prisma migrate deploy

# Open interactive Prisma Studio GUI
npx prisma studio

# Seed or re-seed the database
npm run prisma:seed
```

---

## 9. Redis Usage

Redis is utilized for two specific performance and concurrency safeguards:

1. **Career Profile Caching**: Predefined career skill profiles are stored in Redis under `career:profile:<slug>` to eliminate redundant database reads during analysis computation.
2. **Reviewer Task Locking**: Ensures that when a reviewer claims an analysis task from the queue, a distributed lock is acquired (`review:lock:<taskId>`) with an expiration TTL (default 15 minutes) to prevent duplicate claims by other reviewers.

---

## 10. Authentication & Authorization

Authentication is stateless and powered by **JWT (JSON Web Tokens)**:

- Passwords are hashed securely using `bcrypt`.
- JWTs are sent in the `Authorization: Bearer <token>` header for protected routes.
- Access is restricted using role-based middleware:
  - `USER`: Access to resume uploads and personal analysis history.
  - `REVIEWER`: Access to open review task queues and task verification.
  - `SUPER_ADMIN`: Access to user management and reviewer role assignment.
- Strict resource ownership checks ensure candidate users cannot inspect or manipulate another candidate's resumes or analyses.

---

## 11. Resume Processing

1. Candidates upload PDF resume files via `POST /api/resumes`.
2. The file size is verified against `MAX_RESUME_SIZE_MB`.
3. `pdf-parse` extracts raw text from the uploaded PDF buffer.
4. Text is cleaned and verified to meet character length requirements (`MAX_RESUME_TEXT_CHARS`).
5. A SHA-256 hash of the extracted text (`textHash`) is generated to prevent duplicate processing.

---

## 12. Career System

Careers represent predefined job roles (e.g., Backend Developer, Full Stack Developer). Each career features a structured profile stored as JSON containing:
- Skill names (e.g., "Node.js", "PostgreSQL", "Docker")
- Importance levels (`HIGH`, `MEDIUM`, `LOW`)

Career profiles are cached in Redis to maintain high performance under concurrent analysis requests.

---

## 13. Analysis Lifecycle

Each analysis transitions through a strict status state machine:

```text
[ PENDING ] ──> [ PROCESSING ] ──> [ REVIEW ] ──> [ COMPLETED ]
                                      │
                                      └──> [ FAILED ]
```

- `PENDING`: Analysis request submitted.
- `PROCESSING`: AI extracting skills and backend computing deterministic score match.
- `REVIEW`: Initial AI result saved; analysis placed into the human review queue.
- `COMPLETED`: Reviewer has verified, calibrated, and finalized the result.
- `FAILED`: Processing error encountered (e.g., AI timeout or unreadable PDF).

---

## 14. Reviewer Workflow

1. Reviewers fetch available open tasks (`GET /api/reviews/tasks`).
2. A reviewer claims a task (`POST /api/reviews/tasks/:id/claim`). The task status changes to `LOCKED`, assigning `lockedById` to the reviewer and setting `lockExpiresAt`.
3. If another reviewer attempts to claim the locked task, a `409 Conflict` error is returned.
4. The assigned reviewer submits corrections or approvals (`POST /api/reviews/tasks/:id/submit`).
5. The review task and parent analysis are updated to `COMPLETED`, releasing the lock and publishing the verified final match percentage and skills.

---

## 15. AI Integration

The backend abstracts AI interactions via `src/ai/providers/gemini.provider.ts`:

- The AI model is strictly tasked with **Skill Extraction** (extracting raw technical skill keywords from candidate resume text).
- Match percentage scoring and missing skill determinations are calculated **deterministically** by backend service logic to guarantee consistency and cost control.
- In test environments, AI provider calls are mocked to ensure tests run offline without consuming API quota.

---

## 16. API Routes

All API endpoints are prefixed under `/api`:

| Route Prefix | Description | Auth Required |
|--------------|-------------|---------------|
| `/api/auth` | User registration, login, profile fetch, and logout | Partial |
| `/api/resumes` | Resume PDF upload and fetching candidate resumes | Yes (`USER`) |
| `/api/careers` | Retrieve public predefined career catalog | Yes |
| `/api/analyses` | Submit new skill gap analysis & fetch candidate results | Yes (`USER`) |
| `/api/reviews` | Review queue listing, task claiming, and submitting verified results | Yes (`REVIEWER`) |
| `/api/admin` | Administrative reviewer management | Yes (`SUPER_ADMIN`) |

For complete payload specs and status codes, refer to [docs/api-documentation.md](../docs/api-documentation.md).

---

## 17. Testing

The backend includes automated integration tests using Vitest and Supertest:

```bash
# Run backend test suite once
npm test

# Run tests in watch mode during development
npm run test:watch
```

---

## 18. Docker Configuration

The backend contains a production-ready `Dockerfile` multi-stage build.

To build and run standalone container:
```bash
docker build -t careergap-backend .
docker run -p 5000:5000 --env-file .env careergap-backend
```

---

## 19. Common Development Troubleshooting

- **PostgreSQL Connection Error**: Verify Postgres is running on port 5432 and `DATABASE_URL` matches your local credentials.
- **Redis Connection Error**: Ensure Redis server is active on port 6379 and `REDIS_URL` is set properly.
- **Prisma Migration Mismatch**: Run `npx prisma migrate reset` in local development to clear and re-apply migrations.
- **JWT Errors**: Check that `JWT_SECRET` is defined in `.env`.

---

## 20. Related Documentation

- 🔌 [Complete API Documentation](../docs/api-documentation.md)
- 🗄️ [Database Schema Documentation](../docs/database-schema.md)
- ⚙️ [Backend Architecture & Plan](../docs/backend-plan.md)

