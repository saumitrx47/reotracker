import { useState, type FormEvent } from 'react'
import type { ReconciliationItem } from '../data/mock-data'
import Modal, { FieldError } from './Modal'
import { tonnes } from '../lib/format'
import { nextRevision, parseTonnes } from '../lib/validation'

export type QuantityMode = 'installed' | 'revision'

interface Props {
  mode: QuantityMode
  item: ReconciliationItem
  zoneName: string
  onClose: () => void
  onInstalled: (itemId: string, installedT: number) => void
  onRevision: (itemId: string, requiredT: number, revision: string) => void
}

/** Site Engineer dialogs: record installed quantity, or issue a design revision. */
export default function QuantityModal({ mode, item, zoneName, onClose, onInstalled, onRevision }: Props) {
  // Mounted per item + mode (see the `key` at the call site), so props seed state once.
  const [qty, setQty] = useState(() => String(mode === 'installed' ? item.installedT : item.requiredT))
  const [rev, setRev] = useState(() => nextRevision(item.designRevision))
  const [errors, setErrors] = useState<{ qty?: string; rev?: string }>({})

  const isRevision = mode === 'revision'

  function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseTonnes(qty)
    const next: typeof errors = {}
    if (!parsed.ok) next.qty = parsed.error
    if (isRevision) {
      const label = rev.trim()
      if (!label) next.rev = 'Enter a revision label, e.g. Rev G.'
      else if (label.length > 20) next.rev = 'Keep the label under 20 characters.'
      else if (label === item.designRevision) next.rev = `${item.designRevision} is the current revision.`
    }
    setErrors(next)
    if (!parsed.ok || next.rev) return
    if (isRevision) onRevision(item.id, parsed.value, rev.trim())
    else onInstalled(item.id, parsed.value)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isRevision ? 'Issue design revision' : 'Update installed quantity'}
      subtitle={`${item.itemCode} · ${item.description} · ${zoneName}`}
    >
      <form className="px-6 py-5" onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={isRevision ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="q-qty">
              {isRevision ? 'New requirement (t)' : 'Installed to date (t)'}
            </label>
            <input
              id="q-qty"
              data-autofocus
              inputMode="decimal"
              className="input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-invalid={!!errors.qty}
              aria-describedby={errors.qty ? 'q-qty-err' : undefined}
            />
            <FieldError id="q-qty-err" message={errors.qty} />
          </div>
          {isRevision && (
            <div>
              <label className="label" htmlFor="q-rev">Revision label</label>
              <input
                id="q-rev"
                className="input"
                value={rev}
                onChange={(e) => setRev(e.target.value)}
                aria-invalid={!!errors.rev}
                aria-describedby={errors.rev ? 'q-rev-err' : undefined}
              />
              <FieldError id="q-rev-err" message={errors.rev} />
            </div>
          )}
        </div>

        <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          {isRevision ? (
            <>
              Currently <span className="font-semibold text-slate-800">{tonnes(item.requiredT)}</span> under{' '}
              {item.designRevision}. Issuing a revision recalculates the variance and returns the line item to the
              quantity surveyor for re-reconciliation.
            </>
          ) : (
            <>
              Currently <span className="font-semibold text-slate-800">{tonnes(item.installedT)}</span> installed against{' '}
              {tonnes(item.requiredT)} required.
            </>
          )}
        </p>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {isRevision ? `Issue ${rev.trim() || 'revision'}` : 'Save quantity'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
