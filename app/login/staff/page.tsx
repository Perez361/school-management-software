"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const roles = [
  { id: "teacher",   label: "Teacher",       icon: "📚" },
  { id: "hod",       label: "Head of Dept",  icon: "🎓" },
  { id: "counselor", label: "Counselor",     icon: "💬" },
  { id: "support",   label: "Support Staff", icon: "🛠️" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
    e.preventDefault();
    if (!staffId || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const user = await login(staffId, password);
      if (user.role === "admin") throw new Error("Please use the Admin Login portal.");
      router.push("/dashboard");
    } catch (e: any) { setError(e.message || "Invalid credentials"); }
    finally { setLoading(false); }
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%", padding: "13px 16px 13px 44px", fontSize: 15,
    background: focused ? "#fff" : "var(--gold-pale)",
    border: focused ? "2px solid #8B1A1A" : "2px solid #e2d9c8",
    borderRadius: 10, outline: "none", fontFamily: "system-ui,sans-serif",
    color: "var(--navy)", transition: "all 0.2s ease", boxSizing: "border-box",
  });

  return (
    <>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes spin { to { transform: rotate(360deg); } }

        .staff-shell {
          min-height: 100vh;
          display: flex;
          font-family: system-ui, sans-serif;
          background: #f5f0e8;
        }
        .staff-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(24px,5vw,40px);
          position: relative;
          overflow: hidden;
        }
        .staff-info-panel {
          width: 36%;
          background: linear-gradient(170deg, #4A0A0A 0%, #7A1515 40%, #5C1010 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(32px,4vw,48px) clamp(24px,3vw,40px);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .staff-card {
          background: #fff;
          border-radius: 20px;
          padding: clamp(24px, 5vw, 40px);
          box-shadow: 0 4px 40px rgba(139,26,26,0.08);
          border: 1px solid rgba(226,217,200,0.6);
          width: 100%;
          max-width: 440px;
          animation: ${mounted ? "scale-in 0.5s ease 0.1s both" : "none"};
        }
        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 768px) {
          .staff-shell { flex-direction: column; }
          .staff-info-panel {
            width: 100%;
            min-height: 0;
            padding: 24px 20px;
            order: -1; /* show on top on mobile */
          }
          .staff-info-content { display: none; } /* hide long text, show only brief */
          .staff-info-brief { display: block !important; }
          .staff-form-panel { padding: 20px 16px 36px; align-items: flex-start; }
          .staff-card { padding: 24px 20px; border-radius: 16px; }
          .role-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
        }
        @media (max-width: 480px) {
          .staff-info-panel { padding: 18px 16px; }
          .role-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="staff-shell">

        {/* ── Form panel ── */}
        <div className="staff-form-panel">
          {/* Dot pattern */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.025 }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="var(--navy)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, textDecoration: "none", marginBottom: 24 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to portal
            </Link>

            <div className="staff-card">
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 3, background: "#c9a84c", borderRadius: 2 }} />
                  <span style={{ color: "#c9a84c", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>Staff Portal</span>
                </div>
                <h1 style={{ fontSize: "clamp(22px,4vw,28px)", fontWeight: 700, color: "var(--navy)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Good to see you! 👋
                </h1>
                <p style={{ color: "#64748b", fontSize: 14, margin: "6px 0 0", lineHeight: 1.6 }}>
                  Sign in with your staff credentials to continue.
                </p>
              </div>

              {/* Role selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>I am a…</label>
                <div className="role-grid">
                  {roles.map(r => (
                    <button key={r.id} type="button" onClick={() => setRole(r.id)} style={{
                      padding: "9px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                      background: role === r.id ? "rgba(139,26,26,0.06)" : "var(--gold-pale)",
                      border: role === r.id ? "2px solid #8B1A1A" : "2px solid transparent",
                      transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 7, outline: "none",
                    }}>
                      <span style={{ fontSize: 15 }}>{r.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: role === r.id ? 600 : 400, color: role === r.id ? "var(--navy)" : "#64748b", lineHeight: 1.2 }}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {error && (
                  <div style={{ padding: "12px 16px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                  </div>
                )}

                {/* Staff ID */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Staff ID / Email</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={idFocused ? "#8B1A1A" : "#9ca3af"} strokeWidth="1.8" strokeLinecap="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 19c0-2.5 2.7-4 6-4s6 1.5 6 4" />
                      </svg>
                    </div>
                    <input
                      type="text" value={staffId} placeholder="STF-001 or email"
                      onChange={e => setStaffId(e.target.value)}
                      onFocus={() => setIdFocused(true)} onBlur={() => setIdFocused(false)}
                      style={inputStyle(idFocused)}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
                    <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#8B1A1A", fontSize: 12, fontWeight: 600, padding: 0 }}>Reset password</button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={passFocused ? "#8B1A1A" : "#9ca3af"} strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      type={showPass ? "text" : "password"} value={password} placeholder="••••••••••"
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                      style={{ ...inputStyle(passFocused), paddingRight: 48 }}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af",
                    }}>
                      {showPass
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#8B1A1A" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Keep me signed in for this session</span>
                </label>

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "14px", marginTop: 2,
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #4A0A0A 0%, #8B1A1A 100%)",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "system-ui,sans-serif",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(139,26,26,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loading
                    ? <><span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Signing in…</>
                    : <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10,17 15,12 10,7" /><line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        Sign in as {roles.find(r => r.id === role)?.label}
                      </>
                  }
                </button>
              </form>
            </div>

            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
              New staff member?{" "}
              <span style={{ color: "#8B1A1A", fontWeight: 600, cursor: "pointer" }}>Contact HR to get your credentials</span>
            </p>
          </div>
        </div>

        {/* ── Info panel (right on desktop, top on mobile) ── */}
        <div className="staff-info-panel">
          <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", opacity: 0.06 }} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
            <path d="M0 200 Q200 0 400 200" fill="none" stroke="#c9a84c" strokeWidth="1" />
          </svg>

          {/* Brief mobile version */}
          <div className="staff-info-brief" style={{ display: "none", position: "relative", zIndex: 2, textAlign: "center" }}>
            <p style={{ color: "rgba(201,168,76,0.6)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 4px", fontWeight: 600 }}>Staff Portal</p>
            <h2 style={{ color: "#e2c97e", fontSize: "clamp(16px,4vw,20px)", fontWeight: 700, margin: 0 }}>Ambassadors Christian School</h2>
          </div>

          {/* Full desktop version */}
          <div className="staff-info-content" style={{ position: "relative", zIndex: 2, animation: mounted ? "fade-up 0.7s ease 0.4s both" : "none" }}>
            <p style={{ color: "rgba(201,168,76,0.55)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 6px", fontWeight: 600 }}>Staff Dashboard</p>
            <h2 style={{ color: "#e2c97e", fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 700, margin: "0 0 8px", lineHeight: 1.2 }}>
              Empower Your<br />Teaching
            </h2>
            <p style={{ color: "rgba(201,168,76,0.45)", fontSize: 13, margin: "0 0 28px", lineHeight: 1.7 }}>
              Access student records, enter results, track attendance, and generate reports — all from one place.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Student Records", value: "1,240+", sub: "Across all classes", icon: "👨‍🎓" },
                { label: "Classes Running", value: "32", sub: "Current academic year", icon: "🏫" },
                { label: "Results Processed", value: "4,800+", sub: "This term", icon: "📝" },
              ].map(card => (
                <div key={card.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(201,168,76,0.12)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, fontSize: 18, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ color: "rgba(201,168,76,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{card.label}</div>
                    <div style={{ color: "#e2c97e", fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{card.value}</div>
                    <div style={{ color: "rgba(201,168,76,0.35)", fontSize: 11 }}>{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: "14px 16px", borderLeft: "3px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.04)" }}>
              <p style={{ color: "rgba(201,168,76,0.5)", fontSize: 12, fontStyle: "italic", margin: 0, lineHeight: 1.7 }}>
                "The art of teaching is the art of assisting discovery."<br />
                <span style={{ fontStyle: "normal", fontWeight: 600, marginTop: 4, display: "block" }}>— Mark Van Doren</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}