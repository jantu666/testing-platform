# Online testing platform

Monorepo: **NestJS** API (`backend/`) + **Next.js** app (`frontend/`), **PostgreSQL** via **[Neon](https://neon.tech)**, **Prisma**, JWT access + refresh.

## Architecture (recommended)

| Piece | Where |
|--------|--------|
| Database | **Neon** (Postgres) |
| Frontend | **Vercel** (deploy the `frontend` directory as the project root) |
| API | A long‑running Node host (e.g. **Railway**, **Render**, **Fly.io**) — NestJS is not a typical Vercel serverless app |

Set environment variables on each platform as below.

## Neon + Prisma

1. Create a Neon project and copy:
   - **Pooled** connection string → `DATABASE_URL` (often includes `-pooler` in the host).
   - **Direct** connection string → `DIRECT_URL` (for migrations; no pooler).

2. From `backend/` (with `DATABASE_URL` and `DIRECT_URL` in `.env` or CI secrets):

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

`directUrl` in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) is required so migrations use a direct connection while the app can use the pooler.

## Backend (API host)

Copy [`backend/.env.example`](backend/.env.example) → `.env` (or configure the same keys in your host’s dashboard):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL (same as `DATABASE_URL` if not using Neon) |
| `JWT_*` | Strong random secrets |
| `FRONTEND_URL` | Your **Vercel** site origin (CORS), e.g. `https://your-app.vercel.app` |
| `API_PUBLIC_URL` | Public URL of **this API** (used in saved avatar URLs) |

```bash
cd backend
npm install
npm run start:prod   # after build: npm run build
```

Uploads are stored under `UPLOAD_DIR` on the API machine; for fully ephemeral/serverless APIs, plan object storage (e.g. S3, Vercel Blob) later.

### First administrator

After `prisma db seed`, attach `ADMIN` (and optionally `CREATOR`) to a user via Prisma Studio (`npm run prisma:studio` with env loaded) or SQL against `user_roles` / `roles`.

## Frontend (Vercel)

1. **New Vercel project** → set **Root Directory** to `frontend` (if the repo root is this monorepo).
2. Environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed API origin, e.g. `https://api.yourdomain.com` (no trailing slash).

```bash
cd frontend
npm install
npm run build
```

Vercel runs `next build` automatically; local preview: `npm run dev`.

## API summary

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Users | `GET /users/me`, `PATCH /users/me` (multipart: `nickname`, `avatar`), `GET /users/:id` (public) |
| Tests | `POST /tests`, `GET /tests`, `GET /tests/:id`, `PATCH /tests/:id`, `DELETE /tests/:id` — `?shareToken=` for private access |
| Results | `POST /results`, `GET /results?mine=true` or `GET /results?testId=` |
| Admin | `GET /admin/users`, `PATCH /admin/users/:id`, `POST /admin/users/:id/roles`, `DELETE /admin/users/:id/roles/:role` |

## Features

- Multi-role users (`USER`, `CREATOR`, `ADMIN`), guards + DB checks.
- Tests: draft/publish, public/private + share token, server-side scoring, tab-switch anti-cheat on the client.
- i18n: EN / RU / KZ (`next-intl`).
