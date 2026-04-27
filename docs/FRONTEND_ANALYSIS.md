# Campus 360 Books — Frontend analysis

**Project:** `campus-360-books` (School ERP — **Books module**, standalone SPA)  
**Scope:** Complete front-end inventory: structure, routes, roles, stock behaviour, mock data shapes, UI affordances, tech stack, gaps (multi-branch), and backend follow-ups.  
**Generated:** April 2026 (from repository state at analysis time).

---

## 1. Product context

- This repo is a **separate books / school-kit application** (first slice of a broader school ERP).
- **No backend integration** today: `src/services/index.js` exports an empty object; all lists, KPIs, charts, and transactions are **static mock data** in feature `data.js` files and `buildDetail.js`.
- **UI is feature-complete** for demo flows: authentication shell (static demo users), dual shells (school admin vs super admin), inventory (books / uniforms / accessories), order creation → configure → payment → receipt, transactions list + detail, super-admin dashboard / sales overview / reports, and admin placeholders for reports/sales.

---

## 2. Front-end tech stack (complete)

| Layer | Technology | Version (from `package.json`) | Notes |
|--------|------------|-------------------------------|--------|
| Runtime | **JavaScript (ES modules)** | `"type": "module"` | No TypeScript in source; `@types/react*` present for editor/IDE only |
| UI library | **React** | ^19.2.5 | Concurrent features; function components |
| DOM | **react-dom** | ^19.2.5 | `createRoot` in `main.jsx` |
| Routing | **react-router-dom** | ^7.14.2 | `BrowserRouter`, nested `Route` trees, `Navigate`, `Outlet` |
| Build | **Vite** | ^8.0.9 | `@vitejs/plugin-react` ^6.0.1 |
| CSS — utility | **Tailwind CSS** | ^3.4.19 | `tailwind.config.cjs`, Material-style colour tokens |
| CSS — plugins | **@tailwindcss/forms**, **@tailwindcss/container-queries** | ^0.5.11, ^0.1.1 | Registered in Tailwind config |
| CSS — component | **Sass (scss)** | ^1.99.0 | Auth, layouts, several features |
| PostCSS | **postcss**, **autoprefixer** | ^8.5.10, ^10.5.0 | Standard Vite pipeline |
| Lint | **ESLint** | ^9.39.4 | Flat config `eslint.config.js`, React Hooks + Refresh plugins |
| Path alias | **`@` → `src`** | `vite.config.js` + `jsconfig.json` | Imports like `@/features/...` |
| Fonts (CDN) | **Google Fonts** — Manrope, Inter | `index.html` | Headline + body |
| Icons (CDN) | **Material Symbols Outlined** | `index.html` | `<span class="material-symbols-outlined">` pattern |

**Not used in dependencies:** Redux, Zustand, TanStack Query, Axios, UI kit (MUI/Chakra), charting library (charts are CSS/SVG/markup in components). State is **React `useState` / `useMemo` / context** only.

---

## 3. Application architecture

### 3.1 Entry and global styles

- **`index.html`** — root `#root`, fonts, favicon.
- **`src/main.jsx`** — mounts `<App />`, imports `./styles/tailwind.css` and `./styles/main.scss`.
- **`src/styles/tailwind.css`** — Tailwind directives.
- **`src/styles/main.scss`** — global SCSS; pulls `_variables.scss`.
- **`src/styles/_variables.scss`** — shared SCSS tokens (used by auth and legacy SCSS modules).

### 3.2 App shell

- **`src/App.jsx`** — `AdminSessionProvider` wraps `BrowserRouter` and `Routes`:
  - Public: `/`, `/login`, role-based shortcuts (`/dashboard`, `/inventory`, …).
  - **MainLayout** wraps `adminShellRouteTree` + `superAdminShellRouteTree`.
  - Catch-all `*` → `RootHomeRedirect` (login if no session, else role home).

