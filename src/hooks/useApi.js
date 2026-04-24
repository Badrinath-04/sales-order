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
      setData(res.data.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

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
