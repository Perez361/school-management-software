'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard, Users, UserCheck, UserSquare2, BookOpen,
  FileText, Receipt, BarChart3, Settings, GraduationCap, LogOut,
  ChevronRight
} from 'lucide-react'

const navGroups = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'People',
    items: [
      { label: 'Students',  href: '/students',  icon: Users },
      { label: 'Parents',   href: '/parents',   icon: UserCheck },
      { label: 'Staff',     href: '/staff',     icon: UserSquare2 },
    ]
  },
  {
    label: 'Academics',
    items: [
      { label: 'Classes',  href: '/classes',  icon: BookOpen },
      { label: 'Results',  href: '/results',  icon: BarChart3 },
    ]
  },
  {
    label: 'Administration',
    items: [
      { label: 'Billing',  href: '/billing',  icon: Receipt },
      { label: 'Reports',  href: '/reports',  icon: FileText },
      { label: 'Settings', href: '/settings', icon: Settings },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <aside style={{
      width: 248, flexShrink: 0, height: '100vh',
      background: 'var(--navy)', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(201,168,76,0.1)', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))',
            border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <GraduationCap size={19} color="#c9a84c" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#e2c97e', whiteSpace: 'nowrap' }}>SchoolDesk</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'rgba(201,168,76,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>Management System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', position: 'relative', zIndex: 1, scrollbarWidth: 'none' }}>
        {navGroups.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < navGroups.length - 1 ? 20 : 0 }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.3)', padding: '0 10px', marginBottom: 6 }}>
              {group.label}
            </div>
            {group.items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#e2c97e' : 'rgba(255,255,255,0.75)',
                    textDecoration: 'none', transition: 'all 0.14s ease',
                    marginBottom: 1, position: 'relative',
                    background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                    border: active ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}}
                >
                  {active && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '55%', background: '#c9a84c', borderRadius: '0 2px 2px 0' }} />
                  )}
                  <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(201,168,76,0.15)' : 'transparent', flexShrink: 0 }}>
                    <Icon size={15} color={active ? '#c9a84c' : 'rgba(255,255,255,0.6)'} strokeWidth={active ? 2 : 1.75} />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <ChevronRight size={12} style={{ opacity: 0.4, flexShrink: 0 }} color="#c9a84c" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 16px 16px', borderTop: '1px solid rgba(201,168,76,0.08)', position: 'relative', zIndex: 1, flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(201,168,76,0.12)', border: '1.5px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: '#e2c97e', flexShrink: 0,
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'AD'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'rgba(201,168,76,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name ?? 'Administrator'}
            </div>
            <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role ?? 'Admin'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 8, cursor: 'pointer', color: 'rgba(239,68,68,0.5)',
              padding: '6px 7px', display: 'flex', alignItems: 'center', transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.5)'; }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
