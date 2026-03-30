/**
 * lib/api.ts
 *
 * Universal API adapter.
 *
 * - Inside a Tauri window   → uses invoke() (IPC, zero network hops)
 * - Inside a plain browser  → uses fetch() + JWT (school WiFi clients)
 *
 * All page components import from this file; nothing else changes.
 */

// ─── Types (re-exported so all pages keep their existing imports) ─────────────

export interface Class {
  id: number
  name: string
  level: string
  section?: string | null
  student_count?: number | null
  _count?: { students: number }
  staff?: { name: string }[]
  subjects?: { subject: { name: string } }[]
}

export interface Parent {
  id: number
  name: string
  phone: string
  email?: string | null
  address?: string | null
  students?: Student[]
}

export interface Staff {
  id: number
  staffId: string
  name: string
  role: string
  phone?: string | null
  email?: string | null
  subject?: string | null
  classId?: number | null
  class?: { id: number; name: string } | null
}

export interface Student {
  id: number
  studentId: string
  name: string
  gender: string
  dob: string
  phone?: string | null
  address?: string | null
  classId: number
  parentId?: number | null
  createdAt: string
  class?: { id: number; name: string } | null
  parent?: { id: number; name: string; phone: string; email?: string | null } | null
}

export interface Subject {
  id: number
  name: string
  code: string
}

export interface ResultRow {
  id: number
  studentId: number
  subjectId: number
  term: string
  year: string
  ca: number
  exam: number
  total: number
  grade: string
  remark?: string | null
  student?: { id: number; name: string; studentId: string; class?: { id: number; name: string } | null } | null
  subject?: { id: number; name: string; code: string } | null
}

export interface Payment {
  id: number
  studentId: number
  term: string
  year: string
  feeType: string
  amount: number
  paid: number
  balance: number
  datePaid?: string | null
  createdAt: string
  student?: { id: number; name: string; studentId: string; class: { id: number; name: string } } | null
}

export interface SchoolSettings {
  id: number
  schoolName: string
  motto?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  currentTerm: string
  currentYear: string
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  name: string
}

export interface PaymentSummary {
  total: number
  collected: number
  outstanding: number
}

export interface ReportCardData {
  student: { name: string; studentId: string; class: string; gender: string }
  term: string
  year: string
  position: number
  totalStudents: number
  results: { subject: string; ca: number; exam: number; total: number }[]
}

export interface DashboardStats {
  totalStudents: number
  totalParents: number
  totalStaff: number
  totalClasses: number
  totalCollected: number
  totalOutstanding: number
}

export interface TopStudent {
  studentId: number
  name: string
  class: string
  avg: number
}

// ─── Token management (browser mode only) ────────────────────────────────────

const TOKEN_KEY = 'sms_token'

// Initialised once at module load; safe on server (SSR returns '').
let _token: string =
  typeof window !== 'undefined' ? (localStorage.getItem(TOKEN_KEY) ?? '') : ''

/** Called by auth-context after a successful browser login. */
export function setAuthToken(token: string): void {
  _token = token
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token)
}

/** Called by auth-context on logout. */
export function clearAuthToken(): void {
  _token = ''
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY)
}

// ─── Transport ───────────────────────────────────────────────────────────────

const isTauri: boolean =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/**
 * Core dispatcher.
 * params is the exact object that `invoke(command, params)` would receive,
 * so the call sites in every page are identical for both modes.
 */
