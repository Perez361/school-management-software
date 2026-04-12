'use client'
import { useState, useEffect } from 'react'
import { FileText, Users, Receipt, Download, ScrollText } from 'lucide-react'
import { api, Class, SchoolSettings } from '@/lib/api'
import ReportActions from './ReportActions'

export default function ReportsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [settings, setSettings] = useState<SchoolSettings | null>(null)

  useEffect(() => {
    Promise.all([api.getClasses(), api.getSettings()]).then(([c, s]) => {
      setClasses(c); setSettings(s)
    })
  }, [])

  const reportTypes = [
    { type: 'report-card' as const, title: 'Terminal Report Cards', description: 'Generate individual PDF report cards with grades, scores, and class position for each student', icon: FileText, color: 'var(--navy)', bg: 'rgba(139,26,26,0.07)', border: 'rgba(139,26,26,0.15)', tag: 'Per student' },
    { type: 'transcript' as const, title: 'Academic Transcripts', description: 'Generate a full academic history for a single student across all terms and years, suitable for transfers or applications', icon: ScrollText, color: '#6d28d9', bg: 'rgba(109,40,217,0.07)', border: 'rgba(109,40,217,0.15)', tag: 'Per student' },
    { type: 'class-list' as const, title: 'Class Registers', description: 'Print full class lists with student IDs, names, gender, and parent contact information', icon: Users, color: '#15803d', bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.15)', tag: 'Per class' },
    { type: 'fee-invoice' as const, title: 'Fee Invoices', description: 'Generate billing invoices showing amounts due, paid, and outstanding balances per student', icon: Receipt, color: '#b45309', bg: 'rgba(180,83,9,0.07)', border: 'rgba(180,83,9,0.15)', tag: 'Per class' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} /><span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Administration</span></div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Reports & Documents</h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>Generate and download PDF documents for printing or sharing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', flexShrink: 0 }}>
          <Download size={14} color="var(--text-muted)" />
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{classes.length} classes · {settings?.schoolName || 'School'}</span>
        </div>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reportTypes.map(({ type, title, description, icon: Icon, color, bg, border, tag }) => (
          <div key={type} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: 'clamp(14px,3vw,18px) clamp(16px,3vw,24px)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={20} color={color} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{title}</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
                </div>
              </div>
              <span style={{ background: bg, color, border: `1px solid ${border}`, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>{tag}</span>
            </div>
            <div style={{ padding: 'clamp(14px,3vw,20px) clamp(16px,3vw,24px)' }}>
              <ReportActions type={type} classes={classes} schoolName={settings?.schoolName || 'Our School'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
