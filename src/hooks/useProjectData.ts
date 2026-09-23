import { useCallback, useEffect, useState } from 'react'
import {
  getAlerts,
  getDeliveries,
  getForecast,
  getProject,
  getReconciliationItems,
  getZones,
} from '../data/api'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Minimal async-resource hook. Because every view reads through `data/api.ts`,
 * pointing these loaders at a real HTTP endpoint needs no change here.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // The loader identity is owned by the caller; deps are passed through explicitly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  useEffect(() => {
    let live = true
    setLoading(true)
    setError(null)
    run()
      .then((result) => {
        if (live) setData(result)
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : 'Unable to load data')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [run, nonce])

  return { data, loading, error, reload: () => setNonce((n) => n + 1) }
}

export const useProject = () => useAsync(getProject, [])
export const useZones = () => useAsync(getZones, [])
export const useReconciliationItems = () => useAsync(getReconciliationItems, [])
export const useDeliveries = () => useAsync(getDeliveries, [])
export const useAlerts = () => useAsync(getAlerts, [])
export const useForecast = () => useAsync(getForecast, [])
