# Smart Login Portal

A **college-scale supply chain demo**: one **Next.js 15** app (TypeScript) with **SQLite**, **Prisma**, and **JWT auth**. The UI and JSON API live together—there is no separate backend service and **no Docker** requirement.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Requirements](#requirements)
4. [Quick start](#quick-start)
5. [Environment variables](#environment-variables)
6. [Project structure](#project-structure)
7. [npm scripts](#npm-scripts)
8. [Authentication and roles](#authentication-and-roles)
9. [HTTP API (overview)](#http-api-overview)
10. [Database](#database)
11. [Production and deployment](#production-and-deployment)
12. [Troubleshooting](#troubleshooting)
13. [Context (problem statement)](#context-problem-statement)

---

## Features

- **Mobile web (MWeb):** responsive layout, hamburger navigation on small screens, horizontal scroll for wide tables, larger tap targets, and safe-area support for notched devices.
- **Sign in** with email/password; JWT stored in the browser (`localStorage`).
- **Role-based navigation** (admin, warehouse manager, dispatcher, driver, retailer, etc.).
- **Master data**: locations, SKUs, vehicles, drivers.
- **Inventory** balances per location; **stock transfers** between warehouses (draft → ship → receive).
- **Orders** with lines; **allocate** from warehouse stock.
- **Trips**: plan from ready-to-ship orders, dispatch, stops, proof-of-delivery style updates.
- **Reports**: on-time delivery style metrics, utilization, exceptions (demo scope).

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| API | Route Handlers under `web/app/api/` |
| Database | SQLite (file) |
| ORM | Prisma |
| Auth | `bcrypt` (passwords), `jose` (HS256 JWT) |
| Styling | Tailwind CSS |

---

## Requirements

- **Node.js 18+** and **npm** (or use your package manager inside `web/`).

---

## Quick start

From the **repository root**:

```bash
# 1) Install dependencies
npm run install:web

# 2) Environment (see [Environment variables](#environment-variables))
cp env-example web/.env

# 3) Create/update the database and load demo data
cd web && npx prisma migrate dev && npm run db:seed && cd ..

# 4) Start the dev server
npm run dev
```

Open **http://localhost:3000**. Sign in with the [demo accounts](#authentication-and-roles) below.

**First-time vs. returning:** If you already have `web/.env` and `web/prisma/dev.db`, you can skip steps 2–3 and run `npm run dev` only. Run `npm run db:seed` when you want to reset demo data (this clears and re-seeds tables).

---

## Environment variables

Configure **`web/.env`** (copy from `env-example` at the repo root, or from `web/.env.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite connection string. Default: `file:./prisma/dev.db` (path is relative to the `web/` directory). |
| `JWT_SECRET` | Yes | Secret used to sign access tokens. Use a long random string in any shared or production-like environment. |

Optional (browser / SSR):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | e.g. `http://localhost:3000` — used if server-side code needs an absolute URL to this app. |
| `NEXT_PUBLIC_API_BASE_URL` | Leave unset for **same-origin** `/api` (normal local setup). Set only if the UI must call the API on another origin. |

You can add **`web/.env.local`** for local overrides (Next.js loads it in addition to `.env`; see [Next.js env docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)).

---

## Project structure

```
├── README.md                 # This file (project documentation)
├── env-example               # Template for web/.env
├── package.json              # Root shortcuts (dev, build, db:*)
└── web/
    ├── .env                  # Local secrets (create yourself; gitignored)
    ├── .env.example          # Duplicate template (optional)
    ├── app/                  # App Router: pages + layouts
    │   ├── api/              # REST-style Route Handlers → /api/*
    │   ├── login/
    │   └── (ops)/            # Authenticated operational UI
    ├── components/
    ├── context/              # Auth provider
    ├── lib/                  # api client, prisma, auth, server helpers
    ├── prisma/
    │   ├── schema.prisma     # Data model
    │   ├── migrations/       # Versioned SQL migrations
    │   ├── seed.ts           # Demo org, users, inventory, orders, …
    │   └── dev.db            # SQLite file (after migrate; gitignored)
    └── package.json
```

---

## npm scripts

### Repository root (`package.json`)

| Script | Description |
|--------|-------------|
| `npm run install:web` | `npm install` inside `web/` |
| `npm run dev` | Next.js dev server (Turbopack) on port **3000** |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server (run `build` first) |
| `npm run db:migrate` | Prisma migrate dev (uses `web/.env`) |
| `npm run db:seed` | Run `prisma/seed.ts` (wipes and reloads demo data) |
| `npm run lint` | ESLint in `web/` |

### Inside `web/` (when `cd web`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Same as root `npm run dev` |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:push` | Push schema without migration files (prototyping only) |
| `npx prisma studio` | Open Prisma Studio to browse SQLite |

---

## Authentication and roles

- **Login:** `POST /api/auth/login` with JSON `{ "email", "password" }` returns `{ access_token, token_type }`.
- **Current user:** `GET /api/auth/me` with header `Authorization: Bearer <token>`.
- The SPA stores the token under the key **`getto_token`** in `localStorage` (implementation detail; not the product name).

Seeded demo accounts (passwords shown; emails use the `@getto.demo` domain for demo only):

| Email | Password | Typical roles |
|-------|----------|----------------|
| `admin@getto.demo` | `admin123` | admin |
| `warehouse@getto.demo` | `warehouse123` | warehouse_manager |
| `dispatcher@getto.demo` | `dispatcher123` | dispatcher |
| `driver@getto.demo` | `driver123` | driver |
| `retailer@getto.demo` | `retailer123` | retailer |

The seeded **organization** display name is **Smart Login Portal Demo**.

---

## HTTP API (overview)

All routes are under **`/api`** on the same host as the Next app. Request/response bodies use **JSON**; field names are mostly **snake_case** to match the existing UI.

| Area | Methods | Path pattern |
|------|---------|----------------|
| Auth | POST, GET | `/api/auth/login`, `/api/auth/me` |
| Locations | GET, POST | `/api/locations` |
| SKUs | GET, POST | `/api/skus` |
| Vehicles / Drivers | GET, POST | `/api/vehicles`, `/api/drivers` |
| Inventory | GET | `/api/inventory` |
| Orders | GET, POST | `/api/orders`, `/api/orders/:id`, `POST .../allocate` |
| Trips | GET, POST, PATCH | `/api/trips`, `/api/trips/plan`, `/api/trips/:id`, dispatch, complete, costs, stop actions |
| Transfers | GET, POST | `/api/transfers`, `/api/transfers/:id`, ship, receive, cancel |
| Reports | GET | `/api/reports/otd`, `utilization`, `exceptions` |

Protected routes expect: `Authorization: Bearer <access_token>`.

---

## Database

- **Engine:** SQLite file at the path implied by `DATABASE_URL` (default `web/prisma/dev.db`).
- **Migrations:** `web/prisma/migrations/` — apply with `npm run db:migrate` from the repo root (or `npx prisma migrate dev` from `web/`).
- **Seed:** `web/prisma/seed.ts` — run `npm run db:seed` from root. **Warning:** the seed script **deletes existing data** in all tables before inserting demo rows.

To inspect data: from `web/`, run `npx prisma studio`.

---

## Production and deployment

- **SQLite** is fine for **local demos** and single-user scenarios. File-based DBs on ephemeral serverless disks (e.g. some Vercel setups) are **not** suitable for durable production data.
- For a real deployment, point **`DATABASE_URL`** at a managed database (e.g. **PostgreSQL**), run Prisma migrations against that URL, and set a strong **`JWT_SECRET`**.
- Run **`npm run build`** then **`npm run start`** (from root) or deploy the `web/` app per your host’s Next.js guide.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| `JWT_SECRET is not set` | Ensure `web/.env` exists and contains `JWT_SECRET=...`. |
| Prisma / migration errors | From `web/`: `npx prisma migrate dev`. Check `DATABASE_URL`. |
| Empty or wrong data | `npm run db:seed` (this resets demo data). |
| UI calls wrong API host | Remove `NEXT_PUBLIC_API_BASE_URL` from `.env.local` unless you intentionally use a separate API origin. |
| Port 3000 in use | Stop the other process or run dev with another port: `cd web && npx next dev -p 3001`. |

---

## Context (problem statement)

Poor coordination between logistics stakeholders (factories, warehouses, retailers, transport) can cause redundant trips, congestion, and waste. This project is a **small teaching artifact**: shared **orders**, **inventory**, **trips**, and **transfers** so students can discuss data models, roles, and workflows—not a production logistics platform.

---

## See also

- **`web/README.md`** — short notes for working inside the Next.js app directory.
