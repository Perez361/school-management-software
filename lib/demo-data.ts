/**
 * lib/demo-data.ts
 *
 * All mock data for the Vercel demo deployment.
 * When NEXT_PUBLIC_DEMO_MODE=true every api.* call is intercepted
 * here instead of hitting the Rust/SQLite backend.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function grade(total: number) {
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  if (total >= 50) return 'D'
  if (total >= 40) return 'E'
  return 'F'
}

/** Deterministic pseudo-random score generator */
function genScore(studentId: number, subjectId: number, termSeed: number) {
  const s = studentId * 31 + subjectId * 17 + termSeed * 7
  let ca: number, exam: number
  if ([3, 11, 23, 33].includes(studentId)) {           // poor performers
    ca = 8 + (s % 10); exam = 15 + (s % 14)
  } else if ([1, 8, 20, 29].includes(studentId)) {      // excellent
    ca = 33 + (s % 7); exam = 50 + (s % 10)
  } else {
    ca = 20 + (s % 15); exam = 30 + (s % 20)
  }
  ca = Math.min(40, ca); exam = Math.min(60, exam)
  const total = ca + exam
  return { ca, exam, total, grade: grade(total) }
}

/** Recent dates for attendance (last N days, skipping weekends) */
function recentDates(n: number): string[] {
  const dates: string[] = []
  const d = new Date()
  while (dates.length < n) {
    d.setDate(d.getDate() - 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d.toISOString().split('T')[0])
    }
  }
  return dates
}

const RECENT = recentDates(7)   // 7 most recent school days

// ─── Base data ───────────────────────────────────────────────────────────────

export const DEMO_SETTINGS = {
  id: 1, schoolName: 'Ambassadors Christian School',
  motto: 'Education in the Fear of God',
  address: 'P.O. Box 1234, Accra, Ghana',
  phone: '+233 24 123 4567', email: 'info@ambassadors.edu.gh',
  logo: null, currentTerm: 'Term 2', currentYear: '2024/2025',
  nextTermName: 'Term 3', nextTermFee: 850,
}

export const DEMO_CLASSES = [
  { id: 1, name: 'JHS 1A', level: 'JHS 1', section: 'A', student_count: 7 },
  { id: 2, name: 'JHS 1B', level: 'JHS 1', section: 'B', student_count: 7 },
  { id: 3, name: 'JHS 2A', level: 'JHS 2', section: 'A', student_count: 7 },
  { id: 4, name: 'JHS 2B', level: 'JHS 2', section: 'B', student_count: 7 },
  { id: 5, name: 'JHS 3A', level: 'JHS 3', section: 'A', student_count: 7 },
  { id: 6, name: 'JHS 3B', level: 'JHS 3', section: 'B', student_count: 7 },
]

export const DEMO_SUBJECTS = [
  { id: 1, name: 'English Language',          code: 'ENG' },
  { id: 2, name: 'Mathematics',               code: 'MTH' },
  { id: 3, name: 'Integrated Science',        code: 'SCI' },
  { id: 4, name: 'Social Studies',            code: 'SOC' },
  { id: 5, name: 'Religious & Moral Ed.',     code: 'RME' },
  { id: 6, name: 'ICT',                       code: 'ICT' },
  { id: 7, name: 'French',                    code: 'FRE' },
  { id: 8, name: 'Creative Arts',             code: 'CRE' },
]

export const DEMO_STAFF = [
  { id: 1, staffId: 'STF001', name: 'Mr. Kofi Asante',       role: 'Teacher',     phone: '+233 24 111 0001', email: 'k.asante@acs.edu.gh',    subject: 'English',  classId: 1, class: { id: 1, name: 'JHS 1A' } },
  { id: 2, staffId: 'STF002', name: 'Mrs. Akosua Boateng',   role: 'Teacher',     phone: '+233 24 111 0002', email: 'a.boateng@acs.edu.gh',   subject: 'Mathematics', classId: 2, class: { id: 2, name: 'JHS 1B' } },
  { id: 3, staffId: 'STF003', name: 'Mr. Kwame Mensah',      role: 'Teacher',     phone: '+233 24 111 0003', email: 'k.mensah@acs.edu.gh',    subject: 'Science',  classId: 3, class: { id: 3, name: 'JHS 2A' } },
  { id: 4, staffId: 'STF004', name: 'Mrs. Abena Osei',       role: 'Teacher',     phone: '+233 24 111 0004', email: 'a.osei@acs.edu.gh',      subject: 'Social Studies', classId: 4, class: { id: 4, name: 'JHS 2B' } },
  { id: 5, staffId: 'STF005', name: 'Mr. Yaw Acheampong',    role: 'Teacher',     phone: '+233 24 111 0005', email: 'y.acheampong@acs.edu.gh', subject: 'ICT',     classId: 5, class: { id: 5, name: 'JHS 3A' } },
  { id: 6, staffId: 'STF006', name: 'Mrs. Efua Amoah',       role: 'Teacher',     phone: '+233 24 111 0006', email: 'e.amoah@acs.edu.gh',     subject: 'French',  classId: 6, class: { id: 6, name: 'JHS 3B' } },
  { id: 7, staffId: 'STF007', name: 'Mr. Emmanuel Adjei',    role: 'Teacher',     phone: '+233 24 111 0007', email: null,                     subject: 'RME',     classId: null, class: null },
  { id: 8, staffId: 'STF008', name: 'Mrs. Grace Asare',      role: 'Accountant',  phone: '+233 24 111 0008', email: 'g.asare@acs.edu.gh',     subject: null,      classId: null, class: null },
  { id: 9, staffId: 'STF009', name: 'Mr. Isaac Owusu',       role: 'Headmaster',  phone: '+233 24 111 0009', email: 'i.owusu@acs.edu.gh',     subject: null,      classId: null, class: null },
]

