import { useCallback, useState } from 'react'
import { adminMgmtApi, branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/context/ToastContext'

const PERMISSION_GROUPS = [
  {
    group: 'Stock & Inventory',
    items: [
      { key: 'canUpdateStock',      label: 'Update stock (add / adjust quantities)' },
      { key: 'canAdjustStock',      label: 'Adjust stock via single-item panel' },
      { key: 'canBulkEditStock',    label: 'Bulk edit class stock' },
      { key: 'canCreateProducts',   label: 'Create / edit products' },
      { key: 'canViewStockLogs',    label: 'View stock logs & audit history' },
    ],
  },
  {
    group: 'Orders & Students',
    items: [
      { key: 'canPlaceOrders',      label: 'Place new orders' },
      { key: 'canManageStudents',   label: 'Add / edit students' },
      { key: 'canBulkImport',       label: 'Access bulk import' },
      { key: 'canResetStudentData', label: 'Reset student data' },
    ],
  },
  {
    group: 'Financials',
    items: [
      { key: 'canViewTransactions',        label: 'View transaction history' },
      { key: 'canViewRevenue',             label: 'View revenue & collection amounts' },
      { key: 'canViewReports',             label: 'View financial reports & analytics' },
      { key: 'canViewPublisherFinancials', label: 'View publisher financials & balances' },
    ],
  },
  {
    group: 'Publishers & Accounts',
    items: [
      { key: 'canManagePublishers', label: 'Manage publishers' },
      { key: 'canManageAccounts',   label: 'Manage accounts & expenses' },
    ],
  },
]

// Flat list for iteration convenience
const PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.items)

const DEFAULT_PERMISSIONS = {
  SENIOR_ADMIN: {
    canUpdateStock: true, canAdjustStock: false, canBulkEditStock: false,
    canCreateProducts: false, canViewStockLogs: false,
    canPlaceOrders: true, canManageStudents: true, canBulkImport: false, canResetStudentData: false,
    canViewTransactions: false, canViewRevenue: false, canViewReports: false, canViewPublisherFinancials: false,
    canManagePublishers: false, canManageAccounts: false,
  },
  ADMIN: {
    canUpdateStock: false, canAdjustStock: false, canBulkEditStock: false,
    canCreateProducts: false, canViewStockLogs: false,
    canPlaceOrders: true, canManageStudents: true, canBulkImport: false, canResetStudentData: false,
    canViewTransactions: true, canViewRevenue: true, canViewReports: true, canViewPublisherFinancials: false,
    canManagePublishers: false, canManageAccounts: false,
  },
}

function RoleBadge({ role }) {
  const cls = role === 'SENIOR_ADMIN'
    ? 'bg-secondary-container text-on-secondary-container'
    : 'bg-primary-fixed text-on-primary-fixed-variant'
  const label = role === 'SENIOR_ADMIN' ? 'Senior Admin' : 'School Admin'
  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${cls}`}>{label}</span>
}

function StatusDot({ isActive }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-outline-variant'}`} />
  )
}

