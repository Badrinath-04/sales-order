# Uniforms Module QA and Production Readiness

Date: 2026-06-08
Environment verified: development database

## Executive Status

The uniforms catalog and stock tables are separate from Books:

- `UniformCategory`
- `UniformSize`
- `UniformStock`

The current app does **not** have separate uniform-only order, transaction, or stock-log tables. It uses shared operational tables:

- `Order`
- `OrderItem`
- `Transaction`
- `InventoryLog`

Uniform and book rows are separated by `itemType`, `uniformSizeId`, and `bookItemId`, but they are not separate physical tables. This is a production-readiness blocker for any requirement that mandates `uniform_orders`, `uniform_transactions`, or `uniform_stock_logs` as independent tables.

## Code Isolation Findings

Pass:

- Uniform stock/catalog APIs use `UniformCategory`, `UniformSize`, and `UniformStock`.
- Uniform stock adjustment writes only `UniformStock`.
- Book stock adjustment writes only `BookStock`.
- Shared UI controls are reused only as generic components.
- Uniform pricing comes from `UniformSize.price`, not Books pricing files.

Needs product/schema decision:

- Order creation is shared for Books and Uniforms by design today.
- Payment and transaction recording is shared by design today.
- Logs are shared by design today through `InventoryLog.itemType`.

Mitigation added:

- Uniform inventory routes now require uniform-specific permissions.
- Order creation/payment now checks item types and requires the matching Books and/or Uniform order permissions.
- A combined Books + Uniform order requires both permissions.

## Uniform Permission Model

The codebase has three enum roles (`SUPER_ADMIN`, `SENIOR_ADMIN`, `ADMIN`) plus granular `User.permissions` JSON. New enum roles were not added because that would be a database migration touching auth semantics across the app.

Uniform permissions added:

- `canViewUniformStock`
- `canAdjustUniformStock`
- `canBulkEditUniformStock`
- `canManageUniformCategories`
- `canViewUniformStockLogs`
- `canCreateUniformOrders`
- `canViewUniformReports`

These map to the requested role presets:

- Uniform Stock Viewer: `canViewUniformStock`
- Uniform Stock Manager: `canViewUniformStock`, `canAdjustUniformStock`, `canBulkEditUniformStock`, `canViewUniformStockLogs`
- Uniform Category Manager: `canViewUniformStock`, `canManageUniformCategories`
- Uniform Order Creator: `canCreateUniformOrders`
- Uniform Reports Viewer: `canViewUniformReports`, `canViewUniformStockLogs`

## Stock Rules

Uniform-only stock protections added:

- Single adjustment rejects zero adjustment amounts in UI.
- Single adjustment blocks negative resulting stock in UI.
- Uniform API rejects negative final stock.
- Uniform API rejects no-op add/deduct operations.
- Bulk edit rejects zero/negative deltas.
- Bulk deduction blocks insufficient stock.

Books stock behavior was not changed.

## Calculation Audit Notes

Uniform-only totals are calculated from selected `UniformSize.price` values.

Combined order totals are assembled from:

- Books total via existing Books selection logic.
- Uniform total via uniform selection logic.
- Grand total = Books + Uniforms.

API-level item permission enforcement prevents a Books-only user from submitting Uniform items and a Uniform-only user from submitting Books items.

## Development Smoke Coverage Completed

Already executed rollback smoke test:

- Tie only
- Belt only
- Tie + Belt
- T-Shirt size 28
- Pant 30 + T-Shirt 26
- Full girls set
- Shorts + Socks S + Belt
- Full boys set

Smoke test verified:

- Expected totals
- Per-branch uniform stock deduction
- Per-size deduction
- Inventory log count
- Rollback so test rows did not persist

## Production Migration Warning

Do not run the current dev seed directly against production without a reviewed plan.

If production must have physically separate uniform order/transaction/log tables, create and test a dedicated migration first:

1. Add new `UniformOrder`, `UniformOrderItem`, `UniformTransaction`, and `UniformStockLog` models.
2. Add service/controller endpoints for uniform-only order creation and payment.
3. Keep existing Books `Order`, `Transaction`, and `InventoryLog` behavior untouched.
4. Test migration on a Neon branch cloned from production.
5. Compare schema diff before deploy.
6. Run production seeding only after migration is accepted.

## Production Seed Plan

Seed order:

1. Uniform categories: T-Shirt, Skirt, Shorts, Pant, Tie, Belt, Socks.
2. Uniform variants:
   - T-Shirt: 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42.
   - Skirt: 15, 16, 17, 18, 20, 22, 24, 26, 28, 30.
   - Shorts: 11, 12, 13, 14, 15, 16, 17.
   - Pant: 28, 30, 32, 34, 36, 38, 40, 42.
   - Socks: Small, Medium, Large.
   - Tie: One Size.
   - Belt: One Size.
3. Branch stock:
   - Darga: handwritten register values, with zero values topped up as directed.
   - Shaikpet: 50 per variant.
   - Narsingi: 50 per variant.
4. Placeholder prices.
5. Uniform permissions/presets.
6. Post-seed verification query.

## Remaining QA Before Sign-Off

Required before production sign-off:

- Browser test for all permission presets.
- API auth tests for unauthenticated `401`.
- API auth tests for Books-only token against uniform endpoints.
- UI stock tests for add, deduct, override, bulk edit, and log drawer.
- Combined Books + Uniform browser checkout tests.
- Payment split tests.
- Date/category/student/branch log filter tests.

Current sign-off status: **not production ready until the shared order/transaction/log table decision is resolved and browser/API QA is completed.**
