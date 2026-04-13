'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Pencil, Trash2, Check, X, Search } from 'lucide-react'
import { api, Subject } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'

const inp: React.CSSProperties = {
  padding: '8px 12px', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
}

export default function SubjectsPage() {
  const { can } = useAuth()
  const { version, bump } = useLiveData()
  const router = useRouter()
  useEffect(() => { if (!can('settings')) router.replace('/dashboard') }, [can, router])

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')

  // New subject form
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [adding, setAdding]   = useState(false)
  const [addErr, setAddErr]   = useState('')

  // Inline edit state
  const [editId, setEditId]     = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [saving, setSaving]     = useState(false)

  // Delete state
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [delErr, setDelErr]       = useState('')

  useEffect(() => {
    api.getSubjects().then(setSubjects).finally(() => setLoading(false))
  }, [version])

  async function handleAdd() {
    if (!newName.trim() || !newCode.trim()) { setAddErr('Name and code are required.'); return }
    setAdding(true); setAddErr('')
    try {
      await api.createSubject({ name: newName.trim(), code: newCode.trim() })
      setNewName(''); setNewCode('')
      bump()
    } catch (e: any) { setAddErr(e.message || String(e)) }
    finally { setAdding(false) }
  }

  function startEdit(s: Subject) {
    setEditId(s.id); setEditName(s.name); setEditCode(s.code)
    setConfirmId(null); setDelErr('')
  }

  async function saveEdit() {
    if (!editName.trim() || !editCode.trim()) return
    setSaving(true)
    try {
      await api.updateSubject(editId!, { name: editName.trim(), code: editCode.trim() })
      setEditId(null); bump()
    } catch (e: any) { alert(e.message || String(e)) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    setDeleting(id); setDelErr('')
    try {
      await api.deleteSubject(id)
      setConfirmId(null); bump()
    } catch (e: any) { setDelErr(e.message || String(e)); setConfirmId(null) }
    finally { setDeleting(null) }
  }

  const filtered = query.trim()
    ? subjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.code.toLowerCase().includes(query.toLowerCase()))
    : subjects

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Subjects</h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
        </div>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>

        {/* Add new subject */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plus size={15} color="var(--gold)" />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Add Subject</span>
          </div>
          <div style={{ padding: '18px 22px' }}>
            {addErr && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 12, color: '#b91c1c' }}>{addErr}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2 1 180px' }}>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Subject Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="e.g. Mathematics" style={{ ...inp, width: '100%' }} />
              </div>
              <div style={{ flex: '1 1 100px' }}>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Code *</label>
                <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="e.g. MATH" maxLength={6} style={{ ...inp, width: '100%', textTransform: 'uppercase' }} />
              </div>
              <button onClick={handleAdd} disabled={adding} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: adding ? 'var(--surface-2)' : 'var(--navy)', color: adding ? 'var(--text-muted)' : 'var(--gold-pale)', border: adding ? '1px solid var(--border)' : 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                <Plus size={14} />{adding ? 'Adding…' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>

        {/* Subject list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <BookOpen size={15} color="var(--gold)" />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)', flex: 1 }}>All Subjects</span>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" style={{ ...inp, paddingLeft: 30, width: 180 }} />
            </div>
          </div>

          {delErr && <div style={{ margin: '12px 22px', padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 12, color: '#b91c1c' }}>{delErr}</div>}

          {loading ? (
            <div style={{ padding: '40px 22px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>
              {subjects.length === 0 ? 'No subjects yet. Add one above.' : 'No subjects match your search.'}
            </div>
          ) : filtered.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 22px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em', flexShrink: 0 }}>
                {s.code}
              </div>

              {editId === s.id ? (
                <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inp, flex: '2 1 140px' }} autoFocus />
                  <input value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inp, flex: '1 1 80px', textTransform: 'uppercase' }} />
                  <button onClick={saveEdit} disabled={saving} style={{ padding: '7px 14px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 7, fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={13} />{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setEditId(null)} style={{ padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={13} color="var(--text-muted)" /></button>
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Code: {s.code}</div>
                </div>
              )}

              {editId !== s.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(s)} style={{ padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'system-ui', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}><Pencil size={12} /> Edit</button>
                  {confirmId === s.id ? (
                    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontFamily: 'system-ui', fontSize: 10, color: '#b91c1c', fontWeight: 600 }}>Cannot undo.</span>
                      <span style={{ display: 'inline-flex', gap: 5 }}>
                        <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} style={{ fontSize: 11, padding: '3px 9px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{deleting === s.id ? '…' : 'Delete'}</button>
                        <button onClick={() => setConfirmId(null)} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--border)', color: 'var(--text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                      </span>
                    </span>
                  ) : (
                    <button onClick={() => { setConfirmId(s.id); setEditId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 6, display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={14} /></button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
