export const ROLES = {
  ADMIN: 'admin',
  DG_OFFICE: 'dg_office',
  DEPARTMENT_USER: 'department_user',
  VIEWER: 'viewer',
}

export const DEPARTMENTS = [
  'DG Office',
  'CID Crime',
  'Law & Order',
  'Training',
  'TS & SCRB',
]

export function canCreateEntry(role, department) {
  return [ROLES.ADMIN, ROLES.DG_OFFICE].includes(role) || department === 'DG Office'
}

export function canScanQR(role) {
  return [ROLES.ADMIN, ROLES.DG_OFFICE, ROLES.DEPARTMENT_USER].includes(role)
}

export function canGenerateQR(role, department) {
  return [ROLES.ADMIN, ROLES.DG_OFFICE].includes(role) || department === 'DG Office'
}

export function canManageUsers(role) {
  return role === ROLES.ADMIN
}

export function canViewAllLogs(role) {
  return [ROLES.ADMIN, ROLES.DG_OFFICE].includes(role)
}

export function getRoleLabel(role) {
  const labels = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.DG_OFFICE]: 'DG Office',
    [ROLES.DEPARTMENT_USER]: 'Department User',
    [ROLES.VIEWER]: 'Viewer',
  }
  return labels[role] || role
}