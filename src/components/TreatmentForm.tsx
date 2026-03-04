import React, { useState, useEffect } from 'react';
import type { Treatment, EyeLengthMap, TreatmentCatalogEntry } from '../types';
import EyeSchemaCanvas from './EyeSchemaCanvas';
import {
  Trash2, Calendar, ChevronDown, ChevronUp,
  Check, AlertCircle, Euro, Clock, Zap, Target, X,
} from 'lucide-react';

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
  red:      '#EF4444',
  redBg:    '#FEF2F2',
  ok:       '#22C55E',
} as const;

const GRAD = `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`;

// ─── Micro components ──────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
      {children}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
    </p>
  );
}

function SectionDivider({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
      <div style={{ width: 28, height: 28, borderRadius: 9, background: C.accentSft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={C.accent} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 12, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  height: 50, padding: '0 16px',
  borderRadius: 14, border: `1.5px solid ${C.border}`,
  background: '#FAFAFA', fontSize: 15, color: C.text,
  fontFamily: 'inherit', outline: 'none',
};

function Chip({ active, onClick, children }: {
  active?: boolean; onClick: (e: React.MouseEvent) => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onClick(e); }}
      style={{
        padding: '8px 14px', borderRadius: 100,
        border: `1.5px solid ${active ? C.accent : C.border}`,
        background: active ? C.accent : C.surface,
        color: active ? '#FFF' : C.muted,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.12s ease',
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    >
      {active && <Check size={11} strokeWidth={3} />}
      {children}
    </button>
  );
}

// ─── Options ──────────────────────────────────────────────────────────────────
const CURVATURE_OPTS = ['A', 'B', 'C', 'D', 'L', 'L+', 'M', 'M+'];
const BIGODINI_OPTS  = ['S', 'M', 'L', 'S1', 'M1', 'L1', 'XL', 'XL1'];
const THICKNESS_OPTS = [0.05, 0.07, 0.10, 0.12, 0.15, 0.20];

// ─── Props ────────────────────────────────────────────────────────────────────
interface TreatmentFormProps {
  treatment: Treatment;
  index: number;
  onChange: (t: Treatment) => void;
  onRemove: () => void;
  isLast: boolean;
  catalogEntries?: TreatmentCatalogEntry[];
}

// ─── Component ────────────────────────────────────────────────────────────────
const TreatmentForm: React.FC<TreatmentFormProps> = ({
  treatment, index, onChange, onRemove, isLast, catalogEntries = [],
}) => {
  const [expanded,  setExpanded]  = useState(isLast);
  const [valErrors, setValErrors] = useState<Record<string, string>>({});
  const [pct,       setPct]       = useState(0);

  // ── Progress ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const req = ['data', 'curvatura', 'spessore', 'lunghezze', 'colla', 'tenuta', 'colore_ciglia', 'tempo_applicazione', 'refill', 'prezzo'];
    let done = req.filter(f => { const v = treatment[f as keyof Treatment]; return v !== undefined && v !== null && v !== ''; }).length;
    if (treatment.bigodini?.length) done++;
    setPct(Math.round((done / (req.length + 1)) * 100));
  }, [treatment]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (field: string, val: any): string => {
    if (field === 'data' && val && new Date(val) > new Date()) return 'La data non può essere futura';
    if (field === 'spessore' && val && (val < 0.05 || val > 0.20)) return 'Spessore: 0.05–0.20 mm';
    if (field === 'prezzo' && val < 0) return 'Prezzo non valido';
    return '';
  };

  const set = (field: keyof Treatment, val: any) => {
    onChange({ ...treatment, [field]: val });
    setValErrors(prev => ({ ...prev, [field]: validate(field, val) }));
  };

  const pctColor = pct >= 80 ? C.ok : pct >= 40 ? C.accent : C.muted;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      role="group"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22, overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px',
        borderBottom: expanded ? `1px solid ${C.border}` : 'none',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Index */}
        <div style={{
          width: 42, height: 42, borderRadius: 14, flexShrink: 0,
          background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 16, color: '#FFF',
        }}>
          {index + 1}
        </div>

        {/* Title + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
            Trattamento #{index + 1}
            {treatment.data && (
              <span style={{ fontWeight: 500, fontSize: 13, color: C.muted, marginLeft: 8 }}>
                {new Date(treatment.data).toLocaleDateString('it-IT')}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 100, background: C.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: pctColor, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: pctColor, whiteSpace: 'nowrap' }}>{pct}%</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setExpanded(v => !v); }}
            style={{
              width: 40, height: 40, borderRadius: 13, border: 'none',
              background: expanded ? C.accent : C.accentSft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            {expanded
              ? <ChevronUp  size={17} color="#FFF" />
              : <ChevronDown size={17} color={C.accent} />
            }
          </button>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
            style={{
              width: 40, height: 40, borderRadius: 13, border: 'none', background: C.redBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Trash2 size={15} color={C.red} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {expanded && (
        <div style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Tipo da listino */}
          {catalogEntries.length > 0 && (
            <div>
              <Label>Tipo da listino</Label>
              <select
                value={treatment.treatment_catalog_id ?? ''}
                onChange={e => {
                  const id    = e.target.value || null;
                  const entry = id ? catalogEntries.find(c => c.id === id) : null;
                  onChange({ ...treatment, treatment_catalog_id: id || undefined, prezzo: entry ? entry.base_price : treatment.prezzo });
                }}
                style={{ ...inputStyle, paddingRight: 36 }}
              >
                <option value="">— Nessuno / personalizzato —</option>
                {catalogEntries.map(e => (
                  <option key={e.id} value={e.id}>{e.name} — €{e.base_price} · {e.duration_minutes}min</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Base ── */}
          <SectionDivider title="Informazioni base" icon={Calendar} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Data */}
            <div>
              <Label required>Data</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date" value={treatment.data}
                  onChange={e => set('data', e.target.value)}
                  style={{ ...inputStyle, borderColor: valErrors.data ? C.red : C.border }}
                />
                {treatment.data && !valErrors.data && (
                  <Check size={13} color={C.ok} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                )}
              </div>
              {valErrors.data && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{valErrors.data}</p>}
            </div>

            {/* Refill */}
            <div>
              <Label>Refill</Label>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <Chip active={treatment.refill === 'si'} onClick={() => set('refill', 'si')}>Sì</Chip>
                <Chip active={treatment.refill === 'no'} onClick={() => set('refill', 'no')}>No</Chip>
              </div>
            </div>
          </div>

          {/* ── Curvatura ── */}
          <SectionDivider title="Curvatura e spessore" icon={Target} />
          <div>
            <Label required>Curvatura</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CURVATURE_OPTS.map(o => (
                <Chip key={o} active={treatment.curvatura === o} onClick={() => set('curvatura', o)}>{o}</Chip>
              ))}
            </div>
          </div>

          {/* Spessore */}
          <div>
            <Label required>Spessore (mm)</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {THICKNESS_OPTS.map(t => (
                <Chip key={t} active={treatment.spessore === t} onClick={() => set('spessore', t)}>{t}</Chip>
              ))}
            </div>
            <input
              type="number" step="0.01" min="0.05" max="0.20"
              value={treatment.spessore} onChange={e => set('spessore', parseFloat(e.target.value))}
              placeholder="0.07"
              style={{ ...inputStyle, borderColor: valErrors.spessore ? C.red : C.border }}
            />
            {valErrors.spessore && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{valErrors.spessore}</p>}
          </div>

          {/* Bigodini */}
          <div>
            <Label>Bigodini</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BIGODINI_OPTS.map(b => (
                <Chip
                  key={b}
                  active={treatment.bigodini?.includes(b) ?? false}
                  onClick={() => {
                    const cur = treatment.bigodini || [];
                    const checked = cur.includes(b);
                    set('bigodini', checked ? cur.filter(x => x !== b) : [...cur, b]);
                  }}
                >
                  {b}
                </Chip>
              ))}
            </div>
          </div>

          {/* ── Schema ── */}
          <SectionDivider title="Lunghezze e schema" icon={Zap} />
          <div>
            <Label>Lunghezze (es. 8–13 mm)</Label>
            <input
              type="text" value={treatment.lunghezze}
              onChange={e => set('lunghezze', e.target.value)}
              placeholder="es. 8-13 mm" style={inputStyle}
            />
          </div>
          <EyeSchemaCanvas
            value={treatment.schema_occhio || {}}
            onChange={schema => onChange({ ...treatment, schema_occhio: schema })}
          />

          {/* ── Prodotti ── */}
          <SectionDivider title="Prodotti e tempi" icon={Clock} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([
              ['colla',              'Colla',              'Nome prodotto'],
              ['tenuta',             'Tenuta',             'es. 4 settimane'],
              ['colore_ciglia',      'Colore ciglia',      'es. nere'],
              ['colore',             'Colore',             'es. castano'],
            ] as [keyof Treatment, string, string][]).map(([key, label, placeholder]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input
                  type="text"
                  value={(treatment[key] as string) || ''}
                  onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} style={inputStyle}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>Tempo applicazione</Label>
              <input
                type="text"
                value={treatment.tempo_applicazione || ''}
                onChange={e => set('tempo_applicazione', e.target.value)}
                placeholder="es. 2h 30min" style={inputStyle}
              />
            </div>
          </div>

          {/* ── Prezzo ── */}
          <SectionDivider title="Prezzo" icon={Euro} />
          <div>
            <Label required>Importo (€)</Label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontWeight: 900, fontSize: 20, color: C.accent, pointerEvents: 'none',
              }}>€</span>
              <input
                type="number" step="0.5" min="0"
                value={treatment.prezzo || ''}
                onChange={e => set('prezzo', parseFloat(e.target.value))}
                placeholder="0"
                style={{
                  ...inputStyle,
                  paddingLeft: 34, fontSize: 22, fontWeight: 800,
                  borderColor: valErrors.prezzo ? C.red : C.border,
                }}
              />
            </div>
            {valErrors.prezzo && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{valErrors.prezzo}</p>}
          </div>

        </div>
      )}
    </div>
  );
};

export default TreatmentForm;