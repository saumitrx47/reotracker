/**
 * Shared live store — the single source of truth for every view.
 *
 * A React context + reducer seeded from `mock-data.ts`. Shared slices persist
 * to localStorage under one versioned key and sync across browser tabs via the
 * `storage` event, so two tabs can play two different users. The signed-in
 * demo account is per tab (sessionStorage) and never synced.
 *
 * Views don't touch this module directly: they read through the hooks in
 * `hooks/useProjectData.ts` and write through the commands in `data/api.ts`.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react'
import * as seed from './mock-data'
import type { Delivery, Project, ReconciliationItem, Zone } from './mock-data'
import { DEFAULT_USER_ID, USERS, roleLabel, userById, type DemoUser, type RoleId } from './users'
import { can, type Permission } from '../lib/permissions'
import { REQUEST_LABELS, describeRequest, itemRef, touchesItem } from '../lib/requests'
import { fmtT, round2 } from '../lib/validation'

export interface Notification {
  id: string
  at: string
  /** Roles whose bell shows this notification. */
  toRoles: RoleId[]
  fromUserId: string
  text: string
  /** Roles that have marked it read (read state is per role, not per tab). */
  readBy: RoleId[]
}

export interface ActivityEntry {
  id: string
  at: string
  userId: string
  /** Role label at the time of the action, kept for the audit trail. */
  role: string
  action: string
  target: string
  before: string
  after: string
}

export type ChangeRequestType = 'cancel' | 'topup' | 'reallocate'
export type ChangeRequestStatus = 'Pending' | 'Approved' | 'Rejected'

export interface ChangeRequest {
  id: string
  type: ChangeRequestType
  /** Line item whose order is reduced (cancel, reallocate source). */
  fromItemId?: string
  /** Line item whose order is increased (top-up, reallocate target). */
  toItemId?: string
  quantityT: number
  status: ChangeRequestStatus
  raisedBy: string
  raisedAt: string
  decidedBy?: string
  decidedAt?: string
}

/** Everything that is shared between users (and tabs). */
export interface SharedState {
  project: Project
  zones: Zone[]
  reconciliationItems: ReconciliationItem[]
  deliveries: Delivery[]
  notifications: Notification[]
  activityLog: ActivityEntry[]
  changeRequests: ChangeRequest[]
  /** First-seen timestamp per derived alert key, so `raisedAt` is stable. */
  alertFirstSeen: Record<string, string>
}

export interface DemoState extends SharedState {
  currentUserId: string
}

export const STORAGE_KEY = 'reotracker-demo-v1'
const USER_KEY = `${STORAGE_KEY}:user`

// ---------------------------------------------------------------------------
// Seed

export function seedShared(): SharedState {
  return structuredClone({
    project: seed.project,
    zones: seed.zones,
    reconciliationItems: seed.reconciliationItems,
    deliveries: seed.deliveries,
    notifications: [],
    activityLog: [],
    changeRequests: [],
    alertFirstSeen: {},
  })
}

function isSharedState(value: unknown): value is SharedState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    !!v.project &&
    typeof v.project === 'object' &&
    ['zones', 'reconciliationItems', 'deliveries', 'notifications', 'activityLog', 'changeRequests'].every((k) =>
      Array.isArray(v[k]),
    ) &&
    !!v.alertFirstSeen &&
    typeof v.alertFirstSeen === 'object'
  )
}

function parseShared(raw: string | null): SharedState | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isSharedState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readStoredShared(): SharedState {
  try {
    return parseShared(localStorage.getItem(STORAGE_KEY)) ?? seedShared()
  } catch {
    return seedShared()
  }
}

function readStoredUser(): string {
  try {
    const id = sessionStorage.getItem(USER_KEY)
    return id && USERS.some((u) => u.id === id) ? id : DEFAULT_USER_ID
  } catch {
    return DEFAULT_USER_ID
  }
}

const sharedOf = (s: DemoState): SharedState => ({
  project: s.project,
  zones: s.zones,
  reconciliationItems: s.reconciliationItems,
  deliveries: s.deliveries,
  notifications: s.notifications,
  activityLog: s.activityLog,
  changeRequests: s.changeRequests,
  alertFirstSeen: s.alertFirstSeen,
})

// ---------------------------------------------------------------------------
// Reducer

/** Ids and timestamps are minted by the caller so the reducer stays pure. */
export interface Meta {
  id: string
  at: string
}

export interface DeliveryDraft {
  /** Optional — a docket number is generated when left blank. */
  id?: string
  date: string
  supplier: string
  quantityT: number
  zoneId: string
  itemCode: string
  poNumber: string
  batchNo: string
  acrsCertified: boolean
}

