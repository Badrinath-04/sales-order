# Multi-Student Transaction & Complete Purchase History — Design Spec

**Date:** 2026-06-15  
**Status:** Approved  
**Scope:** Two features — (1) multi-student single combined transaction, (2) complete per-student purchase history

---

## Background

**Feature 1 — Multi-Student Transaction:** Parents with multiple children currently must wait through separate order flows per child, even when paying one consolidated amount. This creates reconciliation confusion and slows staff during peak admission periods.

**Feature 2 — Student Purchase History:** Students purchase items across multiple visits. The roster view currently shows only the latest order, making it impossible to quickly verify what a student has already received without digging through full transaction history.

---

## Constraints & Invariants

- The single-student order flow must work identically to today — zero regression.
- The `Add Student` button must not appear in due-settlement mode.
- Stock deductions must always be individual per student per item with separate `InventoryLog` entries — never combined.
- Multi-student grouping is database-level only. No workarounds using notes fields or concatenated names.
- All students in a combined transaction must belong to the same branch (branch is locked after the first student is selected).
- If group order creation fails, full rollback — no partial state, no orphaned stock deductions. Staff fall back to placing orders one at a time.

---

## 1. Database Schema Changes

### 1.1 New model: `TransactionGroup`

```prisma
model TransactionGroup {
  id           String   @id @default(cuid())
  groupRef     String   @unique   // human-readable: #GRP-2026-XXXX
  branchId     String
  branch       Branch   @relation("BranchTransactionGroups", fields: [branchId], references: [id])
  createdById  String
  createdBy    User     @relation("TransactionGroupCreatedBy", fields: [createdById], references: [id])
  totalAmount  Decimal  @db.Decimal(10, 2)
  splitDetails Json?    // [{paymentMethod: "CASH", amount: 2500}, {paymentMethod: "ONLINE", amount: 1000}]
  paidAt       DateTime @default(now())
  createdAt    DateTime @default(now())

  orders Order[]

  @@index([branchId])
  @@index([createdAt])
}
```

### 1.2 Updated model: `Order`

Add one nullable field:

```prisma
transactionGroupId String?
transactionGroup   TransactionGroup? @relation(fields: [transactionGroupId], references: [id])
```

All existing orders have `transactionGroupId = null`. Combined orders share a `transactionGroupId`. Individual order records remain fully independent — the group is payment linkage only.

### 1.3 Updated model: `User`

Add back-relation:

```prisma
transactionGroups TransactionGroup[] @relation("TransactionGroupCreatedBy")
```

### 1.4 Updated model: `Branch`

Add back-relation:

```prisma
transactionGroups TransactionGroup[] @relation("BranchTransactionGroups")
```

---

## 2. Backend API

### 2.1 New: `POST /orders/group`

Creates all orders + `TransactionGroup` atomically inside a single `prisma.$transaction` with `maxWait: 15_000, timeout: 60_000`.

**Request body:**
```json
{
  "branchId": "...",
  "students": [
    {
      "studentId": "...",
      "items": [{ "itemType": "BOOK", "itemId": "...", "label": "...", "quantity": 1, "unitPrice": 500 }],
      "notes": "optional",
      "discountAmount": 0,
      "totalAmount": 1500
    },
    {
      "studentId": "...",
      "items": [...],
      "totalAmount": 2000
    }
  ],
  "payment": {
    "splitDetails": [
      { "paymentMethod": "CASH", "amount": 2500 },
      { "paymentMethod": "ONLINE", "amount": 1000 }
    ]
  }
}
```

**What runs atomically:**
1. Validate `branchId` is active (same `OPERATIONAL_BRANCH_FILTER` as single-order create).
2. For each student: validate student exists, grade is in supported range, run duplicate-order check.
3. For each student: create `Order` + `OrderItem` records (same logic as existing `create`).
4. For each student: call `applyOrderStockDeductions` — individual `InventoryLog` entry per item per student. Never combined.
5. Allocate split payment sequentially across orders: fill first payment method first (Student 1 fully, then Student 2 from remainder, switching to second method when first is exhausted). Create `Transaction` records per order per allocated payment method.
6. Mark each `Order` as `COMPLETED` / `PAID` with correct `paidAmount`, `paymentMethod`, `paidAt`.
7. Create `TransactionGroup` record with `totalAmount = sum of all order totals`, `splitDetails = payment.splitDetails`.

**Response (success):**
```json
{
  "groupId": "...",
  "groupRef": "#GRP-2026-1234",
  "orders": [{ ...full order with items... }, ...],
  "stockWarnings": ["Stock for X is now at 0..."]
}
```

