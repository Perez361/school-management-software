// ─────────────────────────────────────────────
// app/(app)/parents/new/page.tsx  (enhanced)
// ─────────────────────────────────────────────
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface ParentForm { name: string; phone: string; email?: string; address?: string }

const inp: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }
const lbl = (t: string, req = false) => <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{t}{req && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}</label>

export default function NewParentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<ParentForm>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(data: ParentForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/parents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error(await res.text())
      router.push('/parents')
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link href="/parents" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}><ArrowLeft size={16} /></Link>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Parents</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Add Parent / Guardian</h1>
        </div>
      </div>
      <div style={{ padding: '28px 32px', maxWidth: 560 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Contact Details</div>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                {lbl('Full Name', true)}
                <input {...register('name', { required: true })} style={inp} placeholder="e.g. Kwame Mensah" />
                {errors.name && <p style={{ color: '#b91c1c', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>Name is required</p>}
              </div>
              <div>
                {lbl('Phone Number', true)}
                <input {...register('phone', { required: true })} style={inp} placeholder="+233 XX XXX XXXX" />
                {errors.phone && <p style={{ color: '#b91c1c', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>Phone is required</p>}
              </div>
              <div>{lbl('Email Address')}<input {...register('email')} type="email" style={inp} placeholder="parent@email.com" /></div>
              <div>{lbl('Home Address')}<input {...register('address')} style={inp} placeholder="Town / Area, Region" /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : '#faf7f0', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} /> {loading ? 'Saving…' : 'Save Parent'}
            </button>
            <Link href="/parents" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}