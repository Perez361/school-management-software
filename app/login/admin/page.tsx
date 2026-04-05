import { Suspense } from 'react'
import AdminLogin from './AdminLogin'

export default function Page() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  )
}
