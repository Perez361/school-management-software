import { describe, it, expect } from 'vitest'
import {
  demoCall,
  DEMO_STUDENTS,
  DEMO_CLASSES,
  DEMO_SUBJECTS,
  DEMO_PARENTS,
  DEMO_RESULTS,
  DEMO_PAYMENTS,
  DEMO_DASHBOARD_STATS,
  DEMO_NOTIFICATIONS,
  DEMO_USERS,
  DEMO_CA_ENTRIES,
  DEMO_STAFF,
} from '../lib/demo-data'

// ─── Static data integrity ───────────────────────────────────────────────────

describe('DEMO_STUDENTS', () => {
  it('has exactly 42 students', () => {
    expect(DEMO_STUDENTS).toHaveLength(42)
  })

  it('has 7 students in each of the 6 classes', () => {
    for (let cid = 1; cid <= 6; cid++) {
      expect(DEMO_STUDENTS.filter(s => s.classId === cid)).toHaveLength(7)
    }
  })

  it('every student has a class object', () => {
    DEMO_STUDENTS.forEach(s => {
      expect(s.class).not.toBeNull()
      expect(s.class.name).toBeTruthy()
    })
  })

  it('students with parentId have a parent object', () => {
    DEMO_STUDENTS.filter(s => s.parentId !== null).forEach(s => {
      expect(s.parent).not.toBeNull()
      expect(s.parent!.name).toBeTruthy()
    })
  })

  it('students without parentId have null parent', () => {
    const noParent = DEMO_STUDENTS.filter(s => s.parentId === null)
    expect(noParent.length).toBeGreaterThan(0)
    noParent.forEach(s => expect(s.parent).toBeNull())
  })

  it('all studentIds are unique', () => {
    const ids = DEMO_STUDENTS.map(s => s.studentId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DEMO_RESULTS', () => {
  it('has 42 students × 8 subjects × 2 terms = 672 records', () => {
    expect(DEMO_RESULTS).toHaveLength(672)
  })

  it('total = ca + exam for every record', () => {
    DEMO_RESULTS.forEach(r => {
      expect(r.total).toBe(r.ca + r.exam)
    })
  })

  it('grade is consistent with total', () => {
    const expectedGrade = (t: number) => {
      if (t >= 80) return 'A'
      if (t >= 70) return 'B'
      if (t >= 60) return 'C'
      if (t >= 50) return 'D'
      if (t >= 40) return 'E'
      return 'F'
    }
    DEMO_RESULTS.forEach(r => {
      expect(r.grade).toBe(expectedGrade(r.total))
    })
  })

  it('CA is capped at 40 and exam at 60', () => {
    DEMO_RESULTS.forEach(r => {
      expect(r.ca).toBeLessThanOrEqual(40)
      expect(r.exam).toBeLessThanOrEqual(60)
    })
  })
})

describe('DEMO_PAYMENTS', () => {
  it('has 2 payment records per student (84 total)', () => {
    expect(DEMO_PAYMENTS).toHaveLength(84)
  })

  it('balance = amount - paid for every payment', () => {
    DEMO_PAYMENTS.forEach(p => {
      expect(p.balance).toBe(p.amount - p.paid)
    })
  })

  it('DEMO_DASHBOARD_STATS totals match payment sums', () => {
    const expectedCollected = DEMO_PAYMENTS.reduce((s, p) => s + p.paid, 0)
    const expectedOutstanding = DEMO_PAYMENTS.reduce((s, p) => s + p.balance, 0)
    expect(DEMO_DASHBOARD_STATS.totalCollected).toBe(expectedCollected)
    expect(DEMO_DASHBOARD_STATS.totalOutstanding).toBe(expectedOutstanding)
  })
})

describe('DEMO_DASHBOARD_STATS', () => {
  it('totalStudents matches DEMO_STUDENTS length', () => {
    expect(DEMO_DASHBOARD_STATS.totalStudents).toBe(DEMO_STUDENTS.length)
  })

  it('totalParents matches DEMO_PARENTS length', () => {
    expect(DEMO_DASHBOARD_STATS.totalParents).toBe(DEMO_PARENTS.length)
  })

  it('totalStaff matches DEMO_STAFF length', () => {
    expect(DEMO_DASHBOARD_STATS.totalStaff).toBe(DEMO_STAFF.length)
  })

  it('totalClasses matches DEMO_CLASSES length', () => {
    expect(DEMO_DASHBOARD_STATS.totalClasses).toBe(DEMO_CLASSES.length)
  })
})

// ─── demoCall dispatcher ─────────────────────────────────────────────────────

describe('demoCall – read commands', () => {
  it('get_classes returns all 6 classes', () => {
    const result = demoCall('get_classes', {}) as typeof DEMO_CLASSES
    expect(result).toHaveLength(6)
  })

  it('get_subjects returns all 8 subjects', () => {
    const result = demoCall('get_subjects', {}) as typeof DEMO_SUBJECTS
    expect(result).toHaveLength(8)
  })

  it('get_parents returns all 15 parents', () => {
    const result = demoCall('get_parents', {}) as typeof DEMO_PARENTS
    expect(result).toHaveLength(15)
  })

  it('get_students returns all 42 without filters', () => {
    const result = demoCall('get_students', { classId: null, q: null }) as typeof DEMO_STUDENTS
    expect(result).toHaveLength(42)
  })

  it('get_students filters by classId', () => {
    const result = demoCall('get_students', { classId: 1, q: null }) as typeof DEMO_STUDENTS
    expect(result).toHaveLength(7)
    result.forEach(s => expect(s.classId).toBe(1))
  })

  it('get_students filters by name query (case-insensitive)', () => {
    const result = demoCall('get_students', { classId: null, q: 'kwame' }) as typeof DEMO_STUDENTS
    expect(result.length).toBeGreaterThan(0)
    result.forEach(s => expect(s.name.toLowerCase()).toContain('kwame'))
  })

  it('get_students filters by studentId query', () => {
    const result = demoCall('get_students', { classId: null, q: 'STU0001' }) as typeof DEMO_STUDENTS
    expect(result).toHaveLength(1)
    expect(result[0].studentId).toBe('STU0001')
  })

  it('get_student returns a single student by id', () => {
    const result = demoCall('get_student', { id: 5 }) as (typeof DEMO_STUDENTS)[0]
    expect(result.id).toBe(5)
    expect(result.name).toBe('Yaw Darko')
  })

  it('get_student returns null for unknown id', () => {
    const result = demoCall('get_student', { id: 9999 })
    expect(result).toBeNull()
  })

  it('get_results returns all 672 without filters', () => {
    const result = demoCall('get_results', { classId: null, term: null, year: null, studentId: null }) as unknown[]
    expect(result).toHaveLength(672)
  })

  it('get_results filters by studentId and term', () => {
    const result = demoCall('get_results', { classId: null, term: 'Term 1', year: null, studentId: 1 }) as unknown[]
    expect(result).toHaveLength(8) // 8 subjects
  })

  it('get_results filters by classId', () => {
    const result = demoCall('get_results', { classId: 1, term: null, year: null, studentId: null }) as unknown[]
    expect(result).toHaveLength(7 * 8 * 2) // 7 students × 8 subjects × 2 terms
  })

  it('get_payments returns all 84 without filters', () => {
    const result = demoCall('get_payments', { classId: null, term: null, status: null }) as unknown[]
    expect(result).toHaveLength(84)
  })

  it('get_payments filters status=paid (balance=0)', () => {
    const result = demoCall('get_payments', { classId: null, term: null, status: 'paid' }) as typeof DEMO_PAYMENTS
    result.forEach(p => expect(p.balance).toBe(0))
  })

  it('get_payments filters status=partial (balance>0 and paid>0)', () => {
    const result = demoCall('get_payments', { classId: null, term: null, status: 'partial' }) as typeof DEMO_PAYMENTS
    result.forEach(p => {
      expect(p.balance).toBeGreaterThan(0)
      expect(p.paid).toBeGreaterThan(0)
    })
  })

  it('get_payment_summary totals match filtered payments', () => {
    const payments = demoCall('get_payments', { classId: null, term: 'Term 2', status: null }) as typeof DEMO_PAYMENTS
    const summary = demoCall('get_payment_summary', { classId: null, term: 'Term 2' }) as { total: number; collected: number; outstanding: number }
    expect(summary.collected).toBe(payments.reduce((s, p) => s + p.paid, 0))
    expect(summary.outstanding).toBe(payments.reduce((s, p) => s + p.balance, 0))
    expect(summary.total).toBe(payments.reduce((s, p) => s + p.amount, 0))
  })

  it('get_ca_entries returns entries for a specific class and term', () => {
    const result = demoCall('get_ca_entries', { classId: 1, subjectId: null, term: 'Term 2', year: '2024/2025' }) as typeof DEMO_CA_ENTRIES
    // 7 students × 8 subjects × 4 CA types
    expect(result).toHaveLength(7 * 8 * 4)
    result.forEach(e => expect(e.term).toBe('Term 2'))
  })

  it('get_dashboard_stats returns correct totals', () => {
    const result = demoCall('get_dashboard_stats', {}) as typeof DEMO_DASHBOARD_STATS
    expect(result.totalStudents).toBe(42)
    expect(result.totalClasses).toBe(6)
    expect(result.totalParents).toBe(15)
  })

  it('get_notifications returns all notification types', () => {
    const result = demoCall('get_notifications', {}) as typeof DEMO_NOTIFICATIONS
    const kinds = new Set(result.map((n: any) => n.kind))
    expect(kinds.has('absent')).toBe(true)
    expect(kinds.has('fee_owed')).toBe(true)
    expect(kinds.has('poor_performance')).toBe(true)
    expect(kinds.has('no_parent')).toBe(true)
    expect(kinds.has('unassigned_staff')).toBe(true)
  })

  it('get_users returns all 4 demo users', () => {
    const result = demoCall('get_users', {}) as typeof DEMO_USERS
    expect(result).toHaveLength(4)
    const roles = result.map((u: any) => u.role)
    expect(roles).toContain('admin')
    expect(roles).toContain('teacher')
    expect(roles).toContain('accountant')
  })

  it('check_setup returns false (already set up)', () => {
    expect(demoCall('check_setup', {})).toBe(false)
  })

  it('get_attendance returns all students in class with statuses', () => {
    const result = demoCall('get_attendance', { classId: 1, date: '2099-01-01' }) as unknown[]
    expect(result).toHaveLength(7) // 7 students in class 1
  })
})

describe('demoCall – write commands', () => {
  it('create_class returns a new class object', () => {
    const result = demoCall('create_class', { input: { name: 'KG 1', level: 'Kindergarten' } }) as any
    expect(result.name).toBe('KG 1')
    expect(result.level).toBe('Kindergarten')
    expect(result.student_count).toBe(0)
  })

  it('create_parent returns a new parent object', () => {
    const result = demoCall('create_parent', { input: { name: 'New Parent', phone: '0244000000' } }) as any
    expect(result.name).toBe('New Parent')
    expect(result.studentCount).toBe(0)
  })

  it('update_parent returns updated parent', () => {
    const result = demoCall('update_parent', { id: 1, input: { name: 'Updated Name', phone: '0244111111' } }) as any
    expect(result.id).toBe(1)
    expect(result.name).toBe('Updated Name')
  })

  it('create_student returns a student with status active', () => {
    const result = demoCall('create_student', { input: { name: 'Test Student', gender: 'Male', dob: '2012-01-01', classId: 1 } }) as any
    expect(result.status).toBe('active')
    expect(result.studentId).toBe('STU0099')
  })

  it('upsert_result computes total and grade', () => {
    const result = demoCall('upsert_result', { input: { studentId: 1, subjectId: 1, term: 'Term 1', year: '2024/2025', ca: 35, exam: 55 } }) as any
    expect(result.total).toBe(90)
    expect(result.grade).toBe('A')
  })

  it('create_payment computes balance', () => {
    const result = demoCall('create_payment', { input: { studentId: 1, term: 'Term 2', feeType: 'Tuition', amount: 1000, paid: 600 } }) as any
    expect(result.balance).toBe(400)
  })

  it('promote_class returns fixed counts', () => {
    const result = demoCall('promote_class', { input: { classId: 1, nextClassId: 2, repeatStudentIds: [] } }) as any
    expect(result.promoted).toBe(5)
    expect(result.repeated).toBe(1)
    expect(result.graduated).toBe(0)
  })

  it('delete commands return null', () => {
    expect(demoCall('delete_class', { id: 1 })).toBeNull()
    expect(demoCall('delete_parent', { id: 1 })).toBeNull()
    expect(demoCall('delete_student', { id: 1 })).toBeNull()
    expect(demoCall('delete_subject', { id: 1 })).toBeNull()
  })

  it('unknown command returns null and does not throw', () => {
    expect(() => demoCall('nonexistent_command', {})).not.toThrow()
    expect(demoCall('nonexistent_command', {})).toBeNull()
  })
})