export type StoreAction =
  | { type: 'hydrate'; shared: SharedState }
  | { type: 'reset' }
  | { type: 'switchUser'; userId: string }
  | { type: 'setReconciled'; meta: Meta; itemId: string; reconciled: boolean }
  | { type: 'recordDelivery'; meta: Meta; draft: DeliveryDraft }
  | { type: 'setInstalled'; meta: Meta; itemId: string; installedT: number }
  | { type: 'issueRevision'; meta: Meta; itemId: string; requiredT: number; revision: string }
  | { type: 'raiseRequest'; meta: Meta; request: Pick<ChangeRequest, 'type' | 'fromItemId' | 'toItemId' | 'quantityT'> }
  | { type: 'decideRequest'; meta: Meta; requestId: string; approve: boolean }
  | { type: 'documentDelivery'; meta: Meta; deliveryId: string }
  | { type: 'markRead'; role: RoleId }
  | { type: 'syncAlertFirstSeen'; add: Record<string, string>; remove: string[] }

interface AuditEntry {
  action: string
  target: string
  before: string
  after: string
  notify: RoleId[]
  /** Notification text; the actor's name is shown alongside it. */
  message: string
}

/** Appends one audit-log entry and one notification for the roles that care. */
function audit(state: DemoState, meta: Meta, entry: AuditEntry): Pick<DemoState, 'activityLog' | 'notifications'> {
  const user = userById(state.currentUserId)
  return {
    activityLog: [
      ...state.activityLog,
      {
        id: meta.id,
        at: meta.at,
        userId: user.id,
        role: roleLabel(user.role),
        action: entry.action,
        target: entry.target,
        before: entry.before,
        after: entry.after,
      },
    ],
    notifications: entry.notify.length
      ? [
          ...state.notifications,
          { id: `N-${meta.id}`, at: meta.at, toRoles: entry.notify, fromUserId: user.id, text: entry.message, readBy: [] },
        ]
      : state.notifications,
  }
}

const updateItem = (items: ReconciliationItem[], id: string, patch: Partial<ReconciliationItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...patch } : i))

function nextDocketId(deliveries: Delivery[]): string {
  const max = deliveries.reduce((m, d) => Math.max(m, Number(/^DKT-(\d+)$/.exec(d.id)?.[1] ?? 0)), 0)
  return `DKT-${max + 1}`
}

