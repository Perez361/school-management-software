'use client'
// app/(app)/dashboard/QuickActions.tsx
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const actions = [
  { label: 'Add New Student',  href: '/students/new',  color: 'var(--navy)' },
  { label: 'Record Payment',   href: '/billing/new',   color: '#16a34a' },
  { label: 'Enter Results',    href: '/results/enter', color: 'var(--navy)' },
  { label: 'Generate Reports', href: '/reports',       color: '#C9A84C' },
]

export default function QuickActions() {
  return (
    <>
      <style>{`
        .quick-action-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-family: system-ui;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          background: var(--surface-2);
          transition: border-color 0.15s, background 0.15s;
        }
        .quick-action-link:hover {
          border-color: var(--gold);
          background: var(--gold-pale);
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map(({ label, href, color }) => (
          <Link key={href} href={href} className="quick-action-link" style={{ color }}>
            {label}
            <ArrowUpRight size={12} />
          </Link>
        ))}
      </div>
    </>
  )
}