import type { ReconciliationItem, Zone } from '../data/mock-data'
import type { ChangeRequest, ChangeRequestType } from '../data/store'
import { fmtT } from './validation'

export const REQUEST_LABELS: Record<ChangeRequestType, string> = {
  cancel: 'Cancel balance',
  topup: 'Top-up order',
  reallocate: 'Reallocate surplus',
}

type Lookup = { itemsById: Map<string, ReconciliationItem>; zonesById: Map<string, Zone> }

/** "L3-A N12" for a line item id. */
export function itemRef(itemId: string | undefined, { itemsById, zonesById }: Lookup): string {
  const item = itemId ? itemsById.get(itemId) : undefined
  if (!item) return itemId ?? '—'
  return `${zonesById.get(item.zoneId)?.code ?? item.zoneId} ${item.itemCode}`
}

/** One-line summary, e.g. "Reallocate 1.4 t: L3-A N12 → L5-B N16". */
export function describeRequest(cr: Pick<ChangeRequest, 'type' | 'fromItemId' | 'toItemId' | 'quantityT'>, lookup: Lookup): string {
  const q = fmtT(cr.quantityT)
  if (cr.type === 'cancel') return `Cancel ${q} balance on ${itemRef(cr.fromItemId, lookup)}`
  if (cr.type === 'topup') return `Top-up order of ${q} for ${itemRef(cr.toItemId, lookup)}`
  return `Reallocate ${q}: ${itemRef(cr.fromItemId, lookup)} → ${itemRef(cr.toItemId, lookup)}`
}

/** True when a pending request already touches this line item. */
export const touchesItem = (cr: ChangeRequest, itemId: string) => cr.fromItemId === itemId || cr.toItemId === itemId
