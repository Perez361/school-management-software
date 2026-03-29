'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, UserSquare2, BookOpen,
  FileText, Receipt, BarChart3, Settings, GraduationCap, LogOut, ChevronRight
} from 'lucide-react'

const nav = [
  { label: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students',   href: '/students',  icon: Users },
  { label: 'Parents',    href: '/parents',   icon: UserCheck },
  { label: 'Staff',      href: '/staff',     icon: UserSquare2 },
  { label: 'Classes',    href: '/classes',   icon: BookOpen },
  { label: 'Results',    href: '/results',   icon: BarChart3 },
  { label: 'Reports',    href: '/reports',   icon: FileText },
  { label: 'Billing',    href: '/billing',   icon: Receipt },
  { label: 'Settings',   href: '/settings',  icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-icon">
            <GraduationCap size={18} color="#c9a84c" />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title">SchoolDesk</div>
            <div className="sidebar-logo-sub">Management System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Main Menu</div>
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">AD</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Administrator</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}