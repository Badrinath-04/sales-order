import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let _toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_toastId
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const toast = {
    success: (msg, dur) => push(msg, 'success', dur),
    error: (msg, dur) => push(msg, 'error', dur ?? 5000),
    info: (msg, dur) => push(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex min-w-[280px] max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-xl transition-all animate-in slide-in-from-right-4 ${
              t.type === 'error'
                ? 'bg-error text-on-error'
                : t.type === 'info'
                ? 'bg-primary text-on-primary'
                : 'bg-[#1b5e20] text-white'
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-xl" aria-hidden>
              {t.type === 'error' ? 'error' : t.type === 'info' ? 'info' : 'check_circle'}
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-base" aria-hidden>close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
