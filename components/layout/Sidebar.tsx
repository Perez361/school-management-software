'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard, Users, UserCheck, UserSquare2, BookOpen,
  FileText, Receipt, BarChart3, Settings, GraduationCap, LogOut,
  ChevronRight, Menu, X,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Main',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'People',
    items: [
      { label: 'Students', href: '/students', icon: Users },
      { label: 'Parents',  href: '/parents',  icon: UserCheck },
      { label: 'Staff',    href: '/staff',     icon: UserSquare2 },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Classes', href: '/classes', icon: BookOpen },
      { label: 'Results', href: '/results', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Billing',  href: '/billing',  icon: Receipt },
      { label: 'Reports',  href: '/reports',  icon: FileText },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

// Derive active page title for the mobile topbar
function getPageTitle(pathname: string) {
  for (const g of navGroups) {
    for (const item of g.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return item.label
      }
    }
  }
  return 'SchoolDesk'
}

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuth()

  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleLogout() {
    logout()
    router.push('/')
  }

  const pageTitle = getPageTitle(pathname)

  const sidebarContent = (
    <>
      {/* Logo row */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-icon">
            <GraduationCap size={19} color="#c9a84c" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-logo-title">SchoolDesk</div>
            <div className="sidebar-logo-sub">Management System</div>
          </div>
          {/* Close button — visible only on mobile */}
          <button className="sidebar-close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {navGroups.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < navGroups.length - 1 ? 20 : 0 }}>
            <div className="sidebar-nav-label">{group.label}</div>
            {group.items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link${active ? ' active' : ''}`}
                  style={{
                    background: active ? 'rgba(201,168,76,0.12)' : undefined,
                    borderColor: active ? 'rgba(201,168,76,0.2)' : undefined,
                  }}
                >
                  {active && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '55%', background: '#c9a84c', borderRadius: '0 2px 2px 0' }} />
                  )}
                  <div className="nav-icon-wrap">
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
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'AD'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.name ?? 'Administrator'}</div>
            <div className="sidebar-user-role">{user?.role ?? 'Admin'}</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="mobile-topbar-title">SchoolDesk</span>
        <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'rgba(201,168,76,0.5)' }}>{pageTitle}</span>
      </div>

      {/* ── Desktop sidebar (always visible) / Mobile drawer ── */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="sidebar-overlay open"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}