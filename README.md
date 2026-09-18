# ATS Genie

A small, one-session tool to analyze or assemble a resume so applicant tracking systems can parse it. Nothing is stored. There are no accounts.

## What it does

- **Landing** — what the tool is, how it works, and the privacy terms up front
- **Analyze** (`/analyze`) — upload a PDF or DOCX, get guided issues, download DOCX or PDF
- **Assemble** (`/assemble`) — write each section in plain text, get an ATS-structured recommendation, download

Analyze and assemble call GPT-OSS 120B via Groq. Files over 3 MB are rejected. Long text is truncated before the model. Each IP gets 3 AI checks per hour; the shared Groq budget may pause the tool for everyone.

## Privacy

- No database, no resume logs, no `localStorage` of CV bodies
- Request-scoped processing only; temp bytes are discarded after the handler
- Rewrites will use **GPT-OSS 120B** via Groq (open-weight). Groq does not train on API data
- Enable **Zero Data Retention** in the Groq console
- Closing the tab discards the session. We cannot recover it

## Tech stack

Two apps in one Git repo. The browser never holds the Groq key. Resume bytes live in a single request; the only on-disk state is salted IP hashes used for rate limits.

```text
apps/web     Next.js 15 (App Router) — Vercel
apps/api     FastAPI — Render
render.yaml  Render Blueprint (rootDir: apps/api)
Makefile     make api / make api-dev / make web
```

```text
Browser  --JSON/FormData-->  FastAPI  --chat.completions-->  Groq (GPT-OSS 120B)
   ^                            |
   |          DOCX/PDF bytes    |
   +-------- /v1/generate ------+
```

### Frontend (`apps/web`)

| Piece | Choice | Why it is here |
|---|---|---|
| Runtime | **Next.js 15.5** App Router, **React 19**, **TypeScript 5.9** (strict) | Static/SSR landing plus client wizards; deploys on Vercel with `Root Directory` = `apps/web` |
| Styling | **Tailwind CSS 4** (`@tailwindcss/postcss`), CSS variables in `globals.css` | Paper-like stone palette (`#f4efe6` / rust `#9a3412`); no separate `tailwind.config` |
| UI kit | **shadcn/ui** New York + **Radix** (button, card, input, textarea, checkbox, label) | Accessible primitives; `class-variance-authority`, `clsx`, `tailwind-merge` |
| Icons / type | **Lucide**, **Geist** + **Source Serif 4** (Google fonts) | Header wordmark is serif; body is sans |
| i18n | Hand-rolled `src/i18n` — JSON for **en / es / pt / de** | UI locale in `localStorage` (`ats-ui-locale` only). Output language (`keep` or a locale) is sent to the API separately so the CV can be rewritten without changing the chrome |
| API client | `src/lib/api.ts` + shared types | `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`). Analyze uses `FormData`; assemble/generate use JSON. Downloads are blobs with `Cache-Control: no-store` on the API |

Routes: `/` landing, `/analyze` upload + issues + recommendation card + download, `/assemble` plain-text sections → structured CV.

### Backend (`apps/api`)

| Piece | Choice | Why it is here |
|---|---|---|
| API | **FastAPI 0.116**, **Pydantic v2** models in `app/models/schemas.py` | Typed `/v1/analyze`, `/v1/assemble`, `/v1/generate`, `GET /health`. Field aliases accept `startDate` / `start_date` from Groq |
| Config | **pydantic-settings** (`app/config.py`) | Reads `apps/api/.env`; extra env keys ignored |
| Server | **Gunicorn** + **UvicornWorker** (`start.sh`); `make api-dev` is uvicorn `--reload` | Render uses `start.sh`. Defaults: bind `0.0.0.0:8000`, 2 workers, 120s timeout (Groq can be slow) |
| Uploads | **python-multipart**, 3 MB cap | PDF or DOCX only |
| CORS | FastAPI `CORSMiddleware` | `ALLOWED_ORIGIN` comma-separated; credentials off; `GET`/`POST`/`OPTIONS` |

Request path:

