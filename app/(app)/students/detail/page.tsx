import { Suspense } from 'react'
import StudentDetail from './StudentDetail'

export default function Page() {
  return (
    <Suspense>
      <StudentDetail />
    </Suspense>
  )
}
