import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, Package, AlertTriangle,
  X, CheckCircle2, Layers, ChevronRight, Search,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FullPageLoader from '../components/FullPageLoader';
import { useSupabaseServices } from '../lib/supabaseService';
import { useApp } from '../contexts/AppContext';
import type { Material } from '../types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:        '#FAF0E8',
  surface:   '#FFFFFF',
  accent:    '#C07850',
  accentDk:  '#A05830',
  accentSft: 'rgba(192,120,80,0.10)',
  accentMid: 'rgba(192,120,80,0.20)',
  border:    '#EDE0D8',
  text:      '#2C2C2C',
  muted:     '#9A8880',
  warn:      '#F59E0B',
  warnBg:    '#FFFBEB',
  warnBdr:   'rgba(245,158,11,0.35)',
  ok:        '#22C55E',
  okBg:      '#F0FDF4',
  red:       '#EF4444',
  redBg:     '#FEF2F2',
} as const;

const GRAD = `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isBelowThreshold(m: Material) {
  return m.quantity !== null && m.threshold !== null && m.quantity < m.threshold;
}

function StockBar(props: Readonly<{ ratio: number; below: boolean }>) {
  const { ratio, below } = props;
  return (
    <div style={{ height: 5, borderRadius: 100, background: '#F0E8E0', overflow: 'hidden', marginTop: 8 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, ratio * 100)}%` }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{ height: '100%', borderRadius: 100, background: below ? C.warn : C.ok }}
      />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard(props: Readonly<{
  label: string;
  value: number;
  icon: React.ElementType;
  warn?: boolean;
  ok?: boolean;
}>) {
  const { label, value, icon: Icon, warn, ok } = props;
  const bg     = warn ? C.warnBg  : ok ? C.okBg  : C.surface;
  const border = warn ? C.warnBdr : ok ? 'rgba(34,197,94,0.25)' : C.border;
  const iconBg = warn ? 'rgba(245,158,11,0.18)' : ok ? 'rgba(34,197,94,0.15)' : C.accentSft;
  const iconCl = warn ? C.warn    : ok ? C.ok    : C.accent;
  const valCl  = warn ? '#B45309' : ok ? '#15803D' : C.text;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      style={{
        background: bg, border: `1.5px solid ${border}`,
        borderRadius: 20, padding: '14px 14px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color: valCl, lineHeight: 1.1, marginTop: 4 }}>{value}</p>
      <div style={{
        position: 'absolute', right: 10, bottom: 10,
        width: 34, height: 34, borderRadius: 11,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={iconCl} strokeWidth={2} />
      </div>
    </motion.div>
  );
}

// ─── Material card ────────────────────────────────────────────────────────────
function MaterialCard(props: Readonly<{
  m: Material;
  sessionsLeft?: number | null;
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
}>) {
  const { m, sessionsLeft, onEdit, onDelete } = props;
  const below = isBelowThreshold(m);
  const hasBar = m.quantity !== null && m.threshold !== null && m.threshold > 0;
  const ratio = hasBar ? m.quantity! / m.threshold! : 1;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      style={{
        background: C.surface,
        border: `1.5px solid ${below ? C.warnBdr : C.border}`,
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: below
          ? '0 2px 16px rgba(245,158,11,0.10)'
          : '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left accent stripe for below-threshold */}
      {below && (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.warn}, transparent)` }} />
      )}

      <div style={{ padding: '14px 14px 14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 46, height: 46, borderRadius: 15, flexShrink: 0,
          background: below ? 'rgba(245,158,11,0.12)' : C.accentSft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18,
          color: below ? '#B45309' : C.accent,
        }}>
          {m.name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{m.name}</p>
            {below && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(245,158,11,0.15)', borderRadius: 100,
                padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#B45309',
              }}>
                <AlertTriangle size={10} /> Sotto soglia
              </span>
            )}
          </div>

          {/* Qty / threshold */}
          <div style={{ display: 'flex', gap: 16, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: C.muted }}>
              Quantità:{' '}
              {m.quantity !== null
                ? <strong style={{ color: C.text, fontWeight: 700 }}>{m.quantity}</strong>
                : <em style={{ color: C.muted }}>—</em>
              }
            </span>
            {m.threshold != null && (
              <span style={{ fontSize: 13, color: C.muted }}>
                Soglia:{' '}
                <strong style={{ color: C.text, fontWeight: 700 }}>{m.threshold}</strong>
              </span>
            )}
            {sessionsLeft != null && (
              <span style={{ fontSize: 13, color: C.muted }}>
                Sedute possibili:{' '}
                <strong style={{ color: C.text, fontWeight: 700 }}>{sessionsLeft}</strong>
              </span>
            )}
          </div>

          {/* Progress bar */}
          {hasBar && <StockBar ratio={ratio} below={below} />}

          {/* Notes */}
          {m.notes && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{m.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onEdit(m)}
            aria-label="Modifica"
            style={{
              width: 36, height: 36, borderRadius: 12,
              background: C.accentSft, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Edit3 size={16} color={C.accent} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(m)}
            aria-label="Elimina"
            style={{
              width: 36, height: 36, borderRadius: 12,
              background: C.redBg, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={16} color={C.red} />
          </button>
        </div>
      </div>
    </motion.li>
  );
}

// ─── Form bottom sheet ────────────────────────────────────────────────────────
function MaterialSheet(props: Readonly<{
  material: Material | null;
  onSave: (payload: { name: string; quantity: number | null; threshold: number | null; notes: string | null }) => Promise<void>;
  onCancel: () => void;
}>) {
  const { material, onSave, onCancel } = props;
  const [name, setName] = useState(material?.name ?? '');
  const [qtyStr, setQtyStr] = useState(material?.quantity != null ? String(material.quantity) : '');
  const [thrStr, setThrStr] = useState(material?.threshold != null ? String(material.threshold) : '');
  const [notes, setNotes] = useState(material?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    height: 52, padding: '0 16px',
    borderRadius: 16, border: `1.5px solid ${C.border}`,
    background: '#FAFAFA', fontSize: 15, color: C.text,
    fontFamily: 'inherit', outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) { setErr('Il nome è obbligatorio.'); return; }
    const q = qtyStr.trim() === '' ? null : Number.parseInt(qtyStr, 10);
    const t = thrStr.trim() === '' ? null : Number.parseInt(thrStr, 10);
    if (qtyStr.trim() !== '' && (Number.isNaN(q!) || q! < 0)) { setErr('Quantità non valida.'); return; }
    if (thrStr.trim() !== '' && (Number.isNaN(t!) || t! < 0)) { setErr('Soglia non valida.'); return; }
    setErr(null); setSaving(true);
    try { await onSave({ name: n, quantity: q, threshold: t, notes: notes.trim() || null }); }
    catch { setErr('Errore nel salvataggio.'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(44,28,20,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, margin: '0 auto',
          background: C.surface,
          borderRadius: '28px 28px 0 0',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: C.border }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accent }}>
              Inventario
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 1 }}>
              {material ? 'Modifica materiale' : 'Nuovo materiale'}
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
        <form onSubmit={handleSubmit} style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 14,
              background: C.redBg, border: `1.5px solid rgba(239,68,68,0.3)`,
              fontSize: 13, color: C.red, fontWeight: 600,
            }}>
              <AlertTriangle size={14} /> {err}
            </div>
          )}

          {/* Name */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
              Nome *
            </p>
            <input
              type="text"
              value={name}
              autoFocus
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="es. Ciglia C-curl 0.10, Colla Strong…"
              style={inputStyle}
            />
          </div>

          {/* Qty + Threshold */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
                Quantità
              </p>
              <input
                type="number" min={0}
                value={qtyStr}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQtyStr(e.target.value)}
                placeholder="—"
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Vuoto = In stock</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
                Soglia alert
              </p>
              <input
                type="number" min={0}
                value={thrStr}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThrStr(e.target.value)}
                placeholder="—"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
              Note
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Fornitore, codice prodotto, etc."
              rows={2}
              style={{
                ...inputStyle, height: 'auto',
                padding: '12px 16px', resize: 'none', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
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
            <motion.button
              type="submit"
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 2, height: 52, borderRadius: 17,
                border: 'none',
                background: saving ? C.border : GRAD,
                fontWeight: 800, fontSize: 15, color: saving ? C.muted : '#FFF',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: saving ? 'none' : '0 4px 18px rgba(192,120,80,0.38)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: 10 }}
                  />
                : (material ? 'Aggiorna' : 'Aggiungi')
              }
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete confirm sheet ─────────────────────────────────────────────────────
function DeleteSheet({
  material, onConfirm, onCancel,
}: {
  material: Material; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(44,28,20,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
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

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, marginTop: 8 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 22,
            background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={28} color={C.red} />
          </div>
        </div>

        <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, color: C.text }}>
          Elimina materiale
        </p>
        <p style={{ textAlign: 'center', fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
          Vuoi eliminare <strong style={{ color: C.text }}>{material.name}</strong>?<br />
          Questa azione non può essere annullata.
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
          <motion.button
            type="button" onClick={onConfirm}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, height: 52, borderRadius: 17,
              border: 'none', background: C.red,
              fontWeight: 800, fontSize: 15, color: '#FFF',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 18px rgba(239,68,68,0.3)',
            }}
          >
            Elimina
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InventarioPage() {
  const { materialService, treatmentMaterialsService } = useSupabaseServices();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [search, setSearch] = useState('');
  const [avgPerSessionByMaterial, setAvgPerSessionByMaterial] = useState<Record<string, number>>({});

  const { belowCount, okCount } = useMemo(() => ({
    belowCount: materials.filter(isBelowThreshold).length,
    okCount:    materials.filter(m => !isBelowThreshold(m)).length,
  }), [materials]);

  const filtered = useMemo(() =>
    materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
    [materials, search]
  );

  // Sort: below threshold first
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => (isBelowThreshold(b) ? 1 : 0) - (isBelowThreshold(a) ? 1 : 0)),
    [filtered]
  );

  const loadMaterials = async () => {
    try {
      setLoading(true); setError(null);
      const [materialsData, links] = await Promise.all([
        materialService.getAll(),
        treatmentMaterialsService.getAll(),
      ]);
      setMaterials(materialsData);

      // Calcola consumo medio per seduta per ogni materiale in base alla configurazione dei trattamenti
      const map: Record<string, { total: number; count: number }> = {};
      links.forEach(link => {
        if (!link.material_id || !link.quantity_per_session || link.quantity_per_session <= 0) return;
        const entry = map[link.material_id] ?? { total: 0, count: 0 };
        entry.total += link.quantity_per_session;
        entry.count += 1;
        map[link.material_id] = entry;
      });
      const avgMap: Record<string, number> = {};
      Object.entries(map).forEach(([materialId, stats]) => {
        if (stats.count > 0) {
          avgMap[materialId] = stats.total / stats.count;
        }
      });
      setAvgPerSessionByMaterial(avgMap);
    } catch {
      setError('Errore nel caricamento dell\'inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMaterials(); }, []);

  const handleSave = async (payload: { name: string; quantity: number | null; threshold: number | null; notes: string | null }) => {
    if (editingMaterial) {
      await materialService.update(editingMaterial.id, payload);
    } else {
      await materialService.create({ name: payload.name, quantity: payload.quantity, threshold: payload.threshold, notes: payload.notes });
    }
    await loadMaterials();
    setShowForm(false);
    setEditingMaterial(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await materialService.delete(deleteTarget.id);
      await loadMaterials();
    } catch {
      setError('Errore nell\'eliminazione.');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <FullPageLoader message="Caricamento inventario..." />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageHeader
        title="Inventario"
        showBack
        backLabel="Indietro"
        rightAction={{ type: 'icon', icon: Plus, ariaLabel: 'Aggiungi', onClick: () => { setEditingMaterial(null); setShowForm(true); } }}
      />

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 100px' }} className="safe-area-content-below-header">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 16, padding: '12px 16px', borderRadius: 16,
                background: C.redBg, border: `1.5px solid rgba(239,68,68,0.3)`,
                fontSize: 14, color: C.red, fontWeight: 600,
              }}
            >
              <AlertTriangle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          <StatCard label="Totali"      value={materials.length} icon={Layers}        />
          <StatCard label="Sotto soglia" value={belowCount}       icon={AlertTriangle} warn={belowCount > 0} />
          <StatCard label="OK"           value={okCount}          icon={CheckCircle2}  ok={okCount > 0 && belowCount === 0} />
        </div>

        {/* Warning banner */}
        <AnimatePresence>
          {belowCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 20 }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', borderRadius: 18,
                background: C.warnBg, border: `1.5px solid ${C.warnBdr}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(245,158,11,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={18} color={C.warn} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#78350F' }}>
                    {belowCount} {belowCount === 1 ? 'materiale sotto soglia' : 'materiali sotto soglia'}
                  </p>
                  <p style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                    Controlla le scorte e ordina prima di esaurire le forniture.
                  </p>
                </div>
                <ChevronRight size={16} color="#B45309" style={{ marginTop: 2, flexShrink: 0 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        {materials.length > 4 && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} color={C.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca materiale…"
              style={{
                width: '100%', boxSizing: 'border-box',
                height: 48, paddingLeft: 44, paddingRight: 16,
                borderRadius: 16, border: `1.5px solid ${C.border}`,
                background: C.surface, fontSize: 15, color: C.text,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
        )}

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: C.text }}>
            {search ? `Risultati (${sorted.length})` : 'Elenco materiali'}
          </p>
          {materials.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 100,
              background: C.accentSft, color: C.accent,
            }}>
              {materials.length} totali
            </span>
          )}
        </div>

        {/* Empty state */}
        {materials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '52px 24px',
              borderRadius: 28, border: `2px dashed ${C.border}`,
              background: C.surface, textAlign: 'center',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 24,
              background: C.accentSft, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Package size={32} color={C.accent} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: C.text }}>Inventario vuoto</p>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 8, maxWidth: 260, lineHeight: 1.6 }}>
              Aggiungi ciglia, colla, bigodini e tutti i materiali che usi durante le sedute.
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => { setEditingMaterial(null); setShowForm(true); }}
              style={{
                marginTop: 24, height: 52, padding: '0 28px',
                borderRadius: 17, border: 'none', background: GRAD,
                fontWeight: 800, fontSize: 15, color: '#FFF',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 20px rgba(192,120,80,0.35)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Plus size={18} />
              Aggiungi materiale
            </motion.button>
          </motion.div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
            <Search size={28} color={C.border} style={{ marginBottom: 8 }} />
            <p style={{ fontWeight: 600, fontSize: 14 }}>Nessun risultato per "{search}"</p>
          </div>
        ) : (
          <motion.ul
            layout
            style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <AnimatePresence initial={false}>
        {sorted.map(m => {
              const avg = avgPerSessionByMaterial[m.id];
              const sessionsLeft =
                avg && m.quantity != null && avg > 0 ? Math.floor(m.quantity / avg) : null;
              return (
                <MaterialCard
                  key={m.id}
                  m={m}
                  sessionsLeft={sessionsLeft ?? undefined}
                  onEdit={mat => { setEditingMaterial(mat); setShowForm(true); }}
                  onDelete={setDeleteTarget}
                />
              );
            })}
            </AnimatePresence>
          </motion.ul>
        )}
      </main>

      {/* Sheets */}
      <AnimatePresence>
        {showForm && (
          <MaterialSheet
            material={editingMaterial}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingMaterial(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteSheet
            material={deleteTarget}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}