import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Sparkles, AlertCircle,
  X, Euro, Clock,
  Check, Edit3, ArrowUp, ArrowDown,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FullPageLoader from '../components/FullPageLoader';
import { useSupabaseServices } from '../lib/supabaseService';
import { useApp } from '../contexts/AppContext';
import type { TreatmentCatalogEntry, Material } from '../types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:       '#FAF0E8',
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
  okBg:     '#F0FDF4',
} as const;

const GRAD = `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  height: 52, padding: '0 16px',
  borderRadius: 16, border: `1.5px solid ${C.border}`,
  background: '#FAFAFA', fontSize: 15, color: C.text,
  fontFamily: 'inherit', outline: 'none',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
      {children}
    </p>
  );
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Entry card ───────────────────────────────────────────────────────────────
function EntryCard(props: Readonly<{
  entry: TreatmentCatalogEntry;
  index: number;
  total: number;
  onEdit: (e: TreatmentCatalogEntry) => void;
  onDelete: (e: TreatmentCatalogEntry) => void;
  onMoveUp: (e: TreatmentCatalogEntry) => void;
  onMoveDown: (e: TreatmentCatalogEntry) => void;
}>) {
  const { entry, index, total, onEdit, onDelete, onMoveUp, onMoveDown } = props;
  return (
    <li
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Sort handle / number */}
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: C.accentSft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: C.accent,
        }}>
          {index + 1}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>
            {entry.name}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.accent, fontWeight: 700 }}>
              <Euro size={12} /> {entry.base_price.toFixed(2)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}>
              <Clock size={12} /> {formatDuration(entry.duration_minutes)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {/* Move up/down — visible only on mobile where drag isn't natural */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMoveUp(entry)}
              style={{
                width: 26, height: 26, borderRadius: 8,
                background: index === 0 ? 'transparent' : C.accentSft,
                border: 'none', cursor: index === 0 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: index === 0 ? 0.25 : 1,
              }}
            >
              <ArrowUp size={13} color={C.accent} />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMoveDown(entry)}
              style={{
                width: 26, height: 26, borderRadius: 8,
                background: index === total - 1 ? 'transparent' : C.accentSft,
                border: 'none', cursor: index === total - 1 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: index === total - 1 ? 0.25 : 1,
              }}
            >
              <ArrowDown size={13} color={C.accent} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onEdit(entry)}
            aria-label="Modifica"
            style={{
              width: 38, height: 38, borderRadius: 13,
              background: C.accentSft, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Edit3 size={16} color={C.accent} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            aria-label="Elimina"
            style={{
              width: 38, height: 38, borderRadius: 13,
              background: C.redBg, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={16} color={C.red} />
          </button>
        </div>
      </div>
    </li>
  );
}

// ─── Add / Edit bottom sheet ──────────────────────────────────────────────────
function EntrySheet(props: Readonly<{
  entry: TreatmentCatalogEntry | null;
  materials: Material[];
  initialMaterialsConfig: { material_id: string; quantity_per_session: number }[];
  onSave: (payload: {
    name: string;
    base_price: number;
    duration_minutes: number;
    sort_order: number;
    materials: { material_id: string; quantity_per_session: number }[];
  }) => Promise<void>;
  onCancel: () => void;
}>) {
  const { entry, materials, initialMaterialsConfig, onSave, onCancel } = props;
  const [name,     setName]     = useState(entry?.name ?? '');
  const [price,    setPrice]    = useState(entry ? String(entry.base_price) : '');
  const [duration, setDuration] = useState(String(entry?.duration_minutes ?? 60));
  const [order,    setOrder]    = useState(String(entry?.sort_order ?? 0));
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  type MaterialRow = { material_id: string; quantity_per_session: string };
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>(
    initialMaterialsConfig.map(m => ({
      material_id: m.material_id,
      quantity_per_session: String(m.quantity_per_session),
    })),
  );

  // Quando cambiano i materiali iniziali (es. dopo fetch async dei link),
  // riallineiamo lo stato locale delle righe.
  useEffect(() => {
    setMaterialRows(
      initialMaterialsConfig.map(m => ({
        material_id: m.material_id,
        quantity_per_session: String(m.quantity_per_session),
      })),
    );
  }, [initialMaterialsConfig]);

  // Quick duration chips
  const DURATION_CHIPS = [30, 45, 60, 90, 120, 180];
  const PRICE_CHIPS    = [20, 30, 40, 50, 60, 70, 80, 90];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = name.trim();
    const p = Number.parseFloat(price);
    const d = Math.max(1, Number.parseInt(duration, 10) || 60);
    const o = Math.max(0, Number.parseInt(order, 10) || 0);
    if (!n)            { setErr('Il nome è obbligatorio.'); return; }
    if (isNaN(p) || p < 0) { setErr('Inserisci un prezzo valido (≥ 0).'); return; }

    const materialsPayload = materialRows
      .map(row => ({
        material_id: row.material_id,
        quantity_per_session: Number.parseInt(row.quantity_per_session, 10) || 0,
      }))
      .filter(row => row.material_id && row.quantity_per_session > 0);

    setErr(null); setSaving(true);
    try { await onSave({ name: n, base_price: p, duration_minutes: d, sort_order: o, materials: materialsPayload }); }
    catch { setErr('Errore nel salvataggio.'); }
    finally { setSaving(false); }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(44,28,20,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, margin: '0 auto',
          background: C.surface, borderRadius: '28px 28px 0 0',
          maxHeight: '92vh', overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: C.border }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px', borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accent }}>
              Listino
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 1 }}>
              {entry ? 'Modifica trattamento' : 'Nuovo trattamento'}
            </p>
          </div>
          <button
            type="button" onClick={onCancel}
            style={{
              width: 36, height: 36, borderRadius: 12,
              background: C.accentSft, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={16} color={C.muted} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {err && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 14,
              background: C.redBg, border: `1.5px solid rgba(239,68,68,0.3)`,
              fontSize: 13, color: C.red, fontWeight: 600,
            }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}

          {/* Name */}
          <div>
            <FieldLabel>Nome trattamento *</FieldLabel>
            <input
              type="text"
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              placeholder="Es. Extension One to One, Refill…"
              style={inputStyle}
            />
          </div>

          {/* Price */}
          <div>
            <FieldLabel>Prezzo base (€) *</FieldLabel>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontWeight: 800, fontSize: 18, color: C.accent, pointerEvents: 'none',
              }}>€</span>
              <input
                type="number" min="0" step="0.5"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, paddingLeft: 36, fontSize: 22, fontWeight: 800 }}
              />
            </div>
            {/* Price chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {PRICE_CHIPS.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setPrice(String(p))}
                  style={{
                    padding: '7px 12px', borderRadius: 100,
                    border: `1.5px solid ${parseFloat(price) === p ? C.accent : C.border}`,
                    background: parseFloat(price) === p ? C.accent : C.surface,
                    color: parseFloat(price) === p ? '#FFF' : C.muted,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  €{p}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <FieldLabel>Durata (minuti)</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {DURATION_CHIPS.map(d => {
                const sel = parseInt(duration, 10) === d;
                return (
                  <button
                    key={d} type="button"
                    onClick={() => setDuration(String(d))}
                    style={{
                      padding: '12px 8px', borderRadius: 14,
                      border: `1.5px solid ${sel ? C.accent : C.border}`,
                      background: sel ? C.accent : C.surface,
                      color: sel ? '#FFF' : C.text,
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {formatDuration(d)}
                  </button>
                );
              })}
            </div>
            {/* Custom duration input */}
            <div style={{ marginTop: 10 }}>
              <input
                type="number" min="1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="Durata personalizzata in minuti"
                style={{ ...inputStyle, fontSize: 14 }}
              />
            </div>
          </div>

          {/* Sort order */}
          <div>
            <FieldLabel>Ordine in lista</FieldLabel>
            <input
              type="number" min="0"
              value={order}
              onChange={e => setOrder(e.target.value)}
              placeholder="0 = primo"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Puoi riordinare anche dalle frecce nelle card
            </p>
          </div>

          {/* Materials mapping (optional) */}
          <div style={{ marginTop: 4 }}>
            <FieldLabel>Materiali usati (opzionale)</FieldLabel>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              Collega i materiali di inventario che consumi durante questo trattamento.
              La quantità è espressa nella stessa unità della colonna <strong>Quantità</strong> in Inventario.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materialRows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,2.5fr) minmax(0,1fr) auto',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <select
                    value={row.material_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const val = e.target.value;
                      setMaterialRows(prev => prev.map((r, i) => (i === idx ? { ...r, material_id: val } : r)));
                    }}
                    style={{
                      ...inputStyle,
                      height: 46,
                      paddingRight: 10,
                    }}
                  >
                    <option value="">Seleziona materiale…</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={row.quantity_per_session}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      setMaterialRows(prev => prev.map((r, i) => (i === idx ? { ...r, quantity_per_session: val } : r)));
                    }}
                    placeholder="Q.tà"
                    style={{ ...inputStyle, height: 46 }}
                  />
                  <button
                    type="button"
                    onClick={() => setMaterialRows(prev => prev.filter((_, i) => i !== idx))}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: 'none',
                      background: C.redBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    aria-label="Rimuovi materiale"
                  >
                    <Trash2 size={16} color={C.red} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setMaterialRows(prev => [...prev, { material_id: '', quantity_per_session: '1' }])
                }
                style={{
                  marginTop: 4,
                  height: 44,
                  borderRadius: 14,
                  border: `1.5px dashed ${C.border}`,
                  background: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.accent,
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Aggiungi materiale
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button" onClick={onCancel}
              style={{
                flex: 1, height: 52, borderRadius: 17,
                border: `1.5px solid ${C.border}`, background: C.surface,
                fontWeight: 700, fontSize: 15, color: C.text,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2, height: 52, borderRadius: 17, border: 'none',
                background: saving ? C.border : GRAD,
                fontWeight: 800, fontSize: 15,
                color: saving ? C.muted : '#FFF',
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
                boxShadow: saving ? 'none' : '0 4px 18px rgba(192,120,80,0.38)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving
                ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: 10,
                    }}
                  />
                )
                : <> {entry ? 'Aggiorna' : 'Aggiungi'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete sheet ─────────────────────────────────────────────────────────────
function DeleteSheet({
  entry, onConfirm, onCancel,
}: {
  entry: TreatmentCatalogEntry; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(44,28,20,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, margin: '0 auto',
          background: C.surface, borderRadius: '28px 28px 0 0',
          padding: '0 20px calc(32px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: C.border }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 22,
            background: C.redBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={28} color={C.red} />
          </div>
        </div>
        <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, color: C.text }}>
          Elimina trattamento
        </p>
        <p style={{ textAlign: 'center', fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
          Vuoi eliminare <strong style={{ color: C.text }}>"{entry.name}"</strong>?<br />
          La voce non sarà più disponibile nei nuovi appuntamenti.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            type="button" onClick={onCancel}
            style={{
              flex: 1, height: 52, borderRadius: 17,
              border: `1.5px solid ${C.border}`, background: C.surface,
              fontWeight: 700, fontSize: 15, color: C.text,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Annulla
          </button>
          <button
            type="button" onClick={onConfirm}
            style={{
              flex: 1, height: 52, borderRadius: 17, border: 'none',
              background: C.red, fontWeight: 800, fontSize: 15, color: '#FFF',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 18px rgba(239,68,68,0.3)',
            }}
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ListinoPage() {
  const { treatmentCatalogService, materialService, treatmentMaterialsService } = useSupabaseServices();
  const { appType } = useApp();

  const [entries,      setEntries]      = useState<TreatmentCatalogEntry[]>([]);
  const [materials,    setMaterials]    = useState<Material[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showSheet,    setShowSheet]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<TreatmentCatalogEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TreatmentCatalogEntry | null>(null);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);
  const [editMaterialsConfig, setEditMaterialsConfig] =
    useState<Array<{ material_id: string; quantity_per_session: number }>>([]);

  const loadEntries = async () => {
    try {
      setLoading(true); setError(null);
      const [entriesData, materialsData] = await Promise.all([
        treatmentCatalogService.getAllByAppType(appType),
        materialService.getAll(),
      ]);
      setEntries(entriesData);
      setMaterials(materialsData);
    } catch {
      setError('Errore nel caricamento del listino.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [appType]);

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async (payload: {
    name: string;
    base_price: number;
    duration_minutes: number;
    sort_order: number;
    materials: { material_id: string; quantity_per_session: number }[];
  }) => {
    if (editTarget) {
      await treatmentCatalogService.update(editTarget.id, {
        name: payload.name,
        base_price: payload.base_price,
        duration_minutes: payload.duration_minutes,
        sort_order: payload.sort_order,
      });
      await treatmentMaterialsService.replaceForTreatment(editTarget.id, payload.materials);
      showToast('Trattamento aggiornato');
    } else {
      const created = await treatmentCatalogService.create({
        app_type: appType,
        name: payload.name,
        base_price: payload.base_price,
        duration_minutes: payload.duration_minutes,
        sort_order: payload.sort_order,
      });
      if (payload.materials.length > 0) {
        await treatmentMaterialsService.replaceForTreatment(created.id, payload.materials);
      }
      showToast('Trattamento aggiunto');
    }
    await loadEntries();
    setShowSheet(false);
    setEditTarget(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await treatmentCatalogService.delete(deleteTarget.id);
      showToast('Trattamento eliminato');
      await loadEntries();
    } catch {
      setError("Errore nell'eliminazione.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────
  const handleMove = async (entry: TreatmentCatalogEntry, dir: 'up' | 'down') => {
    const idx = entries.findIndex(e => e.id === entry.id);
    if (dir === 'up'   && idx === 0) return;
    if (dir === 'down' && idx === entries.length - 1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const swapEntry = entries[swapIdx];
    try {
      await Promise.all([
        treatmentCatalogService.update(entry.id,    { sort_order: swapEntry.sort_order }),
        treatmentCatalogService.update(swapEntry.id, { sort_order: entry.sort_order }),
      ]);
      await loadEntries();
    } catch {
      setError('Errore nel riordinamento.');
    }
  };

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2200);
  };

  if (loading) return <FullPageLoader message="Caricamento listino..." />;

  const totalRevenuePotential = entries.reduce((sum, e) => sum + e.base_price, 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageHeader
        title="Listino prezzi"
        showBack
        backLabel="Indietro"
        rightAction={{
          type: 'icon', icon: Plus, ariaLabel: 'Aggiungi trattamento',
          onClick: () => { setEditTarget(null); setShowSheet(true); },
        }}
      />

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 100px' }} className="safe-area-content-below-header">

        {/* Error */}
        {error && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 16, padding: '12px 16px', borderRadius: 16,
              background: C.redBg, border: `1.5px solid rgba(239,68,68,0.3)`,
              fontSize: 14, color: C.red, fontWeight: 600,
            }}
          >
            <AlertCircle size={16} />
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" onClick={() => setError(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={14} color={C.red} />
            </button>
          </div>
        )}

        {/* Summary stats */}
        {entries.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {/* Count */}
            <div style={{
              background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 20, padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              position: 'relative', overflow: 'hidden',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>
                Trattamenti
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1.1, marginTop: 4 }}>
                {entries.length}
              </p>
              <div style={{
                position: 'absolute', right: 10, bottom: 10,
                width: 34, height: 34, borderRadius: 11,
                background: C.accentSft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={16} color={C.accent} />
              </div>
            </div>
            {/* Avg price */}
            <div style={{
              background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 20, padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              position: 'relative', overflow: 'hidden',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>
                Prezzo medio
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, color: C.accent, lineHeight: 1.1, marginTop: 4 }}>
                €{(totalRevenuePotential / entries.length).toFixed(0)}
              </p>
              <div style={{
                position: 'absolute', right: 10, bottom: 10,
                width: 34, height: 34, borderRadius: 11,
                background: C.accentSft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Euro size={16} color={C.accent} />
              </div>
            </div>
          </div>
        )}

        {/* Intro text */}
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          Gestisci il tuo listino prezzi. I dati vengono usati nel form appuntamenti per pre-compilare prezzo e durata.
        </p>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Trattamenti</p>
          {entries.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 100,
              background: C.accentSft, color: C.accent,
            }}>
              {entries.length} voci
            </span>
          )}
        </div>

        {/* Empty state */}
        {entries.length === 0 ? (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '52px 24px',
              borderRadius: 28, border: `2px dashed ${C.border}`,
              background: C.surface, textAlign: 'center',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 24,
              background: C.accentSft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Sparkles size={32} color={C.accent} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: C.text }}>Listino vuoto</p>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 8, maxWidth: 260, lineHeight: 1.6 }}>
              Aggiungi i tuoi trattamenti con prezzi e durate per velocizzare la creazione degli appuntamenti.
            </p>
            <button
              type="button"
              onClick={() => { setEditTarget(null); setShowSheet(true); }}
              style={{
                marginTop: 24, height: 52, padding: '0 28px',
                borderRadius: 17, border: 'none', background: GRAD,
                fontWeight: 800, fontSize: 15, color: '#FFF',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 20px rgba(192,120,80,0.35)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Plus size={18} /> Aggiungi trattamento
            </button>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((entry, i) => (
              <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={i}
                  total={entries.length}
                  onEdit={async e => {
                    setEditTarget(e);
                    setEditMaterialsConfig([]);
                    setShowSheet(true);
                    try {
                      const links = await treatmentMaterialsService.getByTreatmentCatalogId(e.id);
                      setEditMaterialsConfig(
                        links.map(l => ({
                          material_id: l.material_id,
                          quantity_per_session: l.quantity_per_session,
                        })),
                      );
                    } catch {
                      // se fallisce il fetch, manteniamo semplicemente nessun materiale pre-configurato
                    }
                  }}
                  onDelete={setDeleteTarget}
                  onMoveUp={e => handleMove(e, 'up')}
                  onMoveDown={e => handleMove(e, 'down')}
                />
              ))}
          </ul>
        )}
      </main>

      {/* Fullscreen white success overlay instead of toast */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={54} color={C.ok} strokeWidth={3} style={{ marginBottom: 24 }} />
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.text,
              textAlign: 'center',
              whiteSpace: 'pre-line',
              maxWidth: 400,
              letterSpacing: 0.01,
            }}
          >
            {successMsg}
          </span>
        </div>
      )}

      {/* Sheets */}
      {showSheet && (
        <EntrySheet
            entry={editTarget}
            materials={materials}
            initialMaterialsConfig={editTarget ? editMaterialsConfig : []}
            onSave={handleSave}
            onCancel={() => { setShowSheet(false); setEditTarget(null); setEditMaterialsConfig([]); }}
          />
      )}

      {deleteTarget && (
        <DeleteSheet
          entry={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}