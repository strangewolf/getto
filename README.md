# Smart Login Portal

A **college-scale frontend-only ops demo** built with **Next.js 15** and **TypeScript**. Orders, trips, transfers, reports, and role-based sign-in all run from a browser-persisted mock store, so this POC does **not** require a backend service or database to work.

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
9. [Data Flow](#data-flow)
10. [Demo state](#demo-state)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Context (problem statement)](#context-problem-statement)

---

## Features

- **Mobile web (MWeb):** responsive layout, hamburger navigation on small screens, horizontal scroll for wide tables, larger tap targets, and safe-area support for notched devices.
- **Sign in** with seeded mock accounts; session persisted in the browser.
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
| Runtime data | Browser-side mock store in `localStorage` |
| API surface | Frontend mock router in `web/lib/mockApi.ts` |
| Auth | Mock role-based sign-in persisted in `localStorage` |
| Styling | Tailwind CSS |

---

## Requirements

- **Node.js 18+** and **npm** (or **Yarn** 1.x).

---

## Quick start

From the **repository root**, install dependencies **once**. The root `postinstall` script runs `npm install` inside `web/`, so `next` is available to the dev script.

```bash
# 1) Install (root + web — required before dev)
npm install
# or: yarn install

# 2) Optional environment file
cp env-example web/.env

# 3) Start the dev server
npm run dev
# or: yarn dev
```

If you skipped root install, run **`npm run install:web`** or **`yarn install --cwd web`** so `web/node_modules` exists.

Open **http://localhost:3000**. Sign in with the [demo accounts](#authentication-and-roles) below.

**Persistence:** demo data is stored in your browser. Use the **Reset demo** button in the app header to restore the original seed state.

---

## Environment variables

This frontend-only POC does not require any environment variables.

Optional:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Optional absolute app URL, e.g. `http://localhost:3000`. |

You can add **`web/.env.local`** for local overrides (Next.js loads it in addition to `.env`; see [Next.js env docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)).

---

## Project structure

```
├── README.md                 # This file (project documentation)
├── env-example               # Template for web/.env
├── package.json              # Root shortcuts
└── web/
    ├── .env                  # Optional local overrides
    ├── .env.example          # Duplicate template (optional)
    ├── app/                  # App Router: pages + layouts
    │   ├── login/
    │   └── (ops)/            # Authenticated operational UI
    ├── components/
    ├── context/              # Auth provider
    ├── lib/
    │   ├── api.ts            # Client request helper
    │   └── mockApi.ts        # Browser-side mock data engine
    └── package.json
```

---

## npm scripts

### Repository root (`package.json`)

| Script | Description |
|--------|-------------|
| `npm install` (root) | Installs `web/` deps via **`postinstall`** (`npm install --prefix web`) |
| `npm run install:web` | Same as postinstall: `npm install` inside `web/` |
| `npm run dev` | Next.js dev server (Turbopack) on port **3000** |
| `npm run build` | Production build |
| `npm run start` | Production server (run `build` first) |
| `npm run lint` | ESLint in `web/` |

### Inside `web/` (when `cd web`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Same as root `npm run dev` |
| `npm run build` | Next.js production build |
| `npm run lint` | ESLint |

---

## Authentication and roles

- The POC signs in against a **frontend mock auth flow** and stores the session in browser `localStorage`.
- The SPA stores the token under the key **`getto_token`** and the demo dataset in a separate local mock store.

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

## Data Flow

- The UI still calls the same logical endpoints (`/auth/*`, `/orders`, `/trips`, `/transfers`, `/reports`, etc.).
- In this POC those calls are intercepted by `web/lib/api.ts` and resolved by `web/lib/mockApi.ts` in the browser.
- No live backend or database is required for normal app usage.

---

## Demo State

- Demo data is stored in browser `localStorage`.
- A seeded dataset is loaded on first use and then mutated by the UI flows.
- Use **Reset demo** in the header to restore the original state.

---

## Deployment

This app is a **frontend-only Next.js POC**, so deployment is simple:

- No backend service
- No database
- No required secrets
- No server-side API dependency for normal app usage

The only thing to remember is that demo state lives in browser `localStorage`, so each browser/device gets its **own** copy of the data.

### Vercel

Use Vercel if you want the least-friction Next.js deployment.

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Set the **Root Directory** to `web`.
4. Keep the detected **Next.js** framework preset.
5. Deploy.

Optional environment variable:

- `NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app`

### Netlify

This repo includes a root `netlify.toml` already configured for the `web/` app.

CLI flow from the repo root:

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy
netlify deploy --prod
```

Netlify is configured to:

- build from `web/`
- run `npm run build`
- use Node `20`

### Recommendation

- Use **Vercel** if the dashboard import works for you.
- Use **Netlify CLI** if Vercel gives you trouble.
- If you later want real multi-user/shared data, add a real backend on purpose instead of stuffing it back into this POC.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| `sh: next: command not found` | Root `yarn install` / `npm install` does not install `web/` by itself unless **`postinstall`** runs. From repo root run **`npm install`** once (runs `npm install --prefix web`), or **`npm run install:web`** / **`yarn install --cwd web`**. |
| Old demo data is weird | Use **Reset demo** in the app header to restore the seeded state. |
| Login fails unexpectedly | Clear local storage for the app or reset the demo state, then retry. |
| UI looks stale after edits | Refresh the browser; Next.js dev mode sometimes needs a full reload. |
| Port 3000 in use | Stop the other process or run dev with another port: `cd web && npx next dev -p 3001`. |

---

## Context (problem statement)

Poor coordination between logistics stakeholders (factories, warehouses, retailers, transport) can cause redundant trips, congestion, and waste. This project is a **small teaching artifact**: shared **orders**, **inventory**, **trips**, and **transfers** so students can discuss data models, roles, and workflows—not a production logistics platform.

---

## See also

- **`web/README.md`** — short notes for working inside the Next.js app directory.