export function reducer(state: DemoState, action: StoreAction): DemoState {
  const user = userById(state.currentUserId)
  const allowed = (p: Permission) => can(user, p)
  const zoneCode = (zoneId: string) => state.zones.find((z) => z.id === zoneId)?.code ?? zoneId
  const findItem = (id: string | undefined) => state.reconciliationItems.find((i) => i.id === id)
  const itemLabel = (i: ReconciliationItem) => `${zoneCode(i.zoneId)} ${i.itemCode}`

  switch (action.type) {
    case 'hydrate':
      return { ...action.shared, currentUserId: state.currentUserId }

    case 'reset':
      return { ...seedShared(), currentUserId: state.currentUserId }

    case 'switchUser':
      return USERS.some((u) => u.id === action.userId) ? { ...state, currentUserId: action.userId } : state

    case 'setReconciled': {
      const item = findItem(action.itemId)
      if (!allowed('reconcile') || !item || item.reconciled === action.reconciled) return state
      return {
        ...state,
        reconciliationItems: updateItem(state.reconciliationItems, item.id, { reconciled: action.reconciled }),
        ...audit(state, action.meta, {
          action: action.reconciled ? 'Marked reconciled' : 'Reopened reconciliation',
          target: itemLabel(item),
          before: item.reconciled ? 'Reconciled' : 'Unreconciled',
          after: action.reconciled ? 'Reconciled' : 'Unreconciled',
          notify: ['pm'],
          message: `${action.reconciled ? 'signed off' : 'reopened'} ${itemLabel(item)} (${item.designRevision}, ${fmtT(item.orderedT)} ordered vs ${fmtT(item.requiredT)} required)`,
        }),
      }
    }

    case 'recordDelivery': {
      const d = action.draft
      const item = state.reconciliationItems.find((i) => i.zoneId === d.zoneId && i.itemCode === d.itemCode)
      const id = d.id?.trim() || nextDocketId(state.deliveries)
      if (!allowed('recordDelivery') || !item || !(d.quantityT > 0) || state.deliveries.some((x) => x.id === id)) return state
      const isNewPo = !state.deliveries.some(
        (x) => x.zoneId === d.zoneId && x.itemCode === d.itemCode && x.poNumber === d.poNumber,
      )
      const orderedAfter = round2(item.orderedT + d.quantityT)
      const delivery: Delivery = {
        id,
        date: d.date,
        supplier: d.supplier,
        quantityT: d.quantityT,
        zoneId: d.zoneId,
        itemCode: d.itemCode,
        status: 'Pending',
        poNumber: d.poNumber,
        batchNo: d.batchNo,
        acrsCertified: d.acrsCertified,
      }
      return {
        ...state,
        deliveries: [delivery, ...state.deliveries],
        reconciliationItems: isNewPo
          ? updateItem(state.reconciliationItems, item.id, { orderedT: orderedAfter })
          : state.reconciliationItems,
        ...audit(state, action.meta, {
          action: 'Recorded delivery',
          target: `${id} · ${itemLabel(item)}`,
          before: isNewPo ? `Ordered ${fmtT(item.orderedT)}` : '—',
          after: `${fmtT(d.quantityT)} on ${d.poNumber}${isNewPo ? ` (new PO) · ordered ${fmtT(orderedAfter)}` : ''}${d.acrsCertified ? ' · ACRS sighted' : ' · cert outstanding'}`,
          notify: ['qs', 'proc'],
          message: `recorded ${id}: ${fmtT(d.quantityT)} ${d.itemCode} to ${zoneCode(d.zoneId)} on ${isNewPo ? `new ${d.poNumber} — ordered now ${fmtT(orderedAfter)}` : d.poNumber}${d.acrsCertified ? '' : ' (certificate outstanding)'}`,
        }),
      }
    }

    case 'setInstalled': {
      const item = findItem(action.itemId)
      if (!allowed('recordInstalled') || !item || !(action.installedT > 0)) return state
      return {
        ...state,
        reconciliationItems: updateItem(state.reconciliationItems, item.id, { installedT: action.installedT }),
        ...audit(state, action.meta, {
          action: 'Updated installed qty',
          target: itemLabel(item),
          before: fmtT(item.installedT),
          after: fmtT(action.installedT),
          notify: ['qs'],
          message: `updated installed quantity on ${itemLabel(item)}: ${fmtT(item.installedT)} → ${fmtT(action.installedT)}`,
        }),
      }
    }

    case 'issueRevision': {
      const item = findItem(action.itemId)
      const revision = action.revision.trim()
      if (!allowed('issueRevision') || !item || !(action.requiredT > 0) || !revision) return state
      return {
        ...state,
        reconciliationItems: updateItem(state.reconciliationItems, item.id, {
          requiredT: action.requiredT,
          designRevision: revision,
          reconciled: false,
          // Seeded alert wording describes the old revision; drop it.
          alertNotes: undefined,
        }),
        ...audit(state, action.meta, {
          action: 'Issued design revision',
          target: itemLabel(item),
          before: `${item.designRevision} · ${fmtT(item.requiredT)} required${item.reconciled ? ' · reconciled' : ''}`,
          after: `${revision} · ${fmtT(action.requiredT)} required · unreconciled`,
          notify: ['qs', 'pm'],
          message: `issued ${revision} on ${itemLabel(item)}: requirement ${fmtT(item.requiredT)} → ${fmtT(action.requiredT)}; needs re-reconciling`,
        }),
      }
    }

    case 'raiseRequest': {
      const r = action.request
      const from = findItem(r.fromItemId)
      const to = findItem(r.toItemId)
      const shapeOk =
        (r.type === 'cancel' && from && !to) || (r.type === 'topup' && to && !from) || (r.type === 'reallocate' && from && to)
      const busy = state.changeRequests.some(
        (cr) => cr.status === 'Pending' && [r.fromItemId, r.toItemId].some((id) => id && touchesItem(cr, id)),
      )
      if (!allowed('raiseRequest') || !shapeOk || !(r.quantityT > 0) || busy) return state
      const request: ChangeRequest = { ...r, id: `CR-${action.meta.id}`, status: 'Pending', raisedBy: user.id, raisedAt: action.meta.at }
      const lookup = lookupOf(state)
      return {
        ...state,
        changeRequests: [...state.changeRequests, request],
        ...audit(state, action.meta, {
          action: 'Raised change request',
          target: `${REQUEST_LABELS[r.type]} · ${itemRef(r.toItemId ?? r.fromItemId, lookup)}`,
          before: '—',
          after: `Pending · ${describeRequest(r, lookup)}`,
          notify: ['pm'],
          message: `requests approval: ${describeRequest(r, lookup)}`,
        }),
      }
    }

    case 'decideRequest': {
      const cr = state.changeRequests.find((c) => c.id === action.requestId)
      if (!allowed('decideRequest') || !cr || cr.status !== 'Pending') return state
      let items = state.reconciliationItems
      const effects: string[] = []
      if (action.approve) {
        const apply = (id: string | undefined, delta: number) => {
          const item = items.find((i) => i.id === id)
          if (!item) return
          const next = Math.max(0, round2(item.orderedT + delta))
          items = updateItem(items, item.id, { orderedT: next })
          effects.push(`${itemLabel(item)} ordered ${fmtT(item.orderedT)} → ${fmtT(next)}`)
        }
        apply(cr.fromItemId, -cr.quantityT)
        apply(cr.toItemId, cr.quantityT)
      }
      const status: ChangeRequestStatus = action.approve ? 'Approved' : 'Rejected'
      const lookup = lookupOf(state)
      return {
        ...state,
        reconciliationItems: items,
        changeRequests: state.changeRequests.map((c) =>
          c.id === cr.id ? { ...c, status, decidedBy: user.id, decidedAt: action.meta.at } : c,
        ),
        ...audit(state, action.meta, {
          action: `${status} change request`,
          target: `${REQUEST_LABELS[cr.type]} · ${itemRef(cr.toItemId ?? cr.fromItemId, lookup)}`,
          before: 'Pending',
          after: action.approve ? `Approved · ${effects.join('; ')}` : 'Rejected · no change to orders',
          notify: ['qs', 'proc'],
          message: `${status.toLowerCase()} “${describeRequest(cr, lookup)}”${action.approve ? ' — update the PO with the supplier' : ''}`,
        }),
      }
    }

    case 'documentDelivery': {
      const d = state.deliveries.find((x) => x.id === action.deliveryId)
      if (!allowed('documentDelivery') || !d || d.status === 'Documented') return state
      return {
        ...state,
        deliveries: state.deliveries.map((x) =>
          x.id === d.id ? { ...x, status: 'Documented', acrsCertified: true } : x,
        ),
        ...audit(state, action.meta, {
          action: d.acrsCertified ? 'Documented delivery' : 'Attached ACRS certificate',
          target: `${d.id} · ${zoneCode(d.zoneId)} ${d.itemCode}`,
          before: `Pending · ${d.acrsCertified ? 'ACRS sighted' : 'cert outstanding'}`,
          after: `Documented · ACRS certified (batch ${d.batchNo})`,
          notify: ['qs'],
          message: `documented ${d.id} — ACRS certificate filed against batch ${d.batchNo}`,
        }),
      }
    }

    case 'markRead': {
      if (!state.notifications.some((n) => n.toRoles.includes(action.role) && !n.readBy.includes(action.role))) return state
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.toRoles.includes(action.role) && !n.readBy.includes(action.role) ? { ...n, readBy: [...n.readBy, action.role] } : n,
        ),
      }
    }

    case 'syncAlertFirstSeen': {
      if (!Object.keys(action.add).length && !action.remove.length) return state
      const next = { ...state.alertFirstSeen, ...action.add }
      for (const key of action.remove) delete next[key]
      return { ...state, alertFirstSeen: next }
    }
  }
}

