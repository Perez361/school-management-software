// prisma/seed.js


const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const Database = require('better-sqlite3')

const sqlite = new Database('./school.db')
const adapter = new PrismaBetterSqlite3(sqlite)
const prisma = new PrismaClient({ adapter })
async function main() {
  console.log('🌱 Seeding database...')

  // School Settings
  await prisma.schoolSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      schoolName: 'Accra Academy School',
      motto: 'Knowledge is Power',
      address: 'P.O. Box 1234, Accra, Ghana',
      phone: '+233 20 000 0000',
      email: 'info@accraacademy.edu.gh',
      currentTerm: 'Term 1',
      currentYear: '2024',
    }
  })

  // Subjects
  const subjects = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English Language', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SOC' },
    { name: 'ICT', code: 'ICT' },
    { name: 'Religious & Moral Education', code: 'RME' },
    { name: 'French', code: 'FRE' },
    { name: 'Physical Education', code: 'PE' },
  ]
  for (const s of subjects) {
    await prisma.subject.upsert({ where: { code: s.code }, update: {}, create: s })
  }

  // Classes
  const classes = [
    { name: 'JHS 1A', level: 'JHS1', section: 'A' },
    { name: 'JHS 1B', level: 'JHS1', section: 'B' },
    { name: 'JHS 2A', level: 'JHS2', section: 'A' },
    { name: 'JHS 2B', level: 'JHS2', section: 'B' },
    { name: 'JHS 3A', level: 'JHS3', section: 'A' },
    { name: 'SHS 1A', level: 'SHS1', section: 'A' },
    { name: 'SHS 2A', level: 'SHS2', section: 'A' },
    { name: 'SHS 3A', level: 'SHS3', section: 'A' },
  ]
  const createdClasses = []
  for (const c of classes) {
    const cls = await prisma.class.upsert({ where: { name: c.name }, update: {}, create: c })
    createdClasses.push(cls)
  }

  // Assign all subjects to JHS 1A
  const allSubjects = await prisma.subject.findMany()
  for (const sub of allSubjects) {
    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: createdClasses[0].id, subjectId: sub.id } },
      update: {},
      create: { classId: createdClasses[0].id, subjectId: sub.id }
    })
  }

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: { username: 'admin', email: 'admin@school.com', password: 'admin123', role: 'admin', name: 'Administrator' }
  })

  // Sample parents
  const parents = [
    { name: 'Kwame Mensah', phone: '+233 24 111 2222', email: 'kwame@gmail.com', address: 'East Legon, Accra' },
    { name: 'Akosua Boateng', phone: '+233 27 333 4444', email: 'akosua@gmail.com', address: 'Tema, Greater Accra' },
    { name: 'Yaw Darko', phone: '+233 20 555 6666', email: 'yaw@gmail.com', address: 'Kasoa, Central Region' },
    { name: 'Ama Asante', phone: '+233 54 777 8888', email: 'ama@gmail.com', address: 'Spintex, Accra' },
  ]
  const createdParents = []
  for (const p of parents) {
    const parent = await prisma.parent.create({ data: p })
    createdParents.push(parent)
  }

  // Sample students in JHS 1A
  const studentNames = [
    ['Kofi Mensah', 'Male'], ['Abena Boateng', 'Female'], ['Kweku Darko', 'Male'],
    ['Akua Asante', 'Female'], ['Yaw Frimpong', 'Male'], ['Adwoa Owusu', 'Female'],
    ['Kojo Amponsah', 'Male'], ['Esi Amoah', 'Female'], ['Kwabena Tetteh', 'Male'],
    ['Adjoa Quaye', 'Female'],
  ]

  for (let i = 0; i < studentNames.length; i++) {
    const [name, gender] = studentNames[i]
    await prisma.student.create({
      data: {
        studentId: `ACC-2024-${String(i + 1).padStart(3, '0')}`,
        name,
        gender,
        dob: new Date(`2010-0${(i % 9) + 1}-15`),
        classId: createdClasses[0].id,
        parentId: createdParents[i % createdParents.length].id,
        address: 'Accra, Ghana',
      }
    })
  }

  // Sample staff
  const staff = [
    { staffId: 'STF-001', name: 'Mr. Emmanuel Asare', role: 'Teacher', subject: 'Mathematics', classId: createdClasses[0].id },
    { staffId: 'STF-002', name: 'Mrs. Grace Owusu', role: 'Teacher', subject: 'English Language' },
    { staffId: 'STF-003', name: 'Mr. Charles Aidoo', role: 'Teacher', subject: 'Science' },
    { staffId: 'STF-004', name: 'Dr. Sandra Kumah', role: 'Headmaster' },
    { staffId: 'STF-005', name: 'Mr. Felix Tawiah', role: 'Admin' },
  ]
  for (const s of staff) {
    await prisma.staff.create({ data: s })
  }

  // Sample results for JHS 1A, Term 1, 2024
  const students = await prisma.student.findMany({ where: { classId: createdClasses[0].id } })
  const mathSubject = await prisma.subject.findUnique({ where: { code: 'MATH' } })
  const engSubject = await prisma.subject.findUnique({ where: { code: 'ENG' } })

  for (const student of students) {
    const ca1 = Math.floor(Math.random() * 30) + 1
    const exam1 = Math.floor(Math.random() * 70) + 1
    const total1 = ca1 + exam1
    const grade1 = total1 >= 80 ? 'A' : total1 >= 70 ? 'B' : total1 >= 60 ? 'C' : total1 >= 50 ? 'D' : 'F'

    const ca2 = Math.floor(Math.random() * 30) + 1
    const exam2 = Math.floor(Math.random() * 70) + 1
    const total2 = ca2 + exam2
    const grade2 = total2 >= 80 ? 'A' : total2 >= 70 ? 'B' : total2 >= 60 ? 'C' : total2 >= 50 ? 'D' : 'F'

    await prisma.result.upsert({
      where: { studentId_subjectId_term_year: { studentId: student.id, subjectId: mathSubject.id, term: 'Term 1', year: '2024' } },
      update: {},
      create: { studentId: student.id, subjectId: mathSubject.id, term: 'Term 1', year: '2024', ca: ca1, exam: exam1, total: total1, grade: grade1 }
    })
    await prisma.result.upsert({
      where: { studentId_subjectId_term_year: { studentId: student.id, subjectId: engSubject.id, term: 'Term 1', year: '2024' } },
      update: {},
      create: { studentId: student.id, subjectId: engSubject.id, term: 'Term 1', year: '2024', ca: ca2, exam: exam2, total: total2, grade: grade2 }
    })

    // Sample payments
    await prisma.payment.create({
      data: {
        studentId: student.id,
        term: 'Term 1', year: '2024',
        feeType: 'Tuition',
        amount: 1500,
        paid: Math.random() > 0.3 ? 1500 : 750,
        balance: Math.random() > 0.3 ? 0 : 750,
        datePaid: new Date(),
      }
    })
  }

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });