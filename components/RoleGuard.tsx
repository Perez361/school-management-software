'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Feature } from '@/lib/permissions'

/**
 * Wraps a page section and redirects to /dashboard if the user
 * doesn't have the required feature permission.
 * Usage: wrap the entire page return in <RoleGuard feature="billing">
 */
export default function RoleGuard({
  feature,
  children,
}: {
  feature: Feature
  children: React.ReactNode
}) {
  const { can, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !can(feature)) {
      router.replace('/dashboard')
    }
  }, [loading, can, feature, router])

  if (loading || !can(feature)) return null
  return <>{children}</>
}
