/**
 * Data access layer.
 *
 * Every view talks to the app through these functions, never to `mock-data.ts`
 * directly. Swapping the stub for a real backend is therefore a change to this
 * one file — replace each body with a `fetch` returning the same shape, e.g.
 *
 *   export async function getDeliveries(): Promise<Delivery[]> {
 *     const res = await fetch(`${API_BASE}/projects/${projectId}/deliveries`)
 *     if (!res.ok) throw new Error(`Deliveries request failed: ${res.status}`)
 *     return res.json()
 *   }
 */
import {
  alerts,
  deliveries,
  forecast,
  project,
  reconciliationItems,
  zones,
  type Alert,
  type Delivery,
  type ForecastPoint,
  type Project,
  type ReconciliationItem,
  type Zone,
} from './mock-data'

/** Stand-in for network latency so loading states are exercised in the demo. */
const LATENCY_MS = 180

function resolve<T>(value: T): Promise<T> {
  return new Promise((done) => setTimeout(() => done(structuredClone(value)), LATENCY_MS))
}

export const getProject = (): Promise<Project> => resolve(project)
export const getZones = (): Promise<Zone[]> => resolve(zones)
export const getReconciliationItems = (): Promise<ReconciliationItem[]> => resolve(reconciliationItems)
export const getDeliveries = (): Promise<Delivery[]> => resolve(deliveries)
export const getAlerts = (): Promise<Alert[]> => resolve(alerts)
export const getForecast = (): Promise<ForecastPoint[]> => resolve(forecast)

/**
 * Stub write. A real implementation would POST and return the persisted record;
 * here the caller keeps the result in local state only.
 */
export async function markReconciled(itemId: string, reconciled: boolean): Promise<{ id: string; reconciled: boolean }> {
  await resolve(null)
  return { id: itemId, reconciled }
}

export async function createDelivery(draft: Omit<Delivery, 'id'>): Promise<Delivery> {
  await resolve(null)
  return { ...draft, id: `DKT-${Math.floor(2400 + Math.random() * 99)}` }
}
