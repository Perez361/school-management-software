"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const shapes = [
  { size: 80,  x: 12, y: 15, delay: 0,   dur: 6,   opacity: 0.12, type: "hex"    },
  { size: 50,  x: 75, y: 8,  delay: 1.2, dur: 7,   opacity: 0.08, type: "square" },
  { size: 120, x: 55, y: 35, delay: 0.5, dur: 8,   opacity: 0.07, type: "circle" },
  { size: 40,  x: 20, y: 65, delay: 2,   dur: 5,   opacity: 0.15, type: "hex"    },
  { size: 90,  x: 82, y: 58, delay: 0.8, dur: 9,   opacity: 0.06, type: "square" },
  { size: 60,  x: 38, y: 82, delay: 1.5, dur: 6.5, opacity: 0.10, type: "circle" },
  { size: 30,  x: 68, y: 80, delay: 2.5, dur: 7.5, opacity: 0.18, type: "hex"    },
  { size: 55,  x: 5,  y: 45, delay: 3,   dur: 5.5, opacity: 0.09, type: "square" },
];

function FloatingShape({ size, x, y, delay, dur, opacity, type }: {
  size: number; x: number; y: number; delay: number; dur: number; opacity: number; type: string;
}) {
  const floatClass = dur < 6 ? "float-1" : dur < 8 ? "float-2" : "float-3";
  const base: React.CSSProperties = {
    position: "absolute", left: `${x}%`, top: `${y}%`, width: size, height: size,
    opacity, animation: `${floatClass} ${dur}s ease-in-out ${delay}s infinite`,
    border: "1.5px solid rgba(201,168,76,0.6)",
  };
  if (type === "circle") return <div style={{ ...base, borderRadius: "50%" }} />;
  if (type === "square") return <div style={{ ...base, transform: "rotate(45deg)" }} />;
  return <div style={{ ...base, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", border: "none", background: "rgba(201,168,76,0.18)" }} />;
}

function GridLines() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }} preserveAspectRatio="none">
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={`${i * 11.1}%`} y1="0" x2={`${i * 11.1}%`} y2="100%"
          stroke="#c9a84c" strokeWidth="0.5" strokeDasharray="1000" strokeDashoffset="1000"
          style={{ animation: `draw-line 2s ease ${i * 0.1}s forwards` }} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={`${i * 11.1}%`} x2="100%" y2={`${i * 11.1}%`}
          stroke="#c9a84c" strokeWidth="0.5" strokeDasharray="1000" strokeDashoffset="1000"
          style={{ animation: `draw-line 2s ease ${i * 0.1 + 0.5}s forwards` }} />
      ))}
    </svg>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <style>{`
        @keyframes float-1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes float-2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-2deg)} }
        @keyframes float-3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-22px) rotate(1.5deg)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes draw-line { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }

        .welcome-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: 'Georgia', serif;
          background: var(--navy);
        }

        /* Decorative left panel */
        .welcome-left {
          position: relative;
          width: 45%;
          background: linear-gradient(160deg, #5C0F0F 0%, #8B1A1A 50%, #4A0A0A 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          padding: 48px 40px;
        }

        /* Content right panel */
        .welcome-right {
          flex: 1;
          background: #FDF5F5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(28px, 6vw, 56px) clamp(20px, 5vw, 56px);
          position: relative;
          overflow: hidden;
        }

        .welcome-btn-primary {
          width: 100%; padding: 16px 24px;
          background: linear-gradient(135deg, #8B1A1A 0%, #9E1F1F 100%);
          color: var(--gold-pale); border: none; border-radius: 12px;
          font-size: clamp(13px, 2vw, 15px); font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          font-family: system-ui, sans-serif;
          box-shadow: 0 4px 24px rgba(139,26,26,0.25);
          transition: all 0.2s ease; letter-spacing: 0.01em;
        }
        .welcome-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(139,26,26,0.35); }

        .welcome-btn-secondary {
          width: 100%; padding: 16px 24px;
          background: #fff; color: #8B1A1A;
          border: 1.5px solid #e2d9c8; border-radius: 12px;
          font-size: clamp(13px, 2vw, 15px); font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          font-family: system-ui, sans-serif;
          box-shadow: 0 2px 12px rgba(139,26,26,0.06);
          transition: all 0.2s ease; letter-spacing: 0.01em;
        }
        .welcome-btn-secondary:hover { transform: translateY(-2px); border-color: #c9a84c; box-shadow: 0 6px 20px rgba(139,26,26,0.12); }

        /* On mobile: stack panels vertically, hide decorative panel */
        @media (max-width: 768px) {
          .welcome-shell { flex-direction: column; }
          .welcome-left {
            width: 100%;
            min-height: 220px;
            padding: 32px 24px;
            flex-shrink: 0;
          }
          /* Hide floating shapes on mobile (performance) */
          .welcome-left .shape { display: none; }
          .welcome-right {
            flex: 1;
            padding: 32px 24px 40px;
            align-items: flex-start;
            justify-content: flex-start;
          }
          .welcome-content { width: 100%; max-width: 100%; }
          .welcome-heading { font-size: clamp(28px, 8vw, 38px) !important; }
          .welcome-buttons { gap: 10px !important; }
        }

        .crest-fallback { display: none; }

        @media (max-width: 480px) {
          .welcome-left { min-height: 180px; padding: 24px 20px; }
          .welcome-right { padding: 24px 20px 36px; }
          .crest-circle { width: 80px !important; height: 80px !important; }
          .crest-svg { display: none; }
          .crest-fallback { display: inline !important; }
        }
      `}</style>

      <div className="welcome-shell">

        {/* ── LEFT decorative panel ── */}
        <div className="welcome-left">
          <GridLines />
          {shapes.map((s, i) => (
            <div key={i} className="shape">
              <FloatingShape {...s} />
            </div>
          ))}

          <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            {/* Crest */}
            <div className="crest-circle" style={{
              width: 130, height: 130, borderRadius: "50%",
              border: "2px solid rgba(201,168,76,0.5)",
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 60px rgba(201,168,76,0.15), inset 0 0 30px rgba(201,168,76,0.05)",
              animation: mounted ? "scale-in 0.8s ease 0.2s both" : "none",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", animation: "pulse-ring 3s ease-out 1s infinite" }} />
              <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.15)", animation: "pulse-ring 3s ease-out 1.5s infinite" }} />
              <svg className="crest-svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
                <polygon points="36,10 66,26 36,36 6,26" fill="rgba(201,168,76,0.9)" />
                <rect x="54" y="26" width="3" height="18" rx="1.5" fill="rgba(201,168,76,0.7)" />
                <ellipse cx="55.5" cy="45" rx="5" ry="3" fill="rgba(201,168,76,0.5)" />
                <path d="M18 30 L18 46 Q36 54 54 46 L54 30" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" />
                <rect x="24" y="47" width="24" height="15" rx="2" fill="rgba(201,168,76,0.3)" stroke="rgba(201,168,76,0.6)" strokeWidth="1" />
                <line x1="36" y1="47" x2="36" y2="62" stroke="rgba(201,168,76,0.6)" strokeWidth="1" />
              </svg>
              {/* Fallback icon for mobile when SVG hidden */}
              <span style={{ fontSize: 36 }} className="crest-fallback">🎓</span>
            </div>

            {/* School name */}
            <div style={{ textAlign: "center", animation: mounted ? "fade-up 0.8s ease 0.5s both" : "none" }}>
              <p style={{ color: "rgba(204,182,105,0.6)", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 8px" }}>Welcome to</p>
              <h2 style={{ color: "#e2c97e", fontSize: "clamp(16px,3vw,22px)", fontWeight: 700, margin: 0, lineHeight: 1.2, textShadow: "0 2px 20px rgba(201,168,76,0.3)" }}>
                Ambassadors<br />Christian School
              </h2>
              <div style={{ width: 40, height: 1.5, background: "rgba(201,168,76,0.5)", margin: "14px auto 0" }} />
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 10 }}>Est. 2016</p>
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }} />
        </div>

        {/* ── RIGHT content panel ── */}
        <div className="welcome-right">
          {/* BG decorations */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,26,26,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div className="welcome-content" style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>

            {/* Heading */}
            <div style={{ marginBottom: "clamp(28px,5vw,48px)", animation: mounted ? "fade-up 0.6s ease 0.3s both" : "none", opacity: mounted ? undefined : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 3, background: "#c9a84c", borderRadius: 2 }} />
                <span style={{ color: "#c9a84c", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui,sans-serif", fontWeight: 600 }}>Management Portal</span>
              </div>
              <h1 className="welcome-heading" style={{ fontSize: 38, fontWeight: 700, color: "#8B1A1A", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                School<br />
                <span style={{ color: "#c9a84c" }}>Management</span><br />
                System
              </h1>
              <p style={{ color: "#B08080", fontSize: "clamp(13px,2vw,15px)", marginTop: 14, lineHeight: 1.6, fontFamily: "system-ui,sans-serif", fontWeight: 400 }}>
                Streamline academics, administration, and student success — all in one place.
              </p>
            </div>

            {/* Login Buttons */}
            <div className="welcome-buttons" style={{ display: "flex", flexDirection: "column", gap: 14, animation: mounted ? "fade-up 0.6s ease 0.55s both" : "none", opacity: mounted ? undefined : 0 }}>

              {/* Admin */}
              <button className="welcome-btn-primary" onClick={() => router.push("/login/admin")}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" /><path d="M20 21a8 8 0 1 0-16 0" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Admin Login</div>
                    <div style={{ fontSize: 12, color: "rgba(250,247,240,0.5)", marginTop: 1 }}>Full system access</div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              {/* Staff */}
              <button className="welcome-btn-secondary" onClick={() => router.push("/login/staff")}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(204,38,9,0.05)", border: "1px solid rgba(209,38,15,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Staff Login</div>
                    <div style={{ fontSize: 12, color: "#B52424", marginTop: 1 }}>Teachers & staff access</div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Motto */}
            <div style={{ marginTop: "clamp(24px,4vw,36px)", paddingTop: "clamp(20px,3vw,28px)", borderTop: "1px solid #e8e0d0", animation: mounted ? "fade-up 0.6s ease 0.75s both" : "none", opacity: mounted ? undefined : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#B52424", flexShrink: 0, animation: "pulse-ring 2s ease-out infinite" }} />
                <p style={{ color: "#B08080", fontSize: 12, fontFamily: "system-ui,sans-serif", margin: 0, fontStyle: "italic" }}>
                  "Education in the Fear of God"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}