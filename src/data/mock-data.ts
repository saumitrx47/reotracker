/**
 * MatTrak — single source of mock data.
 *
 * Everything in the UI is derived from this file. To swap in a real backend,
 * leave these types alone and replace the accessors in `src/data/api.ts` with
 * fetch calls that return the same shapes.
 *
 * Domain notes (ENGG3112 Tutorial 12 brief, client: Richard Crookes Constructions):
 *  - Quantities are in metric tonnes (t) of reinforcing steel — deformed bar
 *    (N12…N32) and mesh sheet (SL/RL series).
 *  - "Required" is the current design requirement after revisions; "Estimated"
 *    is the baseline take-off quantity the order was placed against.
 *  - AS/NZS 4671 requires identification and traceability of reinforcing steel,
 *    so deliveries carry heat/batch numbers and an ACRS certificate flag.
 */

export type Severity = 'critical' | 'warning' | 'ok'
export type DeliveryStatus = 'Documented' | 'Pending'
export type MaterialType = 'Bar' | 'Mesh'

export interface Project {
  id: string
  name: string
  client: string
  location: string
  /** Acceptable reconciliation variance before an item is flagged (%). */
  varianceTolerancePct: number
  /** Variance above which an item is escalated as critical (%). */
  varianceCriticalPct: number
  lastSyncedAt: string
  user: { name: string; role: string; initials: string }
}

export interface Zone {
  id: string
  /** Short code shown on charts and tables, e.g. "L3-A". */
  code: string
  name: string
  level: string
  /** Current pour / work package status. */
  stage: 'Complete' | 'In progress' | 'Scheduled'
  /** Short name used in alert headlines, e.g. "Level 3 Pour A". */
  shortName?: string
  /** Next scheduled pour (ISO date), quoted in shortfall alerts. */
  nextPourDate?: string
}

export interface ReconciliationItem {
  id: string
  zoneId: string
  /** Bar size or mesh sheet code, e.g. "N20", "SL92". */
  itemCode: string
  materialType: MaterialType
  description: string
  /** Baseline take-off quantity (t). */
  estimatedT: number
  /** Quantity committed on purchase orders (t). */
  orderedT: number
  /** Quantity installed to date (t). */
  installedT: number
  /** Current design requirement after revisions (t). */
  requiredT: number
  /** Drawing revision the requirement came from. */
  designRevision: string
  reconciled: boolean
  /** Name used in alert headlines when the bare item code is ambiguous. */
  label?: string
  /**
   * Site context for the current revision, worked into derived alert text.
   * Cleared when a new design revision is issued.
   */
  alertNotes?: { revision?: string; review?: string }
}

export interface Delivery {
  id: string
  date: string
  supplier: string
  quantityT: number
  zoneId: string
  itemCode: string
  status: DeliveryStatus
  poNumber: string
  /** Mill heat / batch number — AS/NZS 4671 traceability. */
  batchNo: string
  /** ACRS (or equivalent) certificate sighted and filed. */
  acrsCertified: boolean
}

export interface Alert {
  id: string
  severity: Severity
  title: string
  detail: string
  zoneId: string
  itemCode: string
  /** Suggested next step — the brief's "recommended actions" feature. */
  recommendation: string
  raisedAt: string
}

export interface ForecastPoint {
  week: string
  weekLabel: string
  /** Installed to date (historic weeks only). */
  installedT: number | null
  /** Projected requirement for the week (t). */
  projectedRequiredT: number
  /** Quantity already committed on POs for that week (t); null once no order has been raised. */
  committedT: number | null
}

export const project: Project = {
  id: 'PRJ-12',
  name: 'Project Site 12',
  client: 'Richard Crookes Constructions',
  location: 'Sydney, NSW',
  varianceTolerancePct: 5,
  varianceCriticalPct: 15,
  lastSyncedAt: '2026-09-21T07:42:00+10:00',
  user: { name: 'Priya Naidu', role: 'Quantity Surveyor', initials: 'PN' },
}

