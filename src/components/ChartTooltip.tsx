import { CHROME } from '../lib/chart-theme'

interface TooltipRow {
  name?: string
  value?: number | null
  color?: string
  dataKey?: string | number
}

interface Props {
  /** Injected by Recharts when it clones this element as the tooltip content. */
  active?: boolean
  payload?: TooltipRow[]
  label?: string | number
  unit?: string
}

/**
 * Shared hover card for every chart. Values stay in ink tokens; the swatch
 * beside each row carries series identity.
 */
export default function ChartTooltip({ active, payload, label, unit = 't' }: Props) {
  if (!active || !payload?.length) return null

  const rows = payload.filter((row) => row.value !== null && row.value !== undefined)
  if (!rows.length) return null

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-lg" style={{ color: CHROME.ink }}>
      <div className="mb-1.5 text-xs font-semibold text-slate-900">{label}</div>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={String(row.dataKey)} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: row.color }} aria-hidden />
            <span className="text-slate-500">{row.name}</span>
            <span className="ml-auto font-medium tabular-nums text-slate-900">
              {Number(row.value).toFixed(1)} {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
