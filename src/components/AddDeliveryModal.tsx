import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Zone } from '../data/mock-data'

interface Props {
  open: boolean
  onClose: () => void
  zones: Zone[]
}

const SUPPLIERS = [
  'InfraBuild Reinforcing',
  'ARC — Australian Reinforcing Co.',
  'Best Bar',
  'Neumann Steel',
]

const ITEM_CODES = ['N12', 'N16', 'N20', 'N24', 'N32', 'SL72', 'SL82', 'SL92', 'RL1218']

/**
 * Stub form. Fields are controlled so the UI behaves, but submitting only
 * closes the dialog — wiring this to `createDelivery()` in `data/api.ts` is the
 * single change needed once a backend exists.
 */
export default function AddDeliveryModal({ open, onClose, zones }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubmitted(false)
      return
    }
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

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

        <form
          className="px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(true)
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="f-docket">Delivery docket no.</label>
              <input id="f-docket" className="input" placeholder="DKT-2320" defaultValue="" />
            </div>
            <div>
              <label className="label" htmlFor="f-date">Delivery date</label>
              <input id="f-date" type="date" className="input" defaultValue="2026-09-21" />
            </div>
            <div>
              <label className="label" htmlFor="f-supplier">Supplier</label>
              <select id="f-supplier" className="input" defaultValue={SUPPLIERS[0]}>
                {SUPPLIERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-po">Purchase order</label>
              <input id="f-po" className="input" placeholder="PO-4471" defaultValue="" />
            </div>
            <div>
              <label className="label" htmlFor="f-item">Item code</label>
              <select id="f-item" className="input" defaultValue="N16">
                {ITEM_CODES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-qty">Quantity (t)</label>
              <input id="f-qty" type="number" step="0.1" min="0" className="input" placeholder="0.0" defaultValue="" />
            </div>
            <div>
              <label className="label" htmlFor="f-zone">Zone / location</label>
              <select id="f-zone" className="input" defaultValue={zones[0]?.id}>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-batch">Heat / batch no.</label>
              <input id="f-batch" className="input" placeholder="H-88220" defaultValue="" />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-md bg-slate-50 p-3">
            <input id="f-acrs" type="checkbox" className="mt-0.5 h-4 w-4 accent-hazard-500" defaultChecked />
            <label htmlFor="f-acrs" className="text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">ACRS certificate sighted and attached.</span> Required for
              AS/NZS 4671 traceability; records are retained for 10 years.
            </label>
          </div>

          {submitted && (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200">
              Demo stub — the docket was validated but not saved. Wire this form to
              <code className="mx-1 font-mono">createDelivery()</code> to persist it.
            </p>
          )}

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
