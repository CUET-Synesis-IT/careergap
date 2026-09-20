# CareerGap

AI-assisted career skill-gap analysis with human-verified results.

> CareerGap uses an LLM only for resume skill extraction. Career-gap scoring is deterministic. Redis caches career profiles and coordinates concurrent reviewer locks. PostgreSQL is the source of truth.

---

## Project Structure

```text
careergap/
├── backend/          Node.js + TypeScript + Express REST API
├── frontend/         Next.js 16 frontend
└── docs/             Architecture, API contract, implementation plans
```

---

## Tech Stack

| Layer        | Technology                                                                           |
| ------------ | ------------------------------------------------------------------------------------ |
| Frontend     | Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod |
| Backend      | Node.js, TypeScript, Express, Prisma ORM                                             |
| Database     | PostgreSQL 16                                                                        |
| Cache / Lock | Redis 7                                                                              |
| Auth         | JWT (access token only) + bcrypt                                                     |
| AI           | Gemini (via provider abstraction)                                                    |

---

## Prerequisites

- **Node.js** v20 or later
- **npm** v10 or later
- **Docker** and **Docker Compose** (for PostgreSQL and Redis)
- A **Gemini API key** (get one at [aistudio.google.com](https://aistudio.google.com))

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd careergap
```

---

### 2. Start PostgreSQL and Redis

From the `backend/` directory:

```bash
cd backend
docker compose up -d
```

This starts:

- PostgreSQL on port `5432`
- Redis on port `6379`

Verify they are healthy:

```bash
docker compose ps
```

Both services should show `healthy`.

---

### 3. Set up the backend

#### 3a. Install dependencies

```bash
cd backend
npm install
```

#### 3b. Create the environment file

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
# Required — generate a random string of at least 32 characters
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars

# Required — your Gemini API key
AI_API_KEY=your-gemini-api-key-here

# Optional — specify the Gemini model (defaults to gemini-1.5-flash if blank)
AI_MODEL=gemini-1.5-flash

# Optional — pre-create a Super Admin account on first seed
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongAdminPassword123!
```

Everything else in `.env.example` works with the default Docker setup and does not need to change for local development.

#### 3c. Run database migrations

```bash
npx prisma migrate dev
```

#### 3d. Seed the career catalog

```bash
npm run prisma:seed
```

This inserts the five predefined careers (Backend Engineer (Node.js), Frontend Engineer, AI/ML Engineer, DevOps Engineer, Data Engineer) into the database.

#### 3e. Start the backend dev server

```bash
npm run dev
```

The backend starts at **http://localhost:5000**.

Verify it's running:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "CareerGap API"
  }
}
```

---

### 4. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
```

#### 4a. Create the environment file

```bash
cp .env.example .env.local
```

The default `.env.example` already points to the backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

No changes needed for local development.

#### 4b. Start the frontend dev server

```bash
npm run dev
```

The frontend starts at **http://localhost:3000**.

---

## Running Both Together

| Terminal   | Command                      | URL                   |
| ---------- | ---------------------------- | --------------------- |
| Terminal 1 | `cd backend && npm run dev`  | http://localhost:5000 |
| Terminal 2 | `cd frontend && npm run dev` | http://localhost:3000 |

Open **http://localhost:3000** in your browser.

---

## User Roles

| Role          | How to create                                                 | Default route after login |
| ------------- | ------------------------------------------------------------- | ------------------------- |
| `USER`        | Register at `/register`                                       | `/dashboard`              |
| `REVIEWER`    | Created by SUPER_ADMIN via `POST /api/admin/reviewers`        | `/reviewer/tasks`         |
| `SUPER_ADMIN` | Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env` before seeding | `/admin/reviewers`        |

---

## API

Base URL: `http://localhost:5000/api`

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

Full API contract: [`docs/api-documentation.md`](docs/api-documentation.md)

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                   | Required | Default                 | Description                                    |
| -------------------------- | -------- | ----------------------- | ---------------------------------------------- |
| `NODE_ENV`                 | No       | `development`           | Environment                                    |
| `PORT`                     | No       | `5000`                  | API server port                                |
| `DATABASE_URL`             | **Yes**  | —                       | PostgreSQL connection string                   |
| `REDIS_URL`                | **Yes**  | —                       | Redis connection string                        |
| `JWT_SECRET`               | **Yes**  | —                       | Secret for signing JWTs (≥ 32 chars)           |
| `JWT_EXPIRES_IN`           | No       | `15m`                   | JWT lifetime (e.g. `15m`, `1h`, `7d`)          |
| `BCRYPT_ROUNDS`            | No       | `12`                    | bcrypt cost factor (10–15)                     |
| `AI_PROVIDER`              | No       | `gemini`                | AI provider (`gemini`)                         |
| `AI_API_KEY`               | **Yes**  | —                       | Gemini API key                                 |
| `AI_MODEL`                 | No       | _(provider default)_    | Gemini model name                              |
| `AI_TIMEOUT_MS`            | No       | `30000`                 | AI request timeout in milliseconds             |
| `CAREER_CACHE_TTL_SECONDS` | No       | `3600`                  | Redis career profile TTL                       |
| `CAREER_LOCK_TTL_SECONDS`  | No       | `30`                    | Redis career generation lock TTL               |
| `REVIEW_LOCK_MINUTES`      | No       | `15`                    | Reviewer task lock duration                    |
| `MAX_RESUME_SIZE_MB`       | No       | `5`                     | Maximum uploaded PDF size                      |
| `MAX_RESUME_TEXT_CHARS`    | No       | `50000`                 | Maximum extracted resume text length           |
| `CORS_ORIGIN`              | No       | `http://localhost:3000` | Allowed frontend origin                        |
| `ADMIN_EMAIL`              | No       | —                       | Super Admin email (seeded on `prisma:seed`)    |
| `ADMIN_PASSWORD`           | No       | —                       | Super Admin password (seeded on `prisma:seed`) |

### Frontend (`frontend/.env.local`)

| Variable              | Required | Default                     | Description          |
| --------------------- | -------- | --------------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:5000/api` | Backend API base URL |

---

## Useful Commands

### Backend

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm run start            # Start compiled server
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run pending migrations
npm run prisma:seed      # Seed career catalog (+ admin if env set)
npm run lint             # Lint
npm run format           # Format with Prettier
```

### Frontend

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint
```

### Docker

```bash
docker compose up -d          # Start PostgreSQL + Redis
docker compose down           # Stop services
docker compose down -v        # Stop and delete all data volumes
docker compose logs -f        # Follow logs
```

---

## Docs

| File                                                     | Description                                     |
| -------------------------------------------------------- | ----------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)           | System design, AI budget, concurrency decisions |
| [`docs/backend-plan.md`](docs/backend-plan.md)           | Complete backend implementation plan            |
| [`docs/frontend-plan.md`](docs/frontend-plan.md)         | Complete frontend page-by-page specification    |
| [`docs/api-documentation.md`](docs/api-documentation.md) | Full frontend ↔ backend API contract            |
| [`docs/database-schema.md`](docs/database-schema.md)     | Database schema with ER diagram                 |
