# CareerGap

CareerGap uses LLMs only for resume skill extraction, while deterministic matching handles career-gap scoring. Redis caching reduces repeated career-profile computation, and atomic database operations coordinate concurrent reviewer task assignment.

## Project Structure

```text
CareerGap
│
├── frontend
│   └── Next.js/React frontend
│
├── backend
│   └── Node.js + TypeScript + Express REST API
│
└── docs
    └── Architecture, API contract, implementation plans
```

## Architecture

```text
Frontend
   ↓ REST API
Backend
   ↓
PostgreSQL ↔ Redis

Backend
   ↓
Gemini
```

## Getting Started

```bash
git clone <repo>
cd careergap
```

Start the backend:
```bash
cd backend
npm install
npm run dev
```

In a separate terminal, start the frontend:
```bash
cd frontend
npm install
npm run dev
```
