"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Floating geometric shapes for the panel
const shapes = [
  { size: 80,  x: 12,  y: 15,  delay: 0,    dur: 6,  opacity: 0.12, type: "hex"    },
  { size: 50,  x: 75,  y: 8,   delay: 1.2,  dur: 7,  opacity: 0.08, type: "square" },
  { size: 120, x: 55,  y: 35,  delay: 0.5,  dur: 8,  opacity: 0.07, type: "circle" },
  { size: 40,  x: 20,  y: 65,  delay: 2,    dur: 5,  opacity: 0.15, type: "hex"    },
  { size: 90,  x: 82,  y: 58,  delay: 0.8,  dur: 9,  opacity: 0.06, type: "square" },
  { size: 60,  x: 38,  y: 82,  delay: 1.5,  dur: 6.5,opacity: 0.10, type: "circle" },
  { size: 30,  x: 68,  y: 80,  delay: 2.5,  dur: 7.5,opacity: 0.18, type: "hex"    },
  { size: 55,  x: 5,   y: 45,  delay: 3,    dur: 5.5,opacity: 0.09, type: "square" },
];

function FloatingShape({ size, x, y, delay, dur, opacity, type }: {
  size: number; x: number; y: number; delay: number;
  dur: number; opacity: number; type: string;
}) {
  const floatClass = dur < 6 ? "float-1" : dur < 8 ? "float-2" : "float-3";
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    opacity,
    animation: `${floatClass} ${dur}s ease-in-out ${delay}s infinite`,
    border: "1.5px solid rgba(201,168,76,0.6)",
  };

  if (type === "circle") {
    return <div style={{ ...baseStyle, borderRadius: "50%" }} />;
  }
  if (type === "square") {
    return <div style={{ ...baseStyle, transform: "rotate(45deg)" }} />;
  }
  // hex
  return (
    <div style={{ ...baseStyle, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", border: "none", background: "rgba(201,168,76,0.18)" }} />
  );
}

// Animated grid lines in the background
function GridLines() {
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.06 }} preserveAspectRatio="none">
      {Array.from({length:10}).map((_,i) => (
        <line key={`v${i}`} x1={`${i*11.1}%`} y1="0" x2={`${i*11.1}%`} y2="100%"
          stroke="#c9a84c" strokeWidth="0.5"
          strokeDasharray="1000" strokeDashoffset="1000"
          style={{animation:`draw-line 2s ease ${i*0.1}s forwards`}}
        />
      ))}
      {Array.from({length:10}).map((_,i) => (
        <line key={`h${i}`} x1="0" y1={`${i*11.1}%`} x2="100%" y2={`${i*11.1}%`}
          stroke="#c9a84c" strokeWidth="0.5"
          strokeDasharray="1000" strokeDashoffset="1000"
          style={{animation:`draw-line 2s ease ${i*0.1+0.5}s forwards`}}
        />
      ))}
    </svg>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", fontFamily:"'Georgia', serif", background:"#0f1f3d" }}>

      {/* ── LEFT PANEL — decorative ── */}
      <div style={{
        position:"relative", width:"45%", background:"linear-gradient(160deg,#0f1f3d 0%,#1a3260 50%,#0d1a30 100%)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        overflow:"hidden", flexShrink:0,
      }}>
        <GridLines />
        {shapes.map((s,i) => <FloatingShape key={i} {...s} />)}

        {/* Radial glow behind crest */}
        <div style={{
          position:"absolute", width:320, height:320, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>

        {/* School Crest SVG */}
        <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
          <div style={{
            width:130, height:130, borderRadius:"50%",
            border:"2px solid rgba(201,168,76,0.5)",
            background:"rgba(255,255,255,0.04)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 60px rgba(201,168,76,0.15), inset 0 0 30px rgba(201,168,76,0.05)",
            animation: mounted ? "scale-in 0.8s ease 0.2s both" : "none",
            position:"relative",
          }}>
            {/* Pulse rings */}
            <div style={{
              position:"absolute", inset:-8, borderRadius:"50%",
              border:"1px solid rgba(201,168,76,0.3)",
              animation:"pulse-ring 3s ease-out 1s infinite",
            }}/>
            <div style={{
              position:"absolute", inset:-16, borderRadius:"50%",
              border:"1px solid rgba(201,168,76,0.15)",
              animation:"pulse-ring 3s ease-out 1.5s infinite",
            }}/>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              {/* Graduation cap */}
              <polygon points="36,10 66,26 36,36 6,26" fill="rgba(201,168,76,0.9)"/>
              <rect x="54" y="26" width="3" height="18" rx="1.5" fill="rgba(201,168,76,0.7)"/>
              <ellipse cx="55.5" cy="45" rx="5" ry="3" fill="rgba(201,168,76,0.5)"/>
              <path d="M18 30 L18 46 Q36 54 54 46 L54 30" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5"/>
              {/* Book */}
              <rect x="24" y="47" width="24" height="15" rx="2" fill="rgba(201,168,76,0.3)" stroke="rgba(201,168,76,0.6)" strokeWidth="1"/>
              <line x1="36" y1="47" x2="36" y2="62" stroke="rgba(201,168,76,0.6)" strokeWidth="1"/>
            </svg>
          </div>

          {/* School name on panel */}
          <div style={{ textAlign:"center", animation: mounted ? "fade-up 0.8s ease 0.5s both" : "none" }}>
            <p style={{ color:"rgba(201,168,76,0.6)", fontSize:11, letterSpacing:4, textTransform:"uppercase", margin:0, marginBottom:8 }}>
              Welcome to
            </p>
            <h2 style={{
              color:"#e2c97e", fontSize:22, fontWeight:700, margin:0, lineHeight:1.2,
              textShadow:"0 2px 20px rgba(201,168,76,0.3)",
            }}>
              Ada Senior<br/>High School
            </h2>
            <div style={{ width:40, height:1.5, background:"rgba(201,168,76,0.5)", margin:"16px auto 0" }}/>
            <p style={{ color:"rgba(201,168,76,0.45)", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginTop:12 }}>
              Est. 1960
            </p>
          </div>
        </div>

        {/* Corner decoration */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:3,
          background:"linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)",
        }}/>
      </div>

      {/* ── RIGHT PANEL — main content ── */}
      <div style={{
        flex:1, background:"#faf7f0", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"48px 56px",
        position:"relative", overflow:"hidden",
      }}>
        {/* Subtle top-right decoration */}
        <div style={{
          position:"absolute", top:-60, right:-60, width:200, height:200,
          borderRadius:"50%", background:"radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>
        <div style={{
          position:"absolute", bottom:-40, left:-40, width:160, height:160,
          borderRadius:"50%", background:"radial-gradient(circle, rgba(15,31,61,0.05) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>

        <div style={{ width:"100%", maxWidth:380, position:"relative", zIndex:1 }}>
          {/* Header */}
          <div style={{ marginBottom:48, animation: mounted ? "fade-up 0.6s ease 0.3s both" : "none", opacity: mounted ? undefined : 0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:3, background:"#c9a84c", borderRadius:2 }}/>
              <span style={{ color:"#c9a84c", fontSize:11, letterSpacing:3, textTransform:"uppercase", fontFamily:"system-ui,sans-serif", fontWeight:600 }}>
                Management Portal
              </span>
            </div>
            <h1 style={{
              fontSize:38, fontWeight:700, color:"#0f1f3d", margin:0, lineHeight:1.1,
              letterSpacing:"-0.02em",
            }}>
              School<br/>
              <span style={{ color:"#c9a84c" }}>Management</span><br/>
              System
            </h1>
            <p style={{ color:"#64748b", fontSize:15, marginTop:16, lineHeight:1.6, fontFamily:"system-ui,sans-serif", fontWeight:400 }}>
              Streamline academics, administration, and student success — all in one place.
            </p>
          </div>

          {/* Login Buttons */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, animation: mounted ? "fade-up 0.6s ease 0.55s both" : "none", opacity: mounted ? undefined : 0 }}>
            {/* Admin Button */}
            <button
              onClick={() => router.push("/login/admin")}
              style={{
                width:"100%", padding:"18px 28px",
                background:"linear-gradient(135deg, #0f1f3d 0%, #1e3a5f 100%)",
                color:"#faf7f0", border:"none", borderRadius:12,
                fontSize:15, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                fontFamily:"system-ui,sans-serif",
                boxShadow:"0 4px 24px rgba(15,31,61,0.25), 0 1px 0 rgba(255,255,255,0.05) inset",
                transition:"all 0.2s ease",
                letterSpacing:"0.01em",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(15,31,61,0.35), 0 1px 0 rgba(255,255,255,0.05) inset";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(15,31,61,0.25), 0 1px 0 rgba(255,255,255,0.05) inset";
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{
                  width:40, height:40, borderRadius:8,
                  background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                    <path d="M17 11l2 2 4-4" stroke="#c9a84c"/>
                  </svg>
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>Admin Login</div>
                  <div style={{ fontSize:12, color:"rgba(250,247,240,0.5)", marginTop:1 }}>Full system access</div>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Staff Button */}
            <button
              onClick={() => router.push("/login/staff")}
              style={{
                width:"100%", padding:"18px 28px",
                background:"#fff", color:"#0f1f3d",
                border:"1.5px solid #e2d9c8", borderRadius:12,
                fontSize:15, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                fontFamily:"system-ui,sans-serif",
                boxShadow:"0 2px 12px rgba(15,31,61,0.06)",
                transition:"all 0.2s ease",
                letterSpacing:"0.01em",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#c9a84c";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(15,31,61,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2d9c8";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(15,31,61,0.06)";
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{
                  width:40, height:40, borderRadius:8,
                  background:"rgba(15,31,61,0.05)", border:"1px solid rgba(15,31,61,0.1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>Staff Login</div>
                  <div style={{ fontSize:12, color:"rgba(15,31,61,0.4)", marginTop:1 }}>Teachers & staff access</div>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(15,31,61,0.3)" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Divider + motto */}
          <div style={{
            marginTop:36, paddingTop:28, borderTop:"1px solid #e8e0d0",
            animation: mounted ? "fade-up 0.6s ease 0.75s both" : "none", opacity: mounted ? undefined : 0,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:6, height:6, borderRadius:"50%", background:"#c9a84c",
                animation:"pulse-ring 2s ease-out infinite",
              }}/>
              <p style={{ color:"#94a3b8", fontSize:12, fontFamily:"system-ui,sans-serif", margin:0, fontStyle:"italic" }}>
                "Excellence in education, character, and service"
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-1 {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-18px) rotate(3deg)}
        }
        @keyframes float-2 {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-12px) rotate(-2deg)}
        }
        @keyframes float-3 {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-22px) rotate(1.5deg)}
        }
        @keyframes fade-up {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes scale-in {
          from{opacity:0;transform:scale(0.9)}
          to{opacity:1;transform:scale(1)}
        }
        @keyframes pulse-ring {
          0%{transform:scale(1);opacity:0.6}
          100%{transform:scale(1.8);opacity:0}
        }
        @keyframes draw-line {
          from{stroke-dashoffset:1000}
          to{stroke-dashoffset:0}
        }
      `}</style>
    </div>
  );
}