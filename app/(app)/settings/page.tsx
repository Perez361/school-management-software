'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, CheckCircle, Building2, Calendar, School, Cloud, RefreshCw } from 'lucide-react'
import { api, SchoolSettings, SyncStatus } from '@/lib/api'
import RoleGuard from '@/components/RoleGuard'

interface SettingsFormData {
  schoolName: string; motto?: string; address?: string
  phone?: string; email?: string; currentTerm: string; currentYear: string
  nextTermName?: string; nextTermFee?: string
}

const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.01em' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }

function SettingsForm({ settings }: { settings: SchoolSettings | null }) {
  const { register, handleSubmit } = useForm<SettingsFormData>({
    defaultValues: settings ? {
      schoolName: settings.schoolName, motto: settings.motto ?? '', address: settings.address ?? '',
      phone: settings.phone ?? '', email: settings.email ?? '',
      currentTerm: settings.currentTerm, currentYear: settings.currentYear,
      nextTermName: settings.nextTermName ?? '', nextTermFee: settings.nextTermFee != null ? String(settings.nextTermFee) : '',
    } : { schoolName: '', currentTerm: 'Term 1', currentYear: '' }
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
        nextTermName: data.nextTermName || null,
        nextTermFee: data.nextTermFee ? parseFloat(data.nextTermFee) : null,
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
          <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Academic Period</div><div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Sets the active term and year — used as default across CA, attendance, and reports</div></div>
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
            <input {...register('currentYear')} style={inputStyle} placeholder="e.g. 2024/2025" />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={15} color="var(--gold)" /></div>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Next Term Fees</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Set by admin or bursar at end of term — prints on the terminal report card</div>
          </div>
        </div>
        <div style={{ ...sectionBodyStyle, flexDirection: 'row', flexWrap: 'wrap' } as React.CSSProperties}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Next Term Name</label>
            <select {...register('nextTermName')} style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties}>
              <option value="">Not set</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Fees Amount (GHS)</label>
            <input {...register('nextTermFee')} type="number" min="0" step="0.01" style={inputStyle} placeholder="e.g. 350.00" />
          </div>
        </div>
        <div style={{ padding: '0 22px 16px', fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>
          Leave blank if fees for the next term have not been decided yet.
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

function SyncConfigSection() {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [saved, setSaved] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    api.getSyncStatus().then(s => {
      setStatus(s)
      setEnabled(s.enabled)
    }).catch(() => {})
  }, [])

  async function handleSave() {
    await api.saveSyncConfig(url, anonKey, enabled)
    const s = await api.getSyncStatus()
    setStatus(s)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await api.triggerSync()
      setTimeout(async () => {
        const s = await api.getSyncStatus().catch(() => null)
        if (s) setStatus(s)
      }, 3000)
    } finally { setSyncing(false) }
  }

  const sectionStyle: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }
  const sectionHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)' }
  const sectionBodyStyle: React.CSSProperties = { padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cloud size={15} color="var(--gold)" /></div>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Cloud Sync (Supabase)</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Sync data across multiple devices via Supabase</div>
        </div>
      </div>
      <div style={sectionBodyStyle}>
        <div><label style={labelStyle}>Supabase Project URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} placeholder="https://xxxx.supabase.co" />
        </div>
        <div><label style={labelStyle}>Supabase Anon Key</label>
          <input value={anonKey} onChange={e => setAnonKey(e.target.value)} style={inputStyle} placeholder="eyJ..." type="password" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            Enable sync
          </label>
        </div>
        {status && (
          <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px' }}>
            Status: {status.enabled ? 'Enabled' : 'Disabled'} · {status.pending} pending ·
            Last pull: {status.last_pulled_at === '1970-01-01T00:00:00Z' ? 'Never' : new Date(status.last_pulled_at).toLocaleString()}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Save size={14} /> Save Sync Config
          </button>
          {status?.enabled && (
            <button type="button" onClick={handleSync} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer' }}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : undefined }} /> {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
          {saved && <span style={{ alignSelf: 'center', fontFamily: 'system-ui', fontSize: 13, color: '#15803d', fontWeight: 600 }}>Saved!</span>}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null | undefined>(undefined)

  useEffect(() => { api.getSettings().then(setSettings) }, [])

  if (settings === undefined) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <RoleGuard feature="settings">
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
        <SyncConfigSection />
      </div>
    </div>
    </RoleGuard>
  )
}
