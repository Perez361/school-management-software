'use client'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { api, Class } from '@/lib/tauri'

interface StaffForm {
  name: string
  role: string
  phone?: string
  email?: string
  subject?: string
  classId?: string
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px',
  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  borderRadius: 8, fontFamily: 'system-ui', fontSize: 13,
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}
const lbl = (t: string, req = false) => (
  <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
    {t}{req && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}
  </label>
)

export default function EditStaff() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const staffId = parseInt(id)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<StaffForm>({ defaultValues: { role: 'Teacher' } })
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const role = watch('role')

  useEffect(() => {
    Promise.all([api.getClasses(), api.getStaff()]).then(([cls, staffList]) => {
      setClasses(cls)
      const found = staffList.find((s) => s.id === staffId)
      if (found) {
        reset({
          name: found.name,
          role: found.role,
          phone: found.phone ?? '',
          email: found.email ?? '',
          subject: found.subject ?? '',
          classId: found.classId ? String(found.classId) : '',
        })
      }
    }).finally(() => setFetchLoading(false))
  }, [staffId, reset])

  async function onSubmit(data: StaffForm) {
    setLoading(true); setError('')
    try {
      await api.updateStaff(staffId, {
        name: data.name,
        role: data.role,
        phone: data.phone || undefined,
        email: data.email || undefined,
        subject: data.subject || undefined,
        classId: data.classId ? parseInt(data.classId) : undefined,
      })
      router.push('/staff')
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link href="/staff" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Staff</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Edit Staff Member</h1>
        </div>
      </div>
      <div style={{ padding: '28px 32px', maxWidth: 600 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Staff Details</div>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                {lbl('Full Name', true)}
                <input {...register('name', { required: true })} style={inp} placeholder="e.g. Mr. Emmanuel Asare" />
                {errors.name && <p style={{ color: '#b91c1c', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>Name is required</p>}
              </div>
              <div>
                {lbl('Role', true)}
                <select {...register('role', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                  <option value="Headmaster">Headmaster / Headmistress</option>
                  <option value="Bursar">Bursar</option>
                </select>
              </div>
              {role === 'Teacher' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>{lbl('Subject Taught')}<input {...register('subject')} style={inp} placeholder="e.g. Mathematics" /></div>
                  <div>
                    {lbl('Class Teacher Of')}
                    <select {...register('classId')} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                      <option value="">Not a class teacher</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>{lbl('Phone')}<input {...register('phone')} style={inp} placeholder="+233 XX XXX XXXX" /></div>
                <div>{lbl('Email')}<input {...register('email')} type="email" style={inp} placeholder="staff@school.edu.gh" /></div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : '#faf7f0', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} /> {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href="/staff" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}