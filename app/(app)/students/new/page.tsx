'use client'
// src/app/students/new/page.tsx
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface StudentForm {
  name: string
  gender: string
  dob: string
  classId: string
  parentId?: string
  phone?: string
  address?: string
}

export default function NewStudentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<StudentForm>()
  const [classes, setClasses] = useState<{id: number, name: string}[]>([])
  const [parents, setParents] = useState<{id: number, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(setClasses)
    fetch('/api/parents').then(r => r.json()).then(setParents)
  }, [])

  async function onSubmit(data: StudentForm) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/students')
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
          <Link href="/students" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Add New Student</h1>
            <p className="text-sm text-slate-500">Fill in the student's details</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input {...register('name', { required: 'Name is required' })} className="input" placeholder="e.g. Kofi Mensah" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Gender *</label>
              <select {...register('gender', { required: true })} className="input">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="label">Date of Birth *</label>
              <input type="date" {...register('dob', { required: true })} className="input" />
            </div>

            <div>
              <label className="label">Class *</label>
              <select {...register('classId', { required: true })} className="input">
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Parent / Guardian</label>
              <select {...register('parentId')} className="input">
                <option value="">Select parent (optional)</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+233 XX XXX XXXX" />
            </div>

            <div>
              <label className="label">Address</label>
              <input {...register('address')} className="input" placeholder="Town / Area, Region" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Student'}
            </button>
            <Link href="/students" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
