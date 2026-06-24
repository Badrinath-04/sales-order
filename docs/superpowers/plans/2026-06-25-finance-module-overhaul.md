# Finance Module Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the "Cash" module into a unified Finance module: rename it, add collapsible history UI, show dual dates, merge the Operational Expense entry type into category-tagged Handovers and Online Allocations, wire publisher/vendor selection, and add per-branch payment method configuration for Online Allocation.

**Architecture:** Incremental changes to the existing `expenses` feature — no new tables beyond two new columns (`ExpenseEntry.publisherId`, `Branch.paymentMethods`). The `EXPENSE` enum value is retained in the DB for backward compatibility; existing EXPENSE records are migrated to HANDOVER + MISCELLANEOUS category via a migration script. Publisher (Accounts module) vendor selection is wired through an optional `publisherId` FK on `ExpenseEntry`. Tasks 1–4 are pure frontend with no backend changes; Tasks 5–8 involve schema, backend, and frontend.

**Tech Stack:** React + Tailwind (frontend), Node.js + Prisma + PostgreSQL (backend), Prisma `db push` or migration for schema changes.

## Global Constraints

- Do NOT break existing functionality — all existing data, API endpoints, and UI consumers must keep working
- Keep `EXPENSE` in the `ExpenseEntryType` enum (legacy data cannot be deleted); hide from UI for new entries only
- `entryDate` = user-selected date of occurrence; `createdAt` = system-generated record timestamp — never conflate them
- No new tables; extend `ExpenseEntry` with optional `publisherId` FK to `Publisher`
- Keep routes as-is (`/admin/expenses`, `/super/expenses`, `/senior/expenses`)
- Module renamed to "Finance" in all display labels; URL paths unchanged
- All monetary amounts in INR
- Commit after each completed task

---

## File Map

| File | Change |
|------|--------|
| `src/components/AdminSidebar.jsx` | Label: 'Cash' → 'Finance' |
| `src/components/SuperAdminSidebar.jsx` | Label: 'Cash' → 'Finance' |
| `src/components/SeniorAdminSidebar.jsx` | Label: 'Cash' → 'Finance' |
| `src/features/expenses/index.jsx` | h1 and subtitle update |
| `src/features/expenses/components/EntryHistory.jsx` | Collapsible tx section; dual date columns; rename labels |
| `src/features/expenses/components/CreateEntryDrawer.jsx` | Remove EXPENSE tab; Category field for HANDOVER+ONLINE; vendor picker; rename Description→Recipient; branch-filtered payment methods |
| `src/features/expenses/expenseConstants.js` | Add VENDOR_PAYMENT, OTHER to categories; remove EXPENSE label/color |
| `src/features/expenses/expenseApi.js` | Add `getBranchMethods`, `updateBranchMethods` |
| `backend/prisma/schema.prisma` | Add `ExpenseCategory.VENDOR_PAYMENT`, `ExpenseCategory.OTHER`; add `ExpenseEntry.publisherId`; add `Publisher.expenseEntries`; add `Branch.paymentMethods` |
| `backend/src/modules/expenses/expenses.controller.js` | Block new EXPENSE type; accept `publisherId` + `category` for HANDOVER/ONLINE_ALLOCATION; add `getBranchMethods`, `updateBranchMethods` handlers |
| `backend/src/modules/expenses/expenses.routes.js` | Register new branch-methods routes |
| `backend/src/modules/publishers/publishers.controller.js` | Include `expenseEntries` in vendor payment history |

---

### Task 1: Rename "Cash" Module to "Finance"

**Files:**
- Modify: `src/components/AdminSidebar.jsx` (line ~63)
- Modify: `src/components/SuperAdminSidebar.jsx` (line ~28)
- Modify: `src/components/SeniorAdminSidebar.jsx` (line ~61)
- Modify: `src/features/expenses/index.jsx` (lines 39–40)

**Interfaces:**
- Produces: "Finance" label in all three sidebars and as the page h1

- [ ] **Step 1: Update AdminSidebar.jsx**

In `src/components/AdminSidebar.jsx`, find the object with `id: 'expenses'` and change its label:
```js
// Before
label: 'Cash',
// After
label: 'Finance',
```

- [ ] **Step 2: Update SuperAdminSidebar.jsx**

In `src/components/SuperAdminSidebar.jsx`, find the object with `id: 'expenses'`:
```js
// Before
{ id: 'expenses', label: 'Cash', to: '/super/expenses', icon: 'payments', activePrefix: '/super/expenses' },
// After
{ id: 'expenses', label: 'Finance', to: '/super/expenses', icon: 'payments', activePrefix: '/super/expenses' },
```

- [ ] **Step 3: Update SeniorAdminSidebar.jsx**

In `src/components/SeniorAdminSidebar.jsx`, find the object with `id: 'expenses'`:
```js
// Before
label: 'Cash',
// After
label: 'Finance',
```

- [ ] **Step 4: Update module page title and subtitle**

In `src/features/expenses/index.jsx`, update the h1 and subtitle paragraph:
```jsx
<h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">Finance</h1>
<p className="text-sm text-on-surface-variant font-body">Track cash handovers, online allocations, and daily financial position</p>
```

- [ ] **Step 5: Verify in browser**

Navigate to `/admin/expenses` (or `/super/expenses`). The sidebar should show "Finance" and the page title should say "Finance".

- [ ] **Step 6: Commit**
```bash
git add src/components/AdminSidebar.jsx src/components/SuperAdminSidebar.jsx src/components/SeniorAdminSidebar.jsx src/features/expenses/index.jsx
git commit -m "feat: rename Cash module to Finance in sidebar labels and page header"
```

---

### Task 2: Collapsible Fee Collections Section

**Files:**
- Modify: `src/features/expenses/components/EntryHistory.jsx` (the Fee Collections section, lines ~342–393)

