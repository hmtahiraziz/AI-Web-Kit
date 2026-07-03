# SA AI Web Kit — Backend

Production-ready RAG backend for the SA AI Web Kit. Built with **FastAPI**,
**LangChain**, **FAISS**, and **Google Gemini**. Runs independently of the Next.js
frontend and exposes a typed REST API under `/api`.

## Requirements

- Python 3.12+
- Google Gemini API key ([AI Studio](https://aistudio.google.com/apikey))
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
GOOGLE_API_KEY=your-gemini-api-key
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
| `GOOGLE_API_KEY` | — | Google Gemini API key |
| `GEMINI_CHAT_MODEL` | `gemini-2.0-flash` | Chat model for answers |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Embedding model |
| `GEMINI_EMBEDDING_DIMENSION` | `768` | FAISS vector dimension (must match embedding model) |
| `CLERK_JWKS_URL` | — | Clerk JWKS endpoint for JWT verification |
| `CLERK_ISSUER` | — | Expected JWT issuer (optional) |
| `CLERK_AUDIENCE` | — | Expected JWT audience (optional) |
| `AUTH_DISABLED` | `false` | Bypass JWT verification (dev only) |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `FAISS_INDEX_DIR` | `faiss_index` | Persisted vector index directory |
| `UPLOAD_DIR` | `uploads` | Uploaded source files |
| `TOP_K` | `5` | Chunks retrieved per query |
| `CHUNK_SIZE` | `1000` | Text splitter chunk size |
| `CHUNK_OVERLAP` | `150` | Text splitter overlap |
| `MAX_UPLOAD_MB` | `25` | Max upload file size |
| `APP_VERSION` | `1.0.0` | Reported in health response |
| `LOG_LEVEL` | `INFO` | Python log level |

## Migrating from OpenAI

If you previously used OpenAI embeddings, **delete** `faiss_index/*` (keep `.gitkeep`)
and re-upload documents. Embedding dimensions differ (`768` for Gemini vs `1536` for
OpenAI `text-embedding-3-small`).

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
Generate embeddings (GoogleGenerativeAIEmbeddings)
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
Gemini chat model → answer
        ↓
Return answer + citations (source, page, section)
```

## Architecture notes

- **SOLID / DI**: Routers depend on services via FastAPI `Depends`. Services
  depend on abstractions (LangChain `Embeddings`, `FAISSStore`), not SDKs directly.
- **Single responsibility**: Only `llm_service` calls Gemini chat; only
  `embedding_service` creates embeddings; only `faiss_store` touches FAISS.
- **Empty index**: FAISS is initialized without an API call so listing documents
  works even before the first ingest.

## Frontend integration

The Next.js frontend consumes this API via Axios (and `fetch` for streaming).
Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in `frontend/.env.local`.

Mobile (Expo) apps use the same API — set `EXPO_PUBLIC_API_URL` to your LAN IP
with `/api` suffix when testing on a physical device.
