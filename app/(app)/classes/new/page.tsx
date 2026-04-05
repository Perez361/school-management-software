import { redirect } from 'next/navigation'

// Classes are now managed directly from the Classes page
export default function NewClassPage() {
  redirect('/classes')
}