**On failure:** Full rollback. Response includes a clear message: `"Group order failed. Please place each student's order individually."`

**Validation errors:**
- `students` array must have 2–10 entries.
- All students must belong to `branchId`.
- `payment.splitDetails` amounts must sum to the grand total of all student `totalAmount` fields (within ±₹1 rounding tolerance).
- Duplicate student IDs in the same group are rejected.

**Auth:** Same permission checks as single-order create — `canPlaceOrders` for BOOK items, `canCreateUniformOrders` for UNIFORM items, checked per student.

---

### 2.2 New: `GET /orders/group/:groupId`

Returns `TransactionGroup` with all linked orders, each with full detail identical to `orders.getOne` includes (student + class, branch, createdBy, items with bookItem/uniformSize/accessory detail, transactions).

**Auth:** Branch guard — non-SUPER_ADMIN users can only access groups belonging to their branch.

---

### 2.3 Updated: `GET /transactions` (list)

Group rows are collapsed to one row per `transactionGroupId`. Behaviour:

- For non-grouped transactions: same as today, one row per `Transaction`.
- For grouped transactions: one row representing the group, aggregated from linked orders' transactions.
- Group row response shape adds: `isGroup: true`, `groupId`, `groupRef`, `studentCount: N`, `studentNames: ["Arjun Kumar", "Priya Sharma"]`, `amount: groupTotalAmount`.

Implementation approach: query `Transaction` records as today, then in the controller group by `order.transactionGroupId` for post-processing, de-duplicating group rows client-side in the response mapper.

---

### 2.4 Updated: `GET /transactions/kpis`

- `ordersToday`: changes from `transaction.count()` to `COUNT(DISTINCT orderId)` — semantically correct (counts orders not payment events) and handles multi-transaction orders correctly.
- `uniqueStudents`: no change needed — already counts distinct `studentId` via order relation.
- `cashReceived` / `onlineReceived`: no change — proportional `Transaction` records per payment method keep these accurate.
- `revenueToday`: no change — sums `Transaction.amount`, which correctly totals to group amount.

---

### 2.5 New: `GET /students/:studentId/orders`

Returns all orders for a student in descending `createdAt` order.

**Includes:** full `OrderItem` detail (bookItem, uniformSize, accessory), `transactions`, `branch`.

**Auth:** Branch guard for non-SUPER_ADMIN. Student must belong to the requesting user's branch.

**Response:** Array of orders, same shape as `orders.getOne`, ordered `createdAt DESC`.

---

### 2.6 Updated: Students roster query

The endpoint powering `branchesApi.getClasses` → students list adds cumulative computed fields per student, derived from all their orders (not just `orders[0]`):

- `cumulativeBookStatus`: `TAKEN` if any order has `bookStatus = TAKEN`; `PARTIAL` if any has `PARTIAL` and none `TAKEN`; `NOT_TAKEN` otherwise.
- `cumulativeUniformStatus`: `COMPLETE` if any order has `uniformStatus = COMPLETE`; `PENDING` otherwise.
- `cumulativePaymentStatus`: `PAID` if all orders are `PAID`; `PARTIAL` if any are `PARTIAL` or mix of `PAID`+`UNPAID`; `UNPAID` if none paid.
- `allRemarks`: array of all non-empty `notes` strings from all orders, most recent first.
- `orderCount`: total number of non-cancelled orders for the student.

The existing `latestOrderId`, `latestOrderInternalId`, `latestOrderDate`, `latestOrderRemarks`, `latestPaymentMethod` fields are kept for backward compatibility.

---

## 3. Frontend — Multi-Student Order Flow

### 3.1 Multi-student route state shape

Passed through `location.state` as `multiStudentOrder`:

```js
{
  branchId: string,
  completedStudents: Array<{
    student: { id, name, roll, guardian, parentPhone },
    selectedClass: { id, name, grade },
    selectedSection: { id, name, section },
    orderItems: Array<OrderItem>,
    totals: { total: number },
    notes: string,
    discountAmount: number,
  }>
}
```

### 3.2 `config/index.jsx` changes

**"Add Student" button:**
- Rendered in the order summary area when at least one item is selected.
- Hidden in due-settlement mode (`isDueSettlement = true`).
- On click: saves current student's complete config into `multiStudentOrder.completedStudents`, navigates to `paths.ordersNew` with `{ state: { multiStudentOrder, returnFromMultiStudent: true } }`.

