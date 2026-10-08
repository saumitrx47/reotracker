import { Check, X } from 'lucide-react'
import type { ChangeRequest } from '../data/store'
import { userById } from '../data/users'
import { useCommands, useLookups } from '../hooks/useProjectData'
import { dateTime } from '../lib/format'
import { describeRequest } from '../lib/requests'
import GatedButton from './GatedButton'

/** A pending change request with the Project Manager's Approve / Reject controls. */
export default function ChangeRequestRow({ request }: { request: ChangeRequest }) {
  const lookups = useLookups()
  const { decideChangeRequest } = useCommands()

  return (
    <div className="rounded border border-amber-200 bg-amber-50/60 px-2.5 py-2 text-xs text-slate-700">
      <div>
        <span className="font-semibold">Change request pending:</span> {describeRequest(request, lookups)}
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500">
        Raised by {userById(request.raisedBy).name} · {dateTime(request.raisedAt)}
      </div>
      <div className="mt-2 flex gap-2">
        <GatedButton
          permission="decideRequest"
          onClick={() => decideChangeRequest(request.id, true)}
          className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-ink-700"
        >
          <Check size={12} aria-hidden />
          Approve
        </GatedButton>
        <GatedButton
          permission="decideRequest"
          onClick={() => decideChangeRequest(request.id, false)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
        >
          <X size={12} aria-hidden />
          Reject
        </GatedButton>
      </div>
    </div>
  )
}
