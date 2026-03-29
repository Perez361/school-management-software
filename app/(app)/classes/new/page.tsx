// ─────────────────────────────────────────────
// app/(app)/classes/new/page.tsx  (enhanced)
// ─────────────────────────────────────────────
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, BookOpen } from 'lucide-react'

interface ClassForm { name: string; level: string; section?: string }

const inp: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }
const lbl = (t: string, req = false) => <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{t}{req && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}</label>

export default function NewClassPage() {
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ClassForm>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const level = watch('level')
  const section = watch('section')

  useEffect(() => {
    if (level && section) setValue('name', `${level} ${section}`)
    else if (level) setValue('name', level)
  }, [level, section, setValue])

  async function onSubmit(data: ClassForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error(await res.text())
      router.push('/classes')
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link href="/classes" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}><ArrowLeft size={16} /></Link>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Add New Class</h1>
        </div>
      </div>
      <div style={{ padding: '28px 32px', maxWidth: 560 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Class Configuration</div>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  {lbl('Level / Grade', true)}
                  <select {...register('level', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                    <option value="">Select level</option>
                    <optgroup label="Basic / JHS">
                      {['Basic 1','Basic 2','Basic 3','Basic 4','Basic 5','Basic 6','JHS 1','JHS 2','JHS 3'].map(v => <option key={v} value={v}>{v}</option>)}
                    </optgroup>
                    <optgroup label="Senior High School">
                      {['SHS 1','SHS 2','SHS 3'].map(v => <option key={v} value={v}>{v}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  {lbl('Section')}
                  <select {...register('section')} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                    <option value="">No section</option>
                    {['A','B','C','D'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                {lbl('Class Name', true)}
                <input {...register('name', { required: 'Class name is required' })} style={inp} placeholder="e.g. JHS 1A (auto-filled above)" />
                {errors.name && <p style={{ color: '#b91c1c', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>{errors.name.message}</p>}
                <p style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>Auto-generated from Level + Section. You can customise it.</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : '#faf7f0', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} /> {loading ? 'Saving…' : 'Create Class'}
            </button>
            <Link href="/classes" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}