function CreateAdminDrawer({ branches, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    displayName: '', username: '', password: '', role: 'SENIOR_ADMIN', branchId: '',
    permissions: { ...DEFAULT_PERMISSIONS.SENIOR_ADMIN },
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleRoleChange = (role) => {
    setForm((f) => ({ ...f, role, permissions: { ...DEFAULT_PERMISSIONS[role] } }))
  }

  const togglePerm = (key) => {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }))
  }

  const validate = () => {
    const e = {}
    if (!form.displayName.trim()) e.displayName = 'Name is required'
    if (!form.username.trim()) e.username = 'Username is required'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.branchId) e.branchId = 'Branch is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const admin = await adminMgmtApi.create({
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        branchId: form.branchId,
        permissions: form.permissions,
      })
      toast.success(`Admin "${form.displayName}" created successfully`)
      onCreated(admin?.data?.data ?? admin?.data)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create admin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h2 className="font-headline text-xl font-extrabold">Create Admin Account</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-surface-container-low">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Full Name" error={errors.displayName}>
              <input type="text" value={form.displayName} onChange={(e) => set('displayName', e.target.value)}
                className={inputCls(errors.displayName)} placeholder="Admin display name" />
            </Field>
            <Field label="Username / Login" error={errors.username}>
              <input type="text" value={form.username} onChange={(e) => set('username', e.target.value)}
                className={inputCls(errors.username)} placeholder="Lowercase, no spaces" />
            </Field>
            <Field label="Password" error={errors.password}>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                className={inputCls(errors.password)} placeholder="Min 8 characters" />
            </Field>
            <Field label="Role">
              <div className="flex gap-3">
                {['SENIOR_ADMIN', 'ADMIN'].map((r) => (
                  <label key={r} className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border-2 p-3 transition-colors ${form.role === r ? 'border-primary bg-primary/5' : 'border-outline-variant/20'}`}>
                    <input type="radio" className="sr-only" checked={form.role === r} onChange={() => handleRoleChange(r)} />
                    <div className={`h-4 w-4 rounded-full border-2 ${form.role === r ? 'border-primary bg-primary' : 'border-outline-variant'}`} />
                    <span className="text-sm font-semibold">{r === 'SENIOR_ADMIN' ? 'Senior Admin' : 'School Admin'}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Branch" error={errors.branchId}>
              <select value={form.branchId} onChange={(e) => set('branchId', e.target.value)} className={inputCls(errors.branchId)}>
                <option value="">— Select branch —</option>
                {branches.filter((b) => b.type !== 'MAIN').map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-4 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Permissions</p>
            <div className="space-y-5">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">{group.group}</p>
                  <div className="space-y-2.5">
                    {group.items.map(({ key, label }) => (
                      <label key={key} className="flex cursor-pointer items-center gap-3">
                        <input type="checkbox" checked={!!form.permissions[key]} onChange={() => togglePerm(key)}
                          className="rounded border-outline-variant text-primary focus:ring-primary" />
                        <span className="text-sm text-on-surface">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold hover:bg-surface-container-low">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditPermissionsDrawer({ admin, branches, onClose, onSaved }) {
  const toast = useToast()
  const [perms, setPerms] = useState(admin.permissions ?? { ...DEFAULT_PERMISSIONS[admin.role] })
  const [branchId, setBranchId] = useState(admin.branch?.id ?? '')
  const [isActive, setIsActive] = useState(admin.isActive)
  const [saving, setSaving] = useState(false)
  const [resetPwd, setResetPwd] = useState('')
  const [resetting, setResetting] = useState(false)

  const togglePerm = (key) => setPerms((p) => ({ ...p, [key]: !p[key] }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminMgmtApi.update(admin.id, { branchId, permissions: perms, isActive })
      toast.success('Permissions updated')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (resetPwd.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setResetting(true)
    try {
      await adminMgmtApi.resetPassword(admin.id, resetPwd)
      toast.success('Password reset — admin must change on next login')
      setResetPwd('')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <div>
            <h2 className="font-headline text-xl font-extrabold">{admin.displayName}</h2>
            <p className="text-sm text-on-surface-variant">{admin.username} · {admin.branch?.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-surface-container-low">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputCls()}>
              {branches.filter((b) => b.type !== 'MAIN').map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary" />
            <span className="text-sm font-medium">Account Active</span>
          </label>
          <div>
            <p className="mb-4 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Permissions</p>
            <div className="space-y-5">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">{group.group}</p>
                  <div className="space-y-2.5">
                    {group.items.map(({ key, label }) => (
                      <label key={key} className="flex cursor-pointer items-center gap-3">
                        <input type="checkbox" checked={!!perms[key]} onChange={() => togglePerm(key)}
                          className="rounded border-outline-variant text-primary focus:ring-primary" />
                        <span className="text-sm text-on-surface">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Reset Password</p>
            <div className="flex gap-2">
              <input type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)}
                placeholder="New password (min 8 chars)" className={`flex-1 ${inputCls()}`} />
              <button type="button" disabled={resetting} onClick={handleResetPassword}
                className="rounded-xl bg-error px-4 py-2 text-sm font-bold text-on-error hover:opacity-90 disabled:opacity-50">
                {resetting ? '…' : 'Reset'}
              </button>
            </div>
          </div>
          <div className="mt-auto flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold hover:bg-surface-container-low">
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={handleSave}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}

function inputCls(err) {
  return `w-full rounded-xl border ${err ? 'border-error' : 'border-outline-variant/30'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30`
}

export default function AdminManagement() {
  const toast = useToast()
  const fetchAdmins = useCallback(() => adminMgmtApi.list(), [])
  const { data: adminsData, loading, refetch } = useApi(fetchAdmins, null, [])
  const admins = Array.isArray(adminsData) ? adminsData : (adminsData?.data ?? [])

  const fetchBranches = useCallback(() => branchesApi.list(), [])
  const { data: branchesData } = useApi(fetchBranches, null, [])
  const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])

  const [showCreate, setShowCreate] = useState(false)
  const [editAdmin, setEditAdmin] = useState(null)

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="headline text-3xl font-extrabold tracking-tight text-on-surface">Admin Management</h1>
          <p className="mt-2 text-on-surface-variant">Create and manage School Admin and Senior Admin accounts.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-body text-sm font-bold text-on-primary shadow-md hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>person_add</span>
          New Admin
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              {['Name', 'Role', 'Branch', 'Permissions', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {loading && (
              <tr><td colSpan={7} className="px-6 py-8 text-sm text-on-surface-variant">Loading admins…</td></tr>
            )}
            {!loading && admins.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-sm text-on-surface-variant">No admin accounts yet. Create one above.</td></tr>
            )}
            {admins.map((admin) => {
              const perms = admin.permissions ?? DEFAULT_PERMISSIONS[admin.role] ?? {}
              const permCount = Object.values(perms).filter(Boolean).length
              return (
                <tr key={admin.id} className="hover:bg-surface-container-low">
                  <td className="px-6 py-4">
                    <p className="font-semibold">{admin.displayName}</p>
                    <p className="text-xs text-on-surface-variant">{admin.username}</p>
                  </td>
                  <td className="px-6 py-4"><RoleBadge role={admin.role} /></td>
                  <td className="px-6 py-4 text-on-surface-variant">{admin.branch?.name ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-on-surface-variant">{permCount} / {PERMISSION_KEYS.length} on</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusDot isActive={admin.isActive} />
                      <span className="text-xs">{admin.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setEditAdmin(admin)}
                      className="rounded-lg p-2 text-primary hover:bg-primary/5"
                      aria-label={`Edit ${admin.displayName}`}
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden>edit</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateAdminDrawer
          branches={branches}
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
      {editAdmin && (
        <EditPermissionsDrawer
          admin={editAdmin}
          branches={branches}
          onClose={() => setEditAdmin(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  )
}
