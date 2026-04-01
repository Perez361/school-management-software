'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { api, AppUser } from '@/lib/api'
import { Plus, Pencil, Trash2, KeyRound, ShieldCheck, X, Eye, EyeOff } from 'lucide-react'

const ROLES = ['admin', 'teacher', 'accountant'] as const

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:      { bg: 'rgba(139,26,26,0.1)',   color: '#8b1a1a' },
  teacher:    { bg: 'rgba(22,101,52,0.1)',    color: '#166534' },
  accountant: { bg: 'rgba(30,64,175,0.1)',    color: '#1e40af' },
}

const ROLE_DESC: Record<string, string> = {
  admin:      'Full access to all features',
  teacher:    'Dashboard, students (view), CA scores, results, reports',
  accountant: 'Dashboard, students (view), billing, reports',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', background: 'var(--surface-2)',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6,
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function UserModal({
  user, onClose, onSaved,
}: {
  user: AppUser | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!user
  const [name, setName]         = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail]       = useState(user?.email ?? '')
  const [role, setRole]         = useState(user?.role ?? 'teacher')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (isEdit) {
        await api.updateUser(user!.id, { name, username, email, role })
      } else {
        await api.createUser({ name, username, email, password, role })
      }
      onSaved()
      onClose()
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
            {isEdit ? 'Edit User' : 'Create User'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelStyle}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="e.g. Kwame Mensah" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Username *</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle} placeholder="e.g. kwame" />
            </div>
            <div><label style={labelStyle}>Email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} required type="email" style={inputStyle} placeholder="e.g. kwame@school.edu" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Role *</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <div style={{ marginTop: 5, fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_DESC[role]}</div>
          </div>
          {!isEdit && (
            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={password} onChange={e => setPassword(e.target.value)}
                  required type={showPw ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 40 }} placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Password modal ───────────────────────────────────────────────────────────

function PasswordModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSaving(true); setError('')
    try {
      await api.changeUserPassword(user.id, password)
      setDone(true)
      setTimeout(onClose, 1500)
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Change Password</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 16, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-secondary)' }}>
          Setting new password for <strong>{user.name}</strong>
        </div>
        {error && <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}
        {done && <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#15803d' }}>Password updated!</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input value={password} onChange={e => setPassword(e.target.value)} required
                type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }} placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div><label style={labelStyle}>Confirm Password</label>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} required
              type="password" style={inputStyle} placeholder="Re-enter password" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving || done} style={{ padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: me, can } = useAuth()
  const router = useRouter()
  const [users, setUsers]         = useState<AppUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [editUser, setEditUser]   = useState<AppUser | null | 'new'>()
  const [pwUser, setPwUser]       = useState<AppUser | null>(null)
  const [delUser, setDelUser]     = useState<AppUser | null>(null)
  const [deleting, setDeleting]   = useState(false)
  const [error, setError]         = useState('')

  // Guard: only admins
  useEffect(() => {
    if (!can('users')) router.replace('/dashboard')
  }, [can, router])

  const load = useCallback(async () => {
    setLoading(true)
    try { setUsers(await api.getUsers()) }
    catch (e: any) { setError(e.message || String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!delUser) return
    setDeleting(true)
    try {
      await api.deleteUser(delUser.id)
      setDelUser(null)
      load()
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setDeleting(false) }
  }

  if (!can('users')) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Administration</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>User Accounts</h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>Manage staff login accounts and role permissions</p>
        </div>
        <button onClick={() => setEditUser('new')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', maxWidth: 780 }}>
        {/* Role legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {ROLES.map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: ROLE_COLORS[r].bg, border: `1px solid ${ROLE_COLORS[r].color}22` }}>
              <ShieldCheck size={11} color={ROLE_COLORS[r].color} />
              <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: ROLE_COLORS[r].color, textTransform: 'capitalize' }}>{r}</span>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>— {ROLE_DESC[r]}</span>
            </div>
          ))}
        </div>

        {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

        {loading ? (
          <div style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>Loading…</div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {users.map((u, i) => {
              const rc = ROLE_COLORS[u.role] ?? { bg: 'rgba(100,100,100,0.1)', color: '#555' }
              const isMe = u.id === me?.id
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < users.length - 1 ? '1px solid var(--border-soft)' : undefined, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: '#c9a84c', fontFamily: 'Georgia, serif' }}>
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                      {isMe && <span style={{ fontFamily: 'system-ui', fontSize: 10, background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>You</span>}
                      <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: rc.color, background: rc.bg, padding: '2px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{u.role}</span>
                    </div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email} · @{u.username}</div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setEditUser(u)} title="Edit" style={{ padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => setPwUser(u)} title="Change password" style={{ padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <KeyRound size={13} /> Password
                    </button>
                    {!isMe && (
                      <button onClick={() => setDelUser(u)} title="Delete" style={{ padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'system-ui', fontSize: 12, color: '#b91c1c' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {users.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>No users yet. Click "Add User" to create one.</div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {(editUser === 'new' || (editUser && editUser !== 'new')) && (
        <UserModal
          user={editUser === 'new' ? null : editUser}
          onClose={() => setEditUser(undefined)}
          onSaved={load}
        />
      )}
      {pwUser && <PasswordModal user={pwUser} onClose={() => setPwUser(null)} />}

      {/* Delete confirmation */}
      {delUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, border: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Delete User?</h3>
            <p style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Remove <strong>{delUser.name}</strong> ({delUser.role})? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelUser(null)} style={{ padding: '9px 18px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '9px 18px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
