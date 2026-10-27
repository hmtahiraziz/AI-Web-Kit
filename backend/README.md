# SA AI Web Kit — Backend

Production-ready RAG backend for the SA AI Web Kit. Built with **FastAPI**,
**LangChain**, **FAISS**, and **OpenAI**. Runs independently of the Next.js
frontend and exposes a typed REST API under `/api`.

## Requirements

- Python 3.12+
- OpenAI API key ([platform.openai.com](https://platform.openai.com/api-keys))
- Clerk application (for JWT verification) — optional in dev with `AUTH_DISABLED=true`

## Installation

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
OPENAI_API_KEY=your-openai-api-key
AUTH_DISABLED=true          # local dev without Clerk
FRONTEND_URL=http://localhost:3000
```

For production, configure Clerk JWT verification:

```env
CLERK_JWKS_URL=https://your-app.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://your-app.clerk.accounts.dev
AUTH_DISABLED=false
```

## Running

```bash
# Windows (if uvicorn.exe is blocked by App Control, use python -m):
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

Set the frontend env to match:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI API key |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | Chat model for answers (vision-capable) |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model |
| `OPENAI_EMBEDDING_DIMENSION` | `1536` | FAISS vector dimension (must match embedding model) |
| `CLERK_JWKS_URL` | — | Clerk JWKS endpoint for JWT verification |
| `CLERK_ISSUER` | — | Expected JWT issuer (optional) |
| `CLERK_AUDIENCE` | — | Expected JWT audience (optional) |
| `AUTH_DISABLED` | `false` | Bypass JWT verification (dev only) |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `DATABASE_URL` | — | Neon Postgres connection string (document registry) |
| `FAISS_INDEX_DIR` | `faiss_index` | Persisted vector index directory |
| `UPLOAD_DIR` | `uploads` | Uploaded source files |
| `TOP_K` | `5` | Chunks retrieved per query |
| `CHUNK_SIZE` | `1000` | Text splitter chunk size |
| `CHUNK_OVERLAP` | `150` | Text splitter overlap |
| `MAX_UPLOAD_MB` | `25` | Max upload file size |
| `APP_VERSION` | `1.0.0` | Reported in health response |
| `LOG_LEVEL` | `INFO` | Python log level |

## Migrating from Gemini

If you previously used Gemini embeddings, **delete** `faiss_index/*` (keep `.gitkeep`)
and re-upload documents. Embedding dimensions differ (`1536` for OpenAI
`text-embedding-3-small` vs `768` for Gemini).

## API endpoints

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <clerk-jwt>` unless `AUTH_DISABLED=true`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Liveness check |
| `GET` | `/api/auth/me` | Yes | Echo verified user (debug) |
| `POST` | `/api/ingest` | Yes | Upload PDF/TXT/MD → embed → FAISS |
| `GET` | `/api/documents` | Yes | List ingested documents |
| `DELETE` | `/api/documents/{id}` | Yes | Delete document + vectors + file |
| `POST` | `/api/query` | Yes | Grounded answer + citations (JSON) |
| `POST` | `/api/query/stream` | Yes | Streaming answer (plain text) |

## RAG flow

### Ingest

```text
Upload file (PDF / TXT / MD)
        ↓
Extract text (LangChain loaders)
        ↓
Split into chunks (RecursiveCharacterTextSplitter)
        ↓
Generate embeddings (OpenAIEmbeddings)
        ↓
Store in FAISS + save metadata registry
```

### Query

```text
User question
        ↓
Embed query → similarity search (top K chunks)
        ↓
Build grounded prompt with context
        ↓
OpenAI chat model → answer
        ↓
Return answer + citations (source, page, section)
```

## Architecture notes

- **SOLID / DI**: Routers depend on services via FastAPI `Depends`. Services
  depend on abstractions (LangChain `Embeddings`, `FAISSStore`), not SDKs directly.
- **Single responsibility**: Only `llm_service` calls OpenAI chat; only
  `embedding_service` creates embeddings; only `faiss_store` touches FAISS.
- **Empty index**: FAISS is initialized without an API call so listing documents
  works even before the first ingest.

## Frontend integration

The Next.js frontend consumes this API via Axios (and `fetch` for streaming).
Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in `frontend/.env.local`.

Mobile (Expo) apps use the same API — set `EXPO_PUBLIC_API_URL` to your LAN IP
with `/api` suffix when testing on a physical device.
