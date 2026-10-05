# NaukriRadar — Web app

The web app for [NaukriRadar](https://github.com/Satya2008/autoapply-backend): find jobs that fit you,
see why they match, apply where it is safe, and finish the rest with your answers ready to paste.
Every backend feature has a screen, including the admin side.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, Recharts, lucide icons.
Vitest for unit tests.

## Run it

The backend runs first (`scripts\start-local.ps1` in the backend repo); the gateway listens on :8080.

```bash
npm install
npm run dev          # http://localhost:5173
```

The dev server sends `/api` (and Swagger UI) to the gateway, so the browser sees one origin and the
backend needs no CORS. Point it elsewhere with `VITE_GATEWAY_URL` in `.env` (see `.env.example`).

```bash
npm run typecheck    # tsc, strict
npm test             # vitest
npm run build        # production bundle in dist/
```

## Signing in

Login arrives with backend Phase 8. Until then you sign in with an email: an existing user is found,
a new email creates one (`GET/POST /api/v1/dev/users`). The user's id then goes on every request as
`X-User-Id`, which is what the gateway trusts for now. Admin screens are open to every signed-in user
until roles arrive, so run this only against your own local backend.

## Screens

**Job hunt**

| Screen | What you do there |
|---|---|
| Dashboard | Setup checklist, numbers, start matching and applying, best matches, pipeline, what waits for you, live feed |
| Jobs | Search every active job (words, location, remote, board, age), read the full posting and what AI read from it |
| Matches | Your scored jobs with a minimum-score filter; each match explains its score factor by factor, plus the AI review |
| Skill gap | The missing skills that would bring the most extra matches; add one to your profile in a click |
| Applications | Everything applied to or waiting, by status; start an apply run and watch it finish |
| Application | Cover letter (built on your resume, with a claim check), screening answers, mark applied / skip / interview / offer, timeline, answers to paste |
| Needs you | Applications only you can finish, with the site link and your answers |
| Live activity | Apply results as they happen (server-sent events through the gateway) |

**You**: profile (every field, with the server's own field errors), skills with years, resume
(upload by drag and drop or straight to S3, download, what AI read, read again, delete),
notifications (email, Telegram linking with a one-time code, digest, apply updates).

**Admin**

| Screen | What it covers |
|---|---|
| System health | Circuit breakers, event backlogs and dead letters of every service, scheduled jobs |
| Job sources | Add or edit a board as configuration (JSONPath per field), test it without saving, fetch it now |
| Fetch runs | Fetch every board in parallel and follow the run; per-board results; clean up; parse again |
| Apply portals | Risk per careers site, form selectors for the apply worker, a dry run in headless Chrome |
| AI providers | Any vendor with its key and models; primary, fallback order, embedding model, live model list, test |
| AI usage & cost | Calls, tokens, cost and latency by provider, model, prompt, user or day |
| Prompts | Versions of every prompt; make a version live or roll back; eval-gated prompts say what to run |
| Evals | Golden set (add, remove), matcher eval (keyword vs hybrid), prompt eval, metrics per run and per case |
| Semantic search | Embedding model in use, vectors per model, embed missing jobs, run the nightly batch |
| Settings | Runtime settings edited by type (cron, domains, secrets...), reset to default |
| Scheduler | Jobs, next and last runs, run now |
| Events & dead letters | Outbox backlog per service, failed events with their error, replay |
| Caches | Two-level cache stats per service, clear one everywhere |
| Audit log | Every admin change, filtered |
| Storage & tools | Copy local files to S3, send a test email or Telegram message |

## How it is built

- `src/api`: one `request` function (user header, Problem Details errors as `ApiError` with field
  errors), typed endpoints per backend area, and an SSE client on `fetch` (EventSource can't send headers;
  it reconnects with backoff).
- `src/app`: session, live stream (refreshes the screens that show applications), theme, run polling.
- `src/components`: UI primitives, overlays, toasts, editors (chips, key-value, JSON), domain badges,
  and the shared run and writing panels.
- `src/pages`: one file per screen; heavy ones load on demand.
- Background work (match, apply, fetch, eval) answers 202; screens poll the run until it ends.
