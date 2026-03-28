"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 1000)); // placeholder
    setLoading(false);
    // router.push("/dashboard");
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width:"100%", padding:"14px 16px", fontSize:15,
    background: focused ? "#fff" : "#faf7f0",
    border: focused ? "2px solid #0f1f3d" : "2px solid #e2d9c8",
    borderRadius:10, outline:"none", fontFamily:"system-ui,sans-serif",
    color:"#0f1f3d", transition:"all 0.2s ease",
    boxSizing:"border-box",
  });

  return (
    <div style={{
      minHeight:"100vh", display:"flex", background:"#0f1f3d",
      fontFamily:"system-ui,sans-serif",
    }}>

      {/* ── LEFT — brand strip ── */}
      <div style={{
        width:"38%", background:"linear-gradient(170deg,#0a1628 0%,#162844 40%,#0f1f3d 100%)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"48px 40px", position:"relative", overflow:"hidden", flexShrink:0,
      }}>
        {/* Decorative rings */}
        {[200,280,360].map((d,i) => (
          <div key={i} style={{
            position:"absolute", width:d, height:d, borderRadius:"50%",
            border:`1px solid rgba(201,168,76,${0.08-i*0.02})`,
            left:"50%", top:"50%", transform:"translate(-50%,-50%)",
          }}/>
        ))}
        {/* Hex grid pattern */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.04}} viewBox="0 0 200 200">
          <defs>
            <pattern id="hex" x="0" y="0" width="28" height="32" patternUnits="userSpaceOnUse">
              <polygon points="14,2 26,8 26,24 14,30 2,24 2,8" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#hex)"/>
        </svg>

        <div style={{ position:"relative", zIndex:2, textAlign:"center", animation: mounted?"fade-up 0.7s ease 0.2s both":"none", opacity: mounted?undefined:0 }}>
          {/* Icon */}
          <div style={{
            width:80, height:80, borderRadius:"50%", margin:"0 auto 28px",
            background:"rgba(201,168,76,0.1)", border:"1.5px solid rgba(201,168,76,0.35)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 40px rgba(201,168,76,0.1)",
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1.5" fill="#c9a84c" stroke="none"/>
            </svg>
          </div>
          <h2 style={{ color:"#e2c97e", fontSize:24, fontWeight:700, margin:"0 0 10px", letterSpacing:"-0.01em" }}>
            Administrator
          </h2>
          <p style={{ color:"rgba(201,168,76,0.45)", fontSize:13, margin:0, lineHeight:1.6 }}>
            Secure access for<br/>school administration
          </p>

          {/* Privilege badges */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:36, textAlign:"left" }}>
            {[
              { label:"Full system control",    icon:"⚙️" },
              { label:"Student & staff records",icon:"📋" },
              { label:"Financial reports",       icon:"📊" },
              { label:"Settings & configuration",icon:"🔧" },
            ].map(({ label, icon }) => (
              <div key={label} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 14px", borderRadius:8,
                background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.12)",
              }}>
                <span style={{ fontSize:16 }}>{icon}</span>
                <span style={{ color:"rgba(201,168,76,0.7)", fontSize:13 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — form ── */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"40px", background:"#f5f0e8", position:"relative", overflow:"hidden",
      }}>
        {/* Soft bg circles */}
        <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(15,31,61,0.04) 0%,transparent 70%)" }}/>
        <div style={{ position:"absolute", bottom:-60, left:-60, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)" }}/>

        <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1, animation: mounted?"fade-up 0.6s ease 0.3s both":"none", opacity: mounted?undefined:0 }}>
          {/* Back link */}
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

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:28, height:3, background:"#c9a84c", borderRadius:2 }}/>
              <span style={{ color:"#c9a84c", fontSize:11, letterSpacing:3, textTransform:"uppercase", fontWeight:600 }}>Admin Portal</span>
            </div>
            <h1 style={{ fontSize:32, fontWeight:700, color:"#0f1f3d", margin:0, letterSpacing:"-0.02em" }}>
              Welcome back,<br/>Administrator
            </h1>
            <p style={{ color:"#64748b", fontSize:14, margin:"10px 0 0", lineHeight:1.6 }}>
              Sign in to access the school management dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {/* Error */}
            {error && (
              <div style={{
                padding:"12px 16px", borderRadius:8, background:"#fef2f2",
                border:"1px solid #fecaca", color:"#dc2626", fontSize:13,
                display:"flex", alignItems:"center", gap:8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>
                Email Address
              </label>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={emailFocused?"#0f1f3d":"#9ca3af"} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  type="email" value={email} placeholder="admin@school.edu.gh"
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={{ ...inputStyle(emailFocused), paddingLeft:44 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Password</label>
                <button type="button" style={{ background:"none", border:"none", cursor:"pointer", color:"#c9a84c", fontSize:12, fontWeight:600, padding:0 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={passFocused?"#0f1f3d":"#9ca3af"} strokeWidth="1.8" strokeLinecap="round">
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

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width:"100%", padding:"16px", marginTop:4,
                background: loading ? "#64748b" : "linear-gradient(135deg,#0f1f3d 0%,#1e3a5f 100%)",
                color:"#faf7f0", border:"none", borderRadius:10, fontSize:15,
                fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily:"system-ui,sans-serif",
                boxShadow: loading ? "none" : "0 4px 20px rgba(15,31,61,0.3)",
                transition:"all 0.2s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                letterSpacing:"0.01em",
              }}
            >
              {loading
                ? <><span style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/> Signing in…</>
                : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign in as Administrator</>
              }
            </button>
          </form>

          {/* Footer note */}
          <p style={{ textAlign:"center", color:"#9ca3af", fontSize:12, marginTop:28, lineHeight:1.6 }}>
            Having trouble? Contact your{" "}
            <span style={{ color:"#c9a84c", fontWeight:600, cursor:"pointer" }}>IT administrator</span>
          </p>

          {/* School tag */}
          <div style={{
            marginTop:36, paddingTop:20, borderTop:"1px solid #e2d9c8",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#c9a84c" }}/>
            <span style={{ color:"#9ca3af", fontSize:11, letterSpacing:2, textTransform:"uppercase" }}>
              Ada Senior High School · 2024
            </span>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#c9a84c" }}/>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}