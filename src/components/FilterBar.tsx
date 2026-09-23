import { Search, SlidersHorizontal } from 'lucide-react'
import type { Zone } from '../data/mock-data'

interface Props {
  query: string
  onQueryChange: (value: string) => void
  zoneId: string
  onZoneChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  zones: Zone[]
  resultCount: number
}

export default function FilterBar({
  query,
  onQueryChange,
  zoneId,
  onZoneChange,
  status,
  onStatusChange,
  zones,
  resultCount,
}: Props) {
  return (
    <div className="card mb-4 flex flex-wrap items-center gap-3 p-3">
      <div className="relative min-w-[220px] flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          className="input pl-9"
          placeholder="Search docket, supplier or PO number…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search deliveries"
        />
      </div>

      <select className="input w-auto" value={zoneId} onChange={(e) => onZoneChange(e.target.value)} aria-label="Filter by zone">
        <option value="all">All zones</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </select>

      <select className="input w-auto" value={status} onChange={(e) => onStatusChange(e.target.value)} aria-label="Filter by status">
        <option value="all">All statuses</option>
        <option value="Documented">Documented</option>
        <option value="Pending">Pending</option>
      </select>

      <button type="button" className="btn-ghost">
        <SlidersHorizontal size={15} aria-hidden />
        More filters
      </button>

      <span className="ml-auto pr-1 text-xs text-slate-500 tabular-nums">{resultCount} deliveries</span>
    </div>
  )
}
