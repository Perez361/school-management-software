import { Suspense } from 'react'
import EditStudent from './EditStudent'

export default function Page() {
  return (
    <Suspense>
      <EditStudent />
    </Suspense>
  )
}
