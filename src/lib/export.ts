import type { Project, ReconciliationItem, Zone } from '../data/mock-data'
import { severityFor, statusLabel, variancePct } from './variance'

const cell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Downloads the reconciliation register as CSV. */
export function exportRegisterCsv(project: Project, zones: Zone[], items: ReconciliationItem[]) {
  const zoneCodes = new Map(zones.map((z) => [z.id, z.code]))
  const { varianceTolerancePct: tol, varianceCriticalPct: crit } = project
  const header = ['Zone', 'Item', 'Description', 'Revision', 'Estimated (t)', 'Ordered (t)', 'Installed (t)', 'Required (t)', 'Variance (%)', 'Status', 'Reconciled']
  const rows = items.map((i) => {
    const pct = variancePct(i)
    return [
      zoneCodes.get(i.zoneId) ?? i.zoneId, i.itemCode, i.description, i.designRevision,
      i.estimatedT, i.orderedT, i.installedT, i.requiredT, pct.toFixed(1),
      severityFor(pct, tol, crit) === 'ok' ? 'Within tolerance' : statusLabel(pct, tol, crit),
      i.reconciled ? 'Yes' : 'No',
    ]
  })
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.id}-reconciliation-register.csv`
  link.click()
  URL.revokeObjectURL(url)
}
