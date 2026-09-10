# ATS Assistant

A small, one-session tool to analyze or assemble a resume so applicant tracking systems can parse it. Nothing is stored. There are no accounts.

## What it does

- **Landing** — what the tool is, how it works, and the privacy terms up front
- **Analyze** (`/analyze`) — upload a PDF or DOCX, get guided issues, download DOCX or PDF
- **Assemble** (`/assemble`) — write each section in plain text, get an ATS-structured recommendation, download

Foundation slice: real extract + deterministic ATS checks + file generation. Groq is wired (`GROQ_API_KEY` / `GROQ_MODEL`) but not called yet.

## Privacy

- No database, no resume logs, no `localStorage` of CV bodies
- Request-scoped processing only; temp bytes are discarded after the handler
- Rewrites will use **GPT-OSS 120B** via Groq (open-weight). Groq does not train on API data
- Enable **Zero Data Retention** in the Groq console
- Closing the tab discards the session. We cannot recover it

## Repo

```text
apps/web     Next.js — Vercel
apps/api     FastAPI — Render
render.yaml  Render Blueprint (rootDir: apps/api)
```

## Local run

Needs Node 20+ and Python 3.11+.

### API

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Optional: set GROQ_API_KEY. Not required for the foundation stubs.
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://127.0.0.1:8000/health`

### Web

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Consent is required before upload or assemble.

## Environment

**Web** (`apps/web/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI origin, e.g. `http://127.0.0.1:8000` |

**API** (`apps/api/.env`)

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq secret. Never put this in the Next.js client |
| `GROQ_MODEL` | Default `openai/gpt-oss-120b` |
| `ALLOWED_ORIGIN` | Comma-separated CORS origins (your Vercel URL in production) |
| `MAX_UPLOAD_BYTES` | Default `5242880` (5 MB) |
| `RATE_LIMIT_PER_MINUTE` | Default `20` per IP |

## Deploy

1. **Vercel** — import this GitHub repo, set **Root Directory** to `apps/web`, add `NEXT_PUBLIC_API_URL` pointing at the Render service (no trailing slash).
2. **Render** — Blueprint from `render.yaml`, or a Web Service with root `apps/api`. Set `GROQ_API_KEY` and `ALLOWED_ORIGIN` to the Vercel origin (`https://your-app.vercel.app`). Free instances sleep after idle; Starter ($7/mo) stays up.

Do not commit `.env` files. Set a Groq spend cap before sharing a public URL.
