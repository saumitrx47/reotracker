import type { DeliveryStatus } from '../data/mock-data'

export default function StatusPill({ status }: { status: DeliveryStatus }) {
  const documented = status === 'Documented'
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        documented
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-800 ring-amber-200',
      ].join(' ')}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${documented ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden />
      {status}
    </span>
  )
}
