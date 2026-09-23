import type { Severity } from '../data/mock-data'

const STYLES: Record<Severity, { chip: string; dot: string; label: string }> = {
  critical: { chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500', label: 'Critical' },
  warning: { chip: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', label: 'Watch' },
  ok: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', label: 'In tolerance' },
}

export function severityStyles(severity: Severity) {
  return STYLES[severity]
}

export default function SeverityBadge({ severity, children }: { severity: Severity; children?: string }) {
  const style = STYLES[severity]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {children ?? style.label}
    </span>
  )
}