### 3.3 Session and roles

- **`src/config/navigation.js`** — `ROLES.ADMIN` (`admin`), `ROLES.SUPER_ADMIN` (`super_admin`).
- **`src/config/demoCredentials.js`** — static accounts: `school_admin` / `admin123`, `super_admin` / `super123`.
- **`src/context/AdminSessionProviderRoot.jsx`** — `role` (`null` | admin | super_admin), `login()`, `logout()`; persists role in **`localStorage` key `skm_role`**.
- **`src/context/adminSessionContext.js`**, **`useAdminSession.js`**, **`AdminSessionProvider/index.jsx`** — context wiring.

### 3.4 Routing and guards

| File | Responsibility |
|------|----------------|
| `routing/AdminRoutes.jsx` | `/admin/*` tree + `AdminShellGuard` |
| `routing/SuperAdminRoutes.jsx` | `/super/*` tree + `SuperAdminShellGuard` |
| `routing/ShellGuards.jsx` | Unauthenticated → `/login`; wrong role → other shell’s dashboard |
| `routing/NavigateByRole.jsx` | `RootHomeRedirect`, `NavigateByRole` for legacy shortcuts |
| `routing/LegacyTransactionRedirect.jsx` | `/transactions/:id` → admin or super transaction detail path |

### 3.5 Layouts

- **`layouts/AuthLayout.jsx`** — centred card for login.
- **`layouts/MainLayout.jsx`** — chooses **AdminSidebar** vs **SuperAdminSidebar** from `pathname.startsWith('/super')`; **Topbar** hidden on inventory, order wizard, transaction detail paths; `<Outlet />` for page content.

### 3.6 Hooks

- **`hooks/useShellPaths.js`** — role-aware path map (dashboard, stock/inventory, sales, reports, settings, transactions, order steps).
- **`hooks/index.js`** — barrel (minimal).

---

## 4. Route map (local URLs)

Assume dev server **`http://localhost:5173`** (Vite default).

### 4.1 Auth

| Path | Screen |
|------|--------|
| `/login` | Demo login (username + password) |

### 4.2 School admin (`role === admin`)

| Path | Feature |
|------|---------|
| `/admin` | Redirect → `/admin/dashboard` |
| `/admin/dashboard` | Admin dashboard |
| `/admin/inventory` | Stock management (same `Inventory` module as super; **read-only stock edits** where enforced) |
| `/admin/orders`, `/admin/orders/new` | New order wizard entry |
| `/admin/orders/configure` | Order configuration |
| `/admin/orders/payment` | Payment |
| `/admin/transactions` | Transactions list |
| `/admin/transactions/:id` | Transaction detail |
| `/admin/settings` | Settings |
| `/admin/reports` | **Placeholder** (“Reports”) |
| `/admin/sales` | **Placeholder** (“Sales”) |

### 4.3 Super admin (`role === super_admin`)

| Path | Feature |
|------|---------|
| `/super` | Redirect → `/super/dashboard` |
| `/super/dashboard` | Super admin dashboard (multi-campus KPIs, schools table, chart) |
| `/super/stock` | Same **Inventory** module; **can manage** uniform size stock + book kit lines where UI allows |
| `/super/sales` | Sales overview (global vs campus views) |
| `/super/sales/orders/new` | New order (shared wizard) |
| `/super/sales/orders/configure` | Configure |
| `/super/sales/orders/payment` | Payment |
| `/super/reports` | Financial overview + branch-style widgets (mock) |
| `/super/transactions`, `/super/transactions/:id` | Transactions |

### 4.4 Role-agnostic shortcuts (`App.jsx`)

Paths like `/dashboard`, `/inventory`, `/orders`, `/transactions`, `/reports`, `/sales` use **`NavigateByRole`** to send the user to the correct `/admin/...` or `/super/...` URL.

---

## 5. Stock management and roles (detailed)

