import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { Calendar, Clock, Check, StickyNote } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';
import type { Appointment } from '../types';
import { formatDateForDatabase, formatDateForDisplay } from '../lib/utils';
import { makePersonalAppointment } from '../lib/personalEvents';
import PageHeader from './PageHeader';

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

  const [startDate, setStartDate] = useState<Dayjs>(selectedDate ?? dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(selectedDate ?? dayjs());
  const [time, setTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const isEditing = useMemo(() => Boolean(commitment?.id), [commitment?.id]);

  useEffect(() => {
    if (!commitment) return;
    const base = dayjs(commitment.data);
    setStartDate(base);
    setEndDate(commitment.end_date ? dayjs(commitment.end_date) : base);
    setTime(commitment.ora ?? '');
    setAllDay(!commitment.ora);
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
    if (endDate && endDate.isBefore(startDate, 'day')) {
      setError('La data di fine non può essere precedente alla data di inizio.');
      return;
    }

    try {
      const startForDb = formatDateForDatabase(startDate) || startDate.format('YYYY-MM-DD');
      const effectiveEnd = endDate ?? startDate;
      const endForDb = formatDateForDatabase(effectiveEnd) || effectiveEnd.format('YYYY-MM-DD');
      const next = makePersonalAppointment({
        id: commitment?.id,
        date: startForDb,
        endDate: endForDb,
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
      className="min-h-screen flex flex-col min-h-0 flex-1"
      style={{ backgroundColor: appType === 'isabellenails' ? '#F7F3FA' : '#faede0' }}
    >
      <div
        style={{
          height: 'env(safe-area-inset-top, 0px)',
          minHeight: 'env(safe-area-inset-top, 0px)',
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
        }}
      />

      <PageHeader
        title={isEditing ? 'Impegno personale' : 'Impegno personale'}
        showBack
        onBack={onCancel}
        backLabel="Annulla"
        rightAction={{ type: 'label', label: loading ? '...' : 'Salva', formId: 'personal-commitment-form', disabled: loading }}
        skipSafeAreaTop
      />

      <div className="px-4 py-6 flex-1 min-h-0 overflow-y-auto">
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
                  Periodo
                </span>
                <div className="mt-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex-1">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">
                        Dal
                      </span>
                      <input
                        type="date"
                        value={startDate.format('YYYY-MM-DD')}
                        onChange={(e) => {
                          const nextStart = dayjs(e.target.value);
                          setStartDate(nextStart);
                          setEndDate((prev) => {
                            if (!prev || nextStart.isAfter(prev, 'day')) {
                              return nextStart;
                            }
                            return prev;
                          });
                        }}
                        className="w-[90%] px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">
                        Al
                      </span>
                      <input
                        type="date"
                        value={endDate ? endDate.format('YYYY-MM-DD') : ''}
                        min={startDate.format('YYYY-MM-DD')}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!raw) {
                            setEndDate(startDate);
                            return;
                          }
                          const nextEnd = dayjs(raw);
                          setEndDate(nextEnd.isBefore(startDate, 'day') ? startDate : nextEnd);
                        }}
                        className="w-[90%] px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
                        required
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {endDate && !endDate.isSame(startDate, 'day')
                      ? `Dal ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`
                      : formatDateForDisplay(startDate)}
                  </p>
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
                    disabled={allDay}
                    className="w-full w-[90%] px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAllDay(checked);
                        if (checked) {
                          setTime('');
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-300"
                    />
                    <span>Impegno per l&apos;intera giornata</span>
                  </label>
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
                  {startDate.format('DD MMM YYYY')}
                  {endDate && !endDate.isSame(startDate, 'day') ? ` – ${endDate.format('DD MMM YYYY')}` : ''}
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

