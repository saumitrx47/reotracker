import { useMemo } from 'react'
import { Download, HardHat, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import VarianceChart from '../components/VarianceChart'
import AlertsPanel from '../components/AlertsPanel'
import Loading from '../components/Loading'
import { useAlerts, useDeliveries, useProject, useReconciliationItems, useZones } from '../hooks/useProjectData'
import { rollupByZone, totalsFor } from '../lib/variance'
import { percent, tonnes } from '../lib/format'

export default function Dashboard() {
  const { data: project } = useProject()
  const { data: zones, loading: zonesLoading } = useZones()
  const { data: items, loading: itemsLoading } = useReconciliationItems()
  const { data: alerts, loading: alertsLoading } = useAlerts()
  const { data: deliveries, loading: deliveriesLoading } = useDeliveries()

  const totals = useMemo(() => totalsFor(items ?? []), [items])
  const rollups = useMemo(() => rollupByZone(zones ?? [], items ?? []), [zones, items])
  const poCount = useMemo(() => new Set((deliveries ?? []).map((d) => d.poNumber)).size, [deliveries])

  const loading = zonesLoading || itemsLoading || alertsLoading || deliveriesLoading
  if (loading || !zones || !items || !alerts || !deliveries) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Live reconciliation of reinforcing steel across the project" />
        <Loading label="Loading project quantities…" rows={4} />
      </>
    )
  }

  const tolerance = project?.varianceTolerancePct ?? 5
  const critical = project?.varianceCriticalPct ?? 15
  const surplusT = totals.orderedT - totals.requiredT
  const varianceAccent =
    Math.abs(totals.variancePct) >= critical ? 'critical' : Math.abs(totals.variancePct) > tolerance ? 'warning' : 'good'

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live reconciliation of reinforcing steel across the project"
        actions={
          <button type="button" className="btn-ghost">
            <Download size={15} aria-hidden />
            Export summary
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total estimated qty"
          value={tonnes(totals.estimatedT)}
          caption={`Baseline take-off across ${zones.length} zones`}
          icon={HardHat}
        />
        <SummaryCard
          label="Total ordered qty"
          value={tonnes(totals.orderedT)}
          caption={`Committed across ${poCount} purchase orders`}
          icon={ShoppingCart}
        />
        <SummaryCard
          label="Installed / used qty"
          value={tonnes(totals.installedT)}
          caption={`${((totals.installedT / totals.requiredT) * 100).toFixed(0)}% of current requirement placed`}
          icon={Package}
        />
        <SummaryCard
          label="Variance"
          value={percent(totals.variancePct)}
          caption={
            <>
              {tonnes(Math.abs(surplusT))} {surplusT >= 0 ? 'over' : 'short of'} requirement · tolerance {tolerance}%
            </>
          }
          icon={TrendingUp}
          accent={varianceAccent}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <VarianceChart rollups={rollups} />
        </div>
        <div className="xl:col-span-2">
          <AlertsPanel alerts={alerts} zones={zones} tolerancePct={tolerance} />
        </div>
      </div>
    </>
  )
}
