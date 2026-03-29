/**
 * lib/tauri.ts
 *
 * Typed wrappers around Tauri's invoke() that mirror the old fetch('/api/...')
 * surface. Drop-in replacements for all API calls throughout the app.
 *
 * Usage:
 *   import { api } from '@/lib/tauri'
 *   const classes = await api.getClasses()
 *   const student = await api.createStudent({ name, gender, dob, classId })
 */

import { invoke } from '@tauri-apps/api/core'

// ─── Types (mirroring Rust models) ──────────────────────────────────────────

export interface Class {
  id: number
  name: string
  level: string
  section?: string | null
  student_count?: number | null
  // Aliases for existing UI compatibility
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

// ─── API wrapper ─────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (email: string, password: string): Promise<User> =>
    invoke('login', { input: { email, password } }),

  // Classes
  getClasses: (): Promise<Class[]> =>
    invoke('get_classes'),

  createClass: (input: { name: string; level: string; section?: string }): Promise<Class> =>
    invoke('create_class', { input }),

  // Parents
  getParents: (): Promise<Parent[]> =>
    invoke('get_parents'),

  createParent: (input: { name: string; phone: string; email?: string; address?: string }): Promise<Parent> =>
    invoke('create_parent', { input }),

  updateParent: (id: number, input: { name: string; phone: string; email?: string; address?: string }): Promise<Parent> =>
    invoke('update_parent', { id, input }),

  // Staff
  getStaff: (): Promise<Staff[]> =>
    invoke('get_staff'),

  createStaff: (input: {
    name: string; role: string; phone?: string; email?: string;
    subject?: string; classId?: number
  }): Promise<Staff> =>
    invoke('create_staff', { input }),

  // Students
  getStudents: (params?: { classId?: number; q?: string }): Promise<Student[]> =>
    invoke('get_students', { classId: params?.classId ?? null, q: params?.q ?? null }),

  getStudent: (id: number): Promise<Student> =>
    invoke('get_student', { id }),

  createStudent: (input: {
    name: string; gender: string; dob: string; classId: number;
    parentId?: number; phone?: string; address?: string
  }): Promise<Student> =>
    invoke('create_student', { input }),

  updateStudent: (id: number, input: {
    name?: string; gender?: string; dob?: string; classId?: number;
    parentId?: number | null; phone?: string; address?: string
  }): Promise<Student> =>
    invoke('update_student', { id, input }),

  deleteStudent: (id: number): Promise<void> =>
    invoke('delete_student', { id }),

  // Subjects
  getSubjects: (): Promise<Subject[]> =>
    invoke('get_subjects'),

  createSubject: (input: { name: string; code: string }): Promise<Subject> =>
    invoke('create_subject', { input }),

  // Results
  getResults: (params?: {
    classId?: number; term?: string; year?: string; studentId?: number
  }): Promise<ResultRow[]> =>
    invoke('get_results', {
      classId: params?.classId ?? null,
      term: params?.term ?? null,
      year: params?.year ?? null,
      studentId: params?.studentId ?? null,
    }),

  upsertResult: (input: {
    studentId: number; subjectId: number; term: string; year: string; ca: number; exam: number
  }): Promise<ResultRow> =>
    invoke('upsert_result', { input }),

  // Payments
  getPayments: (params?: { classId?: number; term?: string; status?: string }): Promise<Payment[]> =>
    invoke('get_payments', {
      classId: params?.classId ?? null,
      term: params?.term ?? null,
      status: params?.status ?? null,
    }),

  createPayment: (input: {
    studentId: number; term: string; feeType: string; amount: number; paid: number
  }): Promise<Payment> =>
    invoke('create_payment', { input }),

  getPaymentSummary: (params?: { classId?: number; term?: string }): Promise<PaymentSummary> =>
    invoke('get_payment_summary', {
      classId: params?.classId ?? null,
      term: params?.term ?? null,
    }),

  // Settings
  getSettings: (): Promise<SchoolSettings | null> =>
    invoke('get_settings'),

  upsertSettings: (input: {
    schoolName: string; motto?: string; address?: string; phone?: string;
    email?: string; currentTerm: string; currentYear: string
  }): Promise<SchoolSettings> =>
    invoke('upsert_settings', { input }),

  // Reports
  getReportCard: (studentId: number, term: string, year: string): Promise<ReportCardData> =>
    invoke('get_report_card', { studentId, term, year }),

  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    invoke('get_dashboard_stats'),

  getTopStudents: (): Promise<TopStudent[]> =>
    invoke('get_top_students'),
}
