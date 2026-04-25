'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, UserPlus, Camera, X } from 'lucide-react'
import { api, Class, Parent } from '@/lib/api'
import { toTitleCase } from '@/lib/utils'

interface StudentForm {
  name: string; gender: string; dob: string
  classId: string; parentId?: string; phone?: string; address?: string
}

const inp: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }
const lbl = (t: string, req = false) => <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{t}{req && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}</label>

export default function NewStudentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<StudentForm>()
  const [classes, setClasses] = useState<Class[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [photo, setPhoto]     = useState<string | null>(null)
  const fileRef               = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getClasses().then(setClasses).catch(() => {})
    api.getParents().then(setParents).catch(() => {})
  }, [])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function onSubmit(data: StudentForm) {
    setLoading(true); setError('')
    try {
      await api.createStudent({ name: toTitleCase(data.name), gender: data.gender, dob: data.dob, classId: parseInt(data.classId), parentId: data.parentId ? parseInt(data.parentId) : undefined, phone: data.phone || undefined, address: data.address || undefined, photo: photo || undefined })
      router.push('/students')
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/students" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none', flexShrink: 0 }}><ArrowLeft size={16} /></Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Students</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Add New Student</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(139,26,26,0.07)', border: '1px solid rgba(139,26,26,0.15)', borderRadius: 9, padding: '8px 14px' }}>
          <UserPlus size={14} color="var(--gold)" />
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>New enrollment</span>
        </div>
      </div>

      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px)', maxWidth: 680 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

          {/* Personal Details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Personal Details</div>
            <div style={{ padding: 'clamp(16px,3vw,22px)' }}>
              {/* Photo Upload */}
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ width: 80, height: 80, borderRadius: '50%', border: '2px dashed var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                >
                  {photo
                    ? <img src={photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <><Camera size={20} color="var(--text-muted)" /><span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'system-ui' }}>Photo</span></>
                  }
                </div>
                <div>
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ fontSize: 12, padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', fontFamily: 'system-ui', color: 'var(--text-secondary)' }}>Upload Photo</button>
                  {photo && <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = '' }} style={{ marginLeft: 8, fontSize: 12, padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={13} /></button>}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'system-ui' }}>Optional · JPG, PNG</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                {lbl('Full Name', true)}
                <input {...register('name', { required: true })} style={inp} placeholder="e.g. Kofi Mensah" />
                {errors.name && <p style={{ color: '#b91c1c', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>Name is required</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
                <div>
                  {lbl('Gender', true)}
                  <select {...register('gender', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  {lbl('Date of Birth', true)}
                  <input type="date" {...register('dob', { required: true })} style={inp} />
                </div>
                <div>
                  {lbl('Phone')}
                  <input {...register('phone')} style={inp} placeholder="+233 XX XXX XXXX" />
                </div>
                <div>
                  {lbl('Address')}
                  <input {...register('address')} style={inp} placeholder="Town / Area, Region" />
                </div>
              </div>
            </div>
          </div>

          {/* Academic & Family */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Academic & Family</div>
            <div style={{ padding: 'clamp(16px,3vw,22px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
              <div>
                {lbl('Class', true)}
                <select {...register('classId', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                {lbl('Parent / Guardian')}
                <select {...register('parentId')} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="">Select parent (optional)</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : 'var(--gold-pale)', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} /> {loading ? 'Saving…' : 'Save Student'}
            </button>
            <Link href="/students" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}