export const zones: Zone[] = [
  { id: 'Z-B2', code: 'B2', name: 'Basement B2 — Core Walls', level: 'Basement 2', stage: 'Complete', shortName: 'Basement B2' },
  { id: 'Z-L1', code: 'L1', name: 'Podium Level 1 — Slab', level: 'Level 1', stage: 'Complete', shortName: 'Podium Level 1' },
  { id: 'Z-L3', code: 'L3-A', name: 'Level 3 — Slab Pour A', level: 'Level 3', stage: 'In progress', shortName: 'Level 3 Pour A' },
  { id: 'Z-L5', code: 'L5-B', name: 'Level 5 — Slab Pour B', level: 'Level 5', stage: 'In progress', shortName: 'Level 5 Pour B', nextPourDate: '2026-09-30' },
  { id: 'Z-CR', code: 'CORE', name: 'Lift Core — L1 to L6', level: 'Core', stage: 'Scheduled', shortName: 'Lift Core' },
]

export const reconciliationItems: ReconciliationItem[] = [
  {
    id: 'RC-001', zoneId: 'Z-B2', itemCode: 'N20', materialType: 'Bar',
    description: 'N20 vertical bar — core wall',
    estimatedT: 42.0, orderedT: 44.5, installedT: 41.2, requiredT: 41.6,
    designRevision: 'Rev C', reconciled: true,
  },
  {
    id: 'RC-002', zoneId: 'Z-B2', itemCode: 'SL92', materialType: 'Mesh',
    description: 'SL92 mesh — blinding slab',
    estimatedT: 8.5, orderedT: 8.5, installedT: 8.1, requiredT: 8.1,
    designRevision: 'Rev C', reconciled: true,
  },
  {
    id: 'RC-003', zoneId: 'Z-L1', itemCode: 'N16', materialType: 'Bar',
    description: 'N16 bottom mat — podium slab',
    estimatedT: 31.4, orderedT: 33.0, installedT: 30.8, requiredT: 31.0,
    designRevision: 'Rev D', reconciled: false,
  },
  {
    id: 'RC-004', zoneId: 'Z-L1', itemCode: 'SL82', materialType: 'Mesh',
    description: 'SL82 mesh — topping',
    estimatedT: 12.0, orderedT: 12.6, installedT: 11.7, requiredT: 11.9,
    designRevision: 'Rev D', reconciled: false,
  },
  {
    id: 'RC-005', zoneId: 'Z-L3', itemCode: 'N12', materialType: 'Bar',
    description: 'N12 trimmer bar — slab pour A',
    estimatedT: 18.6, orderedT: 23.4, installedT: 17.9, requiredT: 17.9,
    designRevision: 'Rev F', reconciled: false,
    alertNotes: { revision: 'reduced trimmer bar spacing' },
  },
  {
    id: 'RC-006', zoneId: 'Z-L3', itemCode: 'N24', materialType: 'Bar',
    description: 'N24 band beam — slab pour A',
    estimatedT: 9.5, orderedT: 9.8, installedT: 9.4, requiredT: 9.6,
    designRevision: 'Rev F', reconciled: false,
  },
  {
    id: 'RC-007', zoneId: 'Z-L5', itemCode: 'N16', materialType: 'Bar',
    description: 'N16 top mat — slab pour B',
    estimatedT: 27.2, orderedT: 25.0, installedT: 22.4, requiredT: 26.4,
    designRevision: 'Rev B', reconciled: false,
  },
  {
    id: 'RC-008', zoneId: 'Z-L5', itemCode: 'SL92', materialType: 'Mesh',
    description: 'SL92 mesh — slab pour B',
    estimatedT: 6.4, orderedT: 6.6, installedT: 6.0, requiredT: 6.2,
    designRevision: 'Rev B', reconciled: false,
  },
  {
    id: 'RC-009', zoneId: 'Z-CR', itemCode: 'N32', materialType: 'Bar',
    description: 'N32 vertical bar — lift core',
    estimatedT: 38.8, orderedT: 40.2, installedT: 30.5, requiredT: 39.4,
    designRevision: 'Rev A', reconciled: false,
  },
  {
    id: 'RC-010', zoneId: 'Z-CR', itemCode: 'N20', materialType: 'Bar',
    description: 'N20 ligatures — lift core',
    estimatedT: 14.2, orderedT: 15.9, installedT: 11.8, requiredT: 13.8,
    designRevision: 'Rev A', reconciled: false,
    label: 'N20 ligatures',
    alertNotes: { review: 'Confirm ligature schedule against Rev A before releasing the next core order.' },
  },
]

