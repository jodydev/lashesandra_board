import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  X,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FullPageLoader from '../components/FullPageLoader';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import type { Material } from '../types';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';

export default function InventarioPage() {
  const { materialService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;
  const accentSoft = `${colors.primary}29`;

  const { belowThresholdCount, okCount } = useMemo(() => {
    const below = materials.filter(
      (m) => m.quantity !== null && m.threshold !== null && m.quantity < m.threshold
    ).length;
    const ok = materials.length - below;
    return { belowThresholdCount: below, okCount: ok };
  }, [materials]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await materialService.getAll();
      setMaterials(data);
    } catch (err) {
      setError('Errore nel caricamento dell\'inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleAdd = () => {
    setEditingMaterial(null);
    setShowForm(true);
  };

  const handleEdit = (m: Material) => {
    setEditingMaterial(m);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMaterial(null);
  };

  const handleDelete = (m: Material) => {
    setMaterialToDelete(m);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    try {
      await materialService.delete(materialToDelete.id);
      await loadMaterials();
      setShowDeleteDialog(false);
      setMaterialToDelete(null);
    } catch {
      setError('Errore nell\'eliminazione.');
    }
  };

  const isBelowThreshold = (m: Material) =>
    m.quantity !== null && m.threshold !== null && m.quantity < m.threshold;

  if (loading) {
    return <FullPageLoader message="Caricamento inventario..." />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader
        title="Inventario"
        showBack
        backLabel="Indietro"
        rightAction={{
          type: 'icon',
          icon: Plus,
          ariaLabel: 'Aggiungi materiale',
          onClick: handleAdd,
        }}
      />

      <main className="mx-auto max-w-lg px-4 pb-8 safe-area-content-below-header">
        {error && (
          <div
            className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Widgets: riepilogo */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ color: textPrimaryColor }}>
              Riepilogo
            </h2>
            <span
              className="rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: accentSofter, color: accentColor }}
            >
              Inventario
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div
              className="relative overflow-hidden rounded-2xl border p-4 shadow-md transition"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                Totali
              </span>
              <p className="mt-1 text-xl font-bold" style={{ color: textPrimaryColor }}>
                {materials.length}
              </p>
              <div
                className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: accentSofter }}
              >
                <Layers className="h-5 w-5" style={{ color: accentColor }} />
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl border p-4 shadow-md transition"
              style={{
                backgroundColor: belowThresholdCount > 0 ? '#fffbeb' : surfaceColor,
                borderColor: belowThresholdCount > 0 ? '#f59e0b' : accentSofter,
              }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                Sotto soglia
              </span>
              <p
                className="mt-1 text-xl font-bold"
                style={{ color: belowThresholdCount > 0 ? '#b45309' : textPrimaryColor }}
              >
                {belowThresholdCount}
              </p>
              <div
                className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: belowThresholdCount > 0 ? 'rgba(245,158,11,0.25)' : accentSofter }}
              >
                <AlertTriangle
                  className="h-5 w-5"
                  style={{ color: belowThresholdCount > 0 ? '#d97706' : accentColor }}
                />
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl border p-4 shadow-md transition"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                A posto
              </span>
              <p className="mt-1 text-xl font-bold" style={{ color: textPrimaryColor }}>
                {okCount}
              </p>
              <div
                className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </section>

        {belowThresholdCount > 0 && (
          <div
            className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 shadow-sm"
            style={{ borderColor: '#f59e0b' }}
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-200/80">
              <AlertTriangle className="h-6 w-6 text-amber-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {belowThresholdCount} materiale/materiali sotto soglia
              </p>
              <p className="text-xs text-amber-800/90">Controlla le scorte e ordina in tempo.</p>
            </div>
          </div>
        )}

        {/* Elenco materiali */}
        <section>
          <h2 className="mb-3 text-base font-bold" style={{ color: textPrimaryColor }}>
            Elenco materiali
          </h2>

          {materials.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 px-6 text-center"
              style={{ borderColor: accentSoft, backgroundColor: surfaceColor }}
            >
              <div
                className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{ backgroundColor: accentSofter }}
              >
                <Package className="h-10 w-10" style={{ color: accentColor }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: textPrimaryColor }}>
                Nessun materiale
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: textSecondaryColor }}>
                Aggiungi ciglia, colla, bigodini, rimuovente e altri materiali per tenere sotto controllo le scorte.
              </p>
              <button
                type="button"
                onClick={handleAdd}
                className="mt-6 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition active:scale-[0.98]"
                style={{ background: accentGradient }}
              >
                Aggiungi materiale
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {materials.map((m) => {
                const below = isBelowThreshold(m);
                const hasThreshold = m.threshold != null && m.quantity != null;
                const ratio = hasThreshold && m.threshold! > 0 ? m.quantity! / m.threshold! : 1;
                return (
                  <li
                    key={m.id}
                    className="overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
                    style={{
                      backgroundColor: surfaceColor,
                      borderColor: below ? 'rgba(245,158,11,0.5)' : accentSofter,
                      borderLeftWidth: below ? 4 : 1,
                      borderLeftColor: below ? '#f59e0b' : undefined,
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                          style={{
                            backgroundColor: below ? 'rgba(245,158,11,0.15)' : accentSofter,
                            color: below ? '#b45309' : accentColor,
                          }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold" style={{ color: textPrimaryColor }}>
                              {m.name}
                            </h3>
                            {below && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Sotto soglia
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: textSecondaryColor }}>
                            <span>
                              Quantità:{' '}
                              {m.quantity !== null ? (
                                <strong style={{ color: textPrimaryColor }}>{m.quantity}</strong>
                              ) : (
                                <em>In stock / Da ordinare</em>
                              )}
                            </span>
                            {m.threshold != null && (
                              <span>
                                Soglia: <strong style={{ color: textPrimaryColor }}>{m.threshold}</strong>
                              </span>
                            )}
                          </div>
                          {hasThreshold && (
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, ratio * 100)}%`,
                                  backgroundColor: below ? '#f59e0b' : '#22c55e',
                                }}
                              />
                            </div>
                          )}
                          {m.notes && (
                            <p className="mt-2 text-xs leading-relaxed" style={{ color: textSecondaryColor }}>
                              {m.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(m)}
                            className="rounded-xl p-2.5 transition hover:opacity-80"
                            style={{ color: accentColor, backgroundColor: accentSofter }}
                            aria-label="Modifica"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            className="rounded-xl p-2.5 text-red-500 transition hover:bg-red-50"
                            aria-label="Elimina"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Form modal (Add / Edit) */}
      {showForm && (
        <MaterialFormModal
          material={editingMaterial}
          onSave={async (payload) => {
            if (editingMaterial) {
              await materialService.update(editingMaterial.id, payload);
            } else {
              await materialService.create({
                name: payload.name,
                quantity: payload.quantity,
                threshold: payload.threshold,
                notes: payload.notes,
              });
            }
            await loadMaterials();
            handleCloseForm();
          }}
          onCancel={handleCloseForm}
          accentGradient={accentGradient}
          accentSofter={accentSofter}
          textPrimaryColor={textPrimaryColor}
          textSecondaryColor={textSecondaryColor}
          surfaceColor={surfaceColor}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteDialog && materialToDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowDeleteDialog(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl shadow-xl"
            style={{ backgroundColor: surfaceColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 id="delete-dialog-title" className="text-lg font-semibold" style={{ color: textPrimaryColor }}>
                Elimina materiale
              </h3>
              <p className="mt-2 text-sm" style={{ color: textSecondaryColor }}>
                Vuoi eliminare &quot;{materialToDelete.name}&quot; dall&apos;inventario?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{ borderColor: accentSofter, color: textPrimaryColor }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MaterialFormModalProps {
  material: Material | null;
  onSave: (payload: { name: string; quantity: number | null; threshold: number | null; notes: string | null }) => Promise<void>;
  onCancel: () => void;
  accentGradient: string;
  accentSofter: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  surfaceColor: string;
}

function MaterialFormModal({
  material,
  onSave,
  onCancel,
  accentGradient,
  accentSofter,
  textPrimaryColor,
  textSecondaryColor,
  surfaceColor,
}: MaterialFormModalProps) {
  const [name, setName] = useState(material?.name ?? '');
  const [quantityStr, setQuantityStr] = useState(
    material?.quantity != null ? String(material.quantity) : ''
  );
  const [thresholdStr, setThresholdStr] = useState(
    material?.threshold != null ? String(material.threshold) : ''
  );
  const [notes, setNotes] = useState(material?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Inserisci il nome del materiale.');
      return;
    }
    const q = quantityStr.trim() === '' ? null : Number.parseInt(quantityStr, 10);
    const t = thresholdStr.trim() === '' ? null : Number.parseInt(thresholdStr, 10);
    if (quantityStr.trim() !== '' && (Number.isNaN(q!) || q! < 0)) {
      setValidationError('Quantità non valida.');
      return;
    }
    if (thresholdStr.trim() !== '' && (Number.isNaN(t!) || t! < 0)) {
      setValidationError('Soglia non valida.');
      return;
    }
    setValidationError(null);
    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        quantity: q,
        threshold: t,
        notes: notes.trim() || null,
      });
    } catch {
      setValidationError('Errore nel salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-form-title"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl shadow-xl"
        style={{ backgroundColor: surfaceColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: accentSofter }}>
          <h2 id="material-form-title" className="text-lg font-semibold" style={{ color: textPrimaryColor }}>
            {material ? 'Modifica materiale' : 'Nuovo materiale'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 transition hover:opacity-80"
            style={{ color: textSecondaryColor }}
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              {validationError}
            </div>
          )}
          <div>
            <label htmlFor="material-name" className="block text-sm font-medium mb-1" style={{ color: textPrimaryColor }}>
              Nome *
            </label>
            <input
              id="material-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Ciglia, Colla, Bigodini..."
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: accentSofter }}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="material-quantity" className="block text-sm font-medium mb-1" style={{ color: textPrimaryColor }}>
                Quantità
              </label>
              <input
                id="material-quantity"
                type="number"
                min={0}
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="—"
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: accentSofter }}
              />
              <p className="mt-1 text-xs" style={{ color: textSecondaryColor }}>
                Lascia vuoto per &quot;In stock / Da ordinare&quot;
              </p>
            </div>
            <div>
              <label htmlFor="material-threshold" className="block text-sm font-medium mb-1" style={{ color: textPrimaryColor }}>
                Soglia alert
              </label>
              <input
                id="material-threshold"
                type="number"
                min={0}
                value={thresholdStr}
                onChange={(e) => setThresholdStr(e.target.value)}
                placeholder="—"
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: accentSofter }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="material-notes" className="block text-sm font-medium mb-1" style={{ color: textPrimaryColor }}>
              Note
            </label>
            <textarea
              id="material-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opzionale"
              rows={2}
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: accentSofter }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
              style={{ borderColor: accentSofter, color: textPrimaryColor }}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              style={{ background: accentGradient }}
            >
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
