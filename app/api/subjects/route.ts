// src/app/api/subjects/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(subjects)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, code } = body
  if (!name || !code) return NextResponse.json({ error: 'Name and code required' }, { status: 400 })
  const subject = await prisma.subject.create({ data: { name, code: code.toUpperCase() } })
  return NextResponse.json(subject, { status: 201 })
}