export const DEMO_PARENTS = [
  { id: 1,  name: 'Mr. Kofi Boateng',      phone: '+233 24 200 0001', email: 'kofi.b@gmail.com',    address: 'Adenta, Accra',    photo: null, studentCount: 1 },
  { id: 2,  name: 'Mrs. Akosua Mensah',    phone: '+233 24 200 0002', email: 'akosua.m@gmail.com',  address: 'Madina, Accra',    photo: null, studentCount: 2 },
  { id: 3,  name: 'Mr. Yaw Asante',        phone: '+233 24 200 0003', email: null,                  address: 'Tema, Ghana',      photo: null, studentCount: 1 },
  { id: 4,  name: 'Mr. Emmanuel Darko',    phone: '+233 24 200 0004', email: 'e.darko@gmail.com',   address: 'Ashiaman, Accra',  photo: null, studentCount: 1 },
  { id: 5,  name: 'Mr. Kwaku Adjei',       phone: '+233 24 200 0005', email: null,                  address: 'Korle Bu, Accra',  photo: null, studentCount: 1 },
  { id: 6,  name: 'Mrs. Afua Owusu',       phone: '+233 24 200 0006', email: 'afua.o@gmail.com',    address: 'Cantonments, Accra', photo: null, studentCount: 2 },
  { id: 7,  name: 'Mr. Isaac Amoah',       phone: '+233 24 200 0007', email: null,                  address: 'Dansoman, Accra',  photo: null, studentCount: 1 },
  { id: 8,  name: 'Mr. Ebo Ntiamoah',      phone: '+233 24 200 0008', email: 'ebo.n@gmail.com',     address: 'Lapaz, Accra',     photo: null, studentCount: 1 },
  { id: 9,  name: 'Mr. Charles Baffour',   phone: '+233 24 200 0009', email: null,                  address: 'Osu, Accra',       photo: null, studentCount: 1 },
  { id: 10, name: 'Mr. Samuel Agyemang',   phone: '+233 24 200 0010', email: 's.agyemang@gmail.com', address: 'Achimota, Accra', photo: null, studentCount: 1 },
  { id: 11, name: 'Mrs. Comfort Asare',    phone: '+233 24 200 0011', email: null,                  address: 'East Legon, Accra', photo: null, studentCount: 2 },
  { id: 12, name: 'Mr. Philip Boateng',    phone: '+233 24 200 0012', email: 'p.boateng@gmail.com', address: 'Spintex, Accra',   photo: null, studentCount: 2 },
  { id: 13, name: 'Mrs. Grace Owusu',      phone: '+233 24 200 0013', email: 'grace.o@gmail.com',   address: 'Teshie, Accra',    photo: null, studentCount: 2 },
  { id: 14, name: 'Mr. Albert Asante',     phone: '+233 24 200 0014', email: null,                  address: 'Haatso, Accra',    photo: null, studentCount: 1 },
  { id: 15, name: 'Mrs. Pearl Adjei',      phone: '+233 24 200 0015', email: 'pearl.a@gmail.com',   address: 'Legon, Accra',     photo: null, studentCount: 2 },
]

// Helpers for building student/parent basics
const cls = (id: number) => DEMO_CLASSES.find(c => c.id === id)!
const par = (id: number | null) => id ? DEMO_PARENTS.find(p => p.id === id)! : null

