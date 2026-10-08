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
import type { DemoState, Meta, StoreAction } from './store'

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

export async function markReconciled(dispatch: StoreDispatch, itemId: string, reconciled: boolean): Promise<void> {
  dispatch({ type: 'setReconciled', meta: meta('ACT'), itemId, reconciled })
}
