import { Suspense } from 'react'
import InvoicePage from './Invoice'

export default function Page() {
  return (
    <Suspense>
      <InvoicePage />
    </Suspense>
  )
}