const STUDENTS_RAW: Array<{ id: number; studentId: string; name: string; gender: string; dob: string; classId: number; parentId: number | null; phone: string | null; address: string | null }> = [
  // JHS 1A
  { id: 1,  studentId: 'STU0001', name: 'Kwame Boateng',      gender: 'Male',   dob: '2011-03-14', classId: 1, parentId: 1,  phone: null, address: null },
  { id: 2,  studentId: 'STU0002', name: 'Akosua Mensah',      gender: 'Female', dob: '2011-07-22', classId: 1, parentId: 2,  phone: null, address: null },
  { id: 3,  studentId: 'STU0003', name: 'Kofi Asante',        gender: 'Male',   dob: '2011-01-05', classId: 1, parentId: 3,  phone: null, address: null },
  { id: 4,  studentId: 'STU0004', name: 'Abena Osei',         gender: 'Female', dob: '2011-09-30', classId: 1, parentId: 2,  phone: null, address: null },
  { id: 5,  studentId: 'STU0005', name: 'Yaw Darko',          gender: 'Male',   dob: '2011-05-18', classId: 1, parentId: 4,  phone: null, address: null },
  { id: 6,  studentId: 'STU0006', name: 'Ama Amponsah',       gender: 'Female', dob: '2011-11-02', classId: 1, parentId: null, phone: null, address: null },
  { id: 7,  studentId: 'STU0007', name: 'Nana Adjei',         gender: 'Male',   dob: '2011-08-27', classId: 1, parentId: 5,  phone: null, address: null },
  // JHS 1B
  { id: 8,  studentId: 'STU0008', name: 'Akwasi Owusu',       gender: 'Male',   dob: '2011-02-11', classId: 2, parentId: 6,  phone: null, address: null },
  { id: 9,  studentId: 'STU0009', name: 'Efua Acheampong',    gender: 'Female', dob: '2011-06-19', classId: 2, parentId: 6,  phone: null, address: null },
  { id: 10, studentId: 'STU0010', name: 'Kojo Amoah',         gender: 'Male',   dob: '2011-04-07', classId: 2, parentId: 7,  phone: null, address: null },
  { id: 11, studentId: 'STU0011', name: 'Araba Ntiamoah',     gender: 'Female', dob: '2011-10-15', classId: 2, parentId: 8,  phone: null, address: null },
  { id: 12, studentId: 'STU0012', name: 'Fiifi Baffour',      gender: 'Male',   dob: '2011-12-03', classId: 2, parentId: 9,  phone: null, address: null },
  { id: 13, studentId: 'STU0013', name: 'Maame Adusei',       gender: 'Female', dob: '2012-01-20', classId: 2, parentId: null, phone: null, address: null },
  { id: 14, studentId: 'STU0014', name: 'Ato Agyemang',       gender: 'Male',   dob: '2011-07-08', classId: 2, parentId: 10, phone: null, address: null },
  // JHS 2A
  { id: 15, studentId: 'STU0015', name: 'Kweku Asare',        gender: 'Male',   dob: '2010-03-25', classId: 3, parentId: 11, phone: null, address: null },
  { id: 16, studentId: 'STU0016', name: 'Adwoa Mensah',       gender: 'Female', dob: '2010-08-14', classId: 3, parentId: 11, phone: null, address: null },
  { id: 17, studentId: 'STU0017', name: 'Kobina Boateng',     gender: 'Male',   dob: '2010-05-01', classId: 3, parentId: 12, phone: null, address: null },
  { id: 18, studentId: 'STU0018', name: 'Akua Owusu',         gender: 'Female', dob: '2010-11-17', classId: 3, parentId: 13, phone: null, address: null },
  { id: 19, studentId: 'STU0019', name: 'Kojo Asante',        gender: 'Male',   dob: '2010-02-28', classId: 3, parentId: 14, phone: null, address: null },
  { id: 20, studentId: 'STU0020', name: 'Esi Adjei',          gender: 'Female', dob: '2010-09-09', classId: 3, parentId: 15, phone: null, address: null },
  { id: 21, studentId: 'STU0021', name: 'Nana Osei',          gender: 'Male',   dob: '2010-06-21', classId: 3, parentId: 12, phone: null, address: null },
  // JHS 2B
  { id: 22, studentId: 'STU0022', name: 'Kwame Acheampong',   gender: 'Male',   dob: '2010-01-12', classId: 4, parentId: 1,  phone: null, address: null },
  { id: 23, studentId: 'STU0023', name: 'Abena Amoah',        gender: 'Female', dob: '2010-07-30', classId: 4, parentId: 7,  phone: null, address: null },
  { id: 24, studentId: 'STU0024', name: 'Yaw Ntiamoah',       gender: 'Male',   dob: '2010-04-16', classId: 4, parentId: 8,  phone: null, address: null },
  { id: 25, studentId: 'STU0025', name: 'Akosua Baffour',     gender: 'Female', dob: '2010-10-04', classId: 4, parentId: 9,  phone: null, address: null },
  { id: 26, studentId: 'STU0026', name: 'Kofi Adusei',        gender: 'Male',   dob: '2010-03-22', classId: 4, parentId: 10, phone: null, address: null },
  { id: 27, studentId: 'STU0027', name: 'Ama Agyemang',       gender: 'Female', dob: '2010-08-11', classId: 4, parentId: null, phone: null, address: null },
  { id: 28, studentId: 'STU0028', name: 'Fiifi Darko',        gender: 'Male',   dob: '2010-12-29', classId: 4, parentId: 5,  phone: null, address: null },
  // JHS 3A
  { id: 29, studentId: 'STU0029', name: 'Akwasi Asare',       gender: 'Male',   dob: '2009-02-07', classId: 5, parentId: 13, phone: null, address: null },
  { id: 30, studentId: 'STU0030', name: 'Efua Mensah',        gender: 'Female', dob: '2009-06-23', classId: 5, parentId: 2,  phone: null, address: null },
  { id: 31, studentId: 'STU0031', name: 'Kojo Boateng',       gender: 'Male',   dob: '2009-04-10', classId: 5, parentId: 12, phone: null, address: null },
  { id: 32, studentId: 'STU0032', name: 'Araba Owusu',        gender: 'Female', dob: '2009-09-18', classId: 5, parentId: 13, phone: null, address: null },
  { id: 33, studentId: 'STU0033', name: 'Kweku Asante',       gender: 'Male',   dob: '2009-01-31', classId: 5, parentId: 3,  phone: null, address: null },
  { id: 34, studentId: 'STU0034', name: 'Adwoa Osei',         gender: 'Female', dob: '2009-07-14', classId: 5, parentId: 4,  phone: null, address: null },
  { id: 35, studentId: 'STU0035', name: 'Kobina Adjei',       gender: 'Male',   dob: '2009-11-06', classId: 5, parentId: 15, phone: null, address: null },
  // JHS 3B
  { id: 36, studentId: 'STU0036', name: 'Akua Acheampong',    gender: 'Female', dob: '2009-03-19', classId: 6, parentId: 14, phone: null, address: null },
  { id: 37, studentId: 'STU0037', name: 'Kojo Ntiamoah',      gender: 'Male',   dob: '2009-05-27', classId: 6, parentId: 8,  phone: null, address: null },
  { id: 38, studentId: 'STU0038', name: 'Esi Amponsah',       gender: 'Female', dob: '2009-08-02', classId: 6, parentId: null, phone: null, address: null },
  { id: 39, studentId: 'STU0039', name: 'Nana Baffour',       gender: 'Male',   dob: '2009-12-15', classId: 6, parentId: 9,  phone: null, address: null },
  { id: 40, studentId: 'STU0040', name: 'Kwame Adusei',       gender: 'Male',   dob: '2009-02-24', classId: 6, parentId: 10, phone: null, address: null },
  { id: 41, studentId: 'STU0041', name: 'Abena Agyemang',     gender: 'Female', dob: '2009-06-08', classId: 6, parentId: 15, phone: null, address: null },
  { id: 42, studentId: 'STU0042', name: 'Yaw Asante',         gender: 'Male',   dob: '2009-10-20', classId: 6, parentId: 14, phone: null, address: null },
]

