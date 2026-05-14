import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic hook for a single API call.
 * Returns { data, loading, error, refetch }
 */
export function useApi(apiFn, params, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const paramsRef = useRef(params)
  paramsRef.current = params

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(paramsRef.current)
      // Skip when caller returns null/undefined (e.g. `() => (isSuperAdmin ? api.list() : null)`).
      // Otherwise `res.data` throws and every non–super-admin hit spuriously enters the error path.
      if (res == null) {
        setData(null)
        return
      }
      // Avoid throwing on odd axios payloads (e.g. cached 304 / empty body) which would blank the tree.
      const body = res?.data
      const payload = body && typeof body === 'object' && 'data' in body ? body.data : undefined
      setData(payload !== undefined ? payload : null)
    } catch (err) {
      setData(null)
      const msg =
        err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout')
          ? 'Request timed out. Check your connection and try again.'
          : err?.response?.data?.message || 'Failed to load data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * Hook for a mutation (POST / PATCH / DELETE).
 * Returns { mutate, loading, error, data }
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      const result = res.data.data
      setData(result)
      return result
    } catch (err) {
      const msg = err?.response?.data?.message || 'Operation failed'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  return { mutate, loading, error, data }
}
