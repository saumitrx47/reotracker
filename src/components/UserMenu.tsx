import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { USERS, roleLabel } from '../data/users'
import { useCommands, useCurrentUser } from '../hooks/useProjectData'
import { useDismiss } from '../hooks/useDismiss'

type FocusTarget = 'last' | 'current' | 'cancel' | 'reset'

const ITEM = 'flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none'

/**
 * The top-bar avatar button plus its account dropdown. The button's markup is
 * unchanged from the original stub; only its text follows the current user.
 */
export default function UserMenu() {
  const user = useCurrentUser()
  const { switchUser, resetDemo } = useCommands()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const focusOnOpen = useRef<FocusTarget>('current')

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false)
    setConfirmReset(false)
    if (restoreFocus) buttonRef.current?.focus()
  }, [])
  useDismiss(rootRef, open, close)

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])

  useEffect(() => {
    if (!open) return
    const all = items()
    const mode = focusOnOpen.current
    const target =
      mode === 'last'
        ? all[all.length - 1]
        : mode === 'cancel' || mode === 'reset'
          ? all.find((el) => el.dataset.focus === mode)
          : (all.find((el) => el.getAttribute('aria-checked') === 'true') ?? all[0])
    target?.focus()
  }, [open, confirmReset])

  function openWith(focus: FocusTarget) {
    focusOnOpen.current = focus
    setOpen(true)
  }

  function onButtonKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      openWith(e.key === 'ArrowDown' ? 'current' : 'last')
    }
  }

  function onMenuKey(e: KeyboardEvent) {
    const all = items()
    const index = all.indexOf(document.activeElement as HTMLElement)
    const move = (to: number) => {
      e.preventDefault()
      all[(to + all.length) % all.length]?.focus()
    }
    if (e.key === 'ArrowDown') move(index + 1)
    else if (e.key === 'ArrowUp') move(index - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(all.length - 1)
    else if (e.key === 'Tab') close(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => (open ? close(false) : openWith('current'))}
        onKeyDown={onButtonKey}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-hazard-400">
          {user.initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-slate-800">{user.name}</span>
          <span className="block text-[11px] text-slate-500">{roleLabel(user.role)}</span>
        </span>
        <ChevronDown size={14} className="text-slate-400" aria-hidden />
      </button>

      {open && (
        <div
          ref={menuRef}
          id="user-menu"
          role="menu"
          aria-label="Switch account"
          onKeyDown={onMenuKey}
          className="card absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden py-1 shadow-lg"
        >
          <div className="px-4 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Switch account
          </div>
          {USERS.map((u) => {
            const current = u.id === user.id
            return (
              <button
                key={u.id}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                className={ITEM}
                onClick={() => {
                  switchUser(u.id)
                  close(true)
                }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-hazard-400">
                  {u.initials}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block font-medium text-slate-800">{u.name}</span>
                  <span className="block text-[11px] text-slate-500">{roleLabel(u.role)}</span>
                </span>
                {current && <Check size={15} className="shrink-0 text-hazard-600" aria-hidden />}
              </button>
            )
          })}

          <div className="my-1 border-t border-slate-200" role="separator" />

          {confirmReset ? (
            <div className="px-4 py-2.5">
              <p className="text-xs leading-relaxed text-slate-600">
                Restore the seed data for every user? Deliveries, revisions, requests and the activity log are cleared.
              </p>
              <div className="mt-2.5 flex justify-end gap-2">
                <button
                  type="button"
                  role="menuitem"
                  data-focus="cancel"
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-hazard-500"
                  onClick={() => {
                    focusOnOpen.current = 'reset'
                    setConfirmReset(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
                  onClick={() => {
                    resetDemo()
                    close(true)
                  }}
                >
                  Reset data
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              data-focus="reset"
              className={ITEM}
              onClick={() => {
                focusOnOpen.current = 'cancel'
                setConfirmReset(true)
              }}
            >
              <RotateCcw size={15} className="text-slate-400" aria-hidden />
              Reset demo data
            </button>
          )}
        </div>
      )}
    </div>
  )
}