export const DEMO_STUDENTS = STUDENTS_RAW.map(s => ({
  ...s,
  photo: null,
  createdAt: '2024-09-01T08:00:00Z',
  status: 'active',
  class: cls(s.classId),
  parent: s.parentId ? (() => { const p = par(s.parentId)!; return { id: p.id, name: p.name, phone: p.phone, email: p.email ?? null } })() : null,
}))

// ─── Results (Terms 1 & 2) ────────────────────────────────────────────────────

const TERMS = [
  { term: 'Term 1', year: '2024/2025', seed: 1 },
  { term: 'Term 2', year: '2024/2025', seed: 2 },
]

let _resultId = 1
export const DEMO_RESULTS = TERMS.flatMap(({ term, year, seed }) =>
  DEMO_STUDENTS.flatMap(s =>
    DEMO_SUBJECTS.map(sub => {
      const { ca, exam, total, grade: g } = genScore(s.id, sub.id, seed)
      return {
        id: _resultId++,
        studentId: s.id,
        subjectId: sub.id,
        term, year, ca, exam, total, grade: g,
        remark: null,
        student: { id: s.id, name: s.name, studentId: s.studentId, class: cls(s.classId) },
        subject: { id: sub.id, name: sub.name, code: sub.code },
      }
    })
  )
)

// ─── CA Entries ───────────────────────────────────────────────────────────────

let _caId = 1
const CA_TYPES = ['Class Exercise', 'Home Work', 'Class Test', 'Mid-Term Exam']
export const DEMO_CA_ENTRIES = DEMO_STUDENTS.flatMap(s =>
  DEMO_SUBJECTS.flatMap(sub =>
    CA_TYPES.map((assessmentType, ti) => {
      const seed = s.id * 7 + sub.id * 3 + ti
      const maxScore = [10, 10, 10, 10][ti]
      const score = Math.min(maxScore, 4 + (seed % (maxScore - 3)))
      return {
        id: _caId++,
        studentId: s.id, subjectId: sub.id,
        term: 'Term 2', year: '2024/2025',
        assessmentType, score, maxScore,
        student: { id: s.id, name: s.name, studentId: s.studentId, class: cls(s.classId) },
      }
    })
  )
)

