import { useCallback, useRef, useState } from 'react'
import { Bell, History } from 'lucide-react'
import { roleLabel, userById } from '../data/users'
import { useCommands, useNotifications, usePendingRequests } from '../hooks/useProjectData'
import { useDismiss } from '../hooks/useDismiss'
import { dateTime } from '../lib/format'
import ChangeRequestRow from './ChangeRequestRow'

/**
 * The top-bar bell. Its button markup is unchanged; the red dot now reflects
 * unread notifications for the current role. Opens a popover with the role's
 * notifications and, for the Project Manager, pending change requests.
 */
export default function NotificationsPopover({ onOpenActivity }: { onOpenActivity: () => void }) {
  const { notifications, unread, role } = useNotifications()
  const pending = usePendingRequests()
  const { markNotificationsRead } = useCommands()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }, [])
  useDismiss(rootRef, open, close)

  const showRequests = role === 'pm'

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="card absolute right-0 top-full z-30 mt-2 flex max-h-[min(70vh,560px)] w-96 flex-col overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <div className="card-title">Notifications</div>
              <div className="text-[11px] text-slate-500">
                {roleLabel(role)} · {unread} unread
              </div>
            </div>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => markNotificationsRead(role)}
              className="rounded text-xs font-medium text-slate-500 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-hazard-500 disabled:cursor-default disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {showRequests && pending.length > 0 && (
              <div className="space-y-2 border-b border-slate-200 bg-slate-50/60 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Awaiting your approval ({pending.length})
                </div>
                {pending.map((cr) => (
                  <ChangeRequestRow key={cr.id} request={cr} />
                ))}
              </div>
            )}

            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => {
                const from = userById(n.fromUserId)
                const isUnread = !n.readBy.includes(role)
                return (
                  <li key={n.id} className={`flex gap-3 px-4 py-3 ${isUnread ? 'bg-hazard-50/40' : ''}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-hazard-400">
                      {from.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-relaxed ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                        <span className={isUnread ? '' : 'font-medium text-slate-800'}>{from.name}</span> {n.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {roleLabel(from.role)} · {dateTime(n.at)}
                      </p>
                    </div>
                    {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" />}
                  </li>
                )
              })}
              {notifications.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-slate-500">No notifications for this role yet.</li>
              )}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              close(false)
              onOpenActivity()
            }}
            className="flex items-center justify-center gap-1.5 border-t border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:bg-slate-50"
          >
            <History size={13} aria-hidden />
            View activity log
          </button>
        </div>
      )}
    </div>
  )
}
