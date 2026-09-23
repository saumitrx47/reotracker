export interface LegendItem {
  label: string
  color: string
  /** Rendered as a dashed rule — used for projected (non-actual) series. */
  dashed?: boolean
  /** Square swatch for bars, rule for lines. */
  shape?: 'square' | 'line'
}

/**
 * Legend rendered as plain HTML rather than Recharts' own, so series order
 * always matches mark order and dashed series read as dashed.
 */
export default function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
          {item.shape === 'line' ? (
            <span
              className="h-0.5 w-4 shrink-0"
              style={
                item.dashed
                  ? { backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0 5px, transparent 5px 9px)` }
                  : { background: item.color }
              }
              aria-hidden
            />
          ) : (
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: item.color }} aria-hidden />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  )
}
