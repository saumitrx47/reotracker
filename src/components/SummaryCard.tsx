import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string
  caption: ReactNode
  icon: LucideIcon
  /** Accent bar colour along the card edge — status roles only. */
  accent?: 'neutral' | 'good' | 'warning' | 'critical'
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  neutral: 'bg-slate-300',
  good: 'bg-emerald-500',
  warning: 'bg-amber-400',
  critical: 'bg-red-500',
}

export default function SummaryCard({ label, value, caption, icon: Icon, accent = 'neutral' }: Props) {
  return (
    <div className="card relative overflow-hidden p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${ACCENTS[accent]}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</div>
          <div className="mt-1.5 text-xs text-slate-500">{caption}</div>
        </div>
        <span className="rounded-md bg-slate-100 p-2 text-slate-500">
          <Icon size={18} aria-hidden />
        </span>
      </div>
    </div>
  )
}