// ─── Payments ─────────────────────────────────────────────────────────────────

// Students with outstanding balances
const OUTSTANDING: Record<number, number> = { 2: 350, 10: 500, 19: 200, 31: 450, 37: 150 }

let _payId = 1
export const DEMO_PAYMENTS = DEMO_STUDENTS.flatMap(s => {
  const balance = OUTSTANDING[s.id] ?? 0
  const amount = 900
  const paid = amount - balance
  const cls_ = cls(s.classId)
  return [
    {
      id: _payId++,
      studentId: s.id, term: 'Term 2', year: '2024/2025',
      feeType: 'School Fees', amount, paid, balance,
      datePaid: balance === 0 ? '2025-01-10' : null,
      createdAt: '2025-01-05T09:00:00Z',
      student: { id: s.id, name: s.name, studentId: s.studentId, class: { id: cls_.id, name: cls_.name } },
    },
    {
      id: _payId++,
      studentId: s.id, term: 'Term 1', year: '2024/2025',
      feeType: 'School Fees', amount: 850, paid: 850, balance: 0,
      datePaid: '2024-09-08',
      createdAt: '2024-09-05T09:00:00Z',
      student: { id: s.id, name: s.name, studentId: s.studentId, class: { id: cls_.id, name: cls_.name } },
    },
  ]
})

// ─── Attendance ───────────────────────────────────────────────────────────────

// Students with recent absences: 5 → 3 days, 14 → 2 days, 22 → 1 day, 42 → 2 days
const ABSENT_DAYS: Record<number, number> = { 5: 3, 14: 2, 22: 1, 42: 2 }

let _attId = 1
// Build a flat list of attendance records for recent days
export const DEMO_ATTENDANCE_RECORDS: Array<{
  id: number; studentId: number; name: string; status: string; date: string; classId: number
}> = []

