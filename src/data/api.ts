/**
 * Data access layer.
 *
 * Every view talks to the app through this module, never to `mock-data.ts` or
 * the store internals directly. Reads are selectors over the shared store
 * snapshot; writes are async commands that dispatch to it. Swapping the demo
 * for a real backend is therefore a change to this one file — e.g.
 *
 *   export async function markReconciled(dispatch, itemId, reconciled) {
 *     const res = await fetch(`${API_BASE}/items/${itemId}`, { method: 'PATCH', body: … })
 *     if (!res.ok) throw new Error(`Reconcile failed: ${res.status}`)
 *     dispatch({ type: 'hydrate', shared: await res.json() })
 *   }
 */
import type { Dispatch } from 'react'
import { alerts, forecast, type Alert, type ForecastPoint } from './mock-data'
import type { ChangeRequest, DeliveryDraft, DemoState, Meta, StoreAction } from './store'
import type { RoleId } from './users'

export type StoreDispatch = Dispatch<StoreAction>

// --- Reads ------------------------------------------------------------------

export const getProject = (s: DemoState) => s.project
export const getZones = (s: DemoState) => s.zones
export const getReconciliationItems = (s: DemoState) => s.reconciliationItems
export const getDeliveries = (s: DemoState) => s.deliveries
/** Static until alerts are derived from live data (Stage 4). */
export const getAlerts = (): Alert[] => alerts

/** Stand-in for network latency so the forecast's loading state is exercised. */
const LATENCY_MS = 180

/** The forecast is a fixed model in this demo and stays an async fetch. */
export const getForecast = (): Promise<ForecastPoint[]> =>
  new Promise((done) => setTimeout(() => done(structuredClone(forecast)), LATENCY_MS))

// --- Writes -----------------------------------------------------------------

let seq = 0
function meta(prefix: string): Meta {
  seq += 1
  return { id: `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`, at: new Date().toISOString() }
}

/** Demo-only: change which account this tab acts as. */
export async function switchUser(dispatch: StoreDispatch, userId: string): Promise<void> {
  dispatch({ type: 'switchUser', userId })
}

/** Demo-only: restore the seed data for every user and tab. */
export async function resetDemo(dispatch: StoreDispatch): Promise<void> {
  dispatch({ type: 'reset' })
}

export async function markReconciled(dispatch: StoreDispatch, itemId: string, reconciled: boolean): Promise<void> {
  dispatch({ type: 'setReconciled', meta: meta('ACT'), itemId, reconciled })
}

/** Records a docket. A PO not yet on file for the zone + item adds to its ordered quantity. */
export async function createDelivery(dispatch: StoreDispatch, draft: DeliveryDraft): Promise<void> {
  dispatch({ type: 'recordDelivery', meta: meta('ACT'), draft })
}

export async function recordInstalled(dispatch: StoreDispatch, itemId: string, installedT: number): Promise<void> {
  dispatch({ type: 'setInstalled', meta: meta('ACT'), itemId, installedT })
}

/** New requirement + drawing revision; the line item drops back to unreconciled. */
export async function issueDesignRevision(
  dispatch: StoreDispatch,
  itemId: string,
  requiredT: number,
  revision: string,
): Promise<void> {
  dispatch({ type: 'issueRevision', meta: meta('ACT'), itemId, requiredT, revision })
}

export async function raiseChangeRequest(
  dispatch: StoreDispatch,
  request: Pick<ChangeRequest, 'type' | 'fromItemId' | 'toItemId' | 'quantityT'>,
): Promise<void> {
  dispatch({ type: 'raiseRequest', meta: meta('ACT'), request })
}

export async function decideChangeRequest(dispatch: StoreDispatch, requestId: string, approve: boolean): Promise<void> {
  dispatch({ type: 'decideRequest', meta: meta('ACT'), requestId, approve })
}

/** Files the ACRS certificate and closes the docket out as Documented. */
export async function documentDelivery(dispatch: StoreDispatch, deliveryId: string): Promise<void> {
  dispatch({ type: 'documentDelivery', meta: meta('ACT'), deliveryId })
}

export async function markNotificationsRead(dispatch: StoreDispatch, role: RoleId): Promise<void> {
  dispatch({ type: 'markRead', role })
}