**Interfaces:**
- Produces: toggle that hides/shows the transactions table; state key `finance_tx_expanded` in `localStorage`; default state: expanded; count badge always visible

- [ ] **Step 1: Add collapse state with localStorage persistence**

In `EntryHistory.jsx`, inside the `EntryHistory` default export function, add after the existing state declarations (around line 266):
```js
const [txExpanded, setTxExpanded] = useState(() => {
  const stored = localStorage.getItem('finance_tx_expanded')
  return stored === null ? true : stored === 'true'
})

function toggleTx() {
  setTxExpanded((prev) => {
    const next = !prev
    localStorage.setItem('finance_tx_expanded', String(next))
    return next
  })
}
```

- [ ] **Step 2: Wrap the fee collections section with the toggle**

Find the `{/* Transactions from Transaction table */}` block (~line 342) and replace the static `<h3>` with a clickable header and conditional body:
```jsx
{/* Fee Collections — collapsible */}
<div>
  <button
    type="button"
    onClick={toggleTx}
    className="flex w-full items-center gap-2 mb-2 text-left"
  >
    <span className="material-symbols-outlined text-base text-on-surface-variant">
      {txExpanded ? 'expand_more' : 'chevron_right'}
    </span>
    <h3 className="font-headline text-sm font-semibold text-on-surface">
      Fee Collections — {fmtDate(pos.date)}
    </h3>
    <span className="ml-1 inline-flex items-center rounded-full bg-surface-container-low px-2 py-0.5 text-xs font-semibold text-on-surface-variant font-label">
      {transactions.length}
    </span>
  </button>

  {txExpanded && (
    <>
      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-8 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">receipt</span>
          <p className="mt-1 text-sm text-on-surface-variant font-body">No fee collections on this date</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Time</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Student / Order</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Method</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Status</th>
                <th className="px-4 py-2.5 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs whitespace-nowrap">
                    {(() => { const dt = fmtDateTime(tx.paidAt); return <><div>{dt.date}</div><div>{dt.time}</div></> })()}
                  </td>
                  <td className="px-4 py-2.5 text-on-surface font-body">
                    <div className="font-semibold text-xs">{tx.order?.student?.name ?? '—'}</div>
                    <div className="text-xs text-on-surface-variant">{tx.id.slice(-8).toUpperCase()}</div>
                  </td>
                  <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs">
                    {PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-label ${tx.status === 'PAID' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-headline font-semibold text-on-surface">
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )}
</div>
```

- [ ] **Step 3: Verify in browser**

Open the History tab with a date that has transactions. The Fee Collections section should have a clickable header showing the count. Clicking should collapse/expand the list. Refresh the page — the state should persist.

- [ ] **Step 4: Commit**
```bash
git add src/features/expenses/components/EntryHistory.jsx
git commit -m "feat: collapsible fee collections section in Finance history with localStorage persistence"
```

---

### Task 3: Show Both Entry Date and Recorded Date in Manual Entries Table

**Files:**
- Modify: `src/features/expenses/components/EntryHistory.jsx` — `ManualEntriesTable` component

**Interfaces:**
- Consumes: `entry.entryDate` (user-selected, already returned by backend) and `entry.createdAt` (system timestamp)
- Produces: two date columns — "Entry Date" and "Recorded On" — in the `ManualEntriesTable`

- [ ] **Step 1: Split the current "Recorded" column into two**

In `ManualEntriesTable` thead, replace the single `<th>Recorded</th>`:
```jsx
<th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Entry Date</th>
<th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Recorded On</th>
```

- [ ] **Step 2: Update the table row to render both date cells**

In the `<tbody>` rows, replace the existing single `<td>` that shows `createdAt`:
```jsx
{/* Entry Date — the date the transaction actually occurred */}
<td className="px-4 py-2.5 font-body text-xs whitespace-nowrap">
  <div className="font-medium text-on-surface">{fmtDate(entry.entryDate)}</div>
</td>
{/* Recorded On — the system timestamp when the record was created */}
<td className="px-4 py-2.5 text-on-surface-variant font-body text-xs whitespace-nowrap">
  <div>{recorded.date}</div>
  <div>{recorded.time} IST</div>
</td>
```

