// app/(app)/settings/page.tsx
import { prisma } from '@/lib/prisma'
import SettingsForm from './SettingsForm'
import { Settings2, School } from 'lucide-react'

export default async function SettingsPage() {
  const settings = await prisma.schoolSettings.findFirst()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      <div style={{
        padding: '28px 32px 24px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Administration</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
            Settings
          </h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>
            Configure school information and academic period
          </p>
        </div>
        {settings && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--navy)', borderRadius: 10, padding: '10px 16px',
            border: '1px solid rgba(201,168,76,0.2)',
          }}>
            <School size={14} color="#c9a84c" />
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>
              {settings.currentTerm} · {settings.currentYear}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 680 }}>
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// app/(app)/settings/SettingsForm.tsx  (enhanced)
// ─────────────────────────────────────────────────────