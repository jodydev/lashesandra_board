import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { Calendar, Clock, Check, StickyNote } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';
import type { Appointment } from '../types';
import { formatDateForDatabase, formatDateForDisplay } from '../lib/utils';
import { makePersonalAppointment } from '../lib/personalEvents';

dayjs.locale('it');

interface PersonalCommitmentFormProps {
  readonly commitment?: Appointment | null;
  readonly selectedDate?: Dayjs | null;
  readonly onSave: (appointment: Appointment) => void;
  readonly onCancel: () => void;
}

export default function PersonalCommitmentForm({
  commitment,
  selectedDate,
  onSave,
  onCancel,
}: PersonalCommitmentFormProps) {
  const { appType } = useApp();
  const colors = useAppColors();

  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<Dayjs>(selectedDate ?? dayjs());
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const isEditing = useMemo(() => Boolean(commitment?.id), [commitment?.id]);

  useEffect(() => {
    if (!commitment) return;
    setDate(dayjs(commitment.data));
    setTime(commitment.ora ?? '');
    setTitle(commitment.tipo_trattamento ?? '');
    // Nota: usiamo una riga di testo nel titolo se vuoi estenderlo.
    setNote('');
  }, [commitment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Inserisci un titolo per l’impegno.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dateForDb = formatDateForDatabase(date) || date.format('YYYY-MM-DD');
      const next = makePersonalAppointment({
        id: commitment?.id,
        date: dateForDb,
        time: time || undefined,
        title: title.trim(),
        createdAt: commitment?.created_at,
      });

      onSave(next);
    } catch {
      setError('Errore nel salvataggio dell’impegno personale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col bg-white relative"
      style={{ backgroundColor: appType === 'isabellenails' ? '#F7F3FA' : '#ffffff' }}
    >
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 pt-14 border-b border-gray-100 flex-shrink-0 bg-white">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-1 font-medium disabled:opacity-50"
          style={{ color: colors.primary }}
        >
          <span className="text-lg leading-none" aria-hidden>‹</span> Annulla
        </button>
        <h1 className="text-lg font-bold text-gray-900">
          {isEditing ? 'Modifica impegno personale' : 'Nuovo impegno personale'}
        </h1>
        <button
          type="submit"
          form="personal-commitment-form"
          disabled={loading}
          className="shrink-0 text-sm font-semibold disabled:opacity-50"
          style={{ color: colors.primary }}
        >
          {loading ? '...' : 'Salva'}
        </button>
      </header>

      <div className="pt-32 px-4 pb-6 flex-1 min-h-0 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <form id="personal-commitment-form" onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: accentSofter }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: accentSofter }}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Dettagli</h2>
            </div>

            <div className="p-4 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data
                </span>
                <div className="mt-2">
                  <input
                    type="date"
                    value={date.format('YYYY-MM-DD')}
                    onChange={(e) => setDate(dayjs(e.target.value))}
                    className="w-full max-w-[320px] px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">{formatDateForDisplay(date)}</p>
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Orario (opzionale)
                </span>
                <div className="mt-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full max-w-[320px] px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Titolo
                </span>
                <div className="mt-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es. Dentista, palestra, commissioni…"
                    className="w-full px-3 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Nota (facoltativa)
                </span>
                <div className="mt-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="(opzionale)"
                    className="w-full min-h-[92px] px-3 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: accentSofter }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: accentSofter }}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Anteprima</h2>
            </div>
            <div className="p-4">
              <div
                className="rounded-xl p-3 border"
                style={{
                  borderColor: colors.primary,
                  borderStyle: 'dashed',
                  background: `linear-gradient(180deg, ${accentSofter}, #FFFFFF)`,
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Personale</p>
                <p className="mt-1 text-base font-bold text-gray-900 truncate">
                  {title.trim() || 'Impegno personale'}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {date.format('DD MMM YYYY')}
                  {time ? ` · ${time}` : ''}
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg disabled:opacity-50"
                  style={{ background: accentGradient }}
                >
                  Salva impegno personale
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}

