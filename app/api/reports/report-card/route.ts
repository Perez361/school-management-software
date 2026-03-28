// src/app/api/reports/report-card/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { rankStudents } from '@/lib/grades'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const term = searchParams.get('term') || 'Term 1'
  const year = searchParams.get('year') || '2024'

  if (!studentId) {
    return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  }

  const [student, results, settings] = await Promise.all([
    prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: { class: true, parent: true },
    }),
    prisma.result.findMany({
      where: { studentId: parseInt(studentId), term, year },
      include: { subject: true },
      orderBy: { subject: { name: 'asc' } },
    }),
    prisma.schoolSettings.findFirst(),
  ])

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Get all results for student's class to calculate ranking
  const classResults = await prisma.result.findMany({
    where: { term, year, student: { classId: student.classId } },
    include: { student: true },
  })

  const studentMap: Record<number, { studentId: number; name: string; results: { total: number }[] }> = {}
  for (const r of classResults) {
    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = { studentId: r.studentId, name: r.student.name, results: [] }
    }
    studentMap[r.studentId].results.push({ total: r.total })
  }
  const rankings = rankStudents(Object.values(studentMap))
  const myRanking = rankings.find(r => r.studentId === student.id)

  const reportData = {
    school: {
      name: settings?.schoolName || 'Our School',
      motto: settings?.motto || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
    },
    student: {
      name: student.name,
      studentId: student.studentId,
      class: student.class.name,
      gender: student.gender,
    },
    term,
    year,
    position: myRanking?.position || 0,
    totalStudents: rankings.length,
    results: results.map(r => ({
      subject: r.subject.name,
      ca: r.ca,
      exam: r.exam,
      total: r.total,
    })),
  }

  return NextResponse.json(reportData)
}
