import { useEffect, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ReconciliationTable from '../components/ReconciliationTable'
import Loading from '../components/Loading'
import { useProject, useReconciliationItems, useZones } from '../hooks/useProjectData'
import { markReconciled } from '../data/api'
import type { ReconciliationItem } from '../data/mock-data'
import { severityFor, totalsFor, variancePct } from '../lib/variance'
import { percent, tonnes } from '../lib/format'

export default function Reconciliation() {
  const { data: project } = useProject()
  const { data: zones } = useZones()
  const { data: loadedItems, loading } = useReconciliationItems()

  // Local working copy — "Mark as reconciled" updates state only in this stub.
  const [items, setItems] = useState<ReconciliationItem[]>([])
  useEffect(() => {
    if (loadedItems) setItems(loadedItems)
  }, [loadedItems])

  async function handleToggle(itemId: string, next: boolean) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, reconciled: next } : i)))
    await markReconciled(itemId, next) // no-op stub; swap for a real PATCH
  }

  if (loading || !zones || !project || items.length === 0) {
    return (
      <>
        <PageHeader title="Reconciliation" subtitle="Estimated vs ordered vs installed, line by line" />
        <Loading label="Loading reconciliation register…" rows={6} />
      </>
    )
  }

  const totals = totalsFor(items)
  const flagged = items.filter(
    (i) => severityFor(variancePct(i), project.varianceTolerancePct, project.varianceCriticalPct) !== 'ok',
  ).length
  const reconciledCount = items.filter((i) => i.reconciled).length

  return (
    <>
      <PageHeader
        title="Reconciliation"
        subtitle={`${items.length} line items · ${flagged} outside the ${project.varianceTolerancePct}% tolerance · ${reconciledCount} signed off`}
        actions={
          <button type="button" className="btn-ghost">
            <FileSpreadsheet size={15} aria-hidden />
            Export register
          </button>
        }
      />

      <div className="card mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
        {[
          { label: 'Estimated', value: tonnes(totals.estimatedT) },
          { label: 'Ordered', value: tonnes(totals.orderedT) },
          { label: 'Installed', value: tonnes(totals.installedT) },
          { label: 'Required (current design)', value: tonnes(totals.requiredT) },
          { label: 'Project variance', value: percent(totals.variancePct) },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{stat.value}</div>
          </div>
        ))}
        <p className="ml-auto max-w-xs text-xs leading-relaxed text-slate-500">
          Variance compares committed orders against the current design requirement. Items above{' '}
          {project.varianceTolerancePct}% need review; above {project.varianceCriticalPct}% they escalate.
        </p>
      </div>

      {zones.map((zone) => (
        <ReconciliationTable
          key={zone.id}
          zone={zone}
          items={items.filter((i) => i.zoneId === zone.id)}
          project={project}
          onToggleReconciled={handleToggle}
        />
      ))}
    </>
  )
}
