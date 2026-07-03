# SA AI Web Kit

A monorepo for a RAG (Retrieval-Augmented Generation) chat application with a
clean separation between a **Next.js frontend** and a **FastAPI + FAISS backend**.

## Structure

```text
sa-ai-web-kit/
├── frontend/      # Next.js app (Clerk auth, design system, chat UI, API client)
├── backend/       # FastAPI RAG service (LangChain + FAISS + Gemini)
├── docs/          # Setup & architecture docs
└── README.md
```

## Architecture

```text
Browser ──> Next.js (frontend, Vercel)
                │  Clerk auth → JWT attached to every backend request
                └─> FastAPI + FAISS (backend)   ← NEXT_PUBLIC_API_URL
                       /api/health, /api/ingest, /api/documents, /api/query, /api/query/stream
```

- **Frontend** owns auth (Clerk), UI, and the typed API client.
- **Backend** owns document ingest, FAISS retrieval, and LLM calls.
- The frontend forwards the Clerk session JWT so the backend can scope data per user.

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate               # Windows  (use: source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp .env.example .env               # set GOOGLE_API_KEY; AUTH_DISABLED=true for local dev
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000/api/health` → `{"status":"healthy","version":"1.0.0"}`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Clerk keys; API URL defaults to http://localhost:8000/api
npm run dev                          # http://localhost:3000
```

The backend-status badge turns green when the API is reachable.

## Documentation

- [backend/README.md](backend/README.md) — backend setup, env vars, API endpoints, RAG flow
- [docs/frontend.md](docs/frontend.md) — frontend setup, scripts, structure
- [docs/authentication.md](docs/authentication.md) — Clerk + JWT-to-backend flow
- [docs/architecture.md](docs/architecture.md) — how the pieces fit together

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Auth | Clerk |
| Data fetching | TanStack React Query + Axios |
| Client state | Zustand |
| Theming | next-themes (class-based dark mode) |
| UI | Custom design system + Radix Dialog + Sonner |
| Backend | FastAPI, LangChain, FAISS, Google Gemini |
