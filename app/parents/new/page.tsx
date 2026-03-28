'use client'
// src/app/parents/new/page.tsx
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface ParentForm {
  name: string
  phone: string
  email?: string
  address?: string
}

export default function NewParentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<ParentForm>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(data: ParentForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/parents')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/parents" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Add Parent / Guardian</h1>
            <p className="text-sm text-slate-500">Register a new parent or guardian</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="label">Full Name *</label>
            <input {...register('name', { required: 'Name is required' })} className="input" placeholder="e.g. Kwame Mensah" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Phone Number *</label>
            <input {...register('phone', { required: 'Phone is required' })} className="input" placeholder="+233 XX XXX XXXX" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Email Address</label>
            <input {...register('email')} type="email" className="input" placeholder="parent@email.com" />
          </div>

          <div>
            <label className="label">Home Address</label>
            <input {...register('address')} className="input" placeholder="Town / Area, Region" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Parent'}
            </button>
            <Link href="/parents" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
