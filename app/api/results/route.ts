// src/app/api/results/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getGrade, getRemark } from '@/lib/grades'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const term = searchParams.get('term')
  const year = searchParams.get('year')
  const studentId = searchParams.get('studentId')

  const results = await prisma.result.findMany({
    where: {
      ...(term ? { term } : {}),
      ...(year ? { year } : {}),
      ...(studentId ? { studentId: parseInt(studentId) } : {}),
      ...(classId ? { student: { classId: parseInt(classId) } } : {}),
    },
    include: { student: true, subject: true },
    orderBy: [{ student: { name: 'asc' } }, { subject: { name: 'asc' } }],
  })
  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { studentId, subjectId, term, year, ca, exam, remark } = body

  if (!studentId || !subjectId || !term || !year || ca == null || exam == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const total = parseFloat(ca) + parseFloat(exam)
  const grade = getGrade(total)
  const autoRemark = remark || getRemark(total)

  const result = await prisma.result.upsert({
    where: {
      studentId_subjectId_term_year: {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        term,
        year,
      }
    },
    update: { ca: parseFloat(ca), exam: parseFloat(exam), total, grade, remark: autoRemark },
    create: {
      studentId: parseInt(studentId),
      subjectId: parseInt(subjectId),
      term,
      year,
      ca: parseFloat(ca),
      exam: parseFloat(exam),
      total,
      grade,
      remark: autoRemark,
    }
  })

  return NextResponse.json(result, { status: 201 })
}
