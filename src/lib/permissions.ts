import { roleLabel, type DemoUser, type RoleId } from '../data/users'

/** Every gated action in the demo, mapped to the roles allowed to perform it. */
export const PERMISSIONS = {
  reconcile: ['qs'],
  raiseRequest: ['qs'],
  exportRegister: ['qs'],
  recordDelivery: ['se'],
  recordInstalled: ['se'],
  issueRevision: ['se'],
  decideRequest: ['pm'],
  documentDelivery: ['proc'],
} as const satisfies Record<string, readonly RoleId[]>

export type Permission = keyof typeof PERMISSIONS

export function can(user: DemoUser, action: Permission): boolean {
  return (PERMISSIONS[action] as readonly RoleId[]).includes(user.role)
}

/** Tooltip shown on a control the current role cannot use. */
export function lockedReason(action: Permission): string {
  return `Requires ${PERMISSIONS[action].map(roleLabel).join(' or ')} role`
}
