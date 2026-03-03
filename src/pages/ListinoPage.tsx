import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Sparkles,
  AlertCircle,
  X,
  Euro,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FullPageLoader from '../components/FullPageLoader';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import type { TreatmentCatalogEntry } from '../types';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';

export default function ListinoPage() {
  const { treatmentCatalogService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const [entries, setEntries] = useState<TreatmentCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /** Form per nuova voce */
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newDuration, setNewDuration] = useState<string>('60');
  const [newSortOrder, setNewSortOrder] = useState<string>('0');
  const [adding, setAdding] = useState(false);

  /** Edit locale prima di salvare */
  const [editDraft, setEditDraft] = useState<Record<string, Partial<Pick<TreatmentCatalogEntry, 'name' | 'base_price' | 'duration_minutes' | 'sort_order'>>>>({});

  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const surfaceColor = '#FFFFFF';
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await treatmentCatalogService.getAllByAppType(appType);
      setEntries(data);
      setEditDraft({});
    } catch (err) {
      setError("Errore nel caricamento del listino.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [appType]);

  const getRowValues = (entry: TreatmentCatalogEntry) => {
    const draft = editDraft[entry.id];
    return {
      name: draft?.name ?? entry.name,
      base_price: draft?.base_price ?? entry.base_price,
      duration_minutes: draft?.duration_minutes ?? entry.duration_minutes,
      sort_order: draft?.sort_order ?? entry.sort_order,
    };
  };

  const setRowDraft = (id: string, field: keyof TreatmentCatalogEntry, value: string | number) => {
    setEditDraft((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveRow = async (entry: TreatmentCatalogEntry) => {
    const draft = editDraft[entry.id];
    if (!draft || Object.keys(draft).length === 0) return;
    try {
      setSavingId(entry.id);
      await treatmentCatalogService.update(entry.id, draft);
      setEditDraft((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
      await loadEntries();
    } catch {
      setError("Errore nel salvataggio della voce.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (entry: TreatmentCatalogEntry) => {
    if (!window.confirm(`Eliminare "${entry.name}" dal listino?`)) return;
    try {
      setDeletingId(entry.id);
      await treatmentCatalogService.delete(entry.id);
      await loadEntries();
    } catch {
      setError("Errore nell'eliminazione.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    const price = Number.parseFloat(newPrice);
    const duration = Math.max(1, Math.floor(Number(newDuration) || 60));
    const sortOrder = Math.floor(Number(newSortOrder) || 0);
    if (!name || Number.isNaN(price) || price < 0) {
      setError("Inserisci nome e prezzo base (≥ 0).");
      return;
    }
    try {
      setAdding(true);
      setError(null);
      await treatmentCatalogService.create({
        app_type: appType,
        name,
        base_price: price,
        duration_minutes: duration,
        sort_order: sortOrder,
      });
      setNewName('');
      setNewPrice('');
      setNewDuration('60');
      setNewSortOrder('0');
      await loadEntries();
    } catch {
      setError("Errore nell'aggiunta della voce.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <FullPageLoader message="Caricamento listino..." />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader title="Listino prezzi" showBack backLabel="Indietro" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button type="button" onClick={() => setError(null)} className="p-1 text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <p className="text-sm mb-6" style={{ color: textSecondaryColor }}>
          Modifica prezzi base e durate stimate per i tipi di trattamento. Usati in creazione appuntamento e nel profilo cliente.
        </p>

        {/* Aggiungi voce */}
        <div
          className="rounded-2xl border p-4 sm:p-6 mb-6"
          style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: textPrimaryColor }}>
            Aggiungi nuovo trattamento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textSecondaryColor }}>Nome</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Es. Extension One to One"
                aria-label="Nome del trattamento"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textSecondaryColor }}>Prezzo base (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Es. 45"
                aria-label="Prezzo base in euro"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textSecondaryColor }}>Durata (min)</label>
              <input
                type="number"
                min="1"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Es. 60"
                aria-label="Durata in minuti"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: textSecondaryColor }}>Ordine</label>
              <input
                type="number"
                min="0"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(e.target.value)}
                placeholder="0 = primo in lista"
                aria-label="Ordine di visualizzazione nella lista"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl disabled:opacity-50"
              style={{ background: accentGradient }}
            >
              {adding ? 'Aggiunta...' : 'Aggiungi'}
            </button>
          </div>
        </div>

        {/* Elenco voci */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
        >
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: accentSofter }}>
            <h2 className="text-lg font-semibold" style={{ color: textPrimaryColor }}>
              Trattamenti in lista ({entries.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {/* Intestazione colonne: visibile su schermi medi e grandi */}
            {entries.length > 0 && (
              <div
                className="hidden sm:grid sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 border-b"
                style={{ borderColor: accentSofter }}
              >
                <div className="sm:col-span-4 text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                  Nome trattamento
                </div>
                <div className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                  Prezzo (€)
                </div>
                <div className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                  Durata (min)
                </div>
                <div className="sm:col-span-1 text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                  Ordine
                </div>
                <div className="sm:col-span-3 text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                  Azioni
                </div>
              </div>
            )}
            <div className="divide-y" style={{ borderColor: accentSofter }}>
              {entries.length === 0 ? (
                <div className="p-8 text-center" style={{ color: textSecondaryColor }}>
                  Nessuna voce. Aggiungine una sopra.
                </div>
              ) : (
                entries.map((entry) => {
                  const values = getRowValues(entry);
                  const hasDraft = editDraft[entry.id] && Object.keys(editDraft[entry.id] ?? {}).length > 0;
                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 p-4 items-end sm:items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-medium mb-1 sm:mb-0 sm:sr-only" style={{ color: textSecondaryColor }}>
                          Nome trattamento
                        </label>
                        <input
                          type="text"
                          value={values.name}
                          onChange={(e) => setRowDraft(entry.id, 'name', e.target.value)}
                          placeholder="Nome del trattamento"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          aria-label="Nome trattamento"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium mb-1 sm:mb-0 sm:sr-only" style={{ color: textSecondaryColor }}>
                          Prezzo (€)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={values.base_price}
                          onChange={(e) => setRowDraft(entry.id, 'base_price', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          aria-label="Prezzo in euro"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium mb-1 sm:mb-0 sm:sr-only" style={{ color: textSecondaryColor }}>
                          Durata (minuti)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={values.duration_minutes}
                          onChange={(e) => setRowDraft(entry.id, 'duration_minutes', Math.max(1, Number(e.target.value) || 60))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          aria-label="Durata in minuti"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium mb-1 sm:mb-0 sm:sr-only" style={{ color: textSecondaryColor }}>
                          Ordine in lista
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={values.sort_order}
                          onChange={(e) => setRowDraft(entry.id, 'sort_order', Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          aria-label="Ordine di visualizzazione"
                        />
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRow(entry)}
                        disabled={!hasDraft || savingId === entry.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        style={hasDraft ? { background: accentGradient } : { backgroundColor: '#9ca3af' }}
                        title="Salva modifiche"
                      >
                        <Save className="w-4 h-4" />
                        {savingId === entry.id ? '...' : 'Salva'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        disabled={deletingId === entry.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50"
                        title="Elimina"
                        aria-label={`Elimina ${entry.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
