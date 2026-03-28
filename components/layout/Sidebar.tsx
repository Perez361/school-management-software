'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, UserSquare2, BookOpen,
  FileText, Receipt, BarChart3, Settings, GraduationCap, ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { label: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Students',    href: '/students',   icon: Users },
  { label: 'Parents',     href: '/parents',    icon: UserCheck },
  { label: 'Staff',       href: '/staff',      icon: UserSquare2 },
  { label: 'Classes',     href: '/classes',    icon: BookOpen },
  { label: 'Results',     href: '/results',    icon: BarChart3 },
  { label: 'Reports',     href: '/reports',    icon: FileText },
  { label: 'Billing',     href: '/billing',    icon: Receipt },
  { label: 'Settings',    href: '/settings',   icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[240px] shrink-0 h-screen bg-white border-r border-slate-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-slate-900 leading-none text-sm">SchoolDesk</p>
            <p className="text-xs text-slate-400 mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</p>
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={clsx('nav-link group', active && 'active')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Administrator</p>
            <p className="text-xs text-slate-400">admin@school.edu.gh</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
