import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SidebarContext = createContext(null)

function isViewportLg() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
}

export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  const toggle = useCallback(() => {
    if (isViewportLg()) {
      setIsDesktopCollapsed((c) => !c)
    } else {
      setMobileOpen((v) => !v)
    }
  }, [])

  /** Close the mobile drawer only (e.g. after navigation). Does not collapse the desktop sidebar. */
  const close = useCallback(() => {
    setMobileOpen(false)
  }, [])

  /** Collapse desktop sidebar or close mobile drawer (e.g. sidebar close button). */
  const dismiss = useCallback(() => {
    if (isViewportLg()) {
      setIsDesktopCollapsed(true)
    } else {
      setMobileOpen(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      isOpen: mobileOpen,
      isDesktopCollapsed,
      toggle,
      close,
      dismiss,
    }),
    [mobileOpen, isDesktopCollapsed, toggle, close, dismiss],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    return {
      isOpen: false,
      isDesktopCollapsed: false,
      toggle: () => {},
      close: () => {},
      dismiss: () => {},
    }
  }
  return ctx
}
