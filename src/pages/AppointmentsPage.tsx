import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@mui/material';
import { 
  Calendar, 
  Clock, 
  Euro, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  TrendingUp,
  Sparkles,
  Check,
  Menu
} from 'lucide-react';
import type { Appointment, Client } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import AppointmentForm from '../components/AppointmentForm';
import { formatDate, formatCurrency } from '../lib/utils';
import { useApp } from '../contexts/AppContext';

export default function AppointmentsPage() {
  const { appointmentService, clientService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'oggi' | 'questa_settimana' | 'questo_mese'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#ffffff';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentDark = colors.primaryDark;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;

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

  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  };

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setShowForm(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      await appointmentService.delete(appointmentToDelete.id);
      await loadData();
      setShowDeleteDialog(false);
      setAppointmentToDelete(null);
    } catch (err) {
      setError('Errore nell\'eliminazione dell\'appuntamento');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedAppointment(null);
    loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedAppointment(null);
  };

  // Filter and search appointments
  const filteredAppointments = appointments.filter(appointment => {
    const client = getClientById(appointment.client_id);
    const clientName = client ? `${client.nome} ${client.cognome}` : '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.tipo_trattamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(appointment.data).toLowerCase().includes(searchTerm.toLowerCase());
    
    const appointmentDate = new Date(appointment.data);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let matchesFilter = true;
    if (filterType === 'oggi') {
      matchesFilter = appointmentDate.toDateString() === today.toDateString();
    } else if (filterType === 'questa_settimana') {
      matchesFilter = appointmentDate >= startOfWeek;
    } else if (filterType === 'questo_mese') {
      matchesFilter = appointmentDate >= startOfMonth;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => {
    const appointmentDate = new Date(a.data);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }).length;
  const totalRevenue = appointments.reduce((sum, a) => sum + a.importo, 0);
  const averageRevenue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  const getStatusInfo = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.data);
    const today = new Date();
    const isToday = appointmentDate.toDateString() === today.toDateString();
    const isCompleted = appointment.status === 'completed';

    if (isToday) {
      return {
        status: 'Oggi',
        badgeStyle: { backgroundColor: '#FEF3C7', color: '#B45309' },
        cardOverlay: 'rgba(250, 240, 209, 0.45)',
        isCompleted: false,
      } as const;
    }

    if (isCompleted) {
      return {
        status: 'Completato',
        badgeStyle: { backgroundColor: '#DCFCE7', color: '#047857' },
        cardOverlay: 'rgba(209, 250, 229, 0.35)',
        isCompleted: true,
      } as const;
    }

    return {
      status: 'Programmato',
      badgeStyle: { backgroundColor: `${accentSofter}`, color: accentDark },
      cardOverlay: accentSofter,
      isCompleted: false,
    } as const;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor }}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 sm:py-10">
          {/* Header Skeleton */}
          <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
            <div className="space-y-2 sm:space-y-3">
              <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded-2xl w-48 sm:w-64 animate-pulse" />
              <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-800 rounded-2xl w-64 sm:w-96 animate-pulse" />
            </div>
            <div className="h-10 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full sm:w-48 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl sm:rounded-2xl animate-pulse" />
                  <div className="space-y-1 sm:space-y-2 flex-1">
                    <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-800 rounded-xl w-12 sm:w-16 animate-pulse" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded-xl w-16 sm:w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-2xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-1 sm:space-y-2">
                    <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded-xl w-32 sm:w-48" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-xl w-24 sm:w-32" />
                  </div>
                  <div className="w-16 sm:w-20 h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 sm:py-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex flex-col space-y-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-3">
            <div>
              <h1
                className="text-3xl font-semibold tracking-tight dark:text-white sm:text-4xl lg:text-5xl"
                style={{ color: textPrimaryColor }}
              >
                Gestione Appuntamenti
              </h1>
              <p
                className="mt-2 text-sm dark:text-gray-300 sm:text-base lg:text-lg"
                style={{ color: textSecondaryColor }}
              >
                Visualizza, organizza e monitora ogni incontro con stile professionale.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddAppointment}
            className="group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:w-auto"
            style={{ background: accentGradient }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-sm sm:text-base">Nuovo Appuntamento</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </motion.button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6"
        >
          {[
            {
              title: 'Appuntamenti Totali',
              value: totalAppointments,
              icon: Calendar,
              delay: 0.1
            },
            {
              title: 'Appuntamenti Oggi',
              value: todayAppointments,
              icon: Clock,
              delay: 0.2
            },
            {
              title: 'Fatturato Stimato',
              value: formatCurrency(totalRevenue),
              icon: Euro,
              delay: 0.3
            },
            {
              title: 'Media per Appuntamento',
              value: formatCurrency(averageRevenue),
              icon: TrendingUp,
              delay: 0.4
            }
          ].map((stat) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: stat.delay, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${accentSofter} 100%)`,
                borderColor: accentSoft,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <p
                    className="text-xs font-medium uppercase tracking-wide sm:text-sm"
                    style={{ color: textSecondaryColor }}
                  >
                    {stat.title}
                  </p>
                  <p
                    className="truncate text-2xl font-semibold dark:text-white"
                    style={{ color: textPrimaryColor }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
                  style={{ background: accentGradient }}
                >
                  <stat.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              
              {/* Subtle animation overlay */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </motion.div>
          ))}
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl"
            >
              <p className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg mb-6 sm:mb-8"
        >
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca appuntamenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-2xl focus:ring-2 ${colors.focusRing} focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 text-sm sm:text-base`}
              />
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <div className="flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtri</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Filter Chips */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: showFilters || window.innerWidth >= 1024 ? 1 : 0,
                  height: showFilters || window.innerWidth >= 1024 ? 'auto' : 0
                }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:block overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Tutti', count: appointments.length },
                    { key: 'oggi', label: 'Oggi', count: todayAppointments },
                    { key: 'questa_settimana', label: 'Settimana', count: 0 },
                    { key: 'questo_mese', label: 'Mese', count: 0 }
                  ].map((filter) => (
                    <motion.button
                      key={filter.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterType(filter.key as any)}
                      className={`px-3 sm:px-4 py-2 rounded-2xl sm:rounded-2xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                        filterType === filter.key
                          ? `${colors.bgGradient} text-white shadow-lg ${colors.shadowPrimary}`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {filter.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredAppointments.map((appointment, index) => {
              console.log(appointment);
              const client = getClientById(appointment.client_id);
              const statusInfo = getStatusInfo(appointment);
              
              return (
                <motion.div
                  key={appointment.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="group relative rounded-2xl border p-5 shadow-lg transition-all duration-300 sm:rounded-3xl sm:p-6"
                  style={{
                    background: statusInfo.isCompleted
                      ? 'linear-gradient(135deg, rgba(243,244,246,0.95) 0%, rgba(229,231,235,0.9) 100%)'
                      : `linear-gradient(135deg, ${surfaceColor}F6, rgba(255,255,255,0.92))`,
                    borderColor: accentSofter,
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-start gap-3 sm:gap-4">
                      <div
                        className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-lg sm:h-16 sm:w-16 sm:text-xl"
                        style={{ background: statusInfo.isCompleted ? 'linear-gradient(135deg, #9CA3AF, #6B7280)' : accentGradient }}
                      >
                        {statusInfo.isCompleted && (
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        {client ? client.nome.charAt(0).toUpperCase() : '?'}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h4
                            className="truncate text-base font-semibold sm:text-xl"
                            style={{ color: statusInfo.isCompleted ? '#6B7280' : textPrimaryColor, textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}
                          >
                            {client ? `${client.nome} ${client.cognome}` : 'Cliente non trovato'}
                          </h4>
                          <span
                            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style={statusInfo.badgeStyle}
                          >
                            {statusInfo.isCompleted && <Check className="h-3 w-3" />}
                            {statusInfo.status}
                          </span>
                        </div>

                        <div
                          className="flex flex-wrap gap-3 text-xs sm:text-sm"
                          style={{ color: statusInfo.isCompleted ? '#6B7280' : textSecondaryColor }}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                              {formatDate(appointment.data)}
                            </span>
                          </div>

                          {appointment.ora && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                                {appointment.ora.slice(0, 5)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 flex-shrink-0" />
                            <span style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                              {formatCurrency(appointment.importo)}
                            </span>
                          </div>

                          {appointment.tipo_trattamento && (
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate" style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                                {appointment.tipo_trattamento}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 gap-2 sm:flex-col">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditAppointment(appointment)}
                        className="rounded-xl border bg-white/80 p-2 transition-colors duration-200 hover:bg-white sm:p-3"
                        style={{ borderColor: accentSofter }}
                      >
                        <Edit3 className="h-4 w-4" style={{ color: statusInfo.isCompleted ? '#6B7280' : accentDark }} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteAppointment(appointment)}
                        className="rounded-xl border bg-white/80 p-2 transition-colors duration-200 hover:bg-red-50 sm:p-3"
                        style={{ borderColor: '#FECACA', color: '#DC2626' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 sm:rounded-3xl"
                    style={{ background: statusInfo.cardOverlay }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredAppointments.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border p-10 text-center shadow-lg sm:rounded-3xl sm:p-14"
            style={{
              background: `linear-gradient(135deg, ${surfaceColor}F7, rgba(255,255,255,0.9))`,
              borderColor: accentSofter,
            }}
          >
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl sm:mb-8 sm:h-24 sm:w-24"
              style={{ background: accentSofter }}
            >
              <Calendar className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            </div>
            <h3
              className="mb-2 text-lg font-semibold dark:text-white sm:text-xl"
              style={{ color: textPrimaryColor }}
            >
              {searchTerm || filterType !== 'all' ? 'Nessun appuntamento trovato' : 'Nessun appuntamento ancora'}
            </h3>
            <p
              className="mx-auto mb-6 max-w-lg text-sm sm:text-base sm:mb-8"
              style={{ color: textSecondaryColor }}
            >
              {searchTerm || filterType !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo il tuo primo appuntamento'
              }
            </p>
            {(!searchTerm && filterType === 'all') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddAppointment}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:text-base"
                style={{ background: accentGradient }}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Nuovo Appuntamento
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Appointment Form Dialog */}
        <Dialog 
          open={showForm} 
          onClose={handleFormCancel}
          maxWidth="lg"
          fullWidth
          fullScreen={false}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              maxHeight: { xs: '100vh', sm: '95vh' },
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              '@media (prefers-color-scheme: dark)': {
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
              }
            }
          }}
        >
          <DialogContent 
            sx={{ 
              p: 0, 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <AppointmentForm
                appointment={selectedAppointment}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4"
              onClick={() => setShowDeleteDialog(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-lg max-w-md w-full p-4 sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Conferma Eliminazione
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                    Sei sicuro di voler eliminare l'appuntamento del{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {appointmentToDelete && formatDate(appointmentToDelete.data)}
                    </span>
                    ? Questa azione non può essere annullata.
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base"
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDelete}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl sm:rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 text-sm sm:text-base"
                    >
                      Elimina
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
