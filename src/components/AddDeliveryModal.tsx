import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Zone } from '../data/mock-data'
import type { DeliveryDraft } from '../data/store'
import { useDeliveries, useReconciliationItems } from '../hooks/useProjectData'
import { FieldError } from './Modal'
import { parseTonnes } from '../lib/validation'

interface Props {
  open: boolean
  onClose: () => void
  zones: Zone[]
  onSubmit: (draft: DeliveryDraft) => void
}

const SUPPLIERS = [
  'InfraBuild Reinforcing',
  'ARC — Australian Reinforcing Co.',
  'Best Bar',
  'Neumann Steel',
]

const ITEM_CODES = ['N12', 'N16', 'N20', 'N24', 'N32', 'SL72', 'SL82', 'SL92', 'RL1218']

type Field = 'docket' | 'date' | 'po' | 'qty' | 'zone' | 'batch'

const blankForm = (zones: Zone[]) => ({
  docket: '',
  date: '2026-09-21',
  supplier: SUPPLIERS[0],
  po: '',
  item: 'N16',
  qty: '',
  zone: zones[0]?.id ?? '',
  batch: '',
  acrs: true,
})

/**
 * Records a docket against a zone line item. A PO number not yet on file for
 * that zone + item code is treated as a new commitment and adds to its ordered
 * quantity; otherwise the docket is a delivery against an existing order.
 */
export default function AddDeliveryModal({ open, onClose, zones, onSubmit }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  const { data: deliveries } = useDeliveries()
  const { data: items } = useReconciliationItems()
  const [form, setForm] = useState(() => blankForm(zones))
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})

  const docketIds = useMemo(() => new Set((deliveries ?? []).map((d) => d.id)), [deliveries])
  const lineKeys = useMemo(() => new Set((items ?? []).map((i) => `${i.zoneId}|${i.itemCode}`)), [items])
  const knownPos = useMemo(
    () => new Set((deliveries ?? []).map((d) => `${d.zoneId}|${d.itemCode}|${d.poNumber}`)),
    [deliveries],
  )

  useEffect(() => {
    if (!open) return
    setForm(blankForm(zones))
    setErrors({})
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // Reset only when the dialog opens, not when zones re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const zoneName = zones.find((z) => z.id === form.zone)?.name ?? form.zone
  const po = form.po.trim().toUpperCase()
  const isNewPo = po !== '' && !knownPos.has(`${form.zone}|${form.item}|${po}`)

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: Partial<Record<Field, string>> = {}
    const docket = form.docket.trim().toUpperCase()
    if (docket && !/^DKT-\d{3,6}$/.test(docket)) next.docket = 'Use the docket format DKT-2320, or leave blank to auto-number.'
    else if (docketIds.has(docket)) next.docket = `${docket} is already recorded.`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) next.date = 'Enter the delivery date.'
    if (!po) next.po = 'Enter the purchase order number.'
    else if (!/^[A-Z0-9-]{3,20}$/.test(po)) next.po = 'Use letters, numbers and dashes only, e.g. PO-4471.'
    const qty = parseTonnes(form.qty)
    if (!qty.ok) next.qty = qty.error
    if (!lineKeys.has(`${form.zone}|${form.item}`)) next.zone = `${zoneName} has no ${form.item} line item on the register.`
    if (!form.batch.trim()) next.batch = 'Heat / batch number is required for AS/NZS 4671 traceability.'
    setErrors(next)
    if (Object.keys(next).length || !qty.ok) return
    onSubmit({
      id: docket || undefined,
      date: form.date,
      supplier: form.supplier,
      quantityT: qty.value,
      zoneId: form.zone,
      itemCode: form.item,
      poNumber: po,
      batchNo: form.batch.trim().toUpperCase(),
      acrsCertified: form.acrs,
    })
    onClose()
  }

  const describe = (f: Field) => (errors[f] ? { 'aria-invalid': true, 'aria-describedby': `f-${f}-err` } : {})

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4 pt-16">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-delivery-title"
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        <div className="hazard-stripe h-1.5" aria-hidden />
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 id="add-delivery-title" className="text-base font-semibold text-slate-900">
              Record delivery
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Docket details are matched against the open purchase order and the zone requirement.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form className="px-6 py-5" onSubmit={submit} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="f-docket">Delivery docket no.</label>
              <input id="f-docket" className="input" placeholder="DKT-2320" value={form.docket} onChange={set('docket')} {...describe('docket')} />
              <FieldError id="f-docket-err" message={errors.docket} />
            </div>
            <div>
              <label className="label" htmlFor="f-date">Delivery date</label>
              <input id="f-date" type="date" className="input" value={form.date} onChange={set('date')} {...describe('date')} />
              <FieldError id="f-date-err" message={errors.date} />
            </div>
            <div>
              <label className="label" htmlFor="f-supplier">Supplier</label>
              <select id="f-supplier" className="input" value={form.supplier} onChange={set('supplier')}>
                {SUPPLIERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-po">Purchase order</label>
              <input id="f-po" className="input" placeholder="PO-4471" value={form.po} onChange={set('po')} {...describe('po')} />
              <FieldError id="f-po-err" message={errors.po} />
              {!errors.po && isNewPo && (
                <p className="mt-1 text-xs text-amber-700">New PO for this zone and item — its quantity is added to the ordered total.</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="f-item">Item code</label>
              <select id="f-item" className="input" value={form.item} onChange={set('item')}>
                {ITEM_CODES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-qty">Quantity (t)</label>
              <input id="f-qty" type="number" step="0.01" min="0" inputMode="decimal" className="input" placeholder="0.0" value={form.qty} onChange={set('qty')} {...describe('qty')} />
              <FieldError id="f-qty-err" message={errors.qty} />
            </div>
            <div>
              <label className="label" htmlFor="f-zone">Zone / location</label>
              <select id="f-zone" className="input" value={form.zone} onChange={set('zone')} {...describe('zone')}>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              <FieldError id="f-zone-err" message={errors.zone} />
            </div>
            <div>
              <label className="label" htmlFor="f-batch">Heat / batch no.</label>
              <input id="f-batch" className="input" placeholder="H-88220" value={form.batch} onChange={set('batch')} {...describe('batch')} />
              <FieldError id="f-batch-err" message={errors.batch} />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-md bg-slate-50 p-3">
            <input
              id="f-acrs"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-hazard-500"
              checked={form.acrs}
              onChange={(e) => setForm((f) => ({ ...f, acrs: e.target.checked }))}
            />
            <label htmlFor="f-acrs" className="text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">ACRS certificate sighted and attached.</span> Required for
              AS/NZS 4671 traceability; records are retained for 10 years.
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