Keep the `const recorded = fmtDateTime(entry.createdAt)` line as-is (it's used for "Recorded On").

- [ ] **Step 3: Verify in browser**

Open the History tab. The Manual Entries table should now show two date columns. For entries where someone selected a past date (e.g., June 15), the Entry Date should differ from the Recorded On date.

- [ ] **Step 4: Commit**
```bash
git add src/features/expenses/components/EntryHistory.jsx
git commit -m "feat: show both entry date and recorded date in manual entries history table"
```

---

### Task 4: Rename "Description" to "Recipient" for Online Allocation

**Files:**
- Modify: `src/features/expenses/components/CreateEntryDrawer.jsx`
- Modify: `src/features/expenses/components/EntryHistory.jsx` — `ManualEntriesTable`

**Interfaces:**
- Produces: "Recipient" label on the description field in Online Allocation form; "Recipient" label in the Details column of the history table for ONLINE_ALLOCATION entries

Note: The DB column name (`description`) is unchanged. Only display labels are updated.

- [ ] **Step 1: Update the field label in CreateEntryDrawer**

In `CreateEntryDrawer.jsx`, find the field that shows "Description" for both EXPENSE and ONLINE_ALLOCATION (~line 304):
```jsx
{/* Before */}
{(activeTab === ENTRY_TYPES.EXPENSE || activeTab === ENTRY_TYPES.ONLINE_ALLOCATION) && (
  <Field label="Description" error={errors.description}>
```

Change it to show "Recipient" for ONLINE_ALLOCATION (EXPENSE tab will be removed in Task 6, so simplify to ONLINE_ALLOCATION only):
```jsx
{activeTab === ENTRY_TYPES.ONLINE_ALLOCATION && (
  <Field label="Recipient" error={errors.description}>
    <input
      type="text"
      placeholder="Vendor name, person, or details…"
      value={form.description}
      onChange={(e) => set('description', e.target.value)}
      className={inputCls}
    />
  </Field>
)}
```

- [ ] **Step 2: Update the Details column header in ManualEntriesTable**

In `EntryHistory.jsx`, the column header "Details" already covers all types. Leave the header as "Details" — it's generic enough. The row cell for ONLINE_ALLOCATION shows `entry.description ?? 'Online'`. Update it for backward compat to also check `recipient`:
```jsx
: entry.entryType === 'ONLINE_ALLOCATION'
  ? (entry.recipient ?? entry.description ?? '—')
```

- [ ] **Step 3: Verify in browser**

Open the "New Entry" drawer, switch to Online Allocation tab. The text field should now say "Recipient" not "Description". In the History table, ONLINE_ALLOCATION rows should show the description/recipient text.

- [ ] **Step 4: Commit**
```bash
git add src/features/expenses/components/CreateEntryDrawer.jsx src/features/expenses/components/EntryHistory.jsx
git commit -m "feat: rename Description to Recipient label in Online Allocation form and history"
```

---

### Task 5: Schema Migration — Expand Categories, Add publisherId, Add Branch paymentMethods

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrate-finance-overhaul-2026-06-25.js` (data migration script)

**Interfaces:**
- Produces:
  - `ExpenseCategory` enum gains `VENDOR_PAYMENT` and `OTHER`
  - `ExpenseEntry` gains `publisherId String?` FK → `Publisher`
  - `Publisher` gains `expenseEntries ExpenseEntry[]` back-relation
  - `Branch` gains `paymentMethods PaymentMethod[] @default([])`
  - All existing `EXPENSE` entries migrated to `HANDOVER` + `MISCELLANEOUS` category

- [ ] **Step 1: Update ExpenseCategory enum in schema.prisma**

Find the `enum ExpenseCategory` block and add two new values:
```prisma
enum ExpenseCategory {
  STATIONERY
  MAINTENANCE
  FOOD
  TRANSPORT
  MISCELLANEOUS
  VENDOR_PAYMENT
  OTHER
}
```

- [ ] **Step 2: Add publisherId to ExpenseEntry model**

In the `model ExpenseEntry` block, add after `referenceId`:
```prisma
  publisherId   String?
  publisher     Publisher? @relation("PublisherExpenseEntries", fields: [publisherId], references: [id], onDelete: SetNull)
```

Also add to the index list at the bottom of the model:
```prisma
  @@index([publisherId])
```

- [ ] **Step 3: Add back-relation to Publisher model**

In `model Publisher`, add to the relations block (after `payments     PublisherPayment[]`):
```prisma
  expenseEntries ExpenseEntry[] @relation("PublisherExpenseEntries")
```

- [ ] **Step 4: Add paymentMethods to Branch model**

In `model Branch`, add after the `updatedAt` field:
```prisma
  paymentMethods PaymentMethod[] @default([])
```

- [ ] **Step 5: Apply schema to database**

```bash
cd backend && npx prisma db push
```

Expected: Prisma reports schema applied successfully. If there are enum conflicts on adding new values, run:
```bash
npx prisma migrate dev --name finance-overhaul-2026-06-25
```

- [ ] **Step 6: Write the data migration script**

Create `backend/prisma/migrate-finance-overhaul-2026-06-25.js`:
```js
'use strict'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.expenseEntry.updateMany({
    where: { entryType: 'EXPENSE' },
    data: {
      entryType: 'HANDOVER',
      category: 'MISCELLANEOUS',
    },
  })
  console.log(`Migrated ${result.count} EXPENSE entries → HANDOVER + MISCELLANEOUS`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 7: Run the data migration**

```bash
cd backend && node prisma/migrate-finance-overhaul-2026-06-25.js
```

Expected output: `Migrated N EXPENSE entries → HANDOVER + MISCELLANEOUS`

- [ ] **Step 8: Verify schema and data**

```bash
cd backend && npx prisma studio
```

Check that:
- `ExpenseEntry` table has `publisherId` column (all null for now)
- `Branch` table has `paymentMethods` column (empty arrays)
- No rows remain with `entryType = 'EXPENSE'`

- [ ] **Step 9: Commit**
```bash
git add backend/prisma/schema.prisma backend/prisma/migrate-finance-overhaul-2026-06-25.js
git commit -m "feat(schema): add publisherId to ExpenseEntry, paymentMethods to Branch, expand ExpenseCategory; migrate EXPENSE entries to HANDOVER"
```

---

### Task 6: Remove EXPENSE Tab and Add Category + Vendor to HANDOVER & ONLINE_ALLOCATION Forms

**Files:**
- Modify: `src/features/expenses/expenseConstants.js`
- Modify: `src/features/expenses/components/CreateEntryDrawer.jsx`
- Modify: `backend/src/modules/expenses/expenses.controller.js`

**Interfaces:**
- Consumes: `publishersApi.list()` from `@/services/api` (already exists, returns `[{ id, name, ... }]`)
- Produces:
  - No EXPENSE tab in the New Entry drawer
  - HANDOVER form: Category dropdown (optional) + Recipient/Notes (vendor picker or free text) + publisherId stored when vendor selected
  - ONLINE_ALLOCATION form: Category dropdown (optional) + Recipient/Notes (vendor picker or free text, replaces old Description field) + publisherId stored when vendor selected
  - Backend rejects new entries with `entryType = 'EXPENSE'`; accepts `publisherId` and `category` for HANDOVER/ONLINE_ALLOCATION

- [ ] **Step 1: Update expenseConstants.js**

Add VENDOR_PAYMENT and OTHER to the categories arrays:
```js
export const EXPENSE_CATEGORIES = [
  { value: 'STATIONERY',     label: 'Stationery' },
  { value: 'MAINTENANCE',    label: 'Maintenance' },
  { value: 'FOOD',           label: 'Food' },
  { value: 'TRANSPORT',      label: 'Transport' },
  { value: 'MISCELLANEOUS',  label: 'Miscellaneous' },
  { value: 'VENDOR_PAYMENT', label: 'Vendor Payment' },
  { value: 'OTHER',          label: 'Other' },
]

export const EXPENSE_CATEGORY_LABELS = {
  STATIONERY:     'Stationery',
  MAINTENANCE:    'Maintenance',
  FOOD:           'Food',
  TRANSPORT:      'Transport',
  MISCELLANEOUS:  'Miscellaneous',
  VENDOR_PAYMENT: 'Vendor Payment',
  OTHER:          'Other',
}
```

Remove EXPENSE from `ENTRY_TYPE_LABELS` and `ENTRY_TYPE_COLORS` (leave in `ENTRY_TYPES` for backward compat rendering of old history rows):
```js
export const ENTRY_TYPE_LABELS = {
  HANDOVER:          'Cash Handover',
  EXPENSE:           'Operational Expense', // kept for display of historical entries
  ONLINE_ALLOCATION: 'Online Allocation',
}
```

- [ ] **Step 2: Update CreateEntryDrawer — remove EXPENSE tab, add Category + vendor picker**

Replace the entire `CreateEntryDrawer.jsx` content with the updated version below. Key changes:
1. Remove `canExpense` permission and EXPENSE from tabs
2. Add `publisherId` to form state
3. Add `vendors` state (fetched from publishersApi)
4. Add Category dropdown to HANDOVER and ONLINE_ALLOCATION
5. Add vendor picker (dropdown + free text toggle) to HANDOVER and ONLINE_ALLOCATION
6. HANDOVER: rename "Recipient" to "Recipient / Notes", add vendor picker alongside ExpenseRecipient list
7. ONLINE_ALLOCATION: rename "Recipient" field (from Task 4) to include vendor picker

```jsx
import { useState, useEffect, useCallback } from 'react'
import { expenseApi } from '../expenseApi'
import { publishersApi } from '@/services/api'
import {
  ENTRY_TYPES, ENTRY_TYPE_LABELS, EXPENSE_CATEGORIES, PAYMENT_METHODS,
} from '../expenseConstants'
import { usePermission } from '@/hooks/usePermission'
import { useMutation, useApi } from '@/hooks/useApi'

const inputCls =
  'w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm font-body focus:border-primary focus:outline-none'

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant font-label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-on-surface-variant font-body">{hint}</p>}
      {error && <p className="mt-1 text-xs text-error font-body">{error}</p>}
    </div>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

function buildEmptyForm(tab) {
  return {
    amount: '',
    recipient: '',
    publisherId: '',
    category: '',
    description: '',
    paymentMethod: tab === ENTRY_TYPES.ONLINE_ALLOCATION ? 'GPAY' : 'CASH',
    referenceId: '',
    notes: '',
    entryDate: today(),
  }
}

const ONLINE_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m.value !== 'CASH')

export default function CreateEntryDrawer({
  open,
  onClose,
  branchId,
  branches = [],
  onCreated,
  branchPaymentMethods = [], // array of PaymentMethod strings configured for this branch
}) {
  const canHandover = usePermission('canCreateHandoverEntry')
  const canOnline   = usePermission('canCreateOnlineAllocation')

  const tabs = [
    canHandover && ENTRY_TYPES.HANDOVER,
    canOnline   && ENTRY_TYPES.ONLINE_ALLOCATION,
  ].filter(Boolean)

  const [activeTab, setActiveTab] = useState(null)
  const [form, setForm] = useState(() => buildEmptyForm(tabs[0] ?? ENTRY_TYPES.HANDOVER))
  const [errors, setErrors] = useState({})
  const [recipientIsCustom, setRecipientIsCustom] = useState(false)
  const [vendorMode, setVendorMode] = useState(false) // true = picking from publisher list
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || '')

  const { mutate, loading, error: apiError } = useMutation(expenseApi.createEntry)

  const fetchRecipients = useCallback(
    () => selectedBranchId ? expenseApi.getRecipients({ branchId: selectedBranchId }) : null,
    [selectedBranchId],
  )
  const { data: recipientsData } = useApi(fetchRecipients, null, [selectedBranchId])
  const recipients = Array.isArray(recipientsData) ? recipientsData : []

  const fetchVendors = useCallback(() => publishersApi.list(), [])
  const { data: vendorsData } = useApi(fetchVendors, null, [])
  const vendors = Array.isArray(vendorsData) ? vendorsData : []

  // Determine which payment methods to show for Online Allocation
  const onlineMethodsForBranch = branchPaymentMethods.length > 0
    ? ONLINE_PAYMENT_METHODS.filter((m) => branchPaymentMethods.includes(m.value))
    : ONLINE_PAYMENT_METHODS

  useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0])
      setForm(buildEmptyForm(tabs[0]))
    }
  }, [tabs.join(',')]) // eslint-disable-line

  useEffect(() => {
    if (branchId) setSelectedBranchId(branchId)
  }, [branchId])

  if (!open) return null

  const isSuperAdminMode = !branchId && branches.length > 0

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function switchTab(tab) {
    setActiveTab(tab)
    setForm(buildEmptyForm(tab))
    setErrors({})
    setRecipientIsCustom(false)
    setVendorMode(false)
  }

  function validate() {
    const e = {}
    if (isSuperAdminMode && !selectedBranchId) e.branch = 'Select a branch'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0'
    if (activeTab === ENTRY_TYPES.HANDOVER && !form.recipient && !form.publisherId) {
      e.recipient = 'Recipient is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      branchId: selectedBranchId,
      entryType: activeTab,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod || 'CASH',
      recipient: form.recipient || null,
      publisherId: form.publisherId || null,
      category: form.category || null,
      description: form.description?.trim() || null,
      referenceId: form.referenceId?.trim() || null,
      notes: form.notes?.trim() || null,
      entryDate: form.entryDate
        ? new Date(form.entryDate).toISOString()
        : new Date().toISOString(),
    }
    try {
      const result = await mutate(payload)
      onCreated?.(result)
      onClose()
    } catch { /* apiError already set */ }
  }

  // Shared vendor picker for both HANDOVER and ONLINE_ALLOCATION
  function VendorOrTextPicker({ fieldKey, label, required, hint }) {
    const value = form[fieldKey]
    return (
      <Field label={label} error={errors[fieldKey]} hint={hint}>
        {vendorMode ? (
          <div className="space-y-2">
            <select
              value={form.publisherId}
              onChange={(e) => {
                const vendor = vendors.find((v) => v.id === e.target.value)
                set('publisherId', e.target.value)
                if (vendor) set(fieldKey, vendor.name)
              }}
              className={inputCls}
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setVendorMode(false); set('publisherId', ''); set(fieldKey, '') }}
              className="text-xs text-on-surface-variant hover:text-on-surface font-body underline"
            >
              Or type a name instead
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Select vendor or type details…"
              value={value}
              onChange={(e) => { set(fieldKey, e.target.value); set('publisherId', '') }}
              className={inputCls}
            />
            {vendors.length > 0 && (
              <button
                type="button"
                onClick={() => setVendorMode(true)}
                className="text-xs text-on-surface-variant hover:text-on-surface font-body underline"
              >
                Pick from vendor list
              </button>
            )}
          </div>
        )}
      </Field>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h2 className="font-headline text-xl font-extrabold">New Entry</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-surface-container-low" aria-label="Close">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        {tabs.length > 1 && (
          <div className="flex gap-1 border-b border-outline-variant/10 px-6 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className={[
                  'rounded-t-lg px-4 py-2 text-sm font-semibold font-label transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {ENTRY_TYPE_LABELS[tab]}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 p-6">
          {isSuperAdminMode && (
            <Field label="Branch" error={errors.branch}>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value)
                  setErrors((err) => ({ ...err, branch: undefined }))
                  set('recipient', '')
                  set('publisherId', '')
                }}
                className={inputCls}
              >
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Amount (₹)" error={errors.amount}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Entry Date">
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) => set('entryDate', e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* HANDOVER: Recipient from ExpenseRecipient list or custom */}
          {activeTab === ENTRY_TYPES.HANDOVER && (
            <>
              <Field label="Recipient / Notes" error={errors.recipient}>
                {recipients.length > 0 && !recipientIsCustom ? (
                  <select
                    value={form.recipient}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setRecipientIsCustom(true)
                        set('recipient', '')
                      } else {
                        set('recipient', e.target.value)
                        set('publisherId', '')
                        setVendorMode(false)
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">Select recipient…</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                    <option value="__custom__">Other (type a name or pick vendor)…</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Select vendor or type details…"
                        value={vendorMode ? (vendors.find((v) => v.id === form.publisherId)?.name ?? '') : form.recipient}
                        onChange={(e) => { set('recipient', e.target.value); set('publisherId', ''); setVendorMode(false) }}
                        className={`${inputCls} flex-1`}
                        readOnly={vendorMode}
                      />
                      {recipients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setRecipientIsCustom(false); set('recipient', ''); set('publisherId', ''); setVendorMode(false) }}
                          className="shrink-0 rounded-xl border border-outline-variant/30 px-3 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
                        >
                          Pick list
                        </button>
                      )}
                    </div>
                    {vendors.length > 0 && !vendorMode && (
                      <button
                        type="button"
                        onClick={() => setVendorMode(true)}
                        className="text-xs text-on-surface-variant hover:text-on-surface font-body underline"
                      >
                        Pick from vendor list
                      </button>
                    )}
                    {vendorMode && (
                      <div className="space-y-1">
                        <select
                          value={form.publisherId}
                          onChange={(e) => {
                            const vendor = vendors.find((v) => v.id === e.target.value)
                            set('publisherId', e.target.value)
                            if (vendor) set('recipient', vendor.name)
                          }}
                          className={inputCls}
                        >
                          <option value="">Select vendor…</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => { setVendorMode(false); set('publisherId', ''); set('recipient', '') }}
                          className="text-xs text-on-surface-variant hover:text-on-surface font-body underline"
                        >
                          Or type a name instead
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              {/* Category (optional) */}
              <Field label="Category (optional)">
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={inputCls}
                >
                  <option value="">No category…</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              {/* Payment method locked to CASH */}
              <Field label="Payment Method">
                <div className={`${inputCls} cursor-not-allowed bg-surface-container-low text-on-surface-variant`}>
                  Cash
                </div>
              </Field>
            </>
          )}

          {/* ONLINE_ALLOCATION fields */}
          {activeTab === ENTRY_TYPES.ONLINE_ALLOCATION && (
            <>
              {/* Recipient / Notes — vendor picker or free text */}
              <Field label="Recipient / Notes" error={errors.recipient}
                hint="Select a vendor from your accounts, or type any name or description">
                <div className="space-y-2">
                  {vendorMode ? (
                    <>
                      <select
                        value={form.publisherId}
                        onChange={(e) => {
                          const vendor = vendors.find((v) => v.id === e.target.value)
                          set('publisherId', e.target.value)
                          if (vendor) set('description', vendor.name)
                        }}
                        className={inputCls}
                      >
                        <option value="">Select vendor…</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setVendorMode(false); set('publisherId', ''); set('description', '') }}
                        className="text-xs text-on-surface-variant hover:text-on-surface font-body underline"
                      >
                        Or type a name instead
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Select vendor or type details…"
                        value={form.description}
                        onChange={(e) => { set('description', e.target.value); set('publisherId', '') }}
                        className={inputCls}
                      />
                      {vendors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setVendorMode(true)}
                          className="text-xs text-on-surface-variant hover:text-on-surface font-body underline"
                        >
                          Pick from vendor list
                        </button>
                      )}
                    </>
                  )}
                </div>
              </Field>

              {/* Category (optional) */}
              <Field label="Category (optional)">
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={inputCls}
                >
                  <option value="">No category…</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              {/* Payment Method — filtered to branch's online methods */}
              <Field label="Payment Method">
                <select
                  value={form.paymentMethod}
                  onChange={(e) => set('paymentMethod', e.target.value)}
                  className={inputCls}
                >
                  {onlineMethodsForBranch.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Reference / UTR ID (optional)">
                <input
                  type="text"
                  placeholder="Transaction or UTR reference…"
                  value={form.referenceId}
                  onChange={(e) => set('referenceId', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </>
          )}

          <Field label="Notes (optional)">
            <textarea
              rows={3}
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex-1" />

          <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary font-label transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : `Save ${activeTab ? ENTRY_TYPE_LABELS[activeTab] : 'Entry'}`}
            </button>
            {apiError && (
              <p className="text-center text-xs text-error font-body">{apiError}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update backend createEntry to accept publisherId + reject new EXPENSE**

In `backend/src/modules/expenses/expenses.controller.js`, update `createEntry`:
```js
async function createEntry(req, res) {
  try {
    const {
      branchId, entryType, amount, paymentMethod,
      recipient, publisherId, category, description, referenceId, notes, entryDate,
    } = req.body

    // Block new EXPENSE entries (legacy type; existing data kept but new UI removed)
    if (entryType === 'EXPENSE') {
      return badRequest(res, 'EXPENSE entry type is no longer supported. Use HANDOVER or ONLINE_ALLOCATION with a category instead.')
    }

    if (!['HANDOVER', 'ONLINE_ALLOCATION'].includes(entryType)) {
      return badRequest(res, 'entryType must be HANDOVER or ONLINE_ALLOCATION')
    }

    // Validate publisherId exists if provided
    if (publisherId) {
      const publisher = await prisma.publisher.findUnique({ where: { id: publisherId }, select: { id: true } })
      if (!publisher) return badRequest(res, 'Publisher not found')
    }

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN'
    const status = isSuperAdmin ? 'APPROVED' : 'PENDING'

    const entry = await prisma.expenseEntry.create({
      data: {
        branchId,
        entryType,
        amount,
        paymentMethod,
        recipient: recipient ?? null,
        publisherId: publisherId ?? null,
        category: category ?? null,
        description: description ?? null,
        referenceId: referenceId ?? null,
        notes: notes ?? null,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        status,
        approvedById: isSuperAdmin ? req.user.id : null,
        approvedAt:   isSuperAdmin ? new Date() : null,
        createdById: req.user.id,
      },
      include: {
        createdBy:  { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        branch:     { select: { id: true, name: true, code: true } },
        publisher:  { select: { id: true, name: true } },
      },
    })

    return created(res, entry)
  } catch (err) {
    console.error('[expenses] createEntry failed', err)
    return serverError(res)
  }
}
```

Also update `listEntries` to include publisher in the include block:
```js
include: {
  createdBy:  { select: { id: true, displayName: true } },
  approvedBy: { select: { id: true, displayName: true } },
  branch:     { select: { id: true, name: true, code: true } },
  publisher:  { select: { id: true, name: true } },
},
```

- [ ] **Step 4: Update ManualEntriesTable to show publisher name when available**

In `EntryHistory.jsx`, the Details column cell for HANDOVER currently shows `entry.recipient ?? '—'`. Update to also show publisher name:
```jsx
{entry.entryType === 'HANDOVER'
  ? (entry.publisher?.name ?? entry.recipient ?? '—')
  : entry.entryType === 'EXPENSE'
    ? (EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category ?? '—')
    : (entry.publisher?.name ?? entry.recipient ?? entry.description ?? '—')}
```

Also add the Category badge in the Details cell after the main detail text (for HANDOVER and ONLINE_ALLOCATION with a category):
```jsx
<td className="px-4 py-2.5 text-on-surface font-body text-xs max-w-[200px]">
  <div className="truncate">{/* name/description */}</div>
  {entry.category && entry.entryType !== 'EXPENSE' && (
    <span className="inline-flex items-center rounded-full bg-surface-container-low px-1.5 py-0.5 text-xs text-on-surface-variant font-label mt-0.5">
      {EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category}
    </span>
  )}
</td>
```

- [ ] **Step 5: Verify in browser**

1. Open "New Entry" drawer — should show only "Cash Handover" and "Online Allocation" tabs
2. Select Cash Handover — should show Recipient/Notes with vendor picker, optional Category, locked Cash payment method
3. Select Online Allocation — should show Recipient/Notes with vendor picker, optional Category, payment method dropdown (no CASH)
4. Create a Cash Handover with Category = STATIONERY and type a custom recipient name — save succeeds
5. Create an Online Allocation selecting a vendor from the picker — save succeeds and shows publisher name in history
6. Old EXPENSE entries still render correctly in history (show "Operational Expense" type label)

- [ ] **Step 6: Commit**
```bash
git add src/features/expenses/expenseConstants.js src/features/expenses/components/CreateEntryDrawer.jsx src/features/expenses/components/EntryHistory.jsx backend/src/modules/expenses/expenses.controller.js
git commit -m "feat: remove EXPENSE tab; add Category and vendor picker to HANDOVER and ONLINE_ALLOCATION forms"
```

---

### Task 7: Branch-Specific Payment Methods for Online Allocation

**Files:**
- Modify: `backend/src/modules/expenses/expenses.controller.js`
- Modify: `backend/src/modules/expenses/expenses.routes.js`
- Modify: `src/features/expenses/expenseApi.js`
- Modify: `src/features/expenses/index.jsx` (pass branchPaymentMethods to CreateEntryDrawer)
- Modify: `src/features/expenses/components/DashboardView.jsx` (super admin branch method config)

**Interfaces:**
- Consumes: `Branch.paymentMethods` (added in Task 5)
- Produces:
  - `GET /expenses/branch-methods?branchId=xxx` → `{ paymentMethods: PaymentMethod[] }`
  - `PATCH /expenses/branch-methods` (super admin only) → `{ branchId, paymentMethods }` → updated branch
  - Frontend: Online Allocation dropdown only shows branch-configured online methods

- [ ] **Step 1: Add getBranchMethods and updateBranchMethods to expenses controller**

In `backend/src/modules/expenses/expenses.controller.js`, add two new handlers at the bottom (before `module.exports`):

```js
// ─── GET /expenses/branch-methods ────────────────────────────────────────────

async function getBranchMethods(req, res) {
  try {
    const { branchId } = req.query
    if (!branchId) return badRequest(res, 'branchId is required')

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, paymentMethods: true },
    })
    if (!branch) return notFound(res, 'Branch not found')

    return ok(res, { branchId: branch.id, paymentMethods: branch.paymentMethods ?? [] })
  } catch (err) {
    console.error('[expenses] getBranchMethods failed', err)
    return serverError(res)
  }
}