const lookupOf = (s: SharedState) => ({
  itemsById: new Map(s.reconciliationItems.map((i) => [i.id, i])),
  zonesById: new Map(s.zones.map((z) => [z.id, z])),
})

// ---------------------------------------------------------------------------
// Provider

interface StoreValue {
  state: DemoState
  dispatch: Dispatch<StoreAction>
  currentUser: DemoUser
  itemsById: Map<string, ReconciliationItem>
  zonesById: Map<string, Zone>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...readStoredShared(),
    currentUserId: readStoredUser(),
  }))

  const { project, zones, reconciliationItems, deliveries, notifications, activityLog, changeRequests, alertFirstSeen } =
    state
  const shared = useMemo(
    () => sharedOf(state),
    // Only the shared slices matter; switching user must not trigger a write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, zones, reconciliationItems, deliveries, notifications, activityLog, changeRequests, alertFirstSeen],
  )

  // Persist shared slices. `lastRaw` holds what storage already contains, so a
  // state that just arrived from another tab isn't written straight back.
  const lastRaw = useRef<string | null>(null)
  useEffect(() => {
    const raw = JSON.stringify(shared)
    if (raw === lastRaw.current) return
    lastRaw.current = raw
    try {
      localStorage.setItem(STORAGE_KEY, raw)
    } catch {
      // Storage full or blocked (private mode) — the demo keeps working in memory.
    }
  }, [shared])

  // Live sync from other tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = parseShared(e.newValue)
      if (!next) return
      lastRaw.current = e.newValue
      dispatch({ type: 'hydrate', shared: next })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(USER_KEY, state.currentUserId)
    } catch {
      // Ignore — falls back to the default account on reload.
    }
  }, [state.currentUserId])

  const itemsById = useMemo(() => new Map(reconciliationItems.map((i) => [i.id, i])), [reconciliationItems])
  const zonesById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones])
  const currentUser = userById(state.currentUserId)

  const value = useMemo(
    () => ({ state, dispatch, currentUser, itemsById, zonesById }),
    [state, currentUser, itemsById, zonesById],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
