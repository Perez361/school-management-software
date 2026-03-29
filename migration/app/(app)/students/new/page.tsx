'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { api, Class, Parent } from '@/lib/tauri'

interface StudentForm {
  name: string; gender: string; dob: string
  classId: string; parentId?: string; phone?: string; address?: string
}

const labelEl = (text: string, required = false) => (
  <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.01em' }}>
    {text}{required && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}
  </label>
)

const inputCls: React.CSSProperties = {
  width: '100%', padding: '9px 13px',
  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  borderRadius: 8, fontFamily: 'system-ui', fontSize: 13,
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}

export default function NewStudentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<StudentForm>()
  const [classes, setClasses] = useState<Class[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getClasses(), api.getParents()]).then(([c, p]) => {
      setClasses(c); setParents(p)
    })
  }, [])

  async function onSubmit(data: StudentForm) {
    setLoading(true); setError('')
    try {
      await api.createStudent({
        name: data.name,
        gender: data.gender,
        dob: data.dob,
        classId: parseInt(data.classId),
        parentId: data.parentId ? parseInt(data.parentId) : undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      })
      router.push('/students')
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/students" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Students</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Add New Student</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 9, padding: '8px 14px' }}>
          <UserPlus size={14} color="#2563eb" />
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>New enrollment</span>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 680 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Personal Details</div>
            <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                {labelEl('Full Name', true)}
                <input {...register('name', { required: true })} style={inputCls} placeholder="e.g. Kofi Mensah" />
                {errors.name && <p style={{ color: '#b91c1c', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>Name is required</p>}
              </div>
              <div>
                {labelEl('Gender', true)}
                <select {...register('gender', { required: true })} style={{ ...inputCls, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                {labelEl('Date of Birth', true)}
                <input type="date" {...register('dob', { required: true })} style={inputCls} />
              </div>
              <div>
                {labelEl('Phone')}
                <input {...register('phone')} style={inputCls} placeholder="+233 XX XXX XXXX" />
              </div>
              <div>
                {labelEl('Address')}
                <input {...register('address')} style={inputCls} placeholder="Town / Area, Region" />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Academic & Family</div>
            <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {labelEl('Class', true)}
                <select {...register('classId', { required: true })} style={{ ...inputCls, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                {labelEl('Parent / Guardian')}
                <select {...register('parentId')} style={{ ...inputCls, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="">Select parent (optional)</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : '#faf7f0', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 10px rgba(15,31,61,0.2)' }}>
              <Save size={15} /> {loading ? 'Saving…' : 'Save Student'}
            </button>
            <Link href="/students" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
