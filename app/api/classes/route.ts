// src/app/api/classes/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, level, section } = body

  if (!name || !level) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cls = await prisma.class.create({ data: { name, level, section } })
  return NextResponse.json(cls, { status: 201 })
}
