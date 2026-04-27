---
name: Project Architecture
description: Full-stack implementation details — Express backend + Prisma + Neon PG + React SCSS/Tailwind frontend. All screens wired to real API.
type: project
---

Full-stack school kit management system.

**Backend** (`/backend/src`):
- Express + Helmet + CORS + Morgan + express-rate-limit
- Zod validation middleware (`src/middleware/validate.js`) — validates body/params/query on routes
- JWT auth + refresh tokens (`auth.controller.js`)
- Auth middleware: `authenticate`, `requireRole`, `requireSuperAdmin`, `enforceBranchScope`
- Modules: auth, branches, inventory, orders, stock-transfers, transactions, reports
- In-memory cache (`services/cache.js`) with TTL tiers (KPI, MEDIUM, LONG)
- Response utils: `ok/created/badRequest/unauthorized/forbidden/notFound/serverError`
- Prisma + Neon PG (`services/prisma.js`), connection pooler URL in `.env`

**Frontend** (`/src`):
- React + React Router + SCSS + Tailwind utility classes
- Auth: `AdminSessionProviderRoot` calls real API (`authApi.login/logout`), stores JWT in localStorage
- API service: `src/services/api.js` — all endpoints defined
- Hooks: `useApi(apiFn, params, deps)` and `useMutation(apiFn)` in `src/hooks/useApi.js`
- RBAC routing: `ShellGuards.jsx` — AdminShellGuard / SuperAdminShellGuard redirect to /login if unauthenticated
- All dashboards, inventory, transactions, orders, reports → wired to real API (no mock data)

**DB Seed** (`/backend/prisma/seed.js`):
- Users: `super_admin / super123` (SUPER_ADMIN), `school_admin / admin123` (ADMIN, Campus A)
- Branches: Main Warehouse (MAIN), Campus A/B/C (BRANCH)
- 12 grades × 4 sections × 3 campuses = 144 academic classes
- Book kits for grades 1-12 at Campus A, uniform categories (shirt/pant/socks), accessories (bags/tech/sports)

**API Base URL**: `http://localhost:4000/api` | Backend port: 4000 | Frontend port: 5173

**Why:** enforceBranchScope middleware auto-injects branchId for ADMIN role so they only see their branch data.
**How to apply:** When building features, ADMIN always gets branch-scoped data automatically. SUPER_ADMIN sees all.
