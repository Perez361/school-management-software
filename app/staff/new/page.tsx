'use client'
// src/app/staff/new/page.tsx
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface StaffForm {
  name: string
  role: string
  phone?: string
  email?: string
  subject?: string
  classId?: string
}

export default function NewStaffPage() {
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StaffForm>({
    defaultValues: { role: 'Teacher' }
  })
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const role = watch('role')

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(setClasses)
  }, [])

  async function onSubmit(data: StaffForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/staff')
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
          <Link href="/staff" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Add Staff Member</h1>
            <p className="text-sm text-slate-500">Register a new teacher or admin</p>
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
            <input {...register('name', { required: 'Name is required' })} className="input" placeholder="e.g. Mr. Emmanuel Asare" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Role *</label>
            <select {...register('role', { required: true })} className="input">
              <option value="Teacher">Teacher</option>
              <option value="Admin">Admin</option>
              <option value="Headmaster">Headmaster / Headmistress</option>
              <option value="Bursar">Bursar</option>
            </select>
          </div>

          {role === 'Teacher' && (
            <>
              <div>
                <label className="label">Subject Taught</label>
                <input {...register('subject')} className="input" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="label">Class Teacher Of</label>
                <select {...register('classId')} className="input">
                  <option value="">Not a class teacher</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+233 XX XXX XXXX" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="staff@school.edu.gh" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Staff Member'}
            </button>
            <Link href="/staff" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
