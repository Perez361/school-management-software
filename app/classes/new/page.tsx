'use client'
// src/app/classes/new/page.tsx
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface ClassForm {
  name: string
  level: string
  section?: string
}

export default function NewClassPage() {
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ClassForm>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const level = watch('level')
  const section = watch('section')

  // Auto-generate name from level + section
  useEffect(() => {
    if (level && section) {
      setValue('name', `${level} ${section}`)
    } else if (level) {
      setValue('name', level)
    }
  }, [level, section, setValue])

  async function onSubmit(data: ClassForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/classes')
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
          <Link href="/classes" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Add New Class</h1>
            <p className="text-sm text-slate-500">Create a new class / grade</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Level / Grade *</label>
              <select {...register('level', { required: true })} className="input">
                <option value="">Select level</option>
                <optgroup label="Basic / JHS">
                  <option value="Basic 1">Basic 1</option>
                  <option value="Basic 2">Basic 2</option>
                  <option value="Basic 3">Basic 3</option>
                  <option value="Basic 4">Basic 4</option>
                  <option value="Basic 5">Basic 5</option>
                  <option value="Basic 6">Basic 6</option>
                  <option value="JHS 1">JHS 1</option>
                  <option value="JHS 2">JHS 2</option>
                  <option value="JHS 3">JHS 3</option>
                </optgroup>
                <optgroup label="Senior High School">
                  <option value="SHS 1">SHS 1</option>
                  <option value="SHS 2">SHS 2</option>
                  <option value="SHS 3">SHS 3</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="label">Section</label>
              <select {...register('section')} className="input">
                <option value="">No section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Class Name *</label>
            <input
              {...register('name', { required: 'Class name is required' })}
              className="input"
              placeholder="e.g. JHS 1A (auto-filled)"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            <p className="text-xs text-slate-400 mt-1">Auto-generated from Level + Section. You can customise it.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Create Class'}
            </button>
            <Link href="/classes" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