for (const [sidStr, days] of Object.entries(ABSENT_DAYS)) {
  const sid = Number(sidStr)
  const student = DEMO_STUDENTS.find(s => s.id === sid)!
  for (let i = 0; i < days; i++) {
    DEMO_ATTENDANCE_RECORDS.push({
      id: _attId++, studentId: sid,
      name: student.name, status: 'absent',
      date: RECENT[i] ?? RECENT[RECENT.length - 1],
      classId: student.classId,
    })
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const DEMO_USERS = [
  { id: 1, username: 'admin',    email: 'admin@acs.edu.gh',    role: 'admin',      name: 'Isaac Owusu' },
  { id: 2, username: 'kofi',     email: 'k.asante@acs.edu.gh', role: 'teacher',    name: 'Kofi Asante' },
  { id: 3, username: 'akosua',   email: 'a.boateng@acs.edu.gh',role: 'teacher',    name: 'Akosua Boateng' },
  { id: 4, username: 'grace',    email: 'g.asare@acs.edu.gh',  role: 'accountant', name: 'Grace Asare' },
]

// ─── Notifications ────────────────────────────────────────────────────────────

export const DEMO_NOTIFICATIONS = [
  // Absent
  { id: 'absent_5_demo',  kind: 'absent',           title: 'Absent 3 days',      body: 'Yaw Darko was absent 3 days this week',         severity: 'error',   studentId: 5,  studentName: 'Yaw Darko' },
  { id: 'absent_14_demo', kind: 'absent',           title: 'Absent 2 days',      body: 'Ato Agyemang was absent 2 days this week',      severity: 'warning', studentId: 14, studentName: 'Ato Agyemang' },
  { id: 'absent_22_demo', kind: 'absent',           title: 'Absent 1 day',       body: 'Kwame Acheampong was absent yesterday',         severity: 'warning', studentId: 22, studentName: 'Kwame Acheampong' },
  { id: 'absent_42_demo', kind: 'absent',           title: 'Absent 2 days',      body: 'Yaw Asante was absent 2 days this week',        severity: 'warning', studentId: 42, studentName: 'Yaw Asante' },
  // Fees
  { id: 'fee_10_demo',    kind: 'fee_owed',         title: 'Outstanding fees',   body: 'Kojo Amoah owes GHS 500.00 in unpaid fees',     severity: 'warning', studentId: 10, studentName: 'Kojo Amoah' },
  { id: 'fee_31_demo',    kind: 'fee_owed',         title: 'Outstanding fees',   body: 'Kojo Boateng owes GHS 450.00 in unpaid fees',   severity: 'warning', studentId: 31, studentName: 'Kojo Boateng' },
  { id: 'fee_2_demo',     kind: 'fee_owed',         title: 'Outstanding fees',   body: 'Akosua Mensah owes GHS 350.00 in unpaid fees',  severity: 'warning', studentId: 2,  studentName: 'Akosua Mensah' },
  { id: 'fee_37_demo',    kind: 'fee_owed',         title: 'Outstanding fees',   body: 'Kojo Ntiamoah owes GHS 150.00 in unpaid fees',  severity: 'warning', studentId: 37, studentName: 'Kojo Ntiamoah' },
  { id: 'fee_19_demo',    kind: 'fee_owed',         title: 'Outstanding fees',   body: 'Kojo Asante owes GHS 200.00 in unpaid fees',    severity: 'warning', studentId: 19, studentName: 'Kojo Asante' },
  // Poor performance
  { id: 'perf_3_demo',    kind: 'poor_performance', title: 'Low academic performance', body: 'Kofi Asante averaged 38.5% in Term 2 2024/2025',   severity: 'error',   studentId: 3,  studentName: 'Kofi Asante' },
  { id: 'perf_11_demo',   kind: 'poor_performance', title: 'Low academic performance', body: 'Araba Ntiamoah averaged 42.1% in Term 2 2024/2025', severity: 'warning', studentId: 11, studentName: 'Araba Ntiamoah' },
  { id: 'perf_23_demo',   kind: 'poor_performance', title: 'Low academic performance', body: 'Abena Amoah averaged 36.4% in Term 2 2024/2025',    severity: 'error',   studentId: 23, studentName: 'Abena Amoah' },
  { id: 'perf_33_demo',   kind: 'poor_performance', title: 'Low academic performance', body: 'Kweku Asante averaged 40.8% in Term 2 2024/2025',   severity: 'warning', studentId: 33, studentName: 'Kweku Asante' },
  // Info
  { id: 'unassigned_7_demo',   kind: 'unassigned_staff', title: 'Teacher has no class', body: 'Mr. Emmanuel Adjei is a teacher but has not been assigned to any class', severity: 'info', studentId: 7, studentName: 'Emmanuel Adjei' },
  { id: 'no_parent_6_demo',    kind: 'no_parent',        title: 'No parent linked',     body: 'Ama Amponsah has no parent or guardian assigned',     severity: 'info', studentId: 6,  studentName: 'Ama Amponsah' },
  { id: 'no_parent_13_demo',   kind: 'no_parent',        title: 'No parent linked',     body: 'Maame Adusei has no parent or guardian assigned',     severity: 'info', studentId: 13, studentName: 'Maame Adusei' },
  { id: 'no_parent_27_demo',   kind: 'no_parent',        title: 'No parent linked',     body: 'Ama Agyemang has no parent or guardian assigned',     severity: 'info', studentId: 27, studentName: 'Ama Agyemang' },
  { id: 'no_parent_38_demo',   kind: 'no_parent',        title: 'No parent linked',     body: 'Esi Amponsah has no parent or guardian assigned',     severity: 'info', studentId: 38, studentName: 'Esi Amponsah' },
]

// ─── Dashboard stats (derived) ────────────────────────────────────────────────

const totalCollected = DEMO_PAYMENTS.reduce((s, p) => s + p.paid, 0)
const totalOutstanding = DEMO_PAYMENTS.reduce((s, p) => s + p.balance, 0)

export const DEMO_DASHBOARD_STATS = {
  totalStudents: DEMO_STUDENTS.length,
  totalParents:  DEMO_PARENTS.length,
  totalStaff:    DEMO_STAFF.length,
  totalClasses:  DEMO_CLASSES.length,
  totalCollected,
  totalOutstanding,
}

export const DEMO_TOP_STUDENTS = [
  { studentId: 1,  name: 'Kwame Boateng',   class: 'JHS 1A', avg: 84.5 },
  { studentId: 8,  name: 'Akwasi Owusu',    class: 'JHS 1B', avg: 88.2 },
  { studentId: 20, name: 'Esi Adjei',        class: 'JHS 2A', avg: 86.7 },
  { studentId: 29, name: 'Akwasi Asare',    class: 'JHS 3A', avg: 82.1 },
  { studentId: 15, name: 'Kweku Asare',     class: 'JHS 2A', avg: 79.4 },
]

export const DEMO_GENDER_STATS = {
  male:   DEMO_STUDENTS.filter(s => s.gender === 'Male').length,
  female: DEMO_STUDENTS.filter(s => s.gender === 'Female').length,
}

export const DEMO_FEE_BY_CLASS = DEMO_CLASSES.map(c => {
  const classPayments = DEMO_PAYMENTS.filter(p => {
    const s = DEMO_STUDENTS.find(st => st.id === p.studentId)
    return s?.classId === c.id && p.feeType === 'School Fees' && p.term === 'Term 2'
  })
  return {
    class:       c.name,
    collected:   classPayments.reduce((s, p) => s + p.paid, 0),
    outstanding: classPayments.reduce((s, p) => s + p.balance, 0),
  }
})

export const DEMO_ENROLMENT_BY_CLASS = DEMO_CLASSES.map(c => ({
  class: c.name,
  count: DEMO_STUDENTS.filter(s => s.classId === c.id).length,
}))

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export function demoCall(command: string, params: Record<string, unknown>): unknown {
  switch (command) {

    case 'check_setup': return false

    case 'get_settings': return DEMO_SETTINGS

    case 'get_classes': return DEMO_CLASSES

    case 'get_subjects': return DEMO_SUBJECTS

    case 'get_staff': return DEMO_STAFF

    case 'get_parents': return DEMO_PARENTS

    case 'get_students': {
      const { classId, q } = params as { classId?: number | null; q?: string | null }
      let list = DEMO_STUDENTS
      if (classId) list = list.filter(s => s.classId === classId)
      if (q) {
        const lq = q.toLowerCase()
        list = list.filter(s =>
          s.name.toLowerCase().includes(lq) ||
          s.studentId.toLowerCase().includes(lq)
        )
      }
      return list
    }

    case 'get_student': {
      const { id } = params as { id: number }
      return DEMO_STUDENTS.find(s => s.id === id) ?? null
    }

    case 'get_results': {
      const { classId, term, year, studentId } = params as Record<string, number | string | null | undefined>
      let list = DEMO_RESULTS
      if (studentId) list = list.filter(r => r.studentId === studentId)
      if (term) list = list.filter(r => r.term === term)
      if (year) list = list.filter(r => r.year === year)
      if (classId) {
        const ids = new Set(DEMO_STUDENTS.filter(s => s.classId === classId).map(s => s.id))
        list = list.filter(r => ids.has(r.studentId))
      }
      return list
    }

    case 'get_ca_scores':
    case 'get_ca_entries': {
      const { classId, subjectId, term, year } = params as Record<string, number | string | null | undefined>
      let list = DEMO_CA_ENTRIES
      if (subjectId) list = list.filter(e => e.subjectId === subjectId)
      if (term) list = list.filter(e => e.term === term)
      if (year) list = list.filter(e => e.year === year)
      if (classId) {
        const ids = new Set(DEMO_STUDENTS.filter(s => s.classId === classId).map(s => s.id))
        list = list.filter(e => ids.has(e.studentId))
      }
      return list
    }

    case 'get_payments': {
      const { classId, term, status } = params as Record<string, number | string | null | undefined>
      let list = DEMO_PAYMENTS
      if (term) list = list.filter(p => p.term === term)
      if (status === 'paid')    list = list.filter(p => p.balance === 0)
      if (status === 'partial') list = list.filter(p => p.balance > 0 && p.paid > 0)
      if (status === 'unpaid')  list = list.filter(p => p.paid === 0)
      if (classId) {
        const ids = new Set(DEMO_STUDENTS.filter(s => s.classId === classId).map(s => s.id))
        list = list.filter(p => ids.has(p.studentId))
      }
      return list
    }

    case 'get_payment_summary': {
      const { classId, term } = params as Record<string, number | string | null | undefined>
      let list = DEMO_PAYMENTS
      if (term) list = list.filter(p => p.term === term)
      if (classId) {
        const ids = new Set(DEMO_STUDENTS.filter(s => s.classId === classId).map(s => s.id))
        list = list.filter(p => ids.has(p.studentId))
      }
      return {
        total:       list.reduce((s, p) => s + p.amount, 0),
        collected:   list.reduce((s, p) => s + p.paid, 0),
        outstanding: list.reduce((s, p) => s + p.balance, 0),
      }
    }

    case 'get_attendance': {
      const { classId, date } = params as { classId: number; date: string }
      const classStudents = DEMO_STUDENTS.filter(s => s.classId === classId)
      // Return all class students with their status for that date
      return classStudents.map(s => {
        const absent = DEMO_ATTENDANCE_RECORDS.find(a => a.studentId === s.id && a.date === date)
        return {
          id: s.id * 1000 + (absent ? 1 : 0),
          studentId: s.id,
          name: s.name,
          status: absent ? 'absent' : 'present',
          date,
        }
      })
    }

    case 'get_attendance_summary': {
      const { studentId } = params as { studentId: number }
      const records = DEMO_ATTENDANCE_RECORDS.filter(a => a.studentId === studentId)
      return {
        totalDays: RECENT.length,
        present:   RECENT.length - records.length,
        absent:    records.length,
        late:      0,
      }
    }

    case 'get_class_attendance_summary': {
      const { classId, term, year } = params as { classId: number; term: string; year: string }
      const classStudents = DEMO_STUDENTS.filter(s => s.classId === classId)
      return classStudents.map(s => {
        const absentCount = DEMO_ATTENDANCE_RECORDS.filter(a => a.studentId === s.id).length
        return {
          studentId:   s.id,
          studentName: s.name,
          studentCode: s.studentId,
          totalDays:   RECENT.length,
          present:     RECENT.length - absentCount,
          absent:      absentCount,
          late:        0,
          excused:     0,
        }
      })
    }

    case 'get_report_card': {
      const { studentId, term, year } = params as { studentId: number; term: string; year: string }
      const s = DEMO_STUDENTS.find(st => st.id === studentId)
      if (!s) throw new Error('Student not found')
      const results = DEMO_RESULTS.filter(r => r.studentId === studentId && r.term === term && r.year === year)
      const payment = DEMO_PAYMENTS.find(p => p.studentId === studentId && p.term === term)
      const absentCount = DEMO_ATTENDANCE_RECORDS.filter(a => a.studentId === studentId).length
      return {
        student: { name: s.name, studentId: s.studentId, class: cls(s.classId).name, gender: s.gender, photo: null },
        term, year,
        position: Math.floor(Math.random() * 5) + 1,
        totalStudents: 7,
        results: results.map(r => ({ subject: r.subject!.name, ca: r.ca, exam: r.exam, total: r.total })),
        billing: payment ? { feeType: payment.feeType, amount: payment.amount, paid: payment.paid, balance: payment.balance } : null,
        attendance: { totalDays: RECENT.length, present: RECENT.length - absentCount, absent: absentCount, late: 0 },
      }
    }

    case 'get_dashboard_stats': return DEMO_DASHBOARD_STATS
    case 'get_top_students':    return DEMO_TOP_STUDENTS
    case 'get_gender_stats':    return DEMO_GENDER_STATS
    case 'get_fee_by_class':    return DEMO_FEE_BY_CLASS
    case 'get_enrolment_by_class': return DEMO_ENROLMENT_BY_CLASS

    case 'get_users':        return DEMO_USERS
    case 'get_sync_status':  return { enabled: false, pending: 0, last_pulled_at: '', device_id: 'demo' }
    case 'get_notifications': return DEMO_NOTIFICATIONS

    // ── Write operations — return plausible response, data not persisted ──

    case 'create_class': {
      const i = params.input as Record<string, unknown>
      return { id: 99, name: i.name, level: i.level, section: i.section ?? null, student_count: 0 }
    }
    case 'create_parent': {
      const i = params.input as Record<string, unknown>
      return { id: 99, ...i, studentCount: 0 }
    }
    case 'update_parent': {
      const i = params.input as Record<string, unknown>
      return { id: params.id, ...i, studentCount: 0 }
    }
    case 'create_staff': {
      const i = params.input as Record<string, unknown>
      return { id: 99, staffId: 'STF099', ...i }
    }
    case 'update_staff': {
      const s = DEMO_STAFF.find(st => st.id === params.id) ?? DEMO_STAFF[0]
      return { ...s, ...(params.input as object) }
    }
    case 'create_student': {
      const i = params.input as Record<string, unknown>
      return { id: 99, studentId: 'STU0099', ...i, createdAt: new Date().toISOString(), status: 'active', class: cls(i.classId as number), parent: null }
    }
    case 'update_student': {
      const s = DEMO_STUDENTS.find(st => st.id === params.id) ?? DEMO_STUDENTS[0]
      return { ...s, ...(params.input as object) }
    }
    case 'create_subject': {
      const i = params.input as Record<string, unknown>
      return { id: 99, ...i }
    }
    case 'update_subject': {
      const sub = DEMO_SUBJECTS.find(s => s.id === params.id) ?? DEMO_SUBJECTS[0]
      return { ...sub, ...(params.input as object) }
    }
    case 'upsert_result': {
      const i = params.input as Record<string, unknown>
      const total = (i.ca as number) + (i.exam as number)
      return { id: 9999, ...i, total, grade: grade(total), remark: null, student: null, subject: null }
    }
    case 'add_ca_entry':
    case 'batch_add_ca_entries': return []
    case 'create_payment': {
      const i = params.input as Record<string, unknown>
      return { id: 9999, ...i, balance: (i.amount as number) - (i.paid as number), datePaid: null, createdAt: new Date().toISOString(), student: null }
    }
    case 'upsert_settings': return { id: 1, ...(params.input as object) }
    case 'create_user': {
      const i = params.input as Record<string, unknown>
      return { id: 99, ...i }
    }
    case 'update_user': {
      const u = DEMO_USERS.find(u => u.id === params.id) ?? DEMO_USERS[0]
      return { ...u, ...(params.input as object) }
    }
    case 'promote_class': return { promoted: 5, repeated: 1, graduated: 0 }
    case 'record_attendance':   return null
    case 'delete_class':
    case 'delete_parent':
    case 'delete_staff':
    case 'delete_student':
    case 'delete_subject':
    case 'delete_user':
    case 'delete_ca_entry':
    case 'change_user_password':
    case 'trigger_sync':
    case 'save_sync_config':    return null

    default:
      console.warn('[demo] unhandled command:', command)
      return null
  }
}