export const deliveries: Delivery[] = [
  { id: 'DKT-2318', date: '2026-09-19', supplier: 'InfraBuild Reinforcing', quantityT: 12.4, zoneId: 'Z-L3', itemCode: 'N12', status: 'Pending', poNumber: 'PO-4471', batchNo: 'H-88214', acrsCertified: false },
  { id: 'DKT-2311', date: '2026-09-18', supplier: 'ARC — Australian Reinforcing Co.', quantityT: 8.2, zoneId: 'Z-CR', itemCode: 'N32', status: 'Documented', poNumber: 'PO-4468', batchNo: 'H-88190', acrsCertified: true },
  { id: 'DKT-2305', date: '2026-09-16', supplier: 'Best Bar', quantityT: 6.6, zoneId: 'Z-L5', itemCode: 'SL92', status: 'Documented', poNumber: 'PO-4462', batchNo: 'M-30417', acrsCertified: true },
  { id: 'DKT-2299', date: '2026-09-15', supplier: 'InfraBuild Reinforcing', quantityT: 11.0, zoneId: 'Z-L3', itemCode: 'N12', status: 'Documented', poNumber: 'PO-4471', batchNo: 'H-88102', acrsCertified: true },
  { id: 'DKT-2291', date: '2026-09-12', supplier: 'Neumann Steel', quantityT: 9.8, zoneId: 'Z-L3', itemCode: 'N24', status: 'Pending', poNumber: 'PO-4455', batchNo: 'H-87960', acrsCertified: false },
  { id: 'DKT-2284', date: '2026-09-11', supplier: 'ARC — Australian Reinforcing Co.', quantityT: 15.9, zoneId: 'Z-CR', itemCode: 'N20', status: 'Documented', poNumber: 'PO-4450', batchNo: 'H-87903', acrsCertified: true },
  { id: 'DKT-2276', date: '2026-09-09', supplier: 'Best Bar', quantityT: 25.0, zoneId: 'Z-L5', itemCode: 'N16', status: 'Documented', poNumber: 'PO-4444', batchNo: 'H-87811', acrsCertified: true },
  { id: 'DKT-2268', date: '2026-09-05', supplier: 'InfraBuild Reinforcing', quantityT: 12.6, zoneId: 'Z-L1', itemCode: 'SL82', status: 'Documented', poNumber: 'PO-4431', batchNo: 'M-30288', acrsCertified: true },
  { id: 'DKT-2260', date: '2026-09-02', supplier: 'Neumann Steel', quantityT: 33.0, zoneId: 'Z-L1', itemCode: 'N16', status: 'Documented', poNumber: 'PO-4420', batchNo: 'H-87644', acrsCertified: true },
  { id: 'DKT-2251', date: '2026-08-28', supplier: 'ARC — Australian Reinforcing Co.', quantityT: 32.0, zoneId: 'Z-CR', itemCode: 'N32', status: 'Documented', poNumber: 'PO-4468', batchNo: 'H-87502', acrsCertified: true },
  { id: 'DKT-2244', date: '2026-08-26', supplier: 'InfraBuild Reinforcing', quantityT: 44.5, zoneId: 'Z-B2', itemCode: 'N20', status: 'Documented', poNumber: 'PO-4402', batchNo: 'H-87390', acrsCertified: true },
  { id: 'DKT-2238', date: '2026-08-22', supplier: 'Best Bar', quantityT: 8.5, zoneId: 'Z-B2', itemCode: 'SL92', status: 'Documented', poNumber: 'PO-4398', batchNo: 'M-30105', acrsCertified: true },
]