async function call<T>(
  command: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<T>(command, params)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`/api/${command}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(msg || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── Login (special — browser returns { user, token }) ───────────────────────

async function loginCall(email: string, password: string): Promise<User> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<User>('login', { input: { email, password } })
  }

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { email, password } }),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Invalid credentials')
    throw new Error(msg || 'Invalid credentials')
  }

  const data = (await res.json()) as { user: User; token: string }
  setAuthToken(data.token)
  return data.user
}

// ─── API surface (identical to former lib/tauri.ts) ──────────────────────────

export const api = {
  // Auth
  login: loginCall,

  // Classes
  getClasses: (): Promise<Class[]> =>
    call('get_classes'),

  createClass: (input: { name: string; level: string; section?: string }): Promise<Class> =>
    call('create_class', { input }),

  // Parents
  getParents: (): Promise<Parent[]> =>
    call('get_parents'),

  createParent: (input: { name: string; phone: string; email?: string; address?: string }): Promise<Parent> =>
    call('create_parent', { input }),

  updateParent: (id: number, input: { name: string; phone: string; email?: string; address?: string }): Promise<Parent> =>
    call('update_parent', { id, input }),

  // Staff
  getStaff: (): Promise<Staff[]> =>
    call('get_staff'),

  createStaff: (input: {
    name: string; role: string; phone?: string; email?: string;
    subject?: string; classId?: number
  }): Promise<Staff> =>
    call('create_staff', { input }),

  updateStaff: (id: number, input: {
    name?: string; role?: string; phone?: string; email?: string;
    subject?: string; classId?: number
  }): Promise<Staff> =>
    call('update_staff', { id, input }),

  // Students
  getStudents: (params?: { classId?: number; q?: string }): Promise<Student[]> =>
    call('get_students', { classId: params?.classId ?? null, q: params?.q ?? null }),

  getStudent: (id: number): Promise<Student> =>
    call('get_student', { id }),

  createStudent: (input: {
    name: string; gender: string; dob: string; classId: number;
    parentId?: number; phone?: string; address?: string
  }): Promise<Student> =>
    call('create_student', { input }),

  updateStudent: (id: number, input: {
    name?: string; gender?: string; dob?: string; classId?: number;
    parentId?: number | null; phone?: string; address?: string
  }): Promise<Student> =>
    call('update_student', { id, input }),

  deleteStudent: (id: number): Promise<void> =>
    call('delete_student', { id }),

  // Subjects
  getSubjects: (): Promise<Subject[]> =>
    call('get_subjects'),

  createSubject: (input: { name: string; code: string }): Promise<Subject> =>
    call('create_subject', { input }),

  // Results
  getResults: (params?: {
    classId?: number; term?: string; year?: string; studentId?: number
  }): Promise<ResultRow[]> =>
    call('get_results', {
      classId: params?.classId ?? null,
      term: params?.term ?? null,
      year: params?.year ?? null,
      studentId: params?.studentId ?? null,
    }),

  upsertResult: (input: {
    studentId: number; subjectId: number; term: string; year: string; ca: number; exam: number
  }): Promise<ResultRow> =>
    call('upsert_result', { input }),

  // Payments
  getPayments: (params?: { classId?: number; term?: string; status?: string }): Promise<Payment[]> =>
    call('get_payments', {
      classId: params?.classId ?? null,
      term: params?.term ?? null,
      status: params?.status ?? null,
    }),

  createPayment: (input: {
    studentId: number; term: string; feeType: string; amount: number; paid: number
  }): Promise<Payment> =>
    call('create_payment', { input }),

  getPaymentSummary: (params?: { classId?: number; term?: string }): Promise<PaymentSummary> =>
    call('get_payment_summary', {
      classId: params?.classId ?? null,
      term: params?.term ?? null,
    }),

  // Settings
  getSettings: (): Promise<SchoolSettings | null> =>
    call('get_settings'),

  upsertSettings: (input: {
    schoolName: string; motto?: string; address?: string; phone?: string;
    email?: string; currentTerm: string; currentYear: string
  }): Promise<SchoolSettings> =>
    call('upsert_settings', { input }),

  // Reports
  getReportCard: (studentId: number, term: string, year: string): Promise<ReportCardData> =>
    call('get_report_card', { studentId, term, year }),

  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    call('get_dashboard_stats'),

  getTopStudents: (): Promise<TopStudent[]> =>
    call('get_top_students'),
}