**Collapsed `StudentSummaryCard` components:**
- Rendered above the current student's config, one per `completedStudents` entry.
- Shows: student name, class label, subtotal, expand chevron, remove (✕) button.
- Expanding reveals a full editable copy of that student's item config (same `AcademicKit`, `NotebooksSection`, `UniformConfig` sub-components, initialized from saved state).
- Changes to an expanded card update the corresponding entry in `completedStudents` in route state.
- Remove button deletes the entry; if all completed students are removed, `multiStudentOrder` is cleared.

**Combined total bar:**
- Fixed at bottom of screen when `completedStudents.length >= 1` (i.e., ≥ 2 students total including current).
- Shows each student's name + subtotal, then grand total.
- "Confirm & Pay" button navigates to `paths.ordersPayment` with all students' data + `multiStudentOrder`.

### 3.3 `new-order/index.jsx` changes

- Detects `returnFromMultiStudent: true` and `multiStudentOrder` in `location.state`.
- When present: shows banner "Adding Student [N] — [BranchName] branch locked", branch selector hidden/disabled.
- After student is selected and "Continue" tapped: navigates to `paths.ordersConfigure` carrying both the new student data and the full `multiStudentOrder` state.

### 3.4 `payment/index.jsx` changes

- Detects `multiStudentOrder` with `completedStudents.length >= 1` (meaning ≥ 2 total students).
- **Multi-student order summary:** Each student shown as a section — name, class, items list, subtotal. Grand total at bottom.
- Payment method + split UI unchanged — applies to grand total.
- **On submit:** calls `ordersApi.createGroup(payload)` → `POST /orders/group`. Does not call `ordersApi.create` or `ordersApi.processPayment`.
- **Success modal:** "Group Order Confirmed" — lists all order IDs (#SKM-...). "New Order" button and "View Receipt" work as today.
- **On failure:** toast — "Group order failed. Please place each student's order separately." No navigation, staff can retry or go back.

### 3.5 `src/services/api.js` changes

Add to `ordersApi`:
```js
createGroup: (data) => api.post('/orders/group', data),
getGroup: (groupId) => api.get(`/orders/group/${groupId}`),
getStudentOrders: (studentId) => api.get(`/students/${studentId}/orders`),
```

Add to `transactionsApi`:
```js
getGroup: (groupId) => api.get(`/orders/group/${encodeURIComponent(groupId)}`),
```

Note: `transactionsApi.getGroup` and `ordersApi.getGroup` hit the same endpoint — the alias in `transactionsApi` keeps the detail view's fetch consistent with the existing `transactionsApi.getOne` pattern.

---

## 4. Frontend — Transaction History Changes

### 4.1 `mapTransactionToRow` in `transactions/index.jsx`

When `tx.isGroup === true`:
- `studentName`: all student names joined — `"Arjun Kumar, Priya Sharma"`
- `initials`: first student's initials
- `classLabel`: `"${studentCount} students"`
- `amount`: group total amount
- `orderPk`: `groupId` (used for navigation)
- `orderId`: `groupRef` (displayed as order ID)
- Adds `isGroup: true`, `studentCount` to the row shape for visual badge in `TransactionRow`.

### 4.2 `TransactionRow.jsx`

When `row.isGroup`:
- Renders a small "N students" pill badge next to the student name.
- Navigation on click: `paths.transactionDetail(row.groupId)` with `{ state: { isGroup: true } }`.

### 4.3 `detail/index.jsx`

- Reads `location.state?.isGroup` or detects from the fetched data whether it's a group.
- If group: calls `transactionsApi.getGroup(id)` → `GET /orders/group/:groupId`.
- Renders group detail layout:
  - **Header card:** Group ref, date, grand total, split payment breakdown (Cash ₹X + Online ₹Y), staff name.
  - **Per-student order cards:** For each order in the group, renders the existing `StudentInfo`, `OrderSummary`, `FinancialSummary` components in sequence — reused, not duplicated.
- If single order (today's behaviour): unchanged.

### 4.4 `buildDetail.js`

Add `buildGroupTransactionDetail(groupData)` function alongside existing `buildTransactionDetailFromOrder`. Maps the group API response to the shape the detail components expect.

---

## 5. Frontend — Student Purchase History

### 5.1 `mapStudent` in `new-order/index.jsx`

Switch from latest-order fields to cumulative fields:

```js
books:   s.cumulativeBookStatus    → 'Taken' | 'Partial' | 'Not Taken'
uniform: s.cumulativeUniformStatus → 'Complete' | 'Pending'
payment: s.cumulativePaymentStatus → 'Paid' | 'Partial' | 'Unpaid'
remarks: s.allRemarks              // string[] — all remarks, most recent first
orderCount: s.orderCount           // number
```

Existing `latestOrderId`, `latestOrderInternalId` etc. kept for due-settlement and reorder flows.

### 5.2 Student card in roster

- "History" icon button (material symbol `history`) added to each student card.
- Visible only when `canViewStudentPurchaseDetails` permission is true AND `s.orderCount > 0`.
- Clicking opens `StudentHistoryPanel` for that student.

### 5.3 New component: `StudentHistoryPanel.jsx`

Location: `src/features/orders/new-order/components/StudentHistoryPanel.jsx`

**Behaviour:**
- Slide-in panel from right on desktop (≥768px width), bottom sheet on mobile.
- Backdrop click or close button dismisses it.
- Fetches `ordersApi.getStudentOrders(studentId)` on open.

**Layout:**
```
Header:    "← Purchase History — {studentName}"
           "{className} · Roll {rollNumber}"

Summary:   "{N} visits · Total spent ₹{X}"
           Per-category lines: "Books received {date}" / "Uniform received {date}"

Orders:    One card per order, most recent first:
           Date + Order ID
           Item list (label + price per line)
           Payment status badge + method

Footer:    "Place New Order" button (only if canPlaceOrders)
```

**"Place New Order":** Navigates to `paths.ordersConfigure` with the student's data pre-filled, carrying `existingOrderSummary` in state — a brief list of what the student has already received.

### 5.4 Notice banner in `config/index.jsx`

When `location.state?.existingOrderSummary` is present (set by "Place New Order" from history panel):

```
ℹ  {studentName} has existing orders
   {category} received {date} · {category} received {date}
   This is informational only.
```

Rendered at top of config screen. Does not pre-select or deselect anything.

---

## 6. KPI & Revenue Correctness

| Metric | Single order | Group order |
|---|---|---|
| `revenueToday` | SUM(Transaction.amount) — correct | SUM across group's Transaction records = group total — correct |
| `ordersToday` | COUNT DISTINCT orderId — counts 1 | COUNT DISTINCT orderId — counts each student's order separately |
| `uniqueStudents` | COUNT DISTINCT studentId — correct | COUNT DISTINCT studentId across group — counts each student — correct |
| `cashReceived` | GROUP BY paymentMethod — correct | Proportional Transaction records per method — correct |
| `onlineReceived` | Same | Same |

---

## 7. Testing Requirements

### Unit tests
- Group total = sum of individual student totals (2, 3, 4 students).
- Split payment allocation: first method fills completely before switching to second.
- `cumulativeBookStatus` logic: TAKEN if any TAKEN, PARTIAL if any PARTIAL and none TAKEN, NOT_TAKEN if all NOT_TAKEN.
- KPI `ordersToday` counts distinct orders, not transaction records.
- Student history returns all orders in descending `createdAt` order.
- Student with zero orders returns empty array cleanly.

### Smoke tests (manual)
- Create 2-student group order → both students' stock deducted separately → inventory logs have separate entries per student → transaction list shows one combined row → detail view shows both students' items → each student's roster card shows updated cumulative status.
- Create 3-student group order → all three tracked correctly.
- Group order fails midway (simulate DB timeout) → no orders created, no stock deducted, no group record.
- Place second order for student with existing order → both orders in history panel → stock deducted only for new order items.
- Student history panel: shows all orders in correct order, closes on backdrop click, "Place New Order" opens config with notice banner.

### API tests
- `POST /orders/group` with valid 2-student payload → 201 with groupId + both orderIds.
- Missing `students[1]` → 400 validation error.
- Student from different branch → 400 rejected.
- No auth token → 401.
- Token without `canPlaceOrders` and BOOK items → 403.
- `GET /orders/group/:groupId` for other branch → 404/403.
- `GET /students/:studentId/orders` for student in different branch → 403.
- `GET /students/:studentId/orders` with no orders → `[]`.

### Stock verification (post-test DB checks)
- After every group transaction test: query `BookStock`/`UniformStock` — quantity = initial − all distributed quantities across all orders for that product at that branch.
- Query `InventoryLog` — separate entry per student per item, each with correct `notes` containing that student's name and order reference.
- No combined log entries across students.

### Regression tests
- Full single-student book-only order: identical behaviour to pre-feature.
- Full single-student uniform-only order: identical behaviour.
- Full single-student books + uniform order: identical behaviour.
- Due settlement flow: unchanged.
- Print receipt: unchanged for single orders.

---

## 8. Out of Scope

- Cross-branch combined transactions (explicitly excluded — branch is locked).
- Refunds or cancellations of group transactions (handled by cancelling individual orders as today).
- Receipt printing for group transactions in v1 — the individual order receipts already work; a combined group receipt can be added later.
- More than 10 students in a single group (validated server-side, UI caps Add Student at 9 additions).
