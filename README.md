# BookLeaf Author Support & Communication Portal

Two portals (Author + Admin) with AI-assisted ticket triage and reply drafting.
**Stack:** Next.js 14 (App Router) · shadcn/ui + Tailwind · Node.js/Express · MongoDB (Mongoose) · OpenAI-compatible LLM API.

```
bookleaf-portal/
├── server/   Express REST API  (routes → controllers → services → models; AI in services/ai)
├── web/      Next.js frontend  (author + admin portals)
├── WRITEUP.md
└── docker-compose.yml  (local MongoDB)
```

## 1. Run locally

Prereqs: Node 18+, MongoDB (local, Docker via `docker compose up -d`, or a free MongoDB Atlas URI).

```bash
# API
cd server
cp .env.example .env          # set MONGODB_URI, JWT_SECRET, and (optionally) OPENAI_API_KEY
npm install
npm run seed                  # loads the 10 authors / 18 books from data/bookleaf_sample_data.json + 5 demo tickets
npm run dev                   # http://localhost:5000

# Frontend (new terminal)
cd web
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm install
npm run dev                   # http://localhost:3000
```

`npm test` in `server/` runs unit tests for the AI fallback/rules/prompt-context code (no DB or API key needed).

### Test logins (created by the seed)
| Role | Email | Password |
|---|---|---|
| Admin | admin@bookleaf.com | Admin@123 |
| Admin | support@bookleaf.com | Admin@123 |
| Author (all 10) | e.g. priya.sharma@email.com, ananya.reddy@email.com (never paid), sneha.kulkarni@email.com (book in production), kavita.deshmukh@email.com (production + sub-₹1,000 pending) | Author@123 |

The login page also has click-to-fill demo accounts.

### Free LLM options (the code uses the standard OpenAI SDK with a configurable base URL)
OpenAI's API itself is paid. For a free key use any OpenAI-compatible provider:
- **Groq** (free tier): `OPENAI_BASE_URL=https://api.groq.com/openai/v1`, `AI_MODEL=llama-3.3-70b-versatile`
- **Google Gemini** (free tier): `OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/`, `AI_MODEL=gemini-2.0-flash`
- **OpenAI**: leave `OPENAI_BASE_URL` empty, `AI_MODEL=gpt-4o-mini`

No key at all? The app still works fully (see *Graceful degradation*).

### Deploy
- DB: MongoDB Atlas free cluster → `MONGODB_URI`.
- API: Render/Railway (root `server`, start `npm start`; env vars from `.env.example`; set `CLIENT_ORIGIN` to the frontend URL). Run `npm run seed` once.
- Web: Vercel (root `web`, env `NEXT_PUBLIC_API_URL=https://<api-host>/api/v1`).

## 2. Architecture decisions
- **Separate API + frontend.** The brief asks for a clean REST layer with auth middleware and RBAC; a standalone Express API makes that boundary explicit and testable. The browser never talks to the LLM, so the key can't leak.
- **Layering:** `routes` (wiring + zod validation + role guards) → `controllers` (HTTP only) → `services` (business rules) → `models`. AI code is isolated in `services/ai/*` behind two functions (`classifyTicket`, `generateDraft`) so the provider is swappable.
- **MongoDB schema:** `User` (role author/admin), `Book` (one doc per book, FK to author), `Ticket` (messages and internal notes embedded - they are always read with the ticket and bounded in size). Tickets store `categorySource` / `prioritySource` (`ai | rules | admin`) so overrides are never clobbered by late AI results and the UI shows how much to trust a label. `priorityRank`/`statusRank` are denormalised for an indexed "active → most urgent → oldest" sort.
- **Access control:** JWT bearer auth on every route except login/health. Authors are scoped by `author = req.user._id` in the service layer; fetching someone else's ticket returns 404 (not 403) so ids can't be probed. Internal notes, AI draft, AI reasoning and priority are stripped from author responses by `serializers.js`.
- **Real-time:** polling (3s on ticket detail, 4–5s on lists, paused when the tab is hidden). Simple, works on any host/serverless; SSE/WebSocket is the next step at scale.
- **Auth storage:** JWT in `localStorage` for simplicity; production would use httpOnly cookies.
- **shadcn/ui:** components are hand-written in shadcn's standard form (`components/ui`, `cva`, `cn`) so no CLI/network is needed. `Select` is a styled native select. You can replace any with `npx shadcn add ...`.

## 3. AI integration
**Model choice:** `gpt-4o-mini` by default (cheap, fast, reliable JSON mode, strong instruction-following for tone). The client is OpenAI-compatible, so Groq/Gemini free tiers or Claude Haiku via a compatible gateway work with only env changes.

