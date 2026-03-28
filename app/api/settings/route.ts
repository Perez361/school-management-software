// src/app/api/settings/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const settings = await prisma.schoolSettings.findFirst()
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { schoolName, motto, address, phone, email, currentTerm, currentYear } = body

  const existing = await prisma.schoolSettings.findFirst()

  const settings = existing
    ? await prisma.schoolSettings.update({
        where: { id: existing.id },
        data: { schoolName, motto, address, phone, email, currentTerm, currentYear }
      })
    : await prisma.schoolSettings.create({
        data: { schoolName, motto, address, phone, email, currentTerm, currentYear }
      })

  return NextResponse.json(settings)
}
