import { Check } from 'lucide-react'
import type { Project, ReconciliationItem, Zone } from '../data/mock-data'
import SeverityBadge from './SeverityBadge'
import GatedButton from './GatedButton'
import { percent, tonnes } from '../lib/format'
import { severityFor, statusLabel, totalsFor, variancePct, varianceT } from '../lib/variance'

interface Props {
  zone: Zone
  items: ReconciliationItem[]
  project: Project
  onToggleReconciled: (itemId: string, next: boolean) => void
}

export default function ReconciliationTable({ zone, items, project, onToggleReconciled }: Props) {
  const totals = totalsFor(items)
  const { varianceTolerancePct: tol, varianceCriticalPct: crit } = project
  const zoneSeverity = severityFor(totals.variancePct, tol, crit)
  const allReconciled = items.every((i) => i.reconciled)

  return (
    <section className="card mb-5 overflow-hidden">
      <div className="card-header">
        <div>
          <h3 className="card-title">{zone.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {zone.level} · {zone.stage} · {items.length} line items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SeverityBadge severity={zoneSeverity}>{`Zone variance ${percent(totals.variancePct)}`}</SeverityBadge>
          {allReconciled && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check size={14} aria-hidden />
              Zone reconciled
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="th">Item</th>
              <th className="th text-right">Estimated</th>
              <th className="th text-right">Ordered</th>
              <th className="th text-right">Installed</th>
              <th className="th text-right">Required (current)</th>
              <th className="th text-right">Variance</th>
              <th className="th">Status</th>
              <th className="th text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const pct = variancePct(item)
              const severity = severityFor(pct, tol, crit)
              const deltaT = varianceT(item)
              return (
                <tr key={item.id} className={item.reconciled ? 'bg-emerald-50/30' : undefined}>
                  <td className="td">
                    <div className="font-medium text-slate-900">
                      <span className="font-mono text-xs text-slate-500">{item.itemCode}</span> · {item.description}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {item.materialType} · design {item.designRevision}
                    </div>
                  </td>
                  <td className="td text-right tabular-nums text-slate-600">{tonnes(item.estimatedT)}</td>
                  <td className="td text-right tabular-nums font-medium">{tonnes(item.orderedT)}</td>
                  <td className="td text-right tabular-nums text-slate-600">{tonnes(item.installedT)}</td>
                  <td className="td text-right tabular-nums font-medium">{tonnes(item.requiredT)}</td>
                  <td className="td text-right tabular-nums">
                    <div className="font-semibold text-slate-900">{percent(pct)}</div>
                    <div className="text-[11px] text-slate-500">
                      {deltaT >= 0 ? '+' : '−'}
                      {tonnes(Math.abs(deltaT))}
                    </div>
                  </td>
                  <td className="td">
                    <SeverityBadge severity={severity}>{statusLabel(pct, tol, crit)}</SeverityBadge>
                  </td>
                  <td className="td text-right">
                    {item.reconciled ? (
                      <GatedButton
                        permission="reconcile"
                        onClick={() => onToggleReconciled(item.id, false)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                      >
                        <Check size={13} aria-hidden />
                        Reconciled
                      </GatedButton>
                    ) : (
                      <GatedButton
                        permission="reconcile"
                        onClick={() => onToggleReconciled(item.id, true)}
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      >
                        Mark as reconciled
                      </GatedButton>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr>
              <td className="td font-semibold text-slate-900">Zone total</td>
              <td className="td text-right tabular-nums font-semibold">{tonnes(totals.estimatedT)}</td>
              <td className="td text-right tabular-nums font-semibold">{tonnes(totals.orderedT)}</td>
              <td className="td text-right tabular-nums font-semibold">{tonnes(totals.installedT)}</td>
              <td className="td text-right tabular-nums font-semibold">{tonnes(totals.requiredT)}</td>
              <td className="td text-right tabular-nums font-semibold">{percent(totals.variancePct)}</td>
              <td className="td" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
