import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  X,
  Activity,
  Timer,
  Banknote,
  Calendar,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import type { Appointment, Client } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { formatDateForDisplay, formatCurrency } from '../lib/utils';
import dayjs from 'dayjs';

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled';
type DateFilter = 'all' | 'today' | 'tomorrow' | 'nextWeek';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

// Stat card (stile carosello: no shadow, icon con gradient, card più grande)
function StatCard({
  icon: Icon,
  title,
  value,
  accentSofter,
  accentGradient,
}: Readonly<{
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  value: string | number;
  accentSofter: string;
  accentGradient: string;
}>) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wide" style={{ color: textSecondaryColor }}>
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-semibold dark:text-white truncate" style={{ color: textPrimaryColor }}>
            {value}
          </p>
        </div>
        <span
          className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: accentGradient }}
          aria-hidden
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2} aria-hidden />
        </span>
      </div>
    </div>
  );
}

export default function AppointmentsConfirmationPage() {
  const navigate = useNavigate();
  const { appointmentService, clientService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [appointmentsData, clientsData] = await Promise.all([
        appointmentService.getAll(),
        clientService.getAll()
      ]);
      
      setAppointments(appointmentsData);
      setClients(clientsData);
    } catch (err) {
      setError('Errore nel caricamento degli appuntamenti');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      setUpdating(appointmentId);
      await appointmentService.update(appointmentId, { status: newStatus });
      const { cancelAppointmentReminder } = await import(
        '../lib/localNotifications'
      );
      await cancelAppointmentReminder(appointmentId);
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus }
            : apt
        )
      );
    } catch (err) {
      setError('Errore nell\'aggiornamento dello stato');
    } finally {
      setUpdating(null);
    }
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Completato', badgeStyle: { backgroundColor: '#DCFCE7', color: '#047857' } as const };
      case 'cancelled':
        return { label: 'Cancellato', badgeStyle: { backgroundColor: '#FEE2E2', color: '#B91C1C' } as const };
      default:
        return { label: 'In Attesa', badgeStyle: { backgroundColor: accentSofter, color: colors.primaryDark } as const };
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const client = getClientById(appointment.client_id);
    const appointmentDate = dayjs(appointment.data);
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    const nextWeekStart = today.add(1, 'week').startOf('week');
    const nextWeekEnd = nextWeekStart.add(1, 'week');
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = !searchQuery || 
      (client && (
        `${client.nome} ${client.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telefono?.includes(searchQuery) ||
        appointment.tipo_trattamento?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesDate = (() => {
      switch (dateFilter) {
        case 'today':
          return appointmentDate.isSame(today, 'day');
        case 'tomorrow':
          return appointmentDate.isSame(tomorrow, 'day');
        case 'nextWeek':
          return appointmentDate.isAfter(nextWeekStart) && appointmentDate.isBefore(nextWeekEnd);
        case 'all':
        default:
          return true;
      }
    })();
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  const pendingCount = appointments.filter(apt => apt.status === 'pending').length;
  const completedCount = appointments.filter(apt => apt.status === 'completed').length;
  const cancelledCount = appointments.filter(apt => apt.status === 'cancelled').length;
  const totalRevenue = appointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + (apt.importo || 0), 0);

  const todayCount = appointments.filter(apt => dayjs(apt.data).isSame(dayjs(), 'day')).length;
  const tomorrowCount = appointments.filter(apt => dayjs(apt.data).isSame(dayjs().add(1, 'day'), 'day')).length;
  const nextWeekStart = dayjs().add(1, 'week').startOf('week');
  const nextWeekCount = appointments.filter(apt =>
    dayjs(apt.data).isAfter(nextWeekStart) && dayjs(apt.data).isBefore(nextWeekStart.add(1, 'week'))
  ).length;

  // Loading skeleton (stile ClientList)
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor }}>
        <PageHeader title="Conferma Appuntamenti" showBack />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Skeleton carosello statistiche */}
          <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center rounded-2xl border p-6 sm:p-7 bg-white dark:bg-gray-900" style={{ borderColor: accentSofter }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-800 rounded w-20 sm:w-24" />
                      <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded w-16 sm:w-20" />
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6" style={{ borderColor: accentSofter }}>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-48" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32" />
                  </div>
                  <div className="w-16 sm:w-20 h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader title="Conferma Appuntamenti" showBack />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Error (stile ClientList) */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Carosello statistiche scrollabile */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard icon={Timer} title="In Attesa" value={pendingCount} accentSofter={accentSofter} accentGradient={accentGradient} />
            </div>
            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard icon={CheckCircle2} title="Completati" value={completedCount} accentSofter={accentSofter} accentGradient={accentGradient} />
            </div>
            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard icon={XCircle} title="Cancellati" value={cancelledCount} accentSofter={accentSofter} accentGradient={accentGradient} />
            </div>
            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard icon={Banknote} title="Ricavi Totali" value={formatCurrency(totalRevenue)} accentSofter={accentSofter} accentGradient={accentGradient} />
            </div>
          </div>
        </div>

        {/* Barra ricerca e filtri (stile ClientList) */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca cliente, trattamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white"
              style={{ borderColor: accentSoft }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all' as StatusFilter, label: 'Tutti', count: appointments.length },
              { key: 'pending' as StatusFilter, label: 'In Attesa', count: pendingCount },
              { key: 'completed' as StatusFilter, label: 'Completati', count: completedCount },
              { key: 'cancelled' as StatusFilter, label: 'Cancellati', count: cancelledCount },
            ].map((f) => {
              const isActive = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-medium sm:text-sm ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                  style={isActive ? { background: accentGradient } : { backgroundColor: surfaceColor, border: `1px solid ${accentSofter}` }}
                >
                  {f.label} ({f.count})
                </button>
              );
            })}
          </div>
        </div>


        {/* Lista appuntamenti (stile ClientList: card semplici) */}
        <div
          className="rounded-2xl shadow-lg border overflow-hidden"
          style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
        >
          <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: accentSofter }}>
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: textPrimaryColor }}>
              Appuntamenti
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAppointments.length} risultati
            </span>
          </div>
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {filteredAppointments.map((appointment) => {
              const client = getClientById(appointment.client_id);
              if (!client) return null;
              const statusConfig = getStatusConfig(appointment.status);
              return (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg"
                      style={{ background: accentGradient }}
                    >
                      {client.nome.charAt(0)}
                      {client.cognome.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {client.nome} {client.cognome}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {formatDateForDisplay(dayjs(appointment.data))} {appointment.ora && `• ${appointment.ora.slice(0, 5)}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                    <span className="inline-flex rounded-xl px-2 sm:px-3 py-1 text-xs font-medium" style={statusConfig.badgeStyle}>
                      {statusConfig.label}
                    </span>
                    <div className="text-right">
                      <div
                        className="font-bold text-sm sm:text-base"
                        style={{ background: accentGradient, WebkitBackgroundClip: 'text', color: 'transparent' }}
                      >
                        {formatCurrency(appointment.importo)}
                      </div>
                    </div>
                    {appointment.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                          disabled={updating === appointment.id}
                          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                        >
                          {updating === appointment.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                          disabled={updating === appointment.id}
                          className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAppointments.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                <Activity size={32} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">
                  {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all')
                    ? 'Nessun appuntamento trovato con i filtri selezionati'
                    : 'Nessun appuntamento disponibile al momento'}
                </p>
                {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}
                    className="mt-4 px-4 py-2 text-white rounded-xl font-medium transition-opacity hover:opacity-90"
                    style={{ background: accentGradient }}
                  >
                    Cancella filtri
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
