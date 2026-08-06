# Vital

**Vital** is a personal health records platform with an AI advocate built in. Upload lab reports and medical documents once; Vital classifies them, extracts structured data, and indexes them for search. Ask questions in plain language — from the search bar or the **AI Advocate** chat — and get answers grounded in your own records with source citations.

Built as a full-stack monorepo: **Next.js**, **Express**, **Supabase**, and **Google Gemini**.

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand |
| Backend | Express 5, TypeScript, Zod, BullMQ |
| Database & Auth | Supabase (PostgreSQL, Auth, Storage, pgvector) |
| Job queues | Redis + BullMQ |
| AI | Google Gemini (classification, extraction, embeddings, RAG chat) |

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
git clone https://github.com/your-username/vital-health.git
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

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env.local`, then fill in values from `supabase status` and your Gemini API key.

### 3. Run the app

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

> If you see `ECONNREFUSED` on port 6379, Redis is not running — run `docker compose up -d`. Document processing, search indexing, and chat retrieval depend on Redis and the worker for uploaded documents.

### 4. Quick demo

1. Register and complete onboarding
2. **Records** → upload a lab report PDF (keep the worker running)
3. Open the document to view extracted biomarkers
4. Search for `glucose` or `blood sugar` from the header or Records page
5. **AI Advocate** → ask about your labs; answers stream in with citations to your documents

To index documents uploaded before search was added:

```bash
cd backend && npm run backfill:embeddings
```

To verify the chat pipeline locally:

```bash
cd backend && npm run test:chat
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
| `npm run test:chat` | RAG chat pipeline |
| `npm run backfill:embeddings` | Index documents missing embeddings |

### Infrastructure

| Command | Description |
|---------|-------------|
| `supabase start` / `supabase stop` | Local Supabase |
| `supabase db push --local` | Apply migrations |
| `supabase db reset` | Reset local database |
| `docker compose up -d` | Start Redis |
| `docker compose down` | Stop Redis |

## Deployment (planned)

| Service | Target |
|---------|--------|
| Frontend | Vercel |
| Backend + workers | Railway |
| Database | Supabase |
| Redis | Upstash or Railway |
