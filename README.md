# Vital Health

Upload your medical records once — Vital classifies them, extracts the important data, and lets you search your health history in plain language. Ask for "blood sugar" and find glucose results even if you never typed those exact words.

Built as a full-stack monorepo with AI document processing, vector search, and a modern React UI.

## Features

**Accounts & profiles**
- Register, login, and session management with Supabase Auth
- Onboarding flow and profile settings

**Health records**
- Upload PDFs and images (lab reports, prescriptions, bills, EOBs)
- Private storage with a chronological records timeline
- Inline document viewer on the detail page

**AI-powered extraction**
- Background workers classify each upload with Gemini
- Structured data persisted by document type:
  - Lab reports → biomarker readings (glucose, HbA1c, etc.)
  - Prescriptions → medications and dosages
  - Medical bills & insurance EOBs → billing summaries
- Detail pages render extracted data in type-specific panels

**Semantic search**
- Hybrid search: vector similarity (pgvector) + keyword fallback
- Search from the Records page or the app header
- Debounced input, live dropdown results, excerpt highlighting
- Similarity threshold filters irrelevant matches

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, TanStack Query |
| Backend | Express 5, TypeScript, Zod, BullMQ |
| Database & Auth | Supabase (PostgreSQL, Auth, Storage, pgvector) |
| Job queues | Redis + BullMQ |
| AI | Google Gemini (classification, extraction, embeddings) |

## Monorepo structure

```
vital-health/
├── frontend/          # Next.js app (port 3000)
├── backend/           # Express API (port 3001)
├── supabase/          # Migrations & local Supabase config
└── docker-compose.yml # Local Redis
```

## Prerequisites

- Node.js 20+
- npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Google Gemini API key](https://aistudio.google.com/apikey)

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd vital-health

cd backend && npm install
cd ../frontend && npm install
```

### 2. Start local infrastructure

From the repo root:

```bash
supabase start
supabase db push --local
docker compose up -d
```

Verify:

```bash
supabase status                              # copy URL and keys into .env
docker exec -it redis redis-cli ping         # → PONG
```

### 3. Environment variables

**Backend** — `backend/.env` (copy from `backend/.env.example`):

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | `http://127.0.0.1:54321` for local dev |
| `SUPABASE_ANON_KEY` | From `supabase status` |
| `SUPABASE_SERVICE_ROLE_KEY` | From `supabase status` |
| `REDIS_URL` | `redis://localhost:6379` |
| `GEMINI_API_KEY` | Your Gemini API key |
| `FRONTEND_URL` | `http://127.0.0.1:3000` |

**Frontend** — `frontend/.env.local` (copy from `frontend/.env.example`):

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as backend `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same anon key |
| `NEXT_PUBLIC_API_URL` | Leave empty to use the built-in `/api/v1` proxy |

### 4. Run the app

Three terminals for the full pipeline:

```bash
# API server
cd backend && npm run dev

# Background workers (document processing + embeddings)
cd backend && npm run worker

# Frontend
cd frontend && npm run dev
```

Open http://localhost:3000

Health check:

```bash
curl http://localhost:3001/api/v1/health
```

> If you see `ECONNREFUSED` on port 6379, Redis is not running — run `docker compose up -d`. Document processing and search indexing need Redis and the worker process.

### 5. Quick demo

1. Register and complete onboarding
2. **Records** → upload a lab report PDF
3. Wait for processing (worker must be running)
4. Open the document to see extracted biomarkers
5. Search `blood sugar` or `glucose` from the header or Records page

To index older documents that were uploaded before search was added:

```bash
cd backend && npm run backfill:embeddings
```

## How it works

```
Upload  →  classify & extract (Gemini)  →  persist structured data
        →  chunk & embed (Gemini + pgvector)  →  store vectors

Search  →  embed query  →  cosine similarity + keyword match  →  ranked results
```

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | API with hot reload |
| `npm run worker` | Document + embedding workers |
| `npm run test` | All integration tests |
| `npm run test:gemini` | Gemini connectivity & parsing |
| `npm run test:processing` | Upload → extract → DB pipeline |
| `npm run test:embeddings` | Chunking, embedding & search |
| `npm run backfill:embeddings` | Index documents missing embeddings |

### Infrastructure

| Command | Description |
|---------|-------------|
| `supabase start` / `supabase stop` | Local Supabase |
| `supabase db push --local` | Apply migrations |
| `supabase db reset` | Reset local database |
| `docker compose up -d` | Start Redis |
| `docker compose down` | Stop Redis |

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/auth/register` | Register |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/logout` | Logout |
| `GET` | `/api/v1/auth/session` | Current session |
| `GET` | `/api/v1/profile` | User profile |
| `POST` | `/api/v1/documents/upload` | Upload document |
| `GET` | `/api/v1/documents` | List documents |
| `GET` | `/api/v1/documents/search` | Semantic + keyword search |
| `GET` | `/api/v1/documents/:id` | Detail + extracted data |
| `PATCH` | `/api/v1/documents/:id` | Update metadata |
| `DELETE` | `/api/v1/documents/:id` | Delete document |

## Deployment (planned)

| Service | Target |
|---------|--------|
| Frontend | Vercel |
| Backend + workers | Railway |
| Database | Supabase |
| Redis | Upstash or Railway |
