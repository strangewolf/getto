# Smart Login Portal — Next.js app (`web/`)

This folder is the **full application**: React UI (App Router) and **API Route Handlers** under `app/api/`. Database access uses **Prisma** + **SQLite**.

> **Full project documentation** (setup, env vars, API overview, roles, troubleshooting) is in the **[repository root `README.md`](../README.md)**.

---

## Working in this directory

```bash
cd web
npm install
cp ../env-example .env          # or copy .env.example → .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

App URL: **http://localhost:3000**

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply migrations (`prisma migrate dev`) |
| `npm run db:seed` | Reset and seed demo data |
| `npm run db:push` | Push schema without a migration (quick experiments only) |
| `npx prisma studio` | GUI for SQLite |
| `npx prisma generate` | Regenerate Prisma Client after schema changes |

---

## Key paths

| Path | Role |
|------|------|
| `app/(ops)/` | Logged-in pages (dashboard, orders, trips, …) |
| `app/api/` | REST-style JSON API (`/api/...`) |
| `app/login/` | Sign-in page |
| `context/AuthContext.tsx` | Client auth state + token |
| `lib/api.ts` | `fetch` helper (prefixes `/api`) |
| `lib/prisma.ts` | Shared `PrismaClient` instance |
| `lib/auth.ts` | Password hashing + JWT |
| `lib/server/` | Route helpers, serializers, domain logic |
| `prisma/schema.prisma` | Data model |
| `prisma/seed.ts` | Demo data |

---

## Next.js resources

- [Next.js documentation](https://nextjs.org/docs)
- [Prisma + Next.js](https://www.prisma.io/docs/guides/nextjs)
