# SkillForge API

TypeScript backend for the SkillForge application. It uses Express for HTTP routes and PostgreSQL through the `pg` package. Request payloads are validated with Zod; passwords are hashed with bcrypt; access tokens are signed as JWTs.

## Requirements and setup

Use Node.js 20 or newer. From the project root, install backend dependencies:

```powershell
npm --cache .npm-cache --prefix backend ci
```

The API reads `DATABASE_URL` from the project root `.env`. If it is unset, it uses the local credentials in `compose.yaml`.

## Database

Start PostgreSQL from the project root and apply SQL migrations:

```powershell
docker compose up -d database
npm run migrate:api
```

Migrations are tracked in `schema_migrations`. Migration 003 preserves the earlier free-response practice bank as `interview_question_prompts`, then creates the relational entities used by the account-based interview flow.

The active multiple-choice bank contains 124 Russian-language questions: 54 for JavaScript, including DOM and asynchronous JavaScript, and 10 each for TypeScript, React, Node.js, HTML, CSS, SQL, and Git. Each question has four options and at least one correct option. Interviews select a randomized set across all three difficulty levels, then prioritize the next question based on the previous answer. `INTERVIEW_QUESTION_COUNT` sets the interview length and defaults to 10.

The separate free-response practice bank has 30 Frontend prompts and 60 each for Backend and Fullstack. Each track has 20 prompts at each level (`Junior`, `Junior+`, `Middle`).

## Run the API and tests

From the project root:

```powershell
npm run dev:api
npm run test:api
npm run build:api
```

The API listens on `http://127.0.0.1:8000`. Vitest exercises the HTTP routes using an injected database stub. `npm run build:api` compiles TypeScript to `backend/dist`; `npm run start:api` starts the compiled server. The Vite server proxies `/api` requests to the API while `npm run dev` serves the frontend.

## Endpoints

- `GET /api/health` checks PostgreSQL and returns `503` if it is unavailable.
- `POST /api/auth/register` validates and creates a `USER` account with a bcrypt password hash.
- `POST /api/auth/login` returns a JWT valid for 30 days; the frontend persists the signed-in session between browser restarts and clears it on explicit sign-out or an invalid token.
- `GET /api/auth/me` returns the current user and requires a bearer token.
- `GET /api/interviews/questions?track=Frontend&level=Junior` loads prompts from the earlier practice bank.
- `GET /api/questions?skillId=1&difficulty=HARD` filters the multiple-choice question catalog by skill and difficulty; answer keys are never included.
- `GET /api/skills` lists active skills and their question counts.
- `POST /api/interviews`, `GET /api/interviews/:id/current-question`, `POST /api/interviews/:id/answer`, and `GET /api/interviews/:id/result` implement adaptive multiple-choice interviews.
- `GET /api/users/me/statistics`, `/api/users/me/skills`, and `/api/users/me/progress` expose saved progress.
- `/api/admin/*` provides role-protected user, skill, question, and statistics management.

Tracks: `Frontend`, `Backend`, `Fullstack`. Levels: `Junior`, `Junior+`, `Middle`. Unsupported values return `422`; an empty question set returns `404`. Configure `JWT_SECRET` in `.env`; the development fallback must not be used in production.