1. **Analyze** — extract text → heuristic ATS checks (`ats_rules.py`) → Groq structured rewrite → `ResumeSections` + issues.
2. **Assemble** — JSON sections in → Groq rewrite (no invented employers/dates) → recommendation.
3. **Generate** — no model; `documents.py` renders DOCX or PDF from `sections`. Analyze download posts those Groq sections, not the raw PDF preview.

### Documents

| Direction | Library | Behavior |
|---|---|---|
| PDF in | **pdfminer.six** first, **pypdf** fallback | pdfminer is quieter on broken object streams; pypdf loggers are raised to `ERROR` |
| DOCX in | **python-docx** | Paragraph text only |
| DOCX out | **python-docx** | Headings + paragraphs; generator stamp rewritten to `ats-assistant` |
| PDF out | **fpdf2** (core Helvetica, latin-1) | Unicode bullets/dashes mapped to ASCII so they do not become `?`. Accented ES/PT/DE letters are in latin-1 and kept |

Prompts are truncated around **6000** characters (`PROMPT_CHAR_LIMIT`). The UI preview is a shorter extract (`textPreview`).

### AI (Groq)

- SDK: **groq** Python client, 45s timeout.
- Model: **`openai/gpt-oss-120b`** (open-weight; Groq does not train on API data). Override with `GROQ_MODEL`.
- `chat.completions` with `response_format: json_object`, temperature `0.2`, max 4096 tokens.
- System prompt pins `detectedLanguage`, `outputLanguage`, `issues`, and camelCase `sections` (`contact`, `summary`, `skills`, `experience`, `education`, `extras`).
- Parser also accepts `recommendation` / `resume` if `sections` is missing. Empty CVs (no summary, skills, jobs, or education) fail the analyze/assemble call with **502** instead of a blank download.

### Rate limits

SQLite WAL file at `apps/api/data/rate_limit.sqlite` — **timestamps and salted IP hashes only**, never file bytes or CV text. `RATE_LIMIT_SALT` is mixed in before SHA-256.

| Limit | Default | Applies to |
|---|---|---|
| Burst | 5 POST / minute / IP | All mutating routes |
| Session | 3 Groq calls / hour / IP | Analyze + assemble |
| In-flight | 1 global Groq lock | Shared process |
| Spacing | 20s between Groq calls | Everyone |
| Daily budget | 30 Groq calls / UTC day | Everyone |

429 responses send `Retry-After` and `X-RateLimit-*`.

### Hosting

| App | Platform | Notes |
|---|---|---|
| Web | **Vercel** | Root `apps/web`; set `NEXT_PUBLIC_API_URL` to the Render origin (no trailing slash) |
| API | **Render** | Blueprint `render.yaml`; Python runtime; health `GET /health`; free instances sleep |

Node **20+** and Python **3.11+** locally. Do not put `GROQ_API_KEY` in the Next.js client.

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
```

From the repo root:

```bash
make api        # gunicorn + uvicorn workers (default :8000)
make api-dev    # uvicorn --reload for local iteration
```

Or `./apps/api/start.sh`. Override with `PORT`, `WORKERS` / `WEB_CONCURRENCY`, `TIMEOUT`, `HOST`.

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
| `MAX_UPLOAD_BYTES` | Default `3145728` (3 MB) |
| `RATE_LIMIT_PER_MINUTE` | Burst cap, default `5` |
| `SESSION_LIMIT` | AI checks per IP per hour, default `3` |
| `GLOBAL_MIN_INTERVAL` | Seconds between Groq calls, default `20` |
| `GLOBAL_DAILY_LIMIT` | Shared Groq calls per UTC day, default `30` |
| `RATE_LIMIT_SALT` | Salt for IP hashes (not resume data) |

## Deploy

1. **Vercel** — import this GitHub repo, set **Root Directory** to `apps/web`, add `NEXT_PUBLIC_API_URL` pointing at the Render service (no trailing slash).
2. **Render** — Blueprint from `render.yaml`, or a Web Service with root `apps/api`. Set `GROQ_API_KEY` and `ALLOWED_ORIGIN` to the Vercel origin (`https://your-app.vercel.app`). Free instances sleep after idle; Starter ($7/mo) stays up.

Do not commit `.env` files. Set a Groq spend cap before sharing a public URL.
