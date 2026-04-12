# Smart Login Portal — Next.js app (`web/`)

This folder is the **full application**. For the current POC, the UI runs against a browser-side mock data layer, so you do **not** need a backend or database to use it.

> **Full project documentation** (setup, env vars, API overview, roles, troubleshooting) is in the **[repository root `README.md`](../README.md)**.

---

## Working in this directory

```bash
cd web
npm install
cp ../env-example .env          # or copy .env.example → .env
npm run dev
```

App URL: **http://localhost:3000**

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | ESLint |
| `Reset demo` in the UI | Restore the seeded browser-side mock data |

---

## Key paths

| Path | Role |
|------|------|
| `app/(ops)/` | Logged-in pages (dashboard, orders, trips, …) |
| `app/login/` | Sign-in page |
| `context/AuthContext.tsx` | Client auth state + token |
| `lib/api.ts` | Client request helper that routes calls into the mock layer |
| `lib/mockApi.ts` | Browser-persisted demo data and mock endpoint handlers |

---

## Mira-Bhayandar seed data

The current POC dataset is intentionally restricted to **Mira-Bhayandar, Mumbai**.
All seeded warehouses, retailers, trips, and transfers now stay inside these four local regions:

| Region | Seed use | Coordinates |
|------|------|------|
| `Mira Road East` | Primary distribution hub | `19.285504, 72.869271` |
| `Mira Road West` | Transit hub | `19.2815564, 72.8578612` |
| `Bhayandar East` | Fulfillment hub | `19.305601, 72.859375` |
| `Bhayandar West` | Cross-dock hub | `19.3114478, 72.8526514` |

If older browser data is still cached, use **Reset demo** in the UI to restore the new local seed.

---

## Next.js resources

- [Next.js documentation](https://nextjs.org/docs)
