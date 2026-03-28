// src/app/api/students/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const q = searchParams.get('q')

  const students = await prisma.student.findMany({
    where: {
      ...(classId ? { classId: parseInt(classId) } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { class: true, parent: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, gender, dob, classId, parentId, phone, address } = body

  if (!name || !gender || !dob || !classId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Generate student ID
  const count = await prisma.student.count()
  const studentId = `ACC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

  const student = await prisma.student.create({
    data: {
      studentId,
      name,
      gender,
      dob: new Date(dob),
      classId: parseInt(classId),
      parentId: parentId ? parseInt(parentId) : null,
      phone,
      address,
    }
  })

  return NextResponse.json(student, { status: 201 })
}
