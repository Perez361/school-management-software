// src/app/api/parents/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const parents = await prisma.parent.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(parents)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, email, address } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
  }

  const parent = await prisma.parent.create({ data: { name, phone, email, address } })
  return NextResponse.json(parent, { status: 201 })
}
