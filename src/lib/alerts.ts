/**
 * Discrepancy alerts, derived from live data rather than hardcoded.
 *
 * Base rule: a line item is flagged when `severityFor(variancePct)` is not
 * 'ok' under the project's tolerance / critical thresholds. Site rules on top:
 *  - Complete zones raise no variance alerts — they are closed out and any
 *    surplus is sunk. Fully reconciled complete zones instead contribute up to
 *    two "reconciled within tolerance" entries.
 *  - Variances under 0.5 t are immaterial and not raised.
 *  - A shortfall in an active zone escalates to critical: a pour can't go
 *    ahead short.
 *  - An over-order in a scheduled zone is capped at warning: nothing is cast
 *    yet, so it can be corrected before the next order is released.
 *  - A delivery without an ACRS certificate is flagged once it has been
 *    outstanding for more than 2 days (the supplier's grace period).
 * Reallocation pairs a surplus with a shortfall in another zone: same item
 * code first, otherwise the same material type (bar ↔ bar, mesh ↔ mesh).
 */
import type { Alert, Delivery, Project, ReconciliationItem, Severity, Zone } from '../data/mock-data'
import type { ChangeRequest, ChangeRequestType } from '../data/store'
import { touchesItem } from './requests'
import { severityFor, variancePct } from './variance'
import { round2 } from './validation'

export const MATERIALITY_T = 0.5
export const CERT_GRACE_DAYS = 2
const MAX_OK_ALERTS = 2

export type AlertKind = 'over' | 'short' | 'cert' | 'ok'

export interface RequestOption {
  type: ChangeRequestType
  label: string
  fromItemId?: string
  toItemId?: string
  quantityT: number
}

export interface DerivedAlert extends Alert {
  kind: AlertKind
  itemId?: string
  deliveryId?: string
  /** Change requests the QS can raise from this alert (variance alerts only). */
  options: RequestOption[]
  /** A pending change request touching this alert's line item, if any. */
  pendingRequest?: ChangeRequest
}

interface Flag {
  item: ReconciliationItem
  zone: Zone
  kind: 'over' | 'short'
  severity: Severity
  pct: number
  /** Ordered − required (t). */
  deltaT: number
}

const t = (n: number) => `${n.toFixed(1)} t`
const shortName = (z: Zone) => z.shortName ?? z.name
const dayNumber = (isoDate: string) => {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, ok: 2 }

/** Best reallocation partner in another zone: same item code, else same material; largest gap wins. */
function partnerFor(flag: Flag, pool: Flag[]): Flag | undefined {
  let best: Flag | undefined
  let bestScore = -Infinity
  for (const other of pool) {
    if (other.zone.id === flag.zone.id || other.item.materialType !== flag.item.materialType) continue
    const score = (other.item.itemCode === flag.item.itemCode ? 1e6 : 0) + Math.abs(other.deltaT)
    if (score > bestScore) {
      best = other
      bestScore = score
    }
  }
  return best
}

