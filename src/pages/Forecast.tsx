import { AlertTriangle, Info, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ForecastChart from '../components/ForecastChart'
import Loading from '../components/Loading'
import { useForecast } from '../hooks/useProjectData'
import { tonnes } from '../lib/format'

export default function Forecast() {
  const { data: forecast, loading } = useForecast()

  if (loading || !forecast) {
    return (
      <>
        <PageHeader title="Forecast" subtitle="Projected reinforcing steel demand for the next four weeks" />
        <Loading label="Building forecast…" rows={4} />
      </>
    )
  }

  const upcoming = forecast.filter((p) => p.installedT === null)
  const projectedT = upcoming.reduce((sum, p) => sum + p.projectedRequiredT, 0)
  const committedT = upcoming.reduce((sum, p) => sum + (p.committedT ?? 0), 0)
  const gapT = projectedT - committedT
  const firstShortWeek = upcoming.find((p) => p.projectedRequiredT > (p.committedT ?? 0))

  return (
    <>
      <PageHeader
        title="Forecast"
        subtitle="Projected reinforcing steel demand for the next four weeks"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
            <Info size={14} aria-hidden />
            Demo model — flat installation rate
          </span>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Projected requirement (4 wk)', value: tonnes(projectedT), note: 'From current design revisions' },
          { label: 'Already committed on PO', value: tonnes(committedT), note: 'Across 4 open purchase orders' },
          {
            label: gapT > 0 ? 'Procurement gap' : 'Surplus committed',
            value: tonnes(Math.abs(gapT)),
            note: firstShortWeek ? `First shortfall in ${firstShortWeek.weekLabel}` : 'Fully covered',
          },
        ].map((stat, i) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</div>
                <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{stat.value}</div>
                <div className="mt-1.5 text-xs text-slate-500">{stat.note}</div>
              </div>
              <span className="rounded-md bg-slate-100 p-2 text-slate-500">
                {i === 2 && gapT > 0 ? <AlertTriangle size={18} aria-hidden /> : <TrendingUp size={18} aria-hidden />}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="card mb-5">
        <div className="card-header">
          <div>
            <h3 className="card-title">Projected material need — next 4 weeks</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Requirement derived from the current design revision and pour programme, tonnes per week
            </p>
          </div>
        </div>
        <ForecastChart data={forecast} />
      </section>

      <section className="card p-5">
        <h3 className="card-title mb-3">Recommended actions</h3>
        <ul className="space-y-2.5 text-sm text-slate-700">
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
            <span>
              <span className="font-medium">Week 40–41 shortfall of {tonnes(11.8)}</span> against committed orders —
              release the lift core N32 order by Friday to hold the four-week supplier lead time.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
            <span>
              <span className="font-medium">Reallocate the 5.5 t N12 surplus</span> flagged on Level 3 Pour A before
              raising any new bar order.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span>
              <span className="font-medium">Week 42 demand drops to {tonnes(35.4)}</span> as the podium closes out — no
              further mesh orders required this stage.
            </span>
          </li>
        </ul>
        <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
          Stub forecast. A production build would derive this curve from the BIM quantity take-off, the current pour
          programme and historical installation rates, rather than the fixed weekly figures used here.
        </p>
      </section>
    </>
  )
}
