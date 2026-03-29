"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
    try {
      const user = await login(email, password);
      if (user.role !== "admin") throw new Error("Access denied. Admin accounts only.");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%", padding: "14px 16px", fontSize: 15,
    background: focused ? "#fff" : "#faf7f0",
    border: focused ? "2px solid #2C0A0A" : "2px solid #e2d9c8",
    borderRadius: 10, outline: "none", fontFamily: "system-ui,sans-serif",
    color: "#2C0A0A", transition: "all 0.2s ease", boxSizing: "border-box",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", background:  "#8B1A1A", fontFamily: "system-ui,sans-serif" }}>
      {/* LEFT — brand strip */}
      <div style={{
        width: "38%",background: 'linear-gradient(170deg, #4A0A0A 0%, #7A1515 40%, #5C1010 100%)',
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        {[200, 280, 360].map((d, i) => (
          <div key={i} style={{
            position: "absolute", width: d, height: d, borderRadius: "50%",
            border: `1px solid rgba(201,168,76,${0.08 - i * 0.02})`,
            left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          }} />
        ))}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 28px",
            background: "rgba(201,168,76,0.1)", border: "1.5px solid #B08080",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ebe5d7" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1.5" fill="#ebe5d7" stroke="none" />
            </svg>
          </div>
          <h2 style={{ color: "#f3e8e8", fontSize: 24, fontWeight: 700, margin: "0 0 10px" }}>Administrator</h2>
          <p style={{ color: "rgb(243, 234, 234)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Secure access for<br />school administration
          </p>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px", background: "#f5f0e8",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "#94a3b8", fontSize: 13, textDecoration: "none", marginBottom: 32,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to portal
          </Link>

          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 3, background: "#c9a84c", borderRadius: 2 }} />
              <span style={{ color: "#c9a84c", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Admin Portal</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#2C0A0A", margin: 0, letterSpacing: "-0.02em" }}>
              Welcome back,<br />Administrator
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: 8, background: "#fef2f2",
                border: "1px solid #fecaca", color: "#dc2626", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#2C0A0A", marginBottom: 7 }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email" value={email} placeholder="admin@school.com"
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={{ ...inputStyle(emailFocused), paddingLeft: 44 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#2C0A0A", marginBottom: 7 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"} value={password} placeholder="••••••••••"
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  style={{ ...inputStyle(passFocused), paddingLeft: 44, paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 4, color: "#B08080",
                }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "16px", marginTop: 4,
                background: loading ? "#64748b" : "linear-gradient(135deg, #8B1A1A 0%, #B52424 100%)",
                color: "#faf7f0", border: "none", borderRadius: 10, fontSize: 15,
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {loading ? "Signing in…" : "Sign in as Administrator"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: '#B08080', fontSize: 12, marginTop: 20 }}>
            Default: <strong style={{ color: "#B08080" }}>admin@school.com</strong> / <strong style={{ color: "#B08080" }}>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
