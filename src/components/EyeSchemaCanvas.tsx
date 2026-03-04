import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Minus, Plus, X, RotateCcw } from 'lucide-react';
import type { EyeLengthMap } from '../types';
import { useAppColors } from '../hooks/useAppColors';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  surface:  '#FFFFFF',
  accent:   '#C07850',
  accentDk: '#A05830',
  accentSft:'rgba(192,120,80,0.10)',
  accentMid:'rgba(192,120,80,0.20)',
  border:   '#EDE0D8',
  text:     '#2C2C2C',
  muted:    '#9A8880',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface EyePoint {
  x: number; y: number; id: string;
  length: number; label: string; angle: number;
}

export interface EyeSchemaCanvasProps {
  value: EyeLengthMap;
  onChange: (value: EyeLengthMap) => void;
  className?: string;
}

const POINT_LABELS: Record<string, string> = {
  left_inner_corner:  'Sx – Angolo interno',
  left_upper_inner:   'Sx – Sup. interno',
  left_upper_center:  'Sx – Centro sup.',
  left_upper_outer:   'Sx – Sup. esterno',
  left_outer_corner:  'Sx – Angolo esterno',
  right_inner_corner: 'Dx – Angolo interno',
  right_upper_inner:  'Dx – Sup. interno',
  right_upper_center: 'Dx – Centro sup.',
  right_upper_outer:  'Dx – Sup. esterno',
  right_outer_corner: 'Dx – Angolo esterno',
};

const DEFAULT_LENGTHS: EyeLengthMap = {
  left_inner_corner: 8,  left_upper_inner: 9,  left_upper_center: 11,
  left_upper_outer: 12,  left_outer_corner: 10,
  right_inner_corner: 8, right_upper_inner: 9,  right_upper_center: 11,
  right_upper_outer: 12, right_outer_corner: 10,
};