// ─── PATCH /expenses/branch-methods ──────────────────────────────────────────

async function updateBranchMethods(req, res) {
  try {
    const { branchId, paymentMethods } = req.body

    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin only' })
    }
    if (!branchId) return badRequest(res, 'branchId is required')
    if (!Array.isArray(paymentMethods)) return badRequest(res, 'paymentMethods must be an array')

    const VALID_ONLINE = [
      'CANARA_UPI', 'BOB_UPI', 'UPI_BHARATH', 'UPI_POORNIMA',
      'BANK_TRANSFER', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER',
      'GPAY', 'PHONEPE', 'PAYTM', 'ONLINE',
    ]
    const invalid = paymentMethods.filter((m) => !VALID_ONLINE.includes(m))
    if (invalid.length > 0) {
      return badRequest(res, `Invalid payment methods: ${invalid.join(', ')}`)
    }

    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: { paymentMethods },
      select: { id: true, name: true, paymentMethods: true },
    })

    return ok(res, { branchId: branch.id, paymentMethods: branch.paymentMethods })
  } catch (err) {
    console.error('[expenses] updateBranchMethods failed', err)
    return serverError(res)
  }
}
```

Add to `module.exports`:
```js
module.exports = {
  // ... existing exports ...
  getBranchMethods,
  updateBranchMethods,
}
```

- [ ] **Step 2: Register routes in expenses.routes.js**

Read `backend/src/modules/expenses/expenses.routes.js` and add two new routes. Find the existing route registrations and add:
```js
const {
  // ... existing destructuring ...
  getBranchMethods,
  updateBranchMethods,
} = require('./expenses.controller')

