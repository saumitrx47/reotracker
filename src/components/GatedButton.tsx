import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { useCan } from '../hooks/useProjectData'
import { lockedReason, type Permission } from '../lib/permissions'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission: Permission
  /** Extra reason to block the action even when the role allows it. */
  blockedReason?: string
}

/**
 * A button that stays visible when the current role can't use it — locked
 * controls are part of the demo. It uses `aria-disabled` rather than
 * `disabled` so it stays focusable and its tooltip is reachable by keyboard.
 */
export default function GatedButton({ permission, blockedReason, className = '', title, onClick, children, ...rest }: Props) {
  const allowed = useCan()(permission)
  const reason = !allowed ? lockedReason(permission) : blockedReason
  const locked = reason !== undefined

  return (
    <button
      type="button"
      {...rest}
      aria-disabled={locked || undefined}
      title={reason ?? title}
      className={locked ? `${className} cursor-not-allowed opacity-50` : className}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (locked) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
    >
      {children}
    </button>
  )
}
