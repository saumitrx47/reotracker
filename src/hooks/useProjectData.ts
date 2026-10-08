import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getDeliveries,
  getForecast,
  getProject,
  getReconciliationItems,
  getZones,
  createDelivery,
  decideChangeRequest,
  documentDelivery,
  issueDesignRevision,
  markNotificationsRead,
  markReconciled,
  raiseChangeRequest,
  recordInstalled,
  resetDemo,
  switchUser,
} from '../data/api'
import { useStore, type ChangeRequest, type DeliveryDraft, type DemoState } from '../data/store'
import type { RoleId } from '../data/users'
import { can, type Permission } from '../lib/permissions'
import type { DerivedAlert } from '../lib/alerts'

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

const noop = () => {}

/**
 * Store-backed resource with the same shape as `useAsync`, so views keep their
 * loading/error branches for when the store is fed by a real network call.
 */
function useResource<T>(select: (s: DemoState) => T): AsyncState<T> {
  const data = select(useStore().state)
  return useMemo(() => ({ data, loading: false, error: null, reload: noop }), [data])
}

export const useProject = () => useResource(getProject)
export const useZones = () => useResource(getZones)
export const useReconciliationItems = () => useResource(getReconciliationItems)
export const useDeliveries = () => useResource(getDeliveries)
/** Discrepancy alerts, derived from live data once in the store provider (see `lib/alerts.ts`). */
export function useAlerts(): AsyncState<DerivedAlert[]> {
  const { alerts } = useStore()
  return useMemo(() => ({ data: alerts, loading: false, error: null, reload: noop }), [alerts])
}
export const useForecast = () => useAsync(getForecast, [])

export const useCurrentUser = () => useStore().currentUser

/** id → record maps for O(1) lookups in render loops. */
export function useLookups() {
  const { itemsById, zonesById } = useStore()
  return useMemo(() => ({ itemsById, zonesById }), [itemsById, zonesById])
}

/** `can(action)` for the account this tab is signed in as. */
export function useCan() {
  const user = useCurrentUser()
  return useCallback((action: Permission) => can(user, action), [user])
}

/** Write commands bound to the store. */
export function useCommands() {
  const { dispatch } = useStore()
  return useMemo(
    () => ({
      markReconciled: (itemId: string, reconciled: boolean) => markReconciled(dispatch, itemId, reconciled),
      createDelivery: (draft: DeliveryDraft) => createDelivery(dispatch, draft),
      recordInstalled: (itemId: string, installedT: number) => recordInstalled(dispatch, itemId, installedT),
      issueDesignRevision: (itemId: string, requiredT: number, revision: string) =>
        issueDesignRevision(dispatch, itemId, requiredT, revision),
      raiseChangeRequest: (request: Pick<ChangeRequest, 'type' | 'fromItemId' | 'toItemId' | 'quantityT'>) =>
        raiseChangeRequest(dispatch, request),
      decideChangeRequest: (requestId: string, approve: boolean) => decideChangeRequest(dispatch, requestId, approve),
      documentDelivery: (deliveryId: string) => documentDelivery(dispatch, deliveryId),
      markNotificationsRead: (role: RoleId) => markNotificationsRead(dispatch, role),
      switchUser: (userId: string) => switchUser(dispatch, userId),
      resetDemo: () => resetDemo(dispatch),
    }),
    [dispatch],
  )
}