The **same** `Inventory` feature (`features/inventory`) is mounted at:

- **`/admin/inventory`** (school admin)
- **`/super/stock`** (super admin)

### 5.1 Tabs and structure (`features/inventory/index.jsx`)

- **Header:** title “Stock Management”, **Tabs** (books / uniforms / accessories), search input (no logic), notification + help **icon buttons** (no handlers), avatar image.
- **KPI strip:** `KPISection` — driven by `data.js` (`booksKpiRow` / mirrored stats).
- **Panels:** `BooksView` | `UniformsView` | `AccessoriesView`.

### 5.2 Books tab

- **`BooksView`** — `ClassGrid` (class list from `classList`: `id`, `label`, optional `showEdit`) + **`KitDetails`** for selected class.
- **`KitDetails`** (`kitDetails` / `kitDetailsByClass` in `data.js`):
  - **Fields per line:** `id`, `label`, `icon`, **stock** (number), **price** (number).
  - **Super admin only:** **Edit** toggle button enables inputs; **Update Stock** saves locally (closes edit mode). Inputs are **read-only / disabled** for school admin.
  - **Fixed FAB** “add” — **no `onClick`** (visual only).

### 5.3 Uniforms tab

- **`UniformsView`** — `canManageStock = (role === SUPER_ADMIN)` from session.
- **`UniformCategory`** — categories: `id`, `label`, `icon`, `selected`; click selects category.
- **`SizeInventory`** — rows from `sizeInventory`: `id`, `code`, `name`, `stock`, `stockLabel`, `priceLabel`, `tone` (`normal`|`low`), optional `alertLabel`, `action` (`type`, `label`, `icon`).
  - **School admin:** quick-action buttons **disabled**; tooltip title: “Only super admins can update uniform stock”.
  - **Super admin:** click **Add Stock / Restock** → inline edit → **Save** persists to component `useState` only (no API).
  - **Export CSV** / **History** — buttons **present, no handlers**.
- **FAB** inventory icon — **no handler**.

### 5.4 Accessories tab

- **`AccessoriesView`** — static **`accessoriesOverview`**: `title`, `description`, `groups[]` with `id`, `label`, `countLabel`, `icon`. **Read-only** cards.

### 5.5 Summary: stock vs roles

| Capability | School admin | Super admin |
|------------|--------------|-------------|
| View books kit lines + stock/price | Yes (read-only inputs) | Yes + edit mode + “Update Stock” (local state) |
| View uniform sizes + stock | Yes | Yes |
| Change uniform size stock | **No** (disabled) | **Yes** (inline edit + save in UI) |
| Accessories detail | View-only | View-only |
| Persistence / central stock | **None** (all client mock) | **None** |

---

## 6. Transactions (current vs desired multi-branch)

### 6.1 Implemented (UI only)

- **List** (`features/transactions/index.jsx`): KPIs from `transactionsKpis` (`revenueToday`, `ordersToday`); **`FiltersBar`**; **`TransactionsTable`** with `transactionsRows`; **`TrendInsightCard`**.
- **Row shape** (`data.js`): `id`, `orderId`, `orderedLine`, `date`, `studentName`, `initials`, `initialsClass`, `classLabel`, `kitType`, `amount`, `status`.
- **Detail** (`detail/index.jsx` + `buildDetail.js`): merges navigation **location state** with defaults for `orderId`, `status`, `orderedLine`, `studentName`, `studentId`, `classLabel`; sections: student info, order lines, financial summary, timeline.
- **No `branchId` / `campusId`** on rows today — **single-tenant mock**.

### 6.2 Desired (your product note — not implemented)

- **Central / main warehouse** receives bulk stock; **split allocations** to **three branches**.
- **Branch admin:** sees **only** that branch’s stock and transactions.
- **Super admin:** **aggregate + per-branch** breakdown for stock and transactions.

