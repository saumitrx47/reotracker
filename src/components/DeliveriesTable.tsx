import { FileCheck2, FileWarning } from 'lucide-react'
import type { Delivery, Zone } from '../data/mock-data'
import StatusPill from './StatusPill'
import { shortDate, tonnes } from '../lib/format'

interface Props {
  deliveries: Delivery[]
  zones: Zone[]
}

export default function DeliveriesTable({ deliveries, zones }: Props) {
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="th">Docket</th>
              <th className="th">Date</th>
              <th className="th">Supplier</th>
              <th className="th">Item</th>
              <th className="th text-right">Qty</th>
              <th className="th">Zone / location</th>
              <th className="th">PO</th>
              <th className="th">Compliance</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deliveries.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-slate-50/70">
                <td className="td whitespace-nowrap font-medium text-slate-900">{delivery.id}</td>
                <td className="td whitespace-nowrap text-slate-600">{shortDate(delivery.date)}</td>
                <td className="td">{delivery.supplier}</td>
                <td className="td font-mono text-xs text-slate-600">{delivery.itemCode}</td>
                <td className="td whitespace-nowrap text-right tabular-nums font-medium">{tonnes(delivery.quantityT)}</td>
                <td className="td whitespace-nowrap text-slate-600">{zoneName(delivery.zoneId)}</td>
                <td className="td whitespace-nowrap font-mono text-xs text-slate-600">{delivery.poNumber}</td>
                <td className="td whitespace-nowrap">
                  {delivery.acrsCertified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                      <FileCheck2 size={14} aria-hidden />
                      Batch {delivery.batchNo}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                      <FileWarning size={14} aria-hidden />
                      Cert outstanding
                    </span>
                  )}
                </td>
                <td className="td">
                  <StatusPill status={delivery.status} />
                </td>
              </tr>
            ))}
            {deliveries.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-sm text-slate-500" colSpan={9}>
                  No deliveries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
