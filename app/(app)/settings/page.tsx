'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, CheckCircle, Building2, Calendar, School } from 'lucide-react'
import { api, SchoolSettings } from '@/lib/api'

interface SettingsFormData {
  schoolName: string; motto?: string; address?: string
  phone?: string; email?: string; currentTerm: string; currentYear: string
}

const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.01em' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }

function SettingsForm({ settings }: { settings: SchoolSettings | null }) {
  const { register, handleSubmit } = useForm<SettingsFormData>({
    defaultValues: settings ? {
      schoolName: settings.schoolName, motto: settings.motto ?? '', address: settings.address ?? '',
      phone: settings.phone ?? '', email: settings.email ?? '',
      currentTerm: settings.currentTerm, currentYear: settings.currentYear,
    } : { schoolName: '', currentTerm: 'Term 1', currentYear: '2024' }
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(data: SettingsFormData) {
    setSaving(true); setError('')
    try {
      await api.upsertSettings({
        schoolName: data.schoolName, motto: data.motto, address: data.address,
        phone: data.phone, email: data.email, currentTerm: data.currentTerm, currentYear: data.currentYear,
      })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setSaving(false) }
  }

  const sectionStyle: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }
  const sectionHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)' }
  const sectionBodyStyle: React.CSSProperties = { padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={15} color="var(--gold)" /></div>
          <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>School Information</div><div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Displayed on all generated documents and reports</div></div>
        </div>
        <div style={sectionBodyStyle}>
          <div><label style={labelStyle}>School Name *</label><input {...register('schoolName', { required: true })} style={inputStyle} placeholder="e.g. Accra Academy School" /></div>
          <div><label style={labelStyle}>School Motto</label><input {...register('motto')} style={inputStyle} placeholder="e.g. Knowledge is Power" /></div>
          <div><label style={labelStyle}>Address</label><input {...register('address')} style={inputStyle} placeholder="P.O. Box 1234, Accra, Ghana" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14 }}>
            <div><label style={labelStyle}>Phone</label><input {...register('phone')} style={inputStyle} placeholder="+233 XX XXX XXXX" /></div>
            <div><label style={labelStyle}>Email</label><input {...register('email')} type="email" style={inputStyle} placeholder="info@school.edu.gh" /></div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={15} color="var(--gold)" /></div>
          <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Academic Period</div><div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Controls the current term shown on the dashboard</div></div>
        </div>
        <div style={{ ...sectionBodyStyle, flexDirection: 'row', flexWrap: 'wrap' } as React.CSSProperties}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Current Term</label>
            <select {...register('currentTerm')} style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties}>
              <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Academic Year</label>
            <select {...register('currentYear')} style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties}>
              <option value="2023">2023</option><option value="2024">2024</option><option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: saving ? 'var(--surface-2)' : 'var(--navy)', color: saving ? 'var(--text-muted)' : 'var(--gold-pale)', border: saving ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 2px 10px rgba(139,26,26,0.2)' }}>
          <Save size={15} />{saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui', fontSize: 13, color: '#15803d', fontWeight: 600 }}><CheckCircle size={15} /> Settings saved successfully!</div>}
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null | undefined>(undefined)

  useEffect(() => { api.getSettings().then(setSettings) }, [])

  if (settings === undefined) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} /><span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Administration</span></div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>Configure school information and academic period</p>
        </div>
        {settings && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--navy)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(201,168,76,0.2)', flexShrink: 0 }}>
            <School size={14} color="#c9a84c" />
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{settings.currentTerm} · {settings.currentYear}</span>
          </div>
        )}
      </div>
      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', maxWidth: 680 }}>
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