This implies future models such as: `Branch`, `StockLocation`, `StockLedger`, `Allocation`, `Order.branchId`, RBAC scope — see **Section 10**.

---

## 7. Orders flow (shared between shells)

| Step | Route (admin) | Route (super) | Main UI |
|------|-----------------|----------------|---------|
| Class / section / student selection | `/admin/orders/new` | `/super/sales/orders/new` | `features/orders/new-order` — classes (`classes`), sections (`sections`), students (`students` with `books`, `uniform`, `payment`, etc.), filters (`filterTabs`), distribution table, proceed |
| Configure kit | `/admin/orders/configure` | `/super/sales/orders/configure` | `features/orders/config` — student profile, uniform config, academic kit, order summary |
| Payment | `/admin/orders/payment` | `/super/sales/orders/payment` | `features/orders/payment` — methods, summary, success modal, receipt options |
| Receipt | (embedded / navigable from payment flow) | Same | `features/orders/receipt/Receipt.jsx` |

Data helpers: `orderDetails.js`, `payment/data.js`, `config/data.js` — fees, line items, **static** amounts.

---

## 8. Super-admin–only surfaces

- **`features/super-admin/dashboard`** — KPI cards, activity feed, schools table, bar list, hero chart (static arrays in `index.jsx`).
- **`features/super-admin/sales-overview`** — global vs campus toggle, chart, insights, sales table (`data.js`).
- **`features/super-admin/reports`** — finance summary, branch performance, sales trend, branch revenue comparison, transactions table; header buttons: **month**, **“All Branches”**, **Generate Report** (mostly non-functional / demo).

Admin **Reports** and **Sales** routes render **`AdminModulePlaceholder`** only.

---

## 9. Admin dashboard and settings

- **`features/admin/dashboard`** — header, CTA **“+ New Order”** → `/admin/orders/new`, KPI section, recent transactions list, inventory snapshot cards.
- **`features/admin/settings`** — settings UI (forms/sections as built in file; no API).

---

## 10. Shared components (`src/components`)

| Area | Files | Role |
|------|-------|------|
| Chrome | `AdminSidebar.jsx`, `SuperAdminSidebar.jsx`, `Topbar/index.jsx` | Nav + search placeholder + notification/account icons |
| Placeholder | `AdminModulePlaceholder.jsx` | Empty module message |
| UI kit | `components/ui/*` | Reusable `Button`, `Input`, `Table`, `KPICard`, `Dropdown`, filters, etc. — used across features |

---

## 11. Folder structure (authoritative list)

Root config: `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.cjs`, `jsconfig.json`, `index.html`.

**`src/`**

- `App.jsx`, `main.jsx`
- **`auth/`** — `index.jsx` (login), `styles.scss`
- **`components/`** — sidebars, topbar, `ui/*`, `AdminModulePlaceholder.jsx`
- **`config/`** — `navigation.js`, `demoCredentials.js`
- **`context/`** — session provider, context, `useAdminSession`
- **`dashboard/`**, **`orders/`**, **`students/`** — **legacy / unused by `App.jsx` router** (no imports found from main app tree); treat as dead or future removal candidates.
- **`features/`** — primary product code (`admin`, `inventory`, `orders`, `sales`, `super-admin`, `transactions`)
- **`hooks/`** — `useShellPaths.js`, `index.js`
- **`layouts/`** — `AuthLayout`, `MainLayout` + SCSS
- **`routing/`** — admin/super route trees, guards, redirects
- **`services/`** — empty export (API layer stub)
- **`styles/`** — global SCSS + Tailwind entry

---

## 12. Mock data inventory (high level)

