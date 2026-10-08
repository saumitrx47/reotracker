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
import { DEFAULT_USER_ID, USERS, userById, type DemoUser, type RoleId } from './users'

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

export type StoreAction =
  | { type: 'hydrate'; shared: SharedState }
  | { type: 'reset' }
  | { type: 'switchUser'; userId: string }
  | { type: 'setReconciled'; meta: Meta; itemId: string; reconciled: boolean }

export function reducer(state: DemoState, action: StoreAction): DemoState {
  switch (action.type) {
    case 'hydrate':
      return { ...action.shared, currentUserId: state.currentUserId }
    case 'reset':
      return { ...seedShared(), currentUserId: state.currentUserId }
    case 'switchUser':
      return USERS.some((u) => u.id === action.userId) ? { ...state, currentUserId: action.userId } : state
    case 'setReconciled': {
      const item = state.reconciliationItems.find((i) => i.id === action.itemId)
      if (!item || item.reconciled === action.reconciled) return state
      return {
        ...state,
        reconciliationItems: state.reconciliationItems.map((i) =>
          i.id === action.itemId ? { ...i, reconciled: action.reconciled } : i,
        ),
      }
    }
  }
}

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
