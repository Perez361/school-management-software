'use client'
// src/app/students/[id]/edit/page.tsx
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

interface StudentForm {
  name: string
  gender: string
  dob: string
  classId: string
  parentId?: string
  phone?: string
  address?: string
}

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>()
  const [classes, setClasses]   = useState<{ id: number; name: string }[]>([])
  const [parents, setParents]   = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(setClasses)
    fetch('/api/parents').then(r => r.json()).then(setParents)
    fetch(`/api/students/${id}`).then(r => r.json()).then((student: any) => {
      reset({
        name: student.name,
        gender: student.gender,
        dob: new Date(student.dob).toISOString().split('T')[0],
        classId: String(student.classId),
        parentId: student.parentId ? String(student.parentId) : '',
        phone: student.phone || '',
        address: student.address || '',
      })
    })
  }, [id, reset])

  async function onSubmit(data: StudentForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push(`/students/${id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this student? This cannot be undone.')) return
    setDeleting(true)
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' })
      router.push('/students')
    } catch (e: any) {
      setError(e.message)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/students/${id}`} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Edit Student</h1>
            <p className="text-sm text-slate-500">Update student information</p>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2 text-xs">
          <Trash2 className="w-3.5 h-3.5" />
          {deleting ? 'Deleting...' : 'Delete Student'}
        </button>
      </div>

      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input {...register('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select {...register('gender', { required: true })} className="input">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" {...register('dob')} className="input" />
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
                <option value="">No parent linked</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" />
            </div>
            <div>
              <label className="label">Address</label>
              <input {...register('address')} className="input" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href={`/students/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