// ... existing routes ...
router.get('/branch-methods', getBranchMethods)
router.patch('/branch-methods', updateBranchMethods)
```

- [ ] **Step 3: Add API methods to expenseApi.js**

In `src/features/expenses/expenseApi.js`:
```js
export const expenseApi = {
  // ... existing methods ...
  getBranchMethods: (params) => api.get('/expenses/branch-methods', { params }),
  updateBranchMethods: (data) => api.patch('/expenses/branch-methods', data),
}
```

- [ ] **Step 4: Fetch branch payment methods in CreateEntryDrawer and pass from parent**

In `src/features/expenses/index.jsx`, load branch payment methods when a branch is selected (for super admin mode, use branch object from branches list; for branch admin, fetch on mount):

Add to `ExpensesModule`:
```jsx
const [drawerOpen, setDrawerOpen] = useState(false)

// For branch admin: fetch their branch's payment methods
const fetchBranchMethods = useCallback(
  () => !isSuperAdmin && branchesApi.list ? null : null, // admin branch methods fetched inside drawer
  [],
)
```

Actually, the simpler approach: modify `DashboardView.jsx` to include a "Branch Payment Methods" settings section (super admin only), and modify `CreateEntryDrawer` to accept a `branchPaymentMethods` prop. The parent (`DashboardView` or `index.jsx`) fetches/passes it.

In `src/features/expenses/index.jsx`, modify where `CreateEntryDrawer` is rendered (it's likely rendered inside `DashboardView` or in the module index). Find where `CreateEntryDrawer` is rendered and pass `branchPaymentMethods`. 

Note: First check `DashboardView.jsx` — it may be the component that renders `CreateEntryDrawer`.

- [ ] **Step 5: Add branch payment methods config to DashboardView (super admin)**

Read `src/features/expenses/components/DashboardView.jsx`. Add a "Branch Settings" section (super admin only) at the bottom of the dashboard that shows each branch's current payment method config and allows editing.

Key structure to add (inside DashboardView, super admin only):
```jsx
{isSuperAdmin && (
  <BranchMethodsConfig branches={branches} />
)}
```

Create a `BranchMethodsConfig` inline component:
```jsx
function BranchMethodsConfig({ branches }) {
  const ONLINE_OPTIONS = PAYMENT_METHODS.filter((m) => m.value !== 'CASH')
  const [configs, setConfigs] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  useEffect(() => {
    branches.forEach(async (b) => {
      const data = await expenseApi.getBranchMethods({ branchId: b.id })
      setConfigs((c) => ({ ...c, [b.id]: data.paymentMethods ?? [] }))
    })
  }, [branches])

  async function save(branchId) {
    setSaving((s) => ({ ...s, [branchId]: true }))
    try {
      await expenseApi.updateBranchMethods({ branchId, paymentMethods: configs[branchId] ?? [] })
      setSaved((s) => ({ ...s, [branchId]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [branchId]: false })), 2000)
    } finally {
      setSaving((s) => ({ ...s, [branchId]: false }))
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm p-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">
        Branch Payment Method Settings
      </h3>
      <p className="text-xs text-on-surface-variant font-body mb-4">
        Configure which payment methods are available for Online Allocation per branch.
        Leave empty to allow all online methods.
      </p>
      <div className="space-y-4">
        {branches.map((b) => (
          <div key={b.id} className="rounded-xl border border-outline-variant/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold font-label text-on-surface">{b.name}</span>
              <button
                type="button"
                onClick={() => save(b.id)}
                disabled={saving[b.id]}
                className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary font-label hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                {saving[b.id] ? 'Saving…' : saved[b.id] ? 'Saved ✓' : 'Save'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ONLINE_OPTIONS.map((m) => {
                const checked = (configs[b.id] ?? []).includes(m.value)
                return (
                  <label key={m.value} className="flex items-center gap-1.5 text-xs font-body cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setConfigs((c) => ({
                          ...c,
                          [b.id]: checked
                            ? (c[b.id] ?? []).filter((v) => v !== m.value)
                            : [...(c[b.id] ?? []), m.value],
                        }))
                      }}
                      className="rounded"
                    />
                    {m.label}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Pass branchPaymentMethods into CreateEntryDrawer**

In whichever component renders `CreateEntryDrawer` (check `DashboardView.jsx`), when a branch is selected, fetch its payment methods and pass as prop. For branch admins (non-super-admin), fetch on mount using `useApi(expenseApi.getBranchMethods, ...)`.

- [ ] **Step 7: Verify in browser**

1. As super admin, open Finance → Dashboard. Should see "Branch Payment Methods Settings" section.
2. Configure one branch to only have GPAY and BANK_TRANSFER.
3. Open "New Entry" → Online Allocation for that branch → Payment Method dropdown should show only GPAY and Bank Transfer.
4. For a branch with empty config (no methods saved), all online methods should show.

- [ ] **Step 8: Commit**
```bash
git add backend/src/modules/expenses/expenses.controller.js backend/src/modules/expenses/expenses.routes.js src/features/expenses/expenseApi.js src/features/expenses/components/DashboardView.jsx src/features/expenses/components/CreateEntryDrawer.jsx
git commit -m "feat: per-branch payment method config for Online Allocation with super admin settings UI"
```

---

### Task 8: Wire Vendor Payments into Publisher Ledger

**Files:**
- Modify: `backend/src/modules/publishers/publishers.controller.js`

**Interfaces:**
- Consumes: `ExpenseEntry` records with `publisherId` set (created via Tasks 6–7)
- Produces: publisher payment history endpoint includes expense entries (cash handovers and online allocations linked to the publisher), unified and sorted by date

- [ ] **Step 1: Read the publishers controller to find the payment history handler**

Run: `grep -n "function\|payments\|history\|ledger" backend/src/modules/publishers/publishers.controller.js | head -30`

Identify the function that returns a publisher's payment history (likely `getPublisherPayments` or similar).

- [ ] **Step 2: Add expense entries to the publisher payment history**

In the function that fetches a single publisher or its payment history, add a parallel query for expense entries:

```js
const [payments, expenseEntries] = await Promise.all([
  prisma.publisherPayment.findMany({
    where: { publisherId: id },
    orderBy: { date: 'desc' },
  }),
  prisma.expenseEntry.findMany({
    where: { publisherId: id, status: 'APPROVED' },
    orderBy: { entryDate: 'desc' },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, displayName: true } },
    },
  }),
])

// Merge and sort by date descending
const expenseAsPayments = expenseEntries.map((e) => ({
  id: e.id,
  publisherId: id,
  date: e.entryDate,
  amount: e.amount,
  paymentMethod: e.paymentMethod,
  referenceId: e.referenceId,
  notes: e.notes,
  entryType: e.entryType,
  category: e.category,
  branch: e.branch,
  createdBy: e.createdBy,
  source: 'expense_entry', // distinguishes from direct publisher payments
}))

const allPayments = [...payments.map((p) => ({ ...p, source: 'publisher_payment' })), ...expenseAsPayments]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
```

Return `allPayments` (or add alongside existing response structure as `paymentHistory`).

- [ ] **Step 3: Verify**

1. Create a Cash Handover selecting a publisher as vendor (e.g., "Books Vendor XYZ")
2. Go to Accounts → Publishers → click that publisher
3. The payment history should now include the cash handover entry with amount, date, category, and entry type

- [ ] **Step 4: Commit**
```bash
git add backend/src/modules/publishers/publishers.controller.js
git commit -m "feat: include expense entries in publisher payment ledger when vendor is linked"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] FIX 1 — Entry Date + Recorded Date in history: Task 3
- [x] FIX 2 — Rename Description → Recipient for Online Allocation: Task 4 + Task 6
- [x] FIX 3 — Branch-specific payment methods (online only): Task 7
- [x] FIX 4 — Remove EXPENSE type, add Category + vendor picker, migrate data: Tasks 5 + 6
- [x] FIX 5 — Collapsible transaction history section: Task 2
- [x] FIX 6 — Wire vendors to Accounts module: Task 8 (publisher ledger)
- [x] FIX 7 — Rename module to "Finance": Task 1

**Daily position calculations still use entryDate (not createdAt):** Confirmed — `computeOpeningBalance`, `getDailyPosition`, and `getDashboard` all filter by `entryDate`. No changes needed there.

**Backward compatibility for EXPENSE entries:** EXPENSE remains in enum; old entries display correctly via the preserved `ENTRY_TYPE_LABELS.EXPENSE` and the `ManualEntriesTable` rendering path.

**ONLINE_ALLOCATION description field backward compat:** History table shows `entry.publisher?.name ?? entry.recipient ?? entry.description ?? '—'` — old entries that only have `description` populated still render correctly.

**Branch paymentMethods empty = all methods:** Enforced in `CreateEntryDrawer` — `branchPaymentMethods.length > 0` check falls back to full `ONLINE_PAYMENT_METHODS` list.
