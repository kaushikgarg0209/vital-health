# Vital Health

A personal health advocate platform that helps you organize medical records, track biomarkers, manage bills and insurance, and get AI-powered health guidance — with optional family caregiver access and wellness gamification.

## Monorepo structure

```
vital-health/
├── frontend/     # Next.js app (port 3000)
├── backend/      # Express API (port 3001)
└── supabase/     # Database migrations & local Supabase config
```

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand |
| Backend | Express 5, TypeScript, Zod |
| Database & Auth | Supabase (PostgreSQL, Auth, Storage) |
| AI | OpenAI (health advocate chat, document extraction) |

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project (URL + anon key + service role key)
- Docker (optional, for local Redis in later phases)

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd vital-health

cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

**Backend** — copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Fill in your Supabase credentials and set `PORT=3001`.

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_API_URL` | Backend API URL (`http://localhost:3001` for local dev) |

### 3. Run development servers

In separate terminals:

```bash
# Backend API
cd backend
npm run dev
# → http://localhost:3001

# Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

Verify the backend health check:

```bash
curl http://localhost:3001/api/health
# { "status": "ok" }
```

## Available scripts

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with nodemon (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production server |

## Project documentation

Detailed specs live in the repo root as reference docs (not committed to git):

- `vital_prd_frd.md` — product & functional requirements
- `vital_system_architecture.md` — system design & folder structure
- `vital_design_system.md` — UI tokens, colors, typography
- `vital_development_roadmap.md` — phased build plan
- `vital_database_design.md` — schema & RLS policies
- `vital_api_reference.md` — REST API endpoints

## Deployment (planned)

| Service | Target |
|---------|--------|
| Frontend | Vercel (`frontend/` as root directory) |
| Backend | Railway |
| Database | Supabase (hosted) |
