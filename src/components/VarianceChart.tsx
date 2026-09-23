import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ZoneRollup } from '../lib/variance'
import { SERIES, CHROME, axisProps } from '../lib/chart-theme'
import ChartTooltip from './ChartTooltip'
import ChartLegend from './ChartLegend'
import { percent, tonnes } from '../lib/format'

const LEGEND = [
  { key: 'estimated', label: 'Estimated', color: SERIES.estimated },
  { key: 'ordered', label: 'Ordered', color: SERIES.ordered },
  { key: 'installed', label: 'Installed', color: SERIES.installed },
]

export default function VarianceChart({ rollups }: { rollups: ZoneRollup[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const data = rollups.map((r) => ({
    zone: r.zone.code,
    zoneName: r.zone.name,
    estimated: Number(r.estimatedT.toFixed(1)),
    ordered: Number(r.orderedT.toFixed(1)),
    installed: Number(r.installedT.toFixed(1)),
    variancePct: r.variancePct,
  }))

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Estimated vs ordered vs installed</h3>
          <p className="mt-0.5 text-xs text-slate-500">Reinforcing steel by zone / pour, tonnes</p>
        </div>
        <div className="flex rounded-md border border-slate-300 p-0.5" role="group" aria-label="Chart or table view">
          {(['chart', 'table'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={[
                'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                view === mode ? 'bg-ink-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        <div className="px-3 py-5">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }} barGap={2} barCategoryGap="26%">
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="zone" {...axisProps} />
                <YAxis {...axisProps} width={44} label={undefined} />
                <Tooltip cursor={{ fill: 'rgba(11,11,11,0.04)' }} content={<ChartTooltip />} />
                <Bar dataKey="estimated" name="Estimated" fill={SERIES.estimated} radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="ordered" name="Ordered" fill={SERIES.ordered} radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="installed" name="Installed" fill={SERIES.installed} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={LEGEND.map((s) => ({ label: s.label, color: s.color, shape: 'square' }))} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Zone</th>
                {LEGEND.map((s) => (
                  <th key={s.key} className="th text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                      {s.label}
                    </span>
                  </th>
                ))}
                <th className="th text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.zone}>
                  <td className="td font-medium text-slate-900">{row.zoneName}</td>
                  <td className="td text-right tabular-nums">{tonnes(row.estimated)}</td>
                  <td className="td text-right tabular-nums">{tonnes(row.ordered)}</td>
                  <td className="td text-right tabular-nums">{tonnes(row.installed)}</td>
                  <td className="td text-right tabular-nums font-medium">{percent(row.variancePct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
