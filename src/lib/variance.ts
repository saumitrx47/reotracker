import type { ReconciliationItem, Severity, Zone } from '../data/mock-data'

/** Ordered vs current design requirement, as a percentage of the requirement. */
export function variancePct(item: ReconciliationItem): number {
  if (item.requiredT === 0) return 0
  return ((item.orderedT - item.requiredT) / item.requiredT) * 100
}

/** Absolute tonnage over (positive) or short (negative) against the requirement. */
export const varianceT = (item: ReconciliationItem): number => item.orderedT - item.requiredT

export function severityFor(pct: number, tolerance: number, critical: number): Severity {
  const magnitude = Math.abs(pct)
  if (magnitude >= critical) return 'critical'
  if (magnitude > tolerance) return 'warning'
  return 'ok'
}

export function statusLabel(pct: number, tolerance: number, critical: number): string {
  const severity = severityFor(pct, tolerance, critical)
  if (severity === 'ok') return 'Within tolerance'
  if (pct > 0) return severity === 'critical' ? 'Over-ordered' : 'Over tolerance'
  return severity === 'critical' ? 'Shortfall' : 'Under tolerance'
}

export interface Totals {
  estimatedT: number
  orderedT: number
  installedT: number
  requiredT: number
  /** Ordered vs required, as a percentage. */
  variancePct: number
}

export function totalsFor(items: ReconciliationItem[]): Totals {
  const sum = (pick: (i: ReconciliationItem) => number) => items.reduce((acc, i) => acc + pick(i), 0)
  const estimatedT = sum((i) => i.estimatedT)
  const orderedT = sum((i) => i.orderedT)
  const installedT = sum((i) => i.installedT)
  const requiredT = sum((i) => i.requiredT)
  return {
    estimatedT,
    orderedT,
    installedT,
    requiredT,
    variancePct: requiredT === 0 ? 0 : ((orderedT - requiredT) / requiredT) * 100,
  }
}

export interface ZoneRollup extends Totals {
  zone: Zone
  items: ReconciliationItem[]
}

/** Groups items by zone in a single pass (zone order follows `zones`). */
export function groupByZone(items: ReconciliationItem[]): Map<string, ReconciliationItem[]> {
  const groups = new Map<string, ReconciliationItem[]>()
  for (const item of items) {
    const group = groups.get(item.zoneId)
    if (group) group.push(item)
    else groups.set(item.zoneId, [item])
  }
  return groups
}

export function rollupByZone(zones: Zone[], items: ReconciliationItem[]): ZoneRollup[] {
  const groups = groupByZone(items)
  return zones.map((zone) => {
    const zoneItems = groups.get(zone.id) ?? []
    return { zone, items: zoneItems, ...totalsFor(zoneItems) }
  })
}
