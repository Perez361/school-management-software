"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idFocused, setIdFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!staffId || !password) { setError('Please fill in all fields.'); return }
  setLoading(true); setError('')

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffId, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    router.push('/dashboard')
  } catch (e: any) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
}

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width:"100%", padding:"14px 16px", fontSize:15,
    background: focused ? "#fff" : "#f8fafc",
    border: focused ? "2px solid #1e3a5f" : "2px solid #e2e8f0",
    borderRadius:10, outline:"none", fontFamily:"system-ui,sans-serif",
    color:"#0f1f3d", transition:"all 0.2s ease", boxSizing:"border-box",
  });

  const roles = [
    { id:"teacher",    label:"Teacher",         icon:"📚" },
    { id:"hod",        label:"Head of Dept",    icon:"🎓" },
    { id:"counselor",  label:"Counselor",       icon:"💬" },
    { id:"support",    label:"Support Staff",   icon:"🛠️" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#f1f5f9", fontFamily:"system-ui,sans-serif" }}>

      {/* ── FORM (left, wider) ── */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"40px", position:"relative", overflow:"hidden",
      }}>
        {/* Subtle pattern */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.025}} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0f1f3d"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>

        <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1 }}>
          {/* Back */}
          <Link href="/" style={{
            display:"inline-flex", alignItems:"center", gap:6,
            color:"#94a3b8", fontSize:13, textDecoration:"none", marginBottom:32,
            transition:"color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color="#0f1f3d")}
            onMouseLeave={e => (e.currentTarget.style.color="#94a3b8")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to portal
          </Link>

          {/* Card */}
          <div style={{
            background:"#fff", borderRadius:20, padding:"40px",
            boxShadow:"0 4px 40px rgba(15,31,61,0.08), 0 1px 0 rgba(255,255,255,0.6) inset",
            border:"1px solid rgba(226,217,200,0.6)",
            animation: mounted?"scale-in 0.5s ease 0.1s both":"none", opacity: mounted?undefined:0,
          }}>
            {/* Header */}
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:24, height:3, background:"#1e3a5f", borderRadius:2 }}/>
                <span style={{ color:"#1e3a5f", fontSize:11, letterSpacing:3, textTransform:"uppercase", fontWeight:700 }}>Staff Portal</span>
              </div>
              <h1 style={{ fontSize:28, fontWeight:700, color:"#0f1f3d", margin:0, letterSpacing:"-0.02em", lineHeight:1.2 }}>
                Good to see you! 👋
              </h1>
              <p style={{ color:"#64748b", fontSize:14, margin:"8px 0 0", lineHeight:1.6 }}>
                Sign in with your staff credentials to continue.
              </p>
            </div>

            {/* Role selector */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:10 }}>
                I am a…
              </label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {roles.map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)} style={{
                    padding:"10px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
                    background: role===r.id ? "rgba(15,31,61,0.06)" : "#f8fafc",
                    border: role===r.id ? "2px solid #1e3a5f" : "2px solid transparent",
                    transition:"all 0.15s ease", display:"flex", alignItems:"center", gap:8,
                    outline:"none",
                  }}>
                    <span style={{ fontSize:16 }}>{r.icon}</span>
                    <span style={{ fontSize:13, fontWeight: role===r.id ? 600 : 400, color: role===r.id ? "#0f1f3d" : "#64748b" }}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Error */}
              {error && (
                <div style={{
                  padding:"12px 16px", borderRadius:8, background:"#fef2f2",
                  border:"1px solid #fecaca", color:"#dc2626", fontSize:13,
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Staff ID */}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>
                  Staff ID / Email
                </label>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={idFocused?"#1e3a5f":"#9ca3af"} strokeWidth="1.8" strokeLinecap="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                      <path d="M6 19c0-2.5 2.7-4 6-4s6 1.5 6 4"/>
                    </svg>
                  </div>
                  <input
                    type="text" value={staffId} placeholder="STF-001 or email"
                    onChange={e => setStaffId(e.target.value)}
                    onFocus={() => setIdFocused(true)}
                    onBlur={() => setIdFocused(false)}
                    style={{ ...inputStyle(idFocused), paddingLeft:44 }}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Password</label>
                  <button type="button" style={{ background:"none", border:"none", cursor:"pointer", color:"#1e3a5f", fontSize:12, fontWeight:600, padding:0 }}>
                    Reset password
                  </button>
                </div>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={passFocused?"#1e3a5f":"#9ca3af"} strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPass ? "text" : "password"} value={password} placeholder="••••••••••"
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    style={{ ...inputStyle(passFocused), paddingLeft:44, paddingRight:48 }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{
                    position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer", padding:4, color:"#9ca3af",
                  }}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
                <input type="checkbox" style={{ width:16, height:16, cursor:"pointer", accentColor:"#1e3a5f" }}/>
                <span style={{ fontSize:13, color:"#64748b" }}>Keep me signed in for this session</span>
              </label>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width:"100%", padding:"15px", marginTop:4,
                  background: loading ? "#94a3b8" : "linear-gradient(135deg,#162844 0%,#1e3a5f 100%)",
                  color:"#fff", border:"none", borderRadius:10,
                  fontSize:15, fontWeight:700, cursor: loading?"not-allowed":"pointer",
                  fontFamily:"system-ui,sans-serif",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(15,31,61,0.25)",
                  transition:"all 0.2s ease",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
                onMouseEnter={e => { if(!loading) (e.currentTarget).style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget).style.transform="translateY(0)"; }}
              >
                {loading
                  ? <><span style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/> Signing in…</>
                  : <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Sign in as {roles.find(r=>r.id===role)?.label}
                    </>
                }
              </button>
            </form>
          </div>

          {/* Help note */}
          <p style={{ textAlign:"center", color:"#94a3b8", fontSize:12, marginTop:20, lineHeight:1.6 }}>
            New staff member?{" "}
            <span style={{ color:"#1e3a5f", fontWeight:600, cursor:"pointer" }}>
              Contact HR to get your credentials
            </span>
          </p>
        </div>
      </div>

      {/* ── RIGHT — stats panel ── */}
      <div style={{
        width:"36%", background:"linear-gradient(160deg,#0f1f3d 0%,#1e3a5f 60%,#162844 100%)",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"48px 40px", position:"relative", overflow:"hidden", flexShrink:0,
      }}>
        {/* Soft glow */}
        <div style={{ position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", pointerEvents:"none" }}/>

        {/* Decorative top arc */}
        <svg style={{position:"absolute",top:0,left:0,width:"100%",opacity:0.06}} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <path d="M0 200 Q200 0 400 200" fill="none" stroke="#c9a84c" strokeWidth="1"/>
          <path d="M0 200 Q200 50 400 200" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
        </svg>

        <div style={{ position:"relative", zIndex:2, animation: mounted?"fade-up 0.7s ease 0.4s both":"none", opacity: mounted?undefined:0 }}>
          <p style={{ color:"rgba(201,168,76,0.55)", fontSize:11, letterSpacing:3, textTransform:"uppercase", margin:"0 0 6px", fontWeight:600 }}>
            Staff Dashboard
          </p>
          <h2 style={{ color:"#e2c97e", fontSize:26, fontWeight:700, margin:"0 0 8px", letterSpacing:"-0.01em", lineHeight:1.2 }}>
            Empower Your<br/>Teaching
          </h2>
          <p style={{ color:"rgba(201,168,76,0.45)", fontSize:13, margin:"0 0 36px", lineHeight:1.7 }}>
            Access student records, enter results, track attendance, and generate reports — all from one place.
          </p>

          {/* Stat cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Student Records",   value:"1,240+",  sub:"Across all classes", icon:"👨‍🎓" },
              { label:"Classes Running",   value:"32",      sub:"Current academic year", icon:"🏫" },
              { label:"Results Processed", value:"4,800+",  sub:"This term", icon:"📝" },
            ].map(card => (
              <div key={card.label} style={{
                display:"flex", alignItems:"center", gap:16, padding:"16px 18px",
                background:"rgba(255,255,255,0.04)", borderRadius:12,
                border:"1px solid rgba(201,168,76,0.12)",
                backdropFilter:"blur(4px)",
              }}>
                <div style={{
                  width:42, height:42, borderRadius:10, fontSize:20,
                  background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                }}>
                  {card.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"rgba(201,168,76,0.5)", fontSize:11, textTransform:"uppercase", letterSpacing:1 }}>{card.label}</div>
                  <div style={{ color:"#e2c97e", fontSize:20, fontWeight:700, lineHeight:1.1 }}>{card.value}</div>
                  <div style={{ color:"rgba(201,168,76,0.35)", fontSize:11 }}>{card.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{
            marginTop:28, padding:"16px 18px", borderLeft:"3px solid rgba(201,168,76,0.4)",
            background:"rgba(201,168,76,0.04)",
          }}>
            <p style={{ color:"rgba(201,168,76,0.5)", fontSize:12, fontStyle:"italic", margin:0, lineHeight:1.7 }}>
              "The art of teaching is the art of assisting discovery."<br/>
              <span style={{ fontStyle:"normal", fontWeight:600, marginTop:4, display:"block" }}>— Mark Van Doren</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scale-in{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}