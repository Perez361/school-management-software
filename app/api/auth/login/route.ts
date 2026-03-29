// app/api/auth/login/route.ts
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name })

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role, email: user.email },
  })

  res.cookies.set('auth-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  return res
}