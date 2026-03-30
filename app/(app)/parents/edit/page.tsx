import { Suspense } from 'react'
import EditParent from './EditParent'

export default function Page() {
  return (
    <Suspense>
      <EditParent />
    </Suspense>
  )
}
