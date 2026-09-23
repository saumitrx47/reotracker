import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DeliveriesTable from '../components/DeliveriesTable'
import AddDeliveryModal from '../components/AddDeliveryModal'
import Loading from '../components/Loading'
import { useDeliveries, useZones } from '../hooks/useProjectData'
import { tonnes } from '../lib/format'

export default function Deliveries() {
  const { data: deliveries, loading: deliveriesLoading } = useDeliveries()
  const { data: zones, loading: zonesLoading } = useZones()

  const [query, setQuery] = useState('')
  const [zoneId, setZoneId] = useState('all')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!deliveries) return []
    const q = query.trim().toLowerCase()
    return deliveries.filter((d) => {
      const matchesQuery =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.supplier.toLowerCase().includes(q) ||
        d.poNumber.toLowerCase().includes(q) ||
        d.itemCode.toLowerCase().includes(q)
      const matchesZone = zoneId === 'all' || d.zoneId === zoneId
      const matchesStatus = status === 'all' || d.status === status
      return matchesQuery && matchesZone && matchesStatus
    })
  }, [deliveries, query, zoneId, status])

  if (deliveriesLoading || zonesLoading || !deliveries || !zones) {
    return (
      <>
        <PageHeader title="Deliveries log" subtitle="Every reo docket received on site, matched to its purchase order" />
        <Loading label="Loading delivery dockets…" rows={5} />
      </>
    )
  }

  const pending = deliveries.filter((d) => d.status === 'Pending').length
  const totalT = filtered.reduce((sum, d) => sum + d.quantityT, 0)

  return (
    <>
      <PageHeader
        title="Deliveries log"
        subtitle={`${deliveries.length} dockets received · ${pending} awaiting documentation · ${tonnes(totalT)} shown`}
        actions={
          <button type="button" className="btn-accent" onClick={() => setModalOpen(true)}>
            <Plus size={16} aria-hidden />
            Add delivery
          </button>
        }
      />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        zoneId={zoneId}
        onZoneChange={setZoneId}
        status={status}
        onStatusChange={setStatus}
        zones={zones}
        resultCount={filtered.length}
      />

      <DeliveriesTable deliveries={filtered} zones={zones} />

      <AddDeliveryModal open={modalOpen} onClose={() => setModalOpen(false)} zones={zones} />
    </>
  )
}
