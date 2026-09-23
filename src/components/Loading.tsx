interface Props {
  label?: string
  rows?: number
}

/** Neutral placeholder used while an async resource resolves. */
export default function Loading({ label = 'Loading data…', rows = 3 }: Props) {
  return (
    <div className="card p-5" role="status" aria-live="polite">
      <p className="mb-4 text-sm text-slate-500">{label}</p>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-slate-200" style={{ width: `${95 - i * 12}%` }} />
        ))}
      </div>
    </div>
  )
}
