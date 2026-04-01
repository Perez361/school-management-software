'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EnterResultsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/exam-records') }, [router])
  return null
}
