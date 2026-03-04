import PageHeader from "@/components/PageHeader";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Palette & helpers ────────────────────────────────────────────────────────
const ACCENT = "#C07850";
const ACCENT_LIGHT = "#F5E6DA";
const ACCENT_SOFT = "#EDD5C0";
const BG = "#FAF0E8";
const SURFACE = "#FFFFFF";
const TEXT = "#2C2C2C";
const MUTED = "#9A8880";
const GREEN = "#22c55e";
const GREEN_BG = "#dcfce7";

const PRESETS = [30, 45, 60, 90, 120];

function pad(n) {
  return String(n).padStart(2, "0");
}
function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ─── Circular progress SVG ────────────────────────────────────────────────────
function Ring({ progress, size = 240, stroke = 10, color = ACCENT, complete = false, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.max(0, Math.min(1, progress));

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACCENT_LIGHT} strokeWidth={stroke} />
        {/* progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={complete ? GREEN : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.4s cubic-bezier(.4,0,.2,1), stroke 0.4s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Sound helper ─────────────────────────────────────────────────────────────
function playDone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = [523, 659, 784][i];
      osc.type = "sine";
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch (_) {}
  try { navigator.vibrate?.([200, 80, 200]); } catch (_) {}
}

// ─── Custom time input modal ──────────────────────────────────────────────────
function TimeInputModal({ initial, onConfirm, onClose }) {
  const totalMin = Math.floor(initial / 60);
  const totalSec = initial % 60;
  const [mins, setMins] = useState(String(totalMin));
  const [secs, setSecs] = useState(pad(totalSec));

  function confirm() {
    const m = Math.max(0, Math.min(99, parseInt(mins) || 0));
    const s = Math.max(0, Math.min(59, parseInt(secs) || 0));
    onConfirm(m * 60 + s);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.18s ease"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: SURFACE, borderRadius: "24px 24px 0 0",
        padding: "28px 24px 40px", width: "100%", maxWidth: 480,
        animation: "slideUp 0.28s cubic-bezier(.4,0,.2,1)"
      }}>
        <p style={{ textAlign: "center", fontWeight: 700, fontSize: 17, color: TEXT, marginBottom: 24 }}>
          Imposta il tempo
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {[
            { label: "min", value: mins, set: setMins, max: 99 },
            { label: "sec", value: secs, set: setSecs, max: 59 },
          ].map(({ label, value, set, max }, idx) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: idx === 0 ? 8 : 0 }}>
              {idx === 1 && <span style={{ fontSize: 32, fontWeight: 700, color: MUTED, margin: "0 6px" }}>:</span>}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => set(v => String(Math.min(max, (parseInt(v) || 0) + 1)))}
                  style={{ width: 48, height: 36, borderRadius: 12, border: "none", background: ACCENT_LIGHT, color: ACCENT, fontSize: 20, cursor: "pointer", fontWeight: 700 }}
                >▲</button>
                <input
                  type="number" value={value}
                  onChange={e => set(e.target.value)}
                  style={{
                    width: 72, textAlign: "center", fontSize: 40, fontWeight: 800,
                    border: `2px solid ${ACCENT_SOFT}`, borderRadius: 14,
                    color: TEXT, padding: "8px 0", outline: "none", background: BG,
                    fontFamily: "inherit"
                  }}
                />
                <button
                  onClick={() => set(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
                  style={{ width: 48, height: 36, borderRadius: 12, border: "none", background: ACCENT_LIGHT, color: ACCENT, fontSize: 20, cursor: "pointer", fontWeight: 700 }}
                >▼</button>
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={confirm} style={{
          marginTop: 28, width: "100%",
          padding: "16px 0", borderRadius: 18, border: "none",
          background: `linear-gradient(135deg, ${ACCENT}, #A0603A)`,
          color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
          boxShadow: `0 4px 20px ${ACCENT}55`
        }}>
          Conferma
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TimerPage() {
  const [mode, setMode] = useState("countdown");
  const [remaining, setRemaining] = useState(60);
  const [initialSeconds, setInitialSeconds] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [laps, setLaps] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [pulse, setPulse] = useState(false);
  const intervalRef = useRef(null);

  const tickCountdown = useCallback(() => {
    setRemaining(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current); intervalRef.current = null;
        setIsRunning(false); setIsComplete(true);
        playDone();
        setPulse(true); setTimeout(() => setPulse(false), 800);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  const tickStopwatch = useCallback(() => setElapsed(p => p + 1), []);

  useEffect(() => {
    if (!isRunning) return;
    const tick = mode === "countdown" ? tickCountdown : tickStopwatch;
    intervalRef.current = setInterval(tick, 1000);
    return () => { clearInterval(intervalRef.current); intervalRef.current = null; };
  }, [isRunning, mode, tickCountdown, tickStopwatch]);

  function stop() { clearInterval(intervalRef.current); intervalRef.current = null; }

  function handleStart() {
    setIsComplete(false);
    if (mode === "countdown" && remaining === 0) setRemaining(initialSeconds);
    setIsRunning(true);
  }
  function handlePause() { setIsRunning(false); }
  function handleReset() {
    if (mode === "countdown") { stop(); setIsRunning(false); setIsComplete(false); setRemaining(initialSeconds); }
    else { setElapsed(0); setLaps([]); }
  }
  function handleLap() { setLaps(prev => [elapsed, ...prev]); }

  function handlePreset(s) {
    stop(); setIsRunning(false); setIsComplete(false);
    setInitialSeconds(s); setRemaining(s);
  }
  function handleModeChange(m) {
    stop(); setIsRunning(false); setIsComplete(false); setMode(m);
    if (m === "stopwatch") { setElapsed(0); setLaps([]); }
    else setRemaining(initialSeconds);
  }
  function handleCustomTime(s) {
    stop(); setIsRunning(false); setIsComplete(false);
    setInitialSeconds(s); setRemaining(s); setShowInput(false);
  }

  const progress = mode === "countdown"
    ? (initialSeconds > 0 ? remaining / initialSeconds : 0)
    : 1;
  const ringColor = isComplete ? GREEN : ACCENT;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Raleway', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes pulseGreen { 0%,100% { transform:scale(1) } 40% { transform:scale(1.12) } }
        @keyframes tickAnim { 0%,100% { transform:scale(1) } 50% { transform:scale(1.03) } }
        @keyframes lapIn { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .tick-anim { animation: tickAnim 0.25s ease; }
      `}</style>

      {/* Header */}
      <PageHeader title="Timer" showBack backLabel="Indietro" />

      <main style={{ maxWidth: 440, margin: "0 auto", padding: "24px 20px 48px" }}>

        {/* Mode toggle */}
        <div style={{
          display: "flex", background: SURFACE,
          border: `2px solid ${ACCENT_LIGHT}`, borderRadius: 18, padding: 4, marginBottom: 24
        }}>
          {["countdown", "stopwatch"].map(m => (
            <button key={m} onClick={() => handleModeChange(m)} style={{
              flex: 1, padding: "10px 0", borderRadius: 14, border: "none",
              background: mode === m ? `linear-gradient(135deg, ${ACCENT}, #A0603A)` : "transparent",
              color: mode === m ? "#fff" : MUTED,
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              transition: "all 0.25s ease",
              boxShadow: mode === m ? `0 3px 12px ${ACCENT}44` : "none"
            }}>
              {m === "countdown" ? "Tempo di posa" : "Cronometro"}
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: MUTED, marginBottom: 28 }}>
          {mode === "countdown"
            ? "Tocca il timer per impostare un tempo personalizzato"
            : "Registra i giri con il tasto Giro"}
        </p>

        {/* Ring display */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Ring
            progress={progress}
            size={220}
            stroke={11}
            color={ringColor}
            complete={isComplete}
          >
            {isComplete ? (
              <div style={{ textAlign: "center", animation: "pulseGreen 0.6s ease" }}>
                <div style={{ fontSize: 40 }}>✅</div>
                <p style={{ fontWeight: 800, fontSize: 20, color: GREEN, margin: "4px 0 2px" }}>Pronto!</p>
                <p style={{ fontSize: 12, color: MUTED }}>Colla pronta</p>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => !isRunning && mode === "countdown" && setShowInput(true)}
                  style={{
                    background: "none", border: "none", cursor: mode === "countdown" && !isRunning ? "pointer" : "default",
                    padding: 0,
                    animation: isRunning ? "tickAnim 1s ease infinite" : "none"
                  }}
                  title={mode === "countdown" && !isRunning ? "Tocca per modificare" : ""}
                >
                  <span style={{
                    fontSize: 54, fontWeight: 900, color: TEXT, fontVariantNumeric: "tabular-nums",
                    letterSpacing: -1, display: "block",
                    textShadow: isRunning ? `0 0 20px ${ACCENT}44` : "none",
                    transition: "text-shadow 0.3s"
                  }}>
                    {mode === "countdown" ? fmt(remaining) : fmt(elapsed)}
                  </span>
                </button>
                <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
                  {isRunning
                    ? (mode === "countdown" ? "In attesa..." : "In corso...")
                    : (mode === "countdown" && !isRunning ? "Tocca per modificare" : "Premi Avvia")}
                </p>
              </div>
            )}
          </Ring>
        </div>

        {/* Presets - only countdown */}
        {mode === "countdown" && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            {PRESETS.map(s => (
              <button
                key={s}
                onClick={() => handlePreset(s)}
                disabled={isRunning}
                style={{
                  padding: "8px 16px", borderRadius: 12,
                  border: `2px solid ${initialSeconds === s ? ACCENT : ACCENT_LIGHT}`,
                  background: initialSeconds === s ? `linear-gradient(135deg, ${ACCENT}, #A0603A)` : SURFACE,
                  color: initialSeconds === s ? "#fff" : TEXT,
                  fontWeight: 600, fontSize: 13, cursor: isRunning ? "not-allowed" : "pointer",
                  opacity: isRunning ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: initialSeconds === s ? `0 3px 12px ${ACCENT}44` : "none"
                }}
              >
                {s < 60 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
            <button
              onClick={() => !isRunning && setShowInput(true)}
              disabled={isRunning}
              style={{
                padding: "8px 16px", borderRadius: 12,
                border: `2px dashed ${ACCENT_SOFT}`,
                background: SURFACE, color: MUTED,
                fontWeight: 600, fontSize: 13, cursor: isRunning ? "not-allowed" : "pointer",
                opacity: isRunning ? 0.5 : 1,
              }}
            >
              Custom
            </button>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {isRunning ? (
            <button onClick={handlePause} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "15px 32px", borderRadius: 20,
              background: `linear-gradient(135deg, ${ACCENT}, #A0603A)`,
              border: "none", color: "#fff", fontWeight: 700, fontSize: 16,
              cursor: "pointer", boxShadow: `0 6px 24px ${ACCENT}55`,
              transition: "transform 0.15s", transform: "scale(1)"
            }}>
              ⏸ Pausa
            </button>
          ) : (
            <button onClick={handleStart} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "15px 32px", borderRadius: 20,
              background: `linear-gradient(135deg, ${ACCENT}, #A0603A)`,
              border: "none", color: "#fff", fontWeight: 700, fontSize: 16,
              cursor: "pointer", boxShadow: `0 6px 24px ${ACCENT}55`
            }}>
              ▶ {remaining === 0 ? "Ricomincia" : "Avvia"}
            </button>
          )}

          {mode === "stopwatch" && isRunning && (
            <button onClick={handleLap} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "15px 20px", borderRadius: 20,
              background: ACCENT_LIGHT, border: `2px solid ${ACCENT_SOFT}`,
              color: ACCENT, fontWeight: 700, fontSize: 15, cursor: "pointer"
            }}>
              🏁 Giro
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={mode === "countdown" && isRunning}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "15px 20px", borderRadius: 20,
              background: SURFACE, border: `2px solid ${ACCENT_LIGHT}`,
              color: TEXT, fontWeight: 700, fontSize: 15,
              cursor: mode === "countdown" && isRunning ? "not-allowed" : "pointer",
              opacity: mode === "countdown" && isRunning ? 0.4 : 1
            }}
          >
            ↺ Reset
          </button>
        </div>

        {/* Laps list */}
        {mode === "stopwatch" && laps.length > 0 && (
          <div style={{
            background: SURFACE, borderRadius: 20,
            border: `2px solid ${ACCENT_LIGHT}`, overflow: "hidden"
          }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ACCENT_LIGHT}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>🏁 Giri</span>
              <span style={{ color: MUTED, fontSize: 13 }}>{laps.length} registrati</span>
            </div>
            {laps.map((t, i) => {
              const prev = laps[i + 1] ?? 0;
              const delta = t - prev;
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 16px",
                  borderBottom: i < laps.length - 1 ? `1px solid ${ACCENT_LIGHT}` : "none",
                  animation: i === 0 ? "lapIn 0.3s ease" : "none"
                }}>
                  <span style={{ fontWeight: 600, color: MUTED, fontSize: 13 }}>Giro {laps.length - i}</span>
                  <span style={{ fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>{fmt(delta)}</span>
                  <span style={{ color: MUTED, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{fmt(t)}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Custom time modal */}
      {showInput && (
        <TimeInputModal
          initial={initialSeconds}
          onConfirm={handleCustomTime}
          onClose={() => setShowInput(false)}
        />
      )}
    </div>
  );
}