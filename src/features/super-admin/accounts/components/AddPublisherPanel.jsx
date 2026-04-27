import { useState } from 'react'
import { publishersApi } from '@/services/api'

export default function AddPublisherPanel({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setError('')
    if (!form.name.trim()) { setError('Publisher name is required.'); return }
    setSaving(true)
    try {
      await publishersApi.create(form)
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save publisher.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-8">
          <h2 className="font-headline text-xl font-bold">Add Publisher</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4 p-8">
          <Field label="Publisher Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Oxford Press" />
          <Field label="Contact Person" value={form.contactPerson} onChange={(v) => set('contactPerson', v)} placeholder="Name" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+91 99999 99999" />
            <Field label="Email" value={form.email} onChange={(v) => set('email', v)} placeholder="name@publisher.com" type="email" />
          </div>
          <Field label="Address" value={form.address} onChange={(v) => set('address', v)} placeholder="Optional" />
          <Field label="Notes" value={form.notes} onChange={(v) => set('notes', v)} placeholder="Any notes…" />
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-100 px-8 pb-8 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add Publisher'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )
}
