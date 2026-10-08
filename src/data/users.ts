/**
 * Demo accounts. There is no authentication — switching account in the top
 * bar simply changes who the store attributes actions to and which controls
 * `can()` unlocks. Priya is the default so the out-of-the-box view is unchanged.
 */

export type RoleId = 'qs' | 'se' | 'pm' | 'proc'

export interface DemoUser {
  id: string
  name: string
  initials: string
  role: RoleId
}

export const ROLE_LABELS: Record<RoleId, string> = {
  qs: 'Quantity Surveyor',
  se: 'Site Engineer',
  pm: 'Project Manager',
  proc: 'Procurement Officer',
}

export const USERS: DemoUser[] = [
  { id: 'U-PN', name: 'Priya Naidu', initials: 'PN', role: 'qs' },
  { id: 'U-TR', name: 'Tom Reilly', initials: 'TR', role: 'se' },
  { id: 'U-SC', name: 'Sarah Chen', initials: 'SC', role: 'pm' },
  { id: 'U-DO', name: 'Daniel Okafor', initials: 'DO', role: 'proc' },
]

export const DEFAULT_USER_ID = 'U-PN'

const BY_ID = new Map(USERS.map((u) => [u.id, u]))

export function userById(id: string): DemoUser {
  return BY_ID.get(id) ?? BY_ID.get(DEFAULT_USER_ID)!
}

export const roleLabel = (role: RoleId): string => ROLE_LABELS[role]