**Two LLM tasks, deliberately different in cost:**
1. **Triage (on ticket creation)** - one call returns `{category, priority, reasoning}` in JSON mode, `temperature 0`, `max_tokens 120`. Input is only subject + description (capped at 1,500 chars) + book title. *No knowledge base, no history.* Runs asynchronously: the ticket is saved and returned immediately, then updated a moment later. Output is validated with zod; a business rule enforces the KB policy "ISBN errors are at least High".
2. **Drafting (when admin opens a ticket)** - one call, `max_tokens 450`. The prompt contains:
   - the **category-scoped KB slice** (overview + tone + only the relevant policy sections + one calibration example) instead of the full KB,
   - **facts from the author's real data**: the linked book's status, MRP, copies, earned/paid/pending, last payout, flags like `never_paid`, `in_production`, `pending_below_1000_threshold`, and a **precomputed next-payout date** (quarter end + 45 days) so the model never does date maths. Account-level tickets get a compact list of up to 8 books,
   - the last 4 conversation turns, each capped at 600 chars.
   
   The system prompt forces: use only supplied facts, never invent numbers/dates, own BookLeaf's mistakes, acknowledge first, give a timeline, end with a next step, 110-200 words, plain text. Ticket text is wrapped in delimiters and declared untrusted (prompt-injection hardening).

**Cost control:** scoped KB, bounded history, small max_tokens, one call per task, drafts cached on the ticket (re-opening a ticket costs nothing; only the "Regenerate" button or a category change triggers a new call), circuit breaker after repeated failures.

**Graceful degradation:** every AI call is wrapped; on missing key, timeout, 429/5xx, bad JSON, or open circuit breaker:
- tickets are **always created**;
- classification falls back to keyword rules (`source: "rules"`, shown in the UI);
- drafting falls back to a **template draft** that follows KB policy and uses the same data facts, with a visible warning; the admin can always type a manual reply.

**API key security:** read from `process.env` only (validated at boot), used only in `services/ai/llm.js`, never returned by any endpoint, never in the frontend bundle. `.env` is git-ignored.

## 4. API reference
Base URL `/api/v1`. Auth: `Authorization: Bearer <jwt>`. Errors: `{ "error": { "code", "message", "details?" } }` with 400/401/403/404/409/422/429 (500 is never leaked with internals).

| Method & path | Role | Description |
|---|---|---|
| `GET /health` | public | Liveness + whether AI is configured |
| `POST /auth/login` | public | `{email, password}` → `{token, user}` (rate limited) |
| `GET /auth/me` | any | Current user |
| `GET /meta` | any | Allowed categories, priorities, statuses |
| `GET /books` | any | Author: own books. Admin: all (`?authorId=AUTH001`) |
| `GET /tickets` | any | Author: own. Admin: all. Filters: `status, category, priority, assigned(me\|unassigned), from, to, q, sort(urgency\|oldest\|newest), page, limit` |
| `POST /tickets` | author | `{bookId\|null, subject(5-200), description(20-5000), attachments?[{name,size}]}` → 201; triggers async AI triage |
| `GET /tickets/stats` | admin | Counts by status/priority, overdue >48h, unassigned |
| `GET /tickets/:id` | owner/admin | Ticket + thread (admin also gets notes, AI draft, AI meta) |
| `POST /tickets/:id/messages` | owner/admin | `{body, status?}` - admin reply (status honoured, auto-assigns, sets first response); author follow-up (reopens Resolved; blocked on Closed → 409) |
| `PATCH /tickets/:id` | admin | `{status?, category?, priority?, assignedTo?: "me"\|adminId\|null}` - category/priority edits mark the field as admin-overridden |
| `POST /tickets/:id/notes` | admin | `{body}` internal note |
| `POST /tickets/:id/draft` | admin | (Re)generate AI draft; returns `{text, source: ai\|template, model, warning?}` |
| `POST /tickets/:id/reclassify` | admin | Force a fresh AI classification (overrides previous admin overrides) |

## 5. Data notes (checked against the provided JSON)
- For all 16 published books `copies × royalty_per_copy = total_royalty_earned` and `paid + pending = earned`. The 2 in-production books have `null` MRP/pub date and zero figures; the UI renders these as `—` with an explanatory banner.
- Four authors/books have never been paid (BK005, BK010, BK016, BK018); BK016 has ₹850 pending, below the ₹1,000 threshold, so the AI is told to explain roll-over.
- ISBNs in the file are masked (`978-93-5XXXX-..`) and shown as-is. The in-production books already carry an ISBN although ISBN assignment comes later in the KB's production stages; treated as data as provided.
- `last_royalty_payout_date` values are in 2025; "today" is the real clock, so the payout schedule helper is computed from the current date, not from the data.

## 6. Known limitations / next steps
- File attachments store names/sizes only (UI-only per brief); next: S3/Cloudinary signed uploads.
- Polling instead of SSE/WebSockets; JWT in localStorage; no password reset; no email notifications to authors on reply.
- Triage runs in-process (`setImmediate`); at scale move to a queue (BullMQ) with retries, and re-triage stale `pending` tickets.
- No integration tests against a live Mongo in this package (unit tests cover the AI logic); add supertest + mongodb-memory-server.
- Add evaluation set for classification accuracy, token/cost logging per call, and admin-edit-distance tracking on drafts to improve prompts.
