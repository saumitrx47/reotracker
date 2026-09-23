import { AlertTriangle, CheckCircle2, ChevronRight, CircleAlert } from 'lucide-react'
import type { Alert, Severity, Zone } from '../data/mock-data'
import SeverityBadge from './SeverityBadge'
import { dateTime } from '../lib/format'

const ICONS: Record<Severity, typeof AlertTriangle> = {
  critical: CircleAlert,
  warning: AlertTriangle,
  ok: CheckCircle2,
}

const RAIL: Record<Severity, string> = {
  critical: 'border-l-red-500',
  warning: 'border-l-amber-400',
  ok: 'border-l-emerald-500',
}

const ICON_TINT: Record<Severity, string> = {
  critical: 'text-red-600',
  warning: 'text-amber-600',
  ok: 'text-emerald-600',
}

interface Props {
  alerts: Alert[]
  zones: Zone[]
}

export default function AlertsPanel({ alerts, zones }: Props) {
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id
  const openCount = alerts.filter((a) => a.severity !== 'ok').length

  return (
    <section className="card flex h-full flex-col">
      <div className="card-header">
        <div>
          <h3 className="card-title">Discrepancy alerts</h3>
          <p className="mt-0.5 text-xs text-slate-500">{openCount} items outside the 5% reconciliation tolerance</p>
        </div>
        <button type="button" className="text-xs font-medium text-slate-500 hover:text-slate-800">
          View all
        </button>
      </div>

      <ul className="divide-y divide-slate-100">
        {alerts.map((alert) => {
          const Icon = ICONS[alert.severity]
          return (
            <li key={alert.id} className={`border-l-4 ${RAIL[alert.severity]} px-5 py-4`}>
              <div className="flex items-start gap-3">
                <Icon size={17} className={`mt-0.5 shrink-0 ${ICON_TINT[alert.severity]}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">{alert.title}</h4>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{alert.detail}</p>
                  <p className="mt-2 flex items-start gap-1.5 rounded bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                    <ChevronRight size={13} className="mt-0.5 shrink-0 text-hazard-600" aria-hidden />
                    <span>
                      <span className="font-semibold">Recommended:</span> {alert.recommendation}
                    </span>
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {zoneName(alert.zoneId)} · {alert.itemCode} · raised {dateTime(alert.raisedAt)}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
