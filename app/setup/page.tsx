'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Mode = 'choose' | 'new-school' | 'join'

export default function SetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [mode, setMode]         = useState<Mode>('choose')

  // ── New-school form state ──
  const [name, setName]         = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)

  // ── Join form state ──
  const [sbUrl, setSbUrl]       = useState('')
  const [sbKey, setSbKey]       = useState('')
  const [syncing, setSyncing]   = useState(false)
  const [syncDone, setSyncDone] = useState(false)

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.checkSetup().then(needed => {
      if (!needed) router.replace('/login/admin')
      else setChecking(false)
    }).catch(() => setChecking(false))
  }, [router])

  // ── New school submit ──
  async function handleNewSchool(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !username || !email || !password) { setError('All fields are required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await api.setupAdmin({ name, username, email, password })
      router.push('/login/admin?setup=1')
    } catch (e: any) {
      setError(e.message || String(e))
    } finally { setLoading(false) }
  }

  // ── Join existing submit ──
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!sbUrl || !sbKey) { setError('Both fields are required.'); return }
    setSyncing(true); setError('')
    try {
      await api.saveSyncConfig(sbUrl.trim(), sbKey.trim(), true)
      await api.triggerSync()
      // Check again — if users were pulled we can proceed to login
      const stillEmpty = await api.checkSetup()
      if (stillEmpty) {
        setError('Sync completed but no user accounts were found in the remote database. Check your credentials.')
        setSyncing(false)
        return
      }
      setSyncDone(true)
      setTimeout(() => router.push('/login/admin'), 2000)
    } catch (e: any) {
      setError('Could not connect: ' + (e.message || String(e)))
    } finally { setSyncing(false) }
  }

  if (checking) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#8B1A1A' }}>
      <div style={{ color:'#c9a84c', fontFamily:'system-ui', fontSize:14 }}>Checking…</div>
    </div>
  )

  const inp: React.CSSProperties = { width:'100%', padding:'12px 15px', fontSize:14, background:'#fdf8f0', border:'2px solid #e2d9c8', borderRadius:9, outline:'none', fontFamily:'system-ui', color:'#2C0A0A', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { display:'block', fontSize:13, fontWeight:600, color:'#2C0A0A', marginBottom:6 }

  return (
    <>
      <style>{`
        .setup-shell { min-height:100vh; display:flex; font-family:system-ui,sans-serif; background:#8B1A1A; }
        .setup-brand { width:36%; background:linear-gradient(170deg,#4A0A0A 0%,#7A1515 40%,#5C1010 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:clamp(32px,5vw,48px) clamp(24px,4vw,40px); position:relative; overflow:hidden; flex-shrink:0; }
        .setup-panel { flex:1; display:flex; align-items:center; justify-content:center; padding:clamp(24px,5vw,40px); background:#f5f0e8; overflow-y:auto; }
        @media (max-width:768px) {
          .setup-shell { flex-direction:column; }
          .setup-brand { width:100%; min-height:160px; padding:24px 20px; }
          .setup-panel { padding:24px 20px 40px; align-items:flex-start; }
        }
      `}</style>

      <div className="setup-shell">

        {/* Brand */}
        <div className="setup-brand">
          {[180,260,340].map((d,i) => (
            <div key={i} style={{ position:'absolute', width:d, height:d, borderRadius:'50%', border:`1px solid rgba(201,168,76,${0.08-i*0.02})`, left:'50%', top:'50%', transform:'translate(-50%,-50%)' }} />
          ))}
          <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
            <div style={{ width:76, height:76, borderRadius:'50%', margin:'0 auto 18px', background:'rgba(201,168,76,0.12)', border:'1.5px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 style={{ color:'#f3e8e8', fontSize:'clamp(16px,3vw,20px)', fontWeight:700, margin:'0 0 8px' }}>
              {mode === 'choose' ? 'Welcome' : mode === 'new-school' ? 'New School Setup' : 'Join Existing School'}
            </h2>
            <p style={{ color:'rgba(243,232,232,0.7)', fontSize:12, margin:0, lineHeight:1.7, maxWidth:200 }}>
              {mode === 'choose' && 'This software has no accounts yet. Choose how to proceed.'}
              {mode === 'new-school' && 'No internet needed. Your data stays local until you configure sync.'}
              {mode === 'join' && 'Internet required. Your Supabase credentials will pull existing accounts.'}
            </p>

            {mode !== 'choose' && (
              <button onClick={() => { setMode('choose'); setError('') }} style={{ marginTop:20, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(243,232,232,0.8)', borderRadius:7, padding:'7px 16px', cursor:'pointer', fontSize:12, fontFamily:'system-ui' }}>
                ← Back
              </button>
            )}
          </div>
        </div>

        {/* Form panel */}
        <div className="setup-panel">
          <div style={{ width:'100%', maxWidth:460 }}>

            {/* ── Mode chooser ── */}
            {mode === 'choose' && (
              <div>
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:24, height:3, background:'#c9a84c', borderRadius:2 }} />
                    <span style={{ color:'#c9a84c', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>First-Time Setup</span>
                  </div>
                  <h1 style={{ fontSize:'clamp(22px,4vw,28px)', fontWeight:700, color:'#2C0A0A', margin:'0 0 6px', letterSpacing:'-0.02em' }}>How would you like to set up?</h1>
                  <p style={{ color:'#888', fontSize:13, margin:0 }}>No accounts exist on this device yet.</p>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <button onClick={() => setMode('new-school')} style={{ textAlign:'left', padding:'20px 22px', background:'#fff', border:'2px solid #e2d9c8', borderRadius:12, cursor:'pointer', transition:'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#8B1A1A')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2d9c8')}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:'rgba(139,26,26,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'#2C0A0A', marginBottom:3 }}>This is a new school</div>
                        <div style={{ fontSize:12, color:'#888', lineHeight:1.5 }}>Create the first admin account. No internet required.</div>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => setMode('join')} style={{ textAlign:'left', padding:'20px 22px', background:'#fff', border:'2px solid #e2d9c8', borderRadius:12, cursor:'pointer', transition:'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#1d4ed8')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2d9c8')}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:'rgba(29,78,216,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'#2C0A0A', marginBottom:3 }}>Join an existing installation</div>
                        <div style={{ fontSize:12, color:'#888', lineHeight:1.5 }}>This school already uses this software. Enter your Supabase credentials to pull existing accounts. <strong style={{ color:'#1d4ed8' }}>Requires internet.</strong></div>
                      </div>
                    </div>
                  </button>
                </div>

                <p style={{ color:'#aaa', fontSize:12, marginTop:18, lineHeight:1.6 }}>
                  Not sure? Ask the person who originally set up the system whether Supabase sync is configured.
                </p>
              </div>
            )}

            {/* ── New school form ── */}
            {mode === 'new-school' && (
              <div>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:700, color:'#2C0A0A', margin:'0 0 4px' }}>Create Admin Account</h1>
                  <p style={{ color:'#888', fontSize:13, margin:0 }}>This will be the master account for this installation.</p>
                </div>

                <form onSubmit={handleNewSchool} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {error && <div style={{ padding:'11px 15px', borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:13 }}>{error}</div>}

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div><label style={lbl}>Full Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Mensah" style={inp} /></div>
                    <div><label style={lbl}>Username *</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. admin" style={inp} /></div>
                  </div>
                  <div><label style={lbl}>Email Address *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourschool.com" style={inp} /></div>
                  <div>
                    <label style={lbl}>Password * <span style={{ fontWeight:400, color:'#999', fontSize:11 }}>(min. 8 characters)</span></label>
                    <div style={{ position:'relative' }}>
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight:46 }} />
                      <button type="button" onClick={() => setShowPass(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#B08080', fontSize:13 }}>{showPass ? '🙈' : '👁'}</button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Confirm Password *</label>
                    <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={{ ...inp, borderColor: confirm && confirm !== password ? '#fca5a5' : '#e2d9c8' }} />
                    {confirm && confirm !== password && <p style={{ color:'#dc2626', fontSize:11, marginTop:4 }}>Passwords do not match</p>}
                  </div>

                  <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', marginTop:4, background: loading ? '#94a3b8' : 'linear-gradient(135deg,#8B1A1A 0%,#B52424 100%)', color:'#fdf5e6', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'system-ui' }}>
                    {loading ? 'Creating account…' : 'Create Admin Account & Continue'}
                  </button>
                </form>

                <p style={{ color:'#aaa', fontSize:12, marginTop:14, lineHeight:1.6 }}>
                  Additional user accounts are added from <strong>Settings → Users</strong> after login.
                </p>
              </div>
            )}

            {/* ── Join existing form ── */}
            {mode === 'join' && (
              <div>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:700, color:'#2C0A0A', margin:'0 0 4px' }}>Join Existing Installation</h1>
                  <p style={{ color:'#888', fontSize:13, margin:0 }}>Enter your school's Supabase credentials to sync existing accounts to this device.</p>
                </div>

                {syncDone ? (
                  <div style={{ padding:'20px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, textAlign:'center' }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>✓</div>
                    <div style={{ fontWeight:700, color:'#15803d', fontSize:16, marginBottom:4 }}>Sync successful!</div>
                    <div style={{ color:'#555', fontSize:13 }}>Redirecting to login…</div>
                  </div>
                ) : (
                  <form onSubmit={handleJoin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {error && <div style={{ padding:'11px 15px', borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:13 }}>{error}</div>}

                    <div style={{ padding:'14px 16px', background:'rgba(29,78,216,0.05)', border:'1px solid rgba(29,78,216,0.15)', borderRadius:9 }}>
                      <p style={{ margin:0, fontSize:12, color:'#1d4ed8', lineHeight:1.6 }}>
                        Get these from your Supabase project → Settings → API. Ask whoever originally set up the school's Supabase project.
                      </p>
                    </div>

                    <div>
                      <label style={lbl}>Supabase Project URL *</label>
                      <input value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Supabase Anon / Public Key *</label>
                      <input value={sbKey} onChange={e => setSbKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6…" style={{ ...inp, fontFamily:'monospace', fontSize:12 }} />
                    </div>

                    <button type="submit" disabled={syncing} style={{ width:'100%', padding:'14px', marginTop:4, background: syncing ? '#94a3b8' : 'linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: syncing ? 'not-allowed' : 'pointer', fontFamily:'system-ui', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      {syncing && <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />}
                      {syncing ? 'Connecting & syncing…' : 'Connect & Pull Accounts'}
                    </button>
                  </form>
                )}

                <p style={{ color:'#aaa', fontSize:12, marginTop:14, lineHeight:1.6 }}>
                  After sync you will log in with your existing username and password.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