// ─── Component ────────────────────────────────────────────────────────────────
const EyeSchemaCanvas: React.FC<EyeSchemaCanvasProps> = ({ value, onChange, className = '' }) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors       = useAppColors();

  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [hoveredPoint,  setHoveredPoint]  = useState<string | null>(null);
  const [points,        setPoints]        = useState<EyePoint[]>([]);
  const [canvasSize,    setCanvasSize]    = useState({ width: 500, height: 400 });
  const [bgImage,       setBgImage]       = useState<HTMLImageElement | null>(null);

  // ── Load background ────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = '/lash_map.png';
  }, []);

  // ── Responsive sizing ──────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (!containerRef.current || !bgImage) return;
      const w = Math.min(500, containerRef.current.offsetWidth);
      setCanvasSize({ width: w, height: w / (bgImage.width / bgImage.height) });
    };
    if (bgImage) { update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }
  }, [bgImage]);

  // ── Build points ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasSize.width) return;
    const cy = canvasSize.height / 2;
    const ew = 85, eh = 60;
    const lx = canvasSize.width * 0.30;
    const rx = canvasSize.width * 0.75;

    const eye = (cx: number, pfx: string): EyePoint[] => [
      { x: cx - ew,       y: cy - eh * 1.8, id: `${pfx}_inner_corner`,  length: value[`${pfx}_inner_corner`]  ?? 8,  label: POINT_LABELS[`${pfx}_inner_corner`],  angle: 90 },
      { x: cx - ew * 0.6, y: cy - eh * 2.0, id: `${pfx}_upper_inner`,   length: value[`${pfx}_upper_inner`]   ?? 9,  label: POINT_LABELS[`${pfx}_upper_inner`],   angle: 90 },
      { x: cx,             y: cy - eh * 2.3, id: `${pfx}_upper_center`,  length: value[`${pfx}_upper_center`]  ?? 11, label: POINT_LABELS[`${pfx}_upper_center`],  angle: 90 },
      { x: cx + ew * 0.5,  y: cy - eh * 2.0, id: `${pfx}_upper_outer`,  length: value[`${pfx}_upper_outer`]   ?? 12, label: POINT_LABELS[`${pfx}_upper_outer`],   angle: 90 },
      { x: cx + ew,        y: cy - eh * 1.8, id: `${pfx}_outer_corner`, length: value[`${pfx}_outer_corner`]  ?? 10, label: POINT_LABELS[`${pfx}_outer_corner`],  angle: 90 },
    ];

    const next = [...eye(lx, 'left'), ...eye(rx, 'right')];
    setPoints(prev => {
      if (!prev.length) return next;
      const diff = prev.some((p, i) => next[i] && (p.length !== next[i].length || p.x !== next[i].x));
      return diff ? next : prev;
    });
  }, [canvasSize, value]);

  // ── Draw canvas ────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvasSize.width  * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.drawImage(bgImage, 0, 0, canvasSize.width, canvasSize.height);

    points.forEach(pt => {
      const isSel = selectedPoint === pt.id;
      const isHov = hoveredPoint  === pt.id;
      const scale = isSel ? 1.4 : isHov ? 1.2 : 1;

      const lashPx = (pt.length / 20) * 35;
      const rad    = (pt.angle * Math.PI) / 180;
      const ex = pt.x + Math.cos(rad) * lashPx;
      const ey = pt.y + Math.sin(rad) * lashPx;

      // ── Lash ──
      const lashColor = isSel ? C.accent : isHov ? C.accentDk : '#4b5563';
      ctx.strokeStyle = lashColor;
      ctx.lineWidth   = isSel ? 3.5 : isHov ? 3 : 2.5;
      ctx.lineCap = 'round';
      if (isSel || isHov) { ctx.shadowColor = lashColor + '60'; ctx.shadowBlur = 4; }
      const cf = pt.length / 15;
      const ccx = pt.x + Math.cos(rad) * (lashPx * 0.7);
      const ccy = pt.y + Math.sin(rad) * (lashPx * 0.7) - 3 * cf;
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.quadraticCurveTo(ccx, ccy, ex, ey); ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

      // ── Point ──
      const ptColor = isSel ? C.accent   : isHov ? C.accentDk : '#6b7280';
      const ptBdr   = isSel ? C.accentDk : isHov ? C.accent   : '#9ca3af';
      const pr = 6 * scale;
      if (isSel || isHov) { ctx.shadowColor = ptColor + '80'; ctx.shadowBlur = 12; }
      ctx.fillStyle = ptBdr; ctx.beginPath(); ctx.arc(pt.x, pt.y, pr + 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ptColor; ctx.beginPath(); ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2); ctx.fill();
      if (isSel || isHov) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pr * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

      // ── Tooltip ──
      if (isSel || isHov) {
        const text = `${pt.length}mm`;
        ctx.font = 'bold 12px system-ui,sans-serif';
        const tw = ctx.measureText(text).width;
        const lx2 = pt.x, ly2 = pt.y - 30;
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
        ctx.fillStyle = isSel ? C.accent : C.accentDk;
        ctx.beginPath(); ctx.roundRect(lx2 - tw / 2 - 8, ly2 - 11, tw + 16, 22, 12); ctx.fill();
        ctx.beginPath(); ctx.moveTo(lx2 - 4, ly2 + 11); ctx.lineTo(lx2 + 4, ly2 + 11); ctx.lineTo(lx2, ly2 + 16); ctx.closePath(); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, lx2, ly2);
      }
    });
  }, [canvasSize, points, selectedPoint, hoveredPoint, bgImage, colors]);

  useEffect(() => { draw(); }, [draw]);

  // ── Interaction ────────────────────────────────────────────────────────────
  const getHit = (e: React.MouseEvent<HTMLCanvasElement>): EyePoint | null => {
    const r  = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (canvasSize.width  / r.width);
    const my = (e.clientY - r.top)  * (canvasSize.height / r.height);
    return points.reduce<EyePoint | null>((best, pt) => {
      const d = Math.hypot(mx - pt.x, my - pt.y);
      return (d < 25 && (!best || d < Math.hypot(mx - best.x, my - best.y))) ? pt : best;
    }, null);
  };

  const setLen = (id: string, len: number) => {
    const v = Math.max(5, Math.min(20, len));
    setPoints(prev => prev.map(p => p.id === id ? { ...p, length: v } : p));
    onChange({ ...value, [id]: v });
  };

  const selData = points.find(p => p.id === selectedPoint);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Schema ciglia</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Tocca un punto per regolare</p>
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onChange(DEFAULT_LENGTHS); setSelectedPoint(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 10,
            border: `1.5px solid ${C.border}`, background: C.surface,
            fontSize: 12, fontWeight: 700, color: C.muted, cursor: 'pointer',
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* Canvas */}
      <div style={{ borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${C.border}`, background: '#FFF', display: 'flex', justifyContent: 'center' }}>
        {bgImage
          ? <canvas
              ref={canvasRef}
              style={{ width: canvasSize.width, height: canvasSize.height, display: 'block', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); setSelectedPoint(getHit(e)?.id ?? null); }}
              onMouseMove={e => setHoveredPoint(getHit(e)?.id ?? null)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          : <div style={{ height: 140, display: 'flex', alignItems: 'center', fontSize: 14, color: C.muted }}>
              Caricamento…
            </div>
        }
      </div>

      {/* Selected point panel */}
      {selData && (
        <div style={{
          background: C.surface, border: `1.5px solid ${C.accentMid}`,
          borderRadius: 20, padding: '16px 18px',
          boxShadow: '0 3px 14px rgba(192,120,80,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{selData.label}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Regola lunghezza · {selData.length} mm</p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setSelectedPoint(null); }}
              style={{ width: 28, height: 28, borderRadius: 9, background: C.accentSft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={13} color={C.muted} />
            </button>
          </div>

          {/* Slider */}
          <input
            type="range" min="5" max="20" step="0.5"
            value={selData.length}
            onChange={e => setLen(selectedPoint!, parseFloat(e.target.value))}
            style={{
              width: '100%', height: 6, borderRadius: 3, appearance: 'none', cursor: 'pointer', marginBottom: 14,
              background: `linear-gradient(to right, ${C.accent} ${((selData.length - 5) / 15) * 100}%, ${C.border} ${((selData.length - 5) / 15) * 100}%)`,
            }}
          />

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button
              type="button" disabled={selData.length <= 5}
              onClick={e => { e.stopPropagation(); setLen(selectedPoint!, selData.length - 0.5); }}
              style={{ width: 40, height: 40, borderRadius: 13, border: `1.5px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selData.length <= 5 ? 'not-allowed' : 'pointer', opacity: selData.length <= 5 ? 0.35 : 1 }}
            >
              <Minus size={16} color={C.accent} />
            </button>
            <div style={{ minWidth: 72, textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: C.accentSft }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: C.text, fontFamily: 'monospace' }}>{selData.length}mm</span>
            </div>
            <button
              type="button" disabled={selData.length >= 20}
              onClick={e => { e.stopPropagation(); setLen(selectedPoint!, selData.length + 0.5); }}
              style={{ width: 40, height: 40, borderRadius: 13, border: `1.5px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selData.length >= 20 ? 'not-allowed' : 'pointer', opacity: selData.length >= 20 ? 0.35 : 1 }}
            >
              <Plus size={16} color={C.accent} />
            </button>
          </div>
        </div>
      )}

      {/* Quick overview */}
      {!selectedPoint && points.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {points.map(pt => (
            <button
              key={pt.id} type="button"
              onClick={e => { e.stopPropagation(); setSelectedPoint(pt.id); }}
              style={{
                padding: '10px 12px', borderRadius: 14,
                border: `1.5px solid ${C.border}`, background: C.surface,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginRight: 8, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{pt.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.accent, padding: '2px 8px', borderRadius: 7, background: C.accentSft, flexShrink: 0 }}>{pt.length}mm</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EyeSchemaCanvas;