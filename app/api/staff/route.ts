// src/app/api/staff/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const staff = await prisma.staff.findMany({
    include: { class: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(staff)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, role, phone, email, subject, classId } = body

  if (!name || !role) {
    return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
  }

  const count = await prisma.staff.count()
  const staffId = `STF-${String(count + 1).padStart(3, '0')}`

  const staff = await prisma.staff.create({
    data: {
      staffId,
      name,
      role,
      phone,
      email,
      subject,
      classId: classId ? parseInt(classId) : null,
    }
  })
  return NextResponse.json(staff, { status: 201 })
}
