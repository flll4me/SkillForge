# SkillForge

SkillForge is a technical interview practice app. The current MVP has React and TypeScript pages, an Express and TypeScript API, PostgreSQL storage, JWT sign-in, adaptive multiple-choice interviews, score history, and admin tools for users, skills, and questions.

## Stack

- Frontend: React, TypeScript, React Router, CSS
- API: Node.js, TypeScript, Express, Zod, bcryptjs, JWT
- Database: PostgreSQL 18 via Docker Compose
- Tests: Vitest for frontend and API
- Containers: Docker Compose for the web app, API, and database

The attached specification proposes SQLite for local development and PostgreSQL in production. This checkout currently uses PostgreSQL in both local and container development because the existing database and question bank were already running on PostgreSQL. A SQLite adapter is still an open item.

## Local development

Use Node.js 20 or newer and start PostgreSQL:

```powershell
Copy-Item .env.example .env
docker compose up -d database
npm ci
npm --cache .npm-cache --prefix backend ci
npm run migrate:api
```

`INTERVIEW_QUESTION_COUNT` controls how many questions are assigned to each interview. It defaults to 10 and accepts values from 1 to 100.

Start the API and frontend in separate terminals:

```powershell
npm run dev:api
```

```powershell
npm run dev
```

Open the Vite app at `http://127.0.0.1:5173`. Vite proxies `/api` requests to the API at port 8000.

## Docker Compose

Build and start all three services:

```powershell
docker compose up --build
```

Open the app at `http://127.0.0.1:8080`. The API is also available at `http://127.0.0.1:8001`; PostgreSQL is published at `127.0.0.1:5432`. The backend runs outstanding SQL migrations at startup.

The checked-in Compose defaults are for local development only. Set a unique `JWT_SECRET` and strong database password before using the deployment outside a local machine.

## Tests and builds

```powershell
npm run test:run
npm run test:api
npm run typecheck
npm run build
npm run build:api
```

API tests use Vitest and injected database fakes. The interview and admin workflows have also been exercised against the local PostgreSQL container with temporary test records that were removed after the checks.

## What works

- Registration, login, JWT-protected profile, and profile updates
- Persistent sign-in across browser restarts with a 30-day JWT; transient network failures do not clear a saved session
- User statistics, per-skill scores, interview history, and progress history
- Adaptive multiple-choice interviews with a configurable question count (10 by default)
- A Russian-language bank of 124 questions: 54 JavaScript questions covering DOM and async topics, plus 10 each for TypeScript, React, Node.js, HTML, CSS, SQL, and Git
- Free-response practice tracks with 30 Frontend prompts and 60 each for Backend and Fullstack; each track has 20 questions at Junior, Junior+, and Middle levels
- A question catalog at `/questions`, filterable by skill and difficulty, with pagination and no answer-key exposure
- Random interview sets that include all three difficulty levels, allowing difficulty to adapt as the user answers
- Exact-set scoring for multiple-choice questions and all-or-nothing single-choice scoring
- Admin endpoints and screens for user status, skills, and question bank management
- SQL migration tracking and seeded interview questions

All new accounts receive the `USER` role. To grant an account admin access in the local database, run:

```powershell
docker compose exec database psql -U skillforge -d skillforge -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';"
```

Sign out and back in after changing the role so the new JWT includes it.

## API routes

| Area | Routes |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| User | `GET/PATCH /api/users/me`, `GET /api/users/me/statistics`, `GET /api/users/me/skills`, `GET /api/users/me/progress` |
| Skills | `GET /api/skills` |
| Interviews | `POST/GET /api/interviews`, `GET /api/interviews/:id`, `GET /api/interviews/:id/current-question`, `POST /api/interviews/:id/answer`, `GET /api/interviews/:id/result` |
| Admin | `/api/admin/users`, `/api/admin/skills`, `/api/admin/questions`, `/api/admin/statistics` |

All API responses use JSON. Errors use `{ "error": { "code": "...", "message": "..." } }`.

## Question-bank source

The additional JavaScript questions in migration `009_question_catalog_and_expansion.sql` are original Russian multiple-choice items informed by the topic coverage in [Front End Interview Handbook](https://github.com/yangshun/front-end-interview-handbook), licensed under MIT. The additional backend and full-stack prompts in migration `010_expand_backend_fullstack_prompts.sql` were written for SkillForge with topic coverage informed by [Node.js Interview Prep](https://github.com/surajvsk/nodejs-interview-prep), also MIT-licensed. The project preserves source attribution; question wording was written for SkillForge.
