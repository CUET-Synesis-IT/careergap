# CareerGap

CareerGap is an AI-assisted career skill-gap analyzer with verified human review. It enables candidates to upload technical resumes, compare extracted skills against predefined career profiles, and receive a deterministic match score that is subsequently verified and refined by expert human reviewers.

---

## What Problem It Solves

Automated resume screening often produces inconsistent or overly optimistic match results when relying solely on generative AI models. CareerGap addresses this problem using a hybrid workflow:

1. **AI for Extraction**: AI is strictly limited to extracting technical skills from raw resume text.
2. **Deterministic Matching**: Skill matching and percentage scores are calculated deterministically by backend logic based on skill importance levels (High, Medium, Bonus).
3. **Human Review**: Expert reviewers audit and verify the AI baseline evaluation before final scores are published to the candidate.

---

## Main Workflow

```text
User
 ↓
Register / Login
 ↓
Upload Resume (PDF)
 ↓
Select Target Career
 ↓
AI Analysis (Skill Extraction + Deterministic Matching)
 ↓
Human Review Queue
 ↓
Final Verified Result
```

---

## Main Roles

The application supports three distinct user roles with specific access boundaries:

- **`USER`**: Candidates who upload PDF resumes, select target career profiles, initiate skill-gap analyses, and view initial AI baselines as well as human-verified final results.
- **`REVIEWER`**: Subject-matter experts who access the review queue, claim analysis tasks using distributed locks, inspect candidate resume text against AI extractions, calibrate match scores/skills, and publish final results.
- **`SUPER_ADMIN`**: Administrative users responsible for managing reviewer accounts (provisioning, updating roles, and updating active status).

---

## Architecture

CareerGap is built as a clean **Modular Monolith**.

- **Frontend**: Next.js 16 (App Router) client application with React 19, Tailwind CSS, and TanStack Query.
- **Backend**: Express.js REST API service built with TypeScript, Node.js, and Prisma ORM.
- **Database**: PostgreSQL 16 relational database for persistent user, career, resume, analysis, and review task data.
- **Cache & Distributed Lock**: Redis for caching parsed career profiles and handling concurrent reviewer task claiming locks.
- **AI Provider**: Abstraction layer integrating with Google Gemini API for resume skill extraction.
- **Containerization**: Docker & Docker Compose for seamless multi-container deployment and local development setup.

For complete architectural details, see [docs/architecture.md](docs/architecture.md).

---

## Repository Structure

```text
careergap/
├── backend/                # Node.js + Express + Prisma REST API
│   ├── prisma/             # Database schema, migrations, and seed script
│   ├── src/                # Controllers, services, routes, middleware, AI providers
│   ├── tests/              # Vitest integration and unit tests
│   ├── Dockerfile          # Production backend Docker configuration
│   └── package.json        # Backend dependencies and npm scripts
├── frontend/               # Next.js App Router client application
│   ├── app/                # Route components (Auth, User Dashboard, Reviewer Queue, Admin)
│   ├── components/         # Reusable UI widgets and layout navigation
│   ├── lib/                # API client modules, helpers, and TypeScript types
│   ├── Dockerfile          # Production frontend Docker configuration
│   └── package.json        # Frontend dependencies and npm scripts
├── docs/                   # Architectural & technical design documentation
│   ├── api-documentation.md
│   ├── architecture.md
│   ├── backend-plan.md
│   ├── database-schema.md
│   ├── development-guide.md
│   └── frontend-plan.md
├── docker-compose.yml      # Orchestration for PostgreSQL, Redis, Backend, and Frontend
├── LICENSE                 # MIT License
└── README.md               # Main project documentation
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with `bcrypt` password hashing
- **PDF Parser**: `pdf-parse`
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI & React**: React 19, Tailwind CSS, Lucide React, Recharts
- **State & Data Fetching**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form, Zod

### Database & Caching
- **Database**: PostgreSQL 16
- **Cache & Locking**: Redis 7 / Redis Stack

### AI Layer
- **Provider**: Google Gemini API via native `fetch` provider abstraction

### Infrastructure & Testing
- **Containerization**: Docker & Docker Compose
- **Testing**: Vitest, Supertest (Backend)
- **Linting & Code Quality**: ESLint, Prettier

---

## Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker Engine**: v24.x or higher
- **Docker Compose**: v2.x or higher
- **Git**

---

## Quick Start (Docker Compose)

The fastest way to get the full CareerGap application running locally is using Docker Compose:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CUET-Synesis-IT/careergap
   cd careergap
   ```

2. **Configure Environment Variables:**
   Copy the example environment files for both backend and frontend:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   *(Ensure you update `AI_API_KEY` in `backend/.env` with a valid Google Gemini API key if testing real AI extraction).*

3. **Start services:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the application:**
   - **Frontend App**: `http://localhost:3000`
   - **Backend REST API**: `http://localhost:5000/api`
   - **Redis Commander / Insights** (if enabled): `http://localhost:8001`

---

## Environment Variables

CareerGap requires configuration files in both `backend/` and `frontend/` directories.

- **Backend configuration**: Defined in `backend/.env` (see template at `backend/.env.example`).
- **Frontend configuration**: Defined in `frontend/.env` (see template at `frontend/.env.example`).

> **Security Note:** Never commit `.env` files or secret keys to source control.

---

## Local Development

If developing outside Docker, services can be launched independently:

1. **Start Databases (PostgreSQL & Redis):**
   ```bash
   docker compose up -d postgres redis
   ```

2. **Setup and Run Backend:**
   ```bash
   cd backend
   npm ci
   npx prisma generate
   npx prisma migrate dev
   npm run prisma:seed
   npm run dev
   ```

3. **Setup and Run Frontend:**
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

For detailed setup instructions, see [docs/development-guide.md](docs/development-guide.md).

---

## Testing & Verification

### Backend Automated Tests
The backend includes integration and unit tests built with Vitest and Supertest covering authentication, resume upload validation, deterministic skill matching, concurrency locking, and reviewer workflows:

```bash
cd backend
npm test
```

### Frontend Verification
The frontend relies on static type checking and ESLint rules alongside production build verification:

```bash
cd frontend
npm run lint
npm run build
```

---

## Important Documentation

Detailed project documentation is available in the `docs/` directory:

- 🏗️ [Architecture Documentation](docs/architecture.md) — System design, data flow, and architectural principles.
- ⚙️ [Backend Plan](docs/backend-plan.md) — Detailed backend service specifications.
- 🎨 [Frontend Plan](docs/frontend-plan.md) — Frontend page specs, states, and user flows.
- 🔌 [API Documentation](docs/api-documentation.md) — REST endpoints, payloads, headers, and status codes.
- 🗄️ [Database Schema](docs/database-schema.md) — Entity-relationship models and index structures.
- 🛠️ [Development Guide](docs/development-guide.md) — Developer guidelines and workspace configuration.

---

## Security Notes

- **Secret Protection**: Never check in production JWT secrets, database credentials, or AI API keys into Git.
- **Authorization Enforcers**: All business logic, role checks, and ownership verifications are enforced strictly at the backend API level.
- **Frontend Boundary**: The client application communicates strictly through authenticated REST endpoints (`/api/...`) and never connects directly to database or cache instances.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
