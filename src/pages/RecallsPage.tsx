import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { useRecallList } from '../hooks/useRecallList';
import type { Client, Appointment, RecallEntry, RecallFilter } from '../types';
import PageHeader from '../components/PageHeader';
import FullPageLoader from '../components/FullPageLoader';
import { Calendar, Phone, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

dayjs.locale('it');

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

const FILTER_LABELS: Record<RecallFilter | 'all', string> = {
  all: 'Tutti',
  overdue: 'In ritardo',
  this_week: 'Questa settimana',
  next_two_weeks: 'Prossime 2 settimane',
};

export default function RecallsPage() {
  const navigate = useNavigate();
  const { clientService, appointmentService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const appPrefix = appType === 'isabellenails' ? '/isabellenails' : '/lashesandra';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;
  const accentSofter = `${colors.primary}14`;

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RecallFilter | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, a] = await Promise.all([
          clientService.getAll(),
          appointmentService.getAll(),
        ]);
        if (!cancelled) {
          setClients(c);
          setAppointments(a);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('RecallsPage load error:', err);
          setError('Errore nel caricamento. Riprova.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // Esegui solo al mount e al cambio app: i servizi hanno ref instabile (nuovo oggetto ogni render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appType]);

  const { recallList, counts } = useRecallList(clients, appointments);

  const filteredList: RecallEntry[] =
    activeFilter === 'all'
      ? recallList
      : recallList.filter((e) => e.filter === activeFilter);

  const getFilterCount = (key: RecallFilter | 'all') => {
    if (key === 'all') return counts.total;
    if (key === 'overdue') return counts.overdue;
    if (key === 'this_week') return counts.thisWeek;
    return counts.nextTwoWeeks;
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className="min-h-screen w-full pb-6" style={{ backgroundColor }}>
      <PageHeader title="Clienti da richiamare" showBack />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {error && (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <p className="mb-4 text-sm font-semibold" style={{ color: textSecondaryColor }}>
          Prossimo refill consigliato 3 settimane dopo l&apos;ultimo trattamento.
        </p>

        {/* Filtri */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {(['all', 'overdue', 'this_week', 'next_two_weeks'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className="flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
              style={{
                backgroundColor: activeFilter === key ? accentColor : surfaceColor,
                color: activeFilter === key ? '#fff' : textPrimaryColor,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: activeFilter === key ? accentColor : accentSofter,
              }}
            >
              {FILTER_LABELS[key]}
              <span className="ml-1.5 opacity-90">({getFilterCount(key)})</span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {filteredList.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-8 text-center"
            style={{ borderColor: accentSofter, backgroundColor: surfaceColor }}
          >
            <Calendar className="mx-auto mb-3 h-12 w-12" style={{ color: textSecondaryColor }} />
            <p className="text-sm font-medium" style={{ color: textPrimaryColor }}>
              Nessun cliente in questa fascia
            </p>
            <p className="mt-1 text-xs" style={{ color: textSecondaryColor }}>
              {activeFilter === 'all'
                ? 'Non ci sono clienti con refill consigliato nelle prossime 2 settimane o in ritardo.'
                : `Prova un altro filtro o aggiungi appuntamenti completati.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredList.map((entry) => (
              <li key={entry.client.id}>
                <RecallCard entry={entry} onPrenota={() => navigate(`${appPrefix}/appointments`)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RecallCard({
  entry,
  onPrenota,
}: {
  readonly entry: RecallEntry;
  readonly onPrenota: () => void;
}) {
  const colors = useAppColors();
  const accentColor = colors.primary;
  const accentSofter = `${colors.primary}14`;
  const isOverdue = entry.filter === 'overdue';

  return (
    <div
      className="rounded-xl border p-4 shadow-sm transition"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate" style={{ color: textPrimaryColor }}>
              {entry.client.nome} {entry.client.cognome}
            </p>
            {isOverdue && (
              <span
                className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                title="Refill in ritardo"
              >
                In ritardo
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: textSecondaryColor }}>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Ultimo: {dayjs(entry.lastAppointmentDate).format('D MMM YYYY')}
              {entry.lastAppointmentTreatment && ` • ${entry.lastAppointmentTreatment}`}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium" style={{ color: colors.primary }}>
            Refill consigliato: {dayjs(entry.suggestedRefillDate).format('D MMM YYYY')}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {entry.client.telefono && (
            <a
              href={`tel:${entry.client.telefono.replaceAll(/\s/g, '')}`}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
              style={{ backgroundColor: accentSofter, color: accentColor }}
              aria-label={`Chiama ${entry.client.nome}`}
            >
              <Phone className="h-4 w-4" />
              Chiama
            </a>
          )}
          <button
            type="button"
            onClick={onPrenota}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-95"
            style={{ background: colors.cssGradient }}
          >
            Prenota
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
