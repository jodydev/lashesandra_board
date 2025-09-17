import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Search,
  Check,
  X,
  Activity,
  Timer,
  Banknote,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import type { Appointment, Client } from '../types';
import { appointmentService, clientService } from '../lib/supabase';
import { formatDateForDisplay, formatCurrency } from '../lib/utils';
import dayjs from 'dayjs';

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled';
type DateFilter = 'all' | 'today' | 'tomorrow' | 'nextWeek';

// Modern metric card component with glass morphism effect (from MonthlyOverview)
const MetricCard = ({ icon: Icon, title, value, trend, delay = 0 }: {
  icon: any;
  title: string;
  value: string | number;
  trend?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25">
              <Icon size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            {trend && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {trend}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Modern chart container with enhanced styling (from MonthlyOverview)
const ChartContainer = ({ title, children, actions }: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-black/5 overflow-hidden"
  >
    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {actions}
      </div>
    </div>
    <div className="p-4 sm:p-6">
      {children}
    </div>
  </motion.div>
);

export default function AppointmentsConfirmationPage() {
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
        return {
          icon: CheckCircle2,
          color: 'emerald',
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          label: 'Completato',
          dot: 'bg-emerald-500'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'red',
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800',
          label: 'Cancellato',
          dot: 'bg-red-500'
        };
      default:
        return {
          icon: Clock,
          color: 'amber',
          bg: 'bg-pink-50 dark:bg-pink-950/20',
          text: 'text-pink-700 dark:text-pink-300',
          border: 'border-pink-200 dark:border-pink-800',
          label: 'In Attesa',
          dot: 'bg-pink-500'
        };
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

  // Enhanced loading state with skeleton matching MonthlyOverview
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            {/* Header skeleton */}
            <div className="space-y-3 sm:space-y-4">
              <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl w-80 animate-pulse" />
              <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-800 rounded-xl w-96 animate-pulse" />
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
            
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 h-64 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
              <div className="h-64 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-gray-100 dark:from-gray-900 dark:via-pink-900/10 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header with enhanced navigation matching MonthlyOverview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start justify-between gap-4"
        >
          <div className="space-y-1 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Gestione Appuntamenti
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Conferma e gestisci lo stato dei tuoi appuntamenti
            </p>
          </div>
        </motion.div>

        {/* Error state with better styling matching MonthlyOverview */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm sm:text-base"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced metrics grid matching MonthlyOverview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <MetricCard
            icon={Timer}
            title="In Attesa"
            value={pendingCount}
            delay={0.1}
          />
          <MetricCard
            icon={CheckCircle2}
            title="Completati"
            value={completedCount}
            delay={0.2}
          />
          <MetricCard
            icon={XCircle}
            title="Cancellati"
            value={cancelledCount}
            delay={0.3}
          />
          <MetricCard
            icon={Banknote}
            title="Ricavi Totali"
            value={formatCurrency(totalRevenue)}
            delay={0.4}
          />
        </div>

        {/* Search and Filters using ChartContainer */}
        <ChartContainer title="Filtri e Ricerca">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Enhanced Search */}
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-pink-500 transition-colors duration-200">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Cerca cliente, trattamento, email o telefono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 sm:h-14 px-4 pl-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Enhanced Filter */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Stato</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-12 sm:h-14 px-4 sm:px-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-semibold min-w-[160px] sm:min-w-[180px]"
              >
                <option value="all">Tutti gli stati</option>
                <option value="pending">In Attesa</option>
                <option value="completed">Completati</option>
                <option value="cancelled">Cancellati</option>
              </select>
            </div>
          </div>
        </ChartContainer>

        {/* Quick Date Filters */}
        <ChartContainer title="Filtri Rapidi per Data">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {[
              { 
                key: 'all', 
                label: 'Tutti', 
                icon: Calendar, 
                description: 'Mostra tutti gli appuntamenti',
                count: appointments.length
              },
              { 
                key: 'today', 
                label: 'Oggi', 
                icon: Calendar, 
                description: `Appuntamenti di oggi (${dayjs().format('DD/MM/YYYY')})`,
                count: appointments.filter(apt => dayjs(apt.data).isSame(dayjs(), 'day')).length
              },
              { 
                key: 'tomorrow', 
                label: 'Domani', 
                icon: CalendarDays, 
                description: `Appuntamenti di domani (${dayjs().add(1, 'day').format('DD/MM/YYYY')})`,
                count: appointments.filter(apt => dayjs(apt.data).isSame(dayjs().add(1, 'day'), 'day')).length
              },
              { 
                key: 'nextWeek', 
                label: 'Settimana Prossima', 
                icon: CalendarRange, 
                description: 'Appuntamenti della prossima settimana',
                count: appointments.filter(apt => {
                  const nextWeekStart = dayjs().add(1, 'week').startOf('week');
                  const nextWeekEnd = nextWeekStart.add(1, 'week');
                  return dayjs(apt.data).isAfter(nextWeekStart) && dayjs(apt.data).isBefore(nextWeekEnd);
                }).length
              }
            ].map((filter, index) => (
              <motion.button
                key={filter.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDateFilter(filter.key as DateFilter)}
                className={`group relative flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-2 transition-all duration-300 ${
                  dateFilter === filter.key
                    ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-pink-100/50 dark:from-pink-900/30 dark:to-pink-800/20 shadow-lg shadow-pink-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-lg hover:shadow-pink-500/10'
                }`}
                title={filter.description}
              >
                {/* Icon */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  dateFilter === filter.key
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                }`}>
                  <filter.icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                </div>
                
                {/* Content */}
                <div className="flex flex-col items-start">
                  <span className={`text-sm sm:text-base font-semibold transition-colors duration-300 ${
                    dateFilter === filter.key
                      ? 'text-pink-900 dark:text-pink-100'
                      : 'text-gray-900 dark:text-white group-hover:text-pink-900 dark:group-hover:text-pink-100'
                  }`}>
                    {filter.label}
                  </span>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    dateFilter === filter.key
                      ? 'text-pink-700 dark:text-pink-300'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                  }`}>
                    {filter.count} appuntamenti
                  </span>
                </div>
                
                {/* Selection Indicator */}
                {dateFilter === filter.key && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </ChartContainer>

        {/* Appointments List using ChartContainer */}
        <ChartContainer 
          title="Appuntamenti"
          actions={
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Live</span>
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-xl">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {filteredAppointments.length} risultati
                </span>
              </div>
            </div>
          }
        >
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((appointment, index) => {
                const client = getClientById(appointment.client_id);
                if (!client) return null;

                const statusConfig = getStatusConfig(appointment.status);

                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                          {client.nome.charAt(0)}{client.cognome.charAt(0)}
                        </div>
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
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                      }`}>
                        {statusConfig.label}
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-pink-600 dark:text-pink-400 text-sm sm:text-base">
                          {formatCurrency(appointment.importo)}
                        </div>
                      </div>
                      {appointment.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                            disabled={updating === appointment.id}
                            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                          >
                            {updating === appointment.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                            disabled={updating === appointment.id}
                            className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty State matching MonthlyOverview */}
            {filteredAppointments.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                <Activity size={32} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">
                  {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all')
                    ? 'Nessun appuntamento trovato con i filtri selezionati'
                    : 'Nessun appuntamento disponibile al momento'
                  }
                </p>
                {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancella filtri
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
