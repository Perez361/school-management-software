// src/app/api/students/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: parseInt(params.id) },
    include: { class: true, parent: true },
  })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(student)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, gender, dob, classId, parentId, phone, address } = body

  const student = await prisma.student.update({
    where: { id: parseInt(params.id) },
    data: {
      name,
      gender,
      dob: dob ? new Date(dob) : undefined,
      classId: classId ? parseInt(classId) : undefined,
      parentId: parentId ? parseInt(parentId) : null,
      phone: phone || null,
      address: address || null,
    },
  })
  return NextResponse.json(student)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  // Delete related records first
  await prisma.result.deleteMany({ where: { studentId: parseInt(params.id) } })
  await prisma.payment.deleteMany({ where: { studentId: parseInt(params.id) } })
  await prisma.student.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