| File | Key exports / shapes |
|------|----------------------|
| `features/inventory/data.js` | `booksKpiRow`, `classList`, `kitDetailsByClass` / `kitDetails`, `uniformCategories`, `sizeInventory`, `accessoriesOverview` |
| `features/transactions/data.js` | `transactionsKpis`, `transactionsRows[]` |
| `features/transactions/detail/buildDetail.js` | `buildTransactionDetail(id, state)` |
| `features/orders/new-order/data.js` | `classes`, `sections`, `rosterDefaults`, `students`, `filterTabs` |
| `features/orders/payment/data.js`, `orderDetails.js` | Payment presentation |
| `features/orders/config/data.js` | Configuration mock lines |
| `features/sales/dashboard/data.js` | Sales dashboard mock |
| `features/super-admin/sales-overview/data.js` | Campus / global sales mock |

---

## 13. Backend work suggested (later, aligned to this UI)

When you add a real API, typical domains:

1. **Auth** — JWT/session, role claims, branch scope; replace `demoCredentials` + `skm_role`.
2. **Users & RBAC** — admin vs super admin; branch-scoped admin.
3. **Branches / locations** — main depot + N branches; optional hierarchy.
4. **Catalog** — classes, kits, uniform SKUs, accessories; pricing per campus/branch if needed.
5. **Inventory** — on-hand per location, reservations, low-stock rules; **allocation** from main → branches; audit log (“History” button).
6. **Orders** — cart/configuration, payment intent, idempotency, receipt generation.
7. **Transactions** — list/filter/sort server-side; detail aggregates; **branchId** filter for admins.
8. **Reporting** — aggregates per branch + org-wide; export CSV/PDF for “Generate Report”.
9. **Observability** — correlation IDs, error boundaries in UI for API failures.

---

## 14. Multi-branch feature gap (explicit checklist for implementers)

Front-end work items when backend exists:

- [ ] Add **branch context** to session (selected branch for super; fixed branch for admin).
- [ ] Stock screens: **tabs or selectors** — “All branches” vs “Branch A/B/C”; main **hub** view for inbound bulk.
- [ ] **Allocation UI** — workflow: receive at main → split quantities → confirm (with validation ≤ available).
- [ ] Transactions list/detail: **branch column + filter**; super admin **rollup** component.
- [ ] Align **`useShellPaths`** and guards with any new `/branch/:id/...` pattern if introduced.
- [ ] Replace mock `data.js` with API hooks (keep types documented).

---

## 15. Master prompt — full repo re-analysis (for AI or audits)

Copy and adapt the block below when you want a **fresh, file-by-file** pass after code changes:

```text
You are analyzing the repository at [PATH] — a React + Vite “Campus 360 Books” school ERP books module SPA.

Goals:
1. List the complete folder tree (excluding node_modules, dist, build).
2. For every .jsx/.js source file under src/, summarize in one line: purpose, key imports, and whether it is routed from App.jsx or orphaned.
3. For each feature module (inventory, orders, transactions, admin, super-admin, sales), list:
   - User-visible fields (form labels, table columns, KPI labels).
   - Buttons and links: label, approximate component path, and whether onClick/navigate calls are implemented or stubbed.
4. Document routing: all Route paths from App.jsx, AdminRoutes.jsx, SuperAdminRoutes.jsx; describe ShellGuards and NavigateByRole behaviour.
5. Document auth: demo credentials file, localStorage keys, session context API (login/logout/role).
6. Document stock management: which components enforce super-admin-only edit (UniformsView/SizeInventory, KitDetails); what remains read-only for admin.
7. Note any placeholder routes or dead folders (e.g. src/dashboard not imported).
8. Extract the full dependency tech stack from package.json and build tooling configs (vite, tailwind, eslint, postcss).
9. Compare the implemented data model (mock JSON shapes) to a desired multi-branch ERP: list missing entities (Branch, StockLocation, Allocation, branch-scoped Transaction) and UI gaps.
10. Output a concise “backend API checklist” that mirrors current screens.

Be explicit when behaviour is client-only mock state vs persisted API.
```

---

## 16. Revision history

| Date | Note |
|------|------|
| 2026-04 | Initial document from static codebase review |
