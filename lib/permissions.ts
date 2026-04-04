/**
 * Role-based access control.
 *
 * Roles:
 *   admin       — full access
 *   teacher     — academics: dashboard, students (view), CA scores, results, reports
 *   accountant  — finance: dashboard, students (view), billing, reports
 *
 * Features map 1-to-1 with sidebar routes and protected actions.
 */

export type AppRole = 'admin' | 'teacher' | 'accountant'

export type Feature =
  | 'dashboard'
  | 'students'        // view students list
  | 'students:write'  // add / edit / delete students
  | 'parents'
  | 'staff'
  | 'classes'
  | 'ca-scores'
  | 'exam-records'
  | 'results'
  | 'attendance'
  | 'billing'
  | 'reports'
  | 'settings'
  | 'users'           // user management (admin only)

const PERMISSIONS: Record<AppRole, Feature[]> = {
  admin: [
    'dashboard', 'students', 'students:write',
    'parents', 'staff', 'classes',
    'ca-scores', 'exam-records', 'results', 'attendance', 'billing', 'reports',
    'settings', 'users',
  ],
  teacher: [
    'dashboard', 'students',
    'ca-scores', 'exam-records', 'results', 'attendance', 'reports',
  ],
  accountant: [
    'dashboard', 'students',
    'billing', 'reports',
  ],
}

/** Returns true if `role` is allowed to use `feature`. */
export function can(role: string | undefined | null, feature: Feature): boolean {
  if (!role) return false
  const normalised = role.toLowerCase() as AppRole
  return PERMISSIONS[normalised]?.includes(feature) ?? false
}

/** Nav items visible to a given role. */
export function allowedRoutes(role: string | undefined | null): Set<string> {
  if (!role) return new Set()
  const normalised = role.toLowerCase() as AppRole
  const features = PERMISSIONS[normalised] ?? []
  const routeMap: Partial<Record<Feature, string>> = {
    dashboard:   '/dashboard',
    students:    '/students',
    parents:     '/parents',
    staff:       '/staff',
    classes:     '/classes',
    'ca-scores':     '/ca-scores',
    'exam-records':  '/exam-records',
    results:         '/results',
    attendance:      '/attendance',
    billing:     '/billing',
    reports:     '/reports',
    settings:    '/settings',
    users:       '/users',
  }
  return new Set(features.map(f => routeMap[f]).filter(Boolean) as string[])
}