export function deriveAlerts(
  project: Project,
  zones: Zone[],
  items: ReconciliationItem[],
  deliveries: Delivery[],
  changeRequests: ChangeRequest[],
  firstSeen: Record<string, string> = {},
  now: string = new Date().toISOString(),
): DerivedAlert[] {
  const { varianceTolerancePct: tol, varianceCriticalPct: crit } = project
  const today = dayNumber(project.lastSyncedAt)
  const zonesById = new Map(zones.map((z) => [z.id, z]))
  const pending = changeRequests.filter((cr) => cr.status === 'Pending')
  const pendingFor = (itemId: string) => pending.find((cr) => touchesItem(cr, itemId))

  // Most recent PO per zone + item code, for "cancel the balance of PO-…".
  const latestPo = new Map<string, { date: string; po: string }>()
  for (const d of deliveries) {
    const key = `${d.zoneId}|${d.itemCode}`
    const seen = latestPo.get(key)
    if (!seen || d.date > seen.date) latestPo.set(key, { date: d.date, po: d.poNumber })
  }

  // Pass 1 — flag line items.
  const flags: Flag[] = []
  const itemsByZone = new Map<string, ReconciliationItem[]>()
  for (const item of items) {
    const group = itemsByZone.get(item.zoneId)
    if (group) group.push(item)
    else itemsByZone.set(item.zoneId, [item])

    const zone = zonesById.get(item.zoneId)
    if (!zone || zone.stage === 'Complete') continue
    const deltaT = round2(item.orderedT - item.requiredT)
    if (Math.abs(deltaT) < MATERIALITY_T) continue
    const pct = variancePct(item)
    const base = severityFor(pct, tol, crit)
    if (base === 'ok') continue
    const kind = deltaT > 0 ? 'over' : 'short'
    const severity: Severity =
      kind === 'short' ? 'critical' : zone.stage === 'Scheduled' && base === 'critical' ? 'warning' : base
    flags.push({ item, zone, kind, severity, pct, deltaT })
  }
  const overs = flags.filter((f) => f.kind === 'over')
  const shorts = flags.filter((f) => f.kind === 'short')

  const alerts: DerivedAlert[] = []
  const push = (a: Omit<DerivedAlert, 'raisedAt'>) => alerts.push({ ...a, raisedAt: firstSeen[a.id] ?? now })

  // Pass 2 — variance alerts with text and request options.
  for (const f of flags) {
    const { item, zone } = f
    const code = item.label ?? item.itemCode
    const notes = item.alertNotes ?? {}
    const po = latestPo.get(`${item.zoneId}|${item.itemCode}`)?.po
    const options: RequestOption[] = []

    if (f.kind === 'over') {
      const target = partnerFor(f, shorts)
      const excess = f.deltaT
      options.push({ type: 'cancel', label: `Cancel balance${po ? ` of ${po}` : ''}`, fromItemId: item.id, quantityT: excess })
      if (target) {
        options.push({
          type: 'reallocate',
          label: `Reallocate surplus to ${shortName(target.zone)} (${target.item.itemCode})`,
          fromItemId: item.id,
          toItemId: target.item.id,
          quantityT: round2(Math.min(excess, -target.deltaT)),
        })
      }
      const critical = f.severity === 'critical'
      push({
        id: `var:${item.id}:over`,
        kind: 'over',
        severity: f.severity,
        zoneId: zone.id,
        itemCode: item.itemCode,
        itemId: item.id,
        title: `${shortName(zone)} — ${Math.abs(f.pct).toFixed(1)}% over-order on ${code}`,
        detail: critical
          ? `Ordered ${t(item.orderedT)} against a current requirement of ${t(item.requiredT)}. Design ${item.designRevision} ${notes.revision ?? 'revised the requirement'} after ${po ?? 'the order'} was placed.`
          : `Ordered ${t(item.orderedT)} against a requirement of ${t(item.requiredT)}. Above the ${tol}% reconciliation tolerance.`,
        recommendation: critical
          ? `Cancel the balance of ${po ?? 'the order'} (${t(excess)})${target ? ` or reallocate to ${shortName(target.zone)}` : ''}.`
          : (notes.review ??
            `Confirm the ${code} schedule against ${item.designRevision} before releasing the next order${target ? `, or reallocate the ${t(excess)} surplus to ${shortName(target.zone)}` : ''}.`),
        options,
        pendingRequest: pendingFor(item.id),
      })
    } else {
      const source = partnerFor(f, overs)
      const shortT = -f.deltaT
      options.push({ type: 'topup', label: 'Top-up order', toItemId: item.id, quantityT: shortT })
      if (source) {
        options.push({
          type: 'reallocate',
          label: `Reallocate surplus from ${shortName(source.zone)} (${source.item.itemCode})`,
          fromItemId: source.item.id,
          toItemId: item.id,
          quantityT: round2(Math.min(shortT, source.deltaT)),
        })
      }
      const days = zone.nextPourDate ? dayNumber(zone.nextPourDate) - today : undefined
      const pour =
        days === undefined || days < 0
          ? ''
          : ` Pour is scheduled ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`
      const sourceCodes =
        source && source.item.itemCode !== item.itemCode ? `${source.item.itemCode}/${item.itemCode}` : item.itemCode
      push({
        id: `var:${item.id}:short`,
        kind: 'short',
        severity: f.severity,
        zoneId: zone.id,
        itemCode: item.itemCode,
        itemId: item.id,
        title: `${shortName(zone)} — ${t(shortT)} shortfall on ${code}`,
        detail: `Requirement rose to ${t(item.requiredT)} under ${item.designRevision}, but only ${t(item.orderedT)} is on order.${pour}`,
        recommendation: `Raise a top-up order of ${t(shortT)}${source ? `, or draw from the ${t(source.deltaT)} ${sourceCodes} surplus flagged on ${source.zone.level}` : ''}.`,
        options,
        pendingRequest: pendingFor(item.id),
      })
    }
  }

  // Compliance — certificates outstanding past the grace period.
  for (const d of deliveries) {
    if (d.status !== 'Pending' || d.acrsCertified || today - dayNumber(d.date) <= CERT_GRACE_DAYS) continue
    push({
      id: `cert:${d.id}`,
      kind: 'cert',
      severity: 'warning',
      zoneId: d.zoneId,
      itemCode: d.itemCode,
      deliveryId: d.id,
      title: `${d.id} — compliance record incomplete`,
      detail: `Delivery docket received without an ACRS certificate or mill test report against batch ${d.batchNo}.`,
      recommendation: `Request certification from ${d.supplier} — AS/NZS 4671 traceability must be closed out.`,
      options: [],
    })
  }

  // Closed-out zones: reconciled line items inside tolerance.
  for (const zone of zones) {
    const zoneItems = itemsByZone.get(zone.id) ?? []
    if (zone.stage !== 'Complete' || !zoneItems.length || !zoneItems.every((i) => i.reconciled)) continue
    for (const item of zoneItems) {
      const pct = variancePct(item)
      if (severityFor(pct, tol, crit) !== 'ok') continue
      push({
        id: `ok:${item.id}`,
        kind: 'ok',
        severity: 'ok',
        zoneId: zone.id,
        itemCode: item.itemCode,
        itemId: item.id,
        title: `${shortName(zone)} — reconciled within tolerance`,
        detail: `Ordered ${t(item.orderedT)} against ${t(item.installedT)} installed (${Math.abs(pct).toFixed(1)}% variance), inside the ${tol}% threshold.`,
        recommendation: 'No action. Zone closed out and archived for record retention.',
        options: [],
      })
    }
  }

  alerts.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || Date.parse(b.raisedAt) - Date.parse(a.raisedAt),
  )
  let okCount = 0
  return alerts.filter((a) => a.severity !== 'ok' || ++okCount <= MAX_OK_ALERTS)
}