export const alerts: Alert[] = [
  {
    id: 'AL-01', severity: 'critical', zoneId: 'Z-L3', itemCode: 'N12',
    title: 'Level 3 Pour A — 30.7% over-order on N12',
    detail: 'Ordered 23.4 t against a current requirement of 17.9 t. Design Rev F reduced trimmer bar spacing after PO-4471 was placed.',
    recommendation: 'Cancel the balance of PO-4471 (5.5 t) or reallocate to Level 5 Pour B.',
    raisedAt: '2026-09-19T09:15:00+10:00',
  },
  {
    id: 'AL-02', severity: 'critical', zoneId: 'Z-L5', itemCode: 'N16',
    title: 'Level 5 Pour B — 1.4 t shortfall on N16',
    detail: 'Requirement rose to 26.4 t under Rev B, but only 25.0 t is on order. Pour is scheduled in 9 days.',
    recommendation: 'Raise a top-up order of 1.4 t, or draw from the 5.5 t N12/N16 surplus flagged on Level 3.',
    raisedAt: '2026-09-18T16:40:00+10:00',
  },
  {
    id: 'AL-03', severity: 'warning', zoneId: 'Z-CR', itemCode: 'N20',
    title: 'Lift Core — 15.2% over-order on N20 ligatures',
    detail: 'Ordered 15.9 t against a requirement of 13.8 t. Above the 5% reconciliation tolerance.',
    recommendation: 'Confirm ligature schedule against Rev A before releasing the next core order.',
    raisedAt: '2026-09-17T11:05:00+10:00',
  },
  {
    id: 'AL-04', severity: 'warning', zoneId: 'Z-L3', itemCode: 'N24',
    title: 'DKT-2291 — compliance record incomplete',
    detail: 'Delivery docket received without an ACRS certificate or mill test report against batch H-87960.',
    recommendation: 'Request certification from Neumann Steel — AS/NZS 4671 traceability must be closed out.',
    raisedAt: '2026-09-12T14:22:00+10:00',
  },
  {
    id: 'AL-05', severity: 'ok', zoneId: 'Z-B2', itemCode: 'SL92',
    title: 'Basement B2 — reconciled within tolerance',
    detail: 'Ordered 8.5 t against 8.1 t installed (4.9% variance), inside the 5% threshold.',
    recommendation: 'No action. Zone closed out and archived for record retention.',
    raisedAt: '2026-09-08T08:30:00+10:00',
  },
]

export const forecast: ForecastPoint[] = [
  { week: '2026-W36', weekLabel: 'Wk 36', installedT: 38.2, projectedRequiredT: 38.2, committedT: 41.0 },
  { week: '2026-W37', weekLabel: 'Wk 37', installedT: 44.6, projectedRequiredT: 44.6, committedT: 48.5 },
  { week: '2026-W38', weekLabel: 'Wk 38 (now)', installedT: 31.9, projectedRequiredT: 33.4, committedT: 36.0 },
  { week: '2026-W39', weekLabel: 'Wk 39', installedT: null, projectedRequiredT: 40.8, committedT: 42.5 },
  { week: '2026-W40', weekLabel: 'Wk 40', installedT: null, projectedRequiredT: 47.2, committedT: 44.0 },
  { week: '2026-W41', weekLabel: 'Wk 41', installedT: null, projectedRequiredT: 52.6, committedT: 44.0 },
  { week: '2026-W42', weekLabel: 'Wk 42', installedT: null, projectedRequiredT: 35.4, committedT: null },
]
