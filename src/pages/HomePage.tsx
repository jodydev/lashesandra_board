import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useAppointmentNotifications } from '../hooks/useAppointmentNotifications';
import { useApp } from '../contexts/AppContext';
import type { Client, Appointment } from '../types';
import { formatCurrency } from '../lib/utils';
import dayjs from 'dayjs';
import {
  Users,
  Calendar,
  BarChart3,
  Plus,
  TrendingUp,
  Euro,
  Bell,
  X,
  Heart,
  Smile,
  Sparkles,
} from 'lucide-react';
import FullPageLoader from '../components/FullPageLoader';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

export default function HomePage() {
  const navigate = useNavigate();
  const { clientService, appointmentService } = useSupabaseServices();
  const { appType, appName } = useApp();
  const colors = useAppColors();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;
  const accentDark = colors.primaryDark;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;
  const appPrefix = appType === 'isabellenails' ? '/isabellenails' : '/lashesandra';
  const { notifications } = useAppointmentNotifications();

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoveDialog, setShowLoveDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [clientsData, appointmentsData] = await Promise.all([
          clientService.getAll(),
          appointmentService.getAll(),
        ]);
        if (!cancelled) {
          setClients(clientsData);
          setAppointments(appointmentsData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading data:', err);
          setError('Errore nel caricamento dei dati. Riprova più tardi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
    // Esegui solo al mount e al cambio app (tablePrefix). I servizi sono instabili (nuovo ref ogni render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appType]);

  const { stats, nextAppointment } = useMemo(() => {
    const now = dayjs();
    const currentMonth = now;
    const previousMonth = currentMonth.subtract(1, 'month');
    // Solo appuntamenti confermati (completati) dalla pagina di conferma contano per entrate e conteggi
    const completedOnly = (apt: Appointment) => apt.status === 'completed';
    const currentMonthAppointments = appointments
      .filter(completedOnly)
      .filter((apt: Appointment) => dayjs(apt.data).isSame(currentMonth, 'month'));
    const previousMonthAppointments = appointments
      .filter(completedOnly)
      .filter((apt: Appointment) => dayjs(apt.data).isSame(previousMonth, 'month'));
    const previousMonthRevenue = previousMonthAppointments.reduce(
      (sum: number, apt: Appointment) => sum + apt.importo,
      0
    );
    const currentMonthRevenue = currentMonthAppointments.reduce(
      (sum: number, apt: Appointment) => sum + apt.importo,
      0
    );

    const revenueTrend =
      previousMonthRevenue > 0
        ? `+${Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)}%`
        : '+0%';
    const appointmentsTrend =
      previousMonthAppointments.length > 0
        ? `+${Math.round(
          ((currentMonthAppointments.length - previousMonthAppointments.length) /
            previousMonthAppointments.length) *
          100
        )}%`
        : '+0%';

    const totalClients = clients.length;
    const currentMonthClients = new Set(currentMonthAppointments.map((apt: Appointment) => apt.client_id)).size;
    const newClientsThisMonth = clients.filter(
      (c: Client) => dayjs(c.created_at).isSame(now, 'month')
    ).length;
    const newClientsLastMonth = clients.filter(
      (c: Client) => dayjs(c.created_at).isSame(previousMonth, 'month')
    ).length;
    const clientsTrend =
      newClientsLastMonth > 0
        ? `+${Math.round(((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100)}%`
        : (newClientsThisMonth > 0 ? '+100%' : '+0%');

    const upcoming = appointments
      .filter((apt: Appointment) => apt.status !== 'cancelled')
      .filter((apt: Appointment) => {
        const d = dayjs(apt.data);
        if (d.isAfter(now, 'day')) return true;
        if (d.isSame(now, 'day') && apt.ora) {
          const [h, m] = apt.ora.split(':').map(Number);
          return dayjs().hour(h).minute(m).isAfter(now);
        }
        return d.isSame(now, 'day') && !apt.ora;
      })
      .sort((a: Appointment, b: Appointment) => {
        const da = dayjs(a.data);
        const db = dayjs(b.data);
        if (!da.isSame(db, 'day')) return da.valueOf() - db.valueOf();
        return (a.ora || '00:00').localeCompare(b.ora || '00:00');
      });
    const next = upcoming[0] || null;

    return {
      stats: {
        totalClients,
        currentMonthAppointments: currentMonthAppointments.length,
        currentMonthRevenue,
        revenueTrend,
        appointmentsTrend,
        clientsTrend,
        currentMonthClients,
      },
      nextAppointment: next,
    };
  }, [appointments, clients]);

  const getClientById = (id: string): Client | undefined =>
    clients.find((c: Client) => c.id === id);

  const quickActions = [
    {
      title: 'Nuovo appuntamento',
      icon: Plus,
      path: `${appPrefix}/appointments`,
      imageSrc: '/icon-plus-3d.png',
    },
    {
      title: 'Agenda',
      icon: Calendar,
      path: `${appPrefix}/calendar`,
      imageSrc: '/icon-calendar-3d.png',
    },
    {
      title: 'Clienti',
      icon: Users,
      path: `${appPrefix}/clients`,
      imageSrc: '/icon-client-3d.png',
    },
    {
      title: 'Statistiche',
      icon: BarChart3,
      path: `${appPrefix}/overview`,
      imageSrc: '/icon-chart-3d.png',
    },
  ];

  const monthLabel = dayjs().format('MMMM YYYY').toUpperCase();

  if (loading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor }}>
        <div
          className="max-w-sm rounded-2xl border p-6 text-center shadow-lg"
          style={{ borderColor: accentSofter, backgroundColor: surfaceColor }}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <X className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: textPrimaryColor }}>Errore nel caricamento</h3>
          <p className="mt-2 text-sm" style={{ color: textSecondaryColor }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md"
            style={{ background: accentGradient }}
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const nextClient = nextAppointment ? getClientById(nextAppointment.client_id) : null;

  return (
    <div className="absolute inset-0 min-h-screen -top-10" style={{ backgroundColor }}>
      <div className="mx-auto max-w-lg px-4 safe-area-content-below-header">
        {/* Header: profilo + benvenuta, campanella */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ background: accentGradient }}
            >
              <img src="/profile.jpg" alt="Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <div>
              <h1 className="text-base font-base" style={{ color: textPrimaryColor }}>
                Benvenuta, <br />
                <span className="text-2xl font-bold">Andreea</span>
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/confirmations`)}
            className="relative bg-white flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:opacity-90"
            style={{ color: textPrimaryColor }}
            aria-label={`Notifiche${notifications.pendingCount > 0 ? `, ${notifications.pendingCount} da confermare` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {notifications.pendingCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                style={{ background: accentGradient }}
              >
                {notifications.pendingCount > 99 ? '99+' : notifications.pendingCount}
              </span>
            )}
          </button>
        </header>

        {/* Panoramica */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: textPrimaryColor }}>Panoramica</h2>
            <span
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: accentSofter, color: accentColor }}
            >
              {monthLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="relative rounded-xl p-4 shadow-md border"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                  Entrate
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: textPrimaryColor }}>{formatCurrency(stats.currentMonthRevenue)}</p>
              <p className="mt-1 text-xs font-semibold text-green-500">{stats.revenueTrend}</p>
              <div
                className="absolute right-3 bottom-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              >
                <img
                  src="/euro.png"
                  alt="Entrate"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>

            <div
              className="relative rounded-xl p-4 shadow-md border"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                  Appuntamenti
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: textPrimaryColor }}>{stats.currentMonthAppointments}</p>
              <p className="mt-1 text-xs font-semibold text-green-500">{stats.appointmentsTrend}</p>
              <div
                className="absolute right-3 bottom-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              >
                <img
                  src="/icon-calendar-3d.png"
                  alt="Appuntamenti"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
            <div
              className="relative rounded-xl p-4 shadow-md border"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                  Clienti totali
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: textPrimaryColor }}>{stats.totalClients.toLocaleString('it-IT')}</p>
              <p className="mt-1 text-xs font-semibold text-green-500">{stats.clientsTrend}</p>
              <div
                className="absolute right-3 bottom-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              >
                <img
                  src="/icon-client-3d.png"
                  alt="Clienti"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
            <div
              className="relative rounded-xl p-4 shadow-md border"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondaryColor }}>
                  Trend
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: textPrimaryColor }}>{stats.revenueTrend}</p>
              <p className="mt-1 text-xs font-semibold text-green-500">{stats.appointmentsTrend}</p>
              <div
                className="absolute right-3 bottom-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              >
                <img
                  src="/fire.png"
                  alt="Trend"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Azioni rapide */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3" style={{ color: textPrimaryColor }}>Azioni Rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl py-6 shadow-sm transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: accentGradient }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full p-2 bg-white"
                >
                  <img
                    src={action.imageSrc}
                    alt={action.title}
                    className="h-14 w-14 object-contain"
                  />
                </div>
                <span className="text-base font-bold text-white">{action.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Prossimo appuntamento */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3" style={{ color: textPrimaryColor }}>Prossimo Appuntamento</h2>
          {nextAppointment && nextClient ? (
            <div
              className="rounded-xl p-4 shadow-md border flex items-center gap-4"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2.5 text-white font-bold min-w-[56px]"
                style={{ background: accentGradient }}
              >
                <span className="text-[10px] uppercase leading-tight opacity-95">
                  {dayjs(nextAppointment.data).format('MMM')}
                </span>
                <span className="text-xl leading-none mt-0.5">
                  {dayjs(nextAppointment.data).format('DD')}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate" style={{ color: textPrimaryColor }}>
                  {nextClient.nome} {nextClient.cognome}
                </p>
                <p className="text-sm truncate" style={{ color: textSecondaryColor }}>
                  {nextAppointment.tipo_trattamento || 'Trattamento'} •{' '}
                  {nextAppointment.ora ? nextAppointment.ora.slice(0, 5) : '--:--'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`${appPrefix}/appointments`)}
                className="flex-shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition"
                style={{ backgroundColor: accentDark }}
              >
                DETTAGLI
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl p-10 text-center shadow-md border"
              style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
            >
              <Calendar className="mx-auto h-10 w-10 mb-4" style={{ color: textSecondaryColor }} />
              <p className="text-sm font-medium" style={{ color: textSecondaryColor }}>Nessun appuntamento in programma</p>
              <button
                type="button"
                onClick={() => navigate(`${appPrefix}/appointments`)}
                className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: accentGradient }}
              >
                Nuova prenotazione
              </button>
            </div>
          )}
        </section>

        {/* Love card solo LashesAndra - compatto */}
        {appType !== 'isabellenails' && (
          <section className="mb-6">
            <button
              type="button"
              onClick={() => setShowLoveDialog(true)}
              className="w-full rounded-2xl p-4 text-left text-white shadow-md flex items-center gap-3"
              style={{ background: accentGradient }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Reminder per te amore mio</p>
                <p className="text-sm text-white/90">Un pensiero speciale per te, non dimenticare di farmi visita!</p>
              </div>
            </button>
          </section>
        )}
      </div>

      {/* Love Dialog - invariato */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300 ${showLoveDialog ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        onClick={() => setShowLoveDialog(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Messaggio d'amore"
      >
        <div
          className={`w-full max-w-lg overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ${showLoveDialog ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          style={{ backgroundColor: surfaceColor }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="p-6 text-white" style={{ background: accentGradient }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Per la ragazza più importante</h2>
                  <p className="text-sm text-white/80">Leggi con attenzione questo messaggio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoveDialog(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-4 text-center">
              <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl shadow-lg">
                <img src="/IMG_3560.jpg" alt="Love" className="h-full w-full object-cover" />
              </div>
              <div
                className="rounded-xl border p-4 text-left"
                style={{ borderColor: accentSoft, backgroundColor: accentSofter }}
              >
                <h3 className="mb-3 flex items-center justify-center gap-2 text-lg font-bold" style={{ color: accentColor }}>
                  <Heart className="h-5 w-5" />
                  Ti sosterrò sempre
                  <Heart className="h-5 w-5" />
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: textPrimaryColor }}>
                  Amore mio, ti prometto che sarò sempre al tuo fianco in tutto ciò che farai, qualsiasi sogno, qualsiasi sfida.
                  Quando nella tua testa passa il pensiero di lasciarmi, per favore, accarezza quel pensiero e lascialo andare via.
                  È solo una nuvola che passa, perché io voglio starti accanto e supportarti sempre, in ogni momento.
                  Non sei mai sola, anche nei momenti difficili resto con te.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <div
                  className="flex flex-col items-center rounded-xl border p-3"
                  style={{ borderColor: accentSofter, backgroundColor: accentSofter }}
                >
                  <Smile className="mb-1 h-6 w-6" style={{ color: accentColor }} />
                  <span className="text-xs font-medium" style={{ color: textPrimaryColor }}>Il tuo sorriso</span>
                </div>
                <div
                  className="flex flex-col items-center rounded-xl border p-3"
                  style={{ borderColor: accentSofter, backgroundColor: accentSofter }}
                >
                  <Heart className="mb-1 h-6 w-6" style={{ color: accentColor }} />
                  <span className="text-xs font-medium" style={{ color: textPrimaryColor }}>Il tuo cuore</span>
                </div>
                <div
                  className="flex flex-col items-center rounded-xl border p-3"
                  style={{ borderColor: accentSofter, backgroundColor: accentSofter }}
                >
                  <Sparkles className="mb-1 h-6 w-6" style={{ color: accentColor }} />
                  <span className="text-xs font-medium" style={{ color: textPrimaryColor }}>La tua forza</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t p-4" style={{ borderColor: accentSofter, backgroundColor: accentSofter }}>
            <button
              type="button"
              onClick={() => setShowLoveDialog(false)}
              className="w-full rounded-xl py-3 font-semibold text-white shadow-md"
              style={{ background: accentGradient }}
            >
              Chiudi con amore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
