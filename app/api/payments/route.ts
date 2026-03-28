// src/app/api/payments/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const classId = searchParams.get('classId')

  const payments = await prisma.payment.findMany({
    where: {
      ...(studentId ? { studentId: parseInt(studentId) } : {}),
      ...(classId ? { student: { classId: parseInt(classId) } } : {}),
    },
    include: { student: { include: { class: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { studentId, term, year, feeType, amount, paid } = body

  if (!studentId || !term || !year || !feeType || amount == null || paid == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const amountF = parseFloat(amount)
  const paidF = parseFloat(paid)
  const balance = amountF - paidF

  const payment = await prisma.payment.create({
    data: {
      studentId: parseInt(studentId),
      term,
      year,
      feeType,
      amount: amountF,
      paid: paidF,
      balance,
      datePaid: paidF > 0 ? new Date() : null,
    }
  })

  return NextResponse.json(payment, { status: 201 })
}
