import { useState, type FormEvent } from 'react'
import { useCommands, useLookups } from '../hooks/useProjectData'
import type { DerivedAlert } from '../lib/alerts'
import { REQUEST_LABELS, describeRequest } from '../lib/requests'
import { fmtT, parseTonnes } from '../lib/validation'
import Modal, { FieldError } from './Modal'

interface Props {
  alert: DerivedAlert
  onClose: () => void
}

/** QS raises a change request from a variance alert; it goes to the PM for approval. */
export default function RequestModal({ alert, onClose }: Props) {
  const lookups = useLookups()
  const { raiseChangeRequest } = useCommands()
  const [choice, setChoice] = useState(0)
  const [qty, setQty] = useState(() => String(alert.options[0]?.quantityT ?? ''))
  const [error, setError] = useState<string>()

  const option = alert.options[choice]
  if (!option) return null

  function pick(index: number) {
    setChoice(index)
    setQty(String(alert.options[index].quantityT))
    setError(undefined)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseTonnes(qty)
    if (!parsed.ok) return setError(parsed.error)
    const source = option.fromItemId ? lookups.itemsById.get(option.fromItemId) : undefined
    if (source && parsed.value > source.orderedT) {
      return setError(`Only ${fmtT(source.orderedT)} is on order for that line item.`)
    }
    raiseChangeRequest({ type: option.type, fromItemId: option.fromItemId, toItemId: option.toItemId, quantityT: parsed.value })
    onClose()
  }

  const parsed = parseTonnes(qty)
  const preview = describeRequest({ ...option, quantityT: parsed.ok ? parsed.value : option.quantityT }, lookups)

  return (
    <Modal open onClose={onClose} title="Raise change request" subtitle={alert.title} width="max-w-lg">
      <form className="px-6 py-5" onSubmit={submit} noValidate>
        <fieldset>
          <legend className="label">Request type</legend>
          <div className="space-y-2">
            {alert.options.map((o, i) => (
              <label
                key={`${o.type}-${i}`}
                className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm ${
                  i === choice ? 'border-hazard-500 bg-hazard-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="cr-type"
                  className="mt-0.5 accent-hazard-500"
                  checked={i === choice}
                  onChange={() => pick(i)}
                  data-autofocus={i === 0 ? true : undefined}
                />
                <span>
                  <span className="block font-medium text-slate-800">{o.label}</span>
                  <span className="block text-xs text-slate-500">
                    {REQUEST_LABELS[o.type]} · suggested {fmtT(o.quantityT)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label className="label" htmlFor="cr-qty">Quantity (t)</label>
          <input
            id="cr-qty"
            inputMode="decimal"
            className="input"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'cr-qty-err' : undefined}
          />
          <FieldError id="cr-qty-err" message={error} />
        </div>

        <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-800">{preview}.</span> The Project Manager is notified and the
          ordered quantity changes only once the request is approved.
        </p>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Send for approval
          </button>
        </div>
      </form>
    </Modal>
  )
}
