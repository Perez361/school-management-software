import { Suspense } from 'react'
import EditStaff from './EditStaff'

export default function Page() {
  return (
    <Suspense>
      <EditStaff />
    </Suspense>
  )
}
