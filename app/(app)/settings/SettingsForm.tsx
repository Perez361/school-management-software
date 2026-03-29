'use client'
// src/app/settings/SettingsForm.tsx
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'

interface Settings {
  id?: number
  schoolName: string
  motto?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  currentTerm: string
  currentYear: string
}

export default function SettingsForm({ settings }: { settings: Settings | null }) {
  const { register, handleSubmit } = useForm<Settings>({ defaultValues: settings || {
    schoolName: '',
    currentTerm: 'Term 1',
    currentYear: '2024',
  }})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function onSubmit(data: Settings) {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">School Information</h2>

        <div>
          <label className="label">School Name *</label>
          <input {...register('schoolName', { required: true })} className="input" placeholder="e.g. Accra Academy School" />
        </div>
        <div>
          <label className="label">School Motto</label>
          <input {...register('motto')} className="input" placeholder="e.g. Knowledge is Power" />
        </div>
        <div>
          <label className="label">Address</label>
          <input {...register('address')} className="input" placeholder="P.O. Box 1234, Accra, Ghana" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input" placeholder="+233 XX XXX XXXX" />
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} className="input" placeholder="info@school.edu.gh" />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Academic Period</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Current Term</label>
            <select {...register('currentTerm')} className="input">
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select {...register('currentYear')} className="input">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="text-green-600 text-sm flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Settings saved!
          </span>
        )}
      </div>
    </form>
  )
}
