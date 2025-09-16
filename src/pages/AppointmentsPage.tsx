import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Euro, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Users, 
  TrendingUp,
  Sparkles,
  Check,
  X,
  Menu
} from 'lucide-react';
import type { Appointment, Client } from '../types';
import { appointmentService, clientService } from '../lib/supabase';
import AppointmentForm from '../components/AppointmentForm';
import { formatDate, formatCurrency } from '../lib/utils';

export default function AppointmentsPage() {
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
      return { status: 'Oggi', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', isCompleted: false };
    } else if (isCompleted) {
      return { status: 'Completato', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', isCompleted: true };
    } else {
      return { status: 'Programmato', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300', isCompleted: false };
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-pink-950/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Header Skeleton */}
          <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
            <div className="space-y-2 sm:space-y-3">
              <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48 sm:w-64 animate-pulse" />
              <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-64 sm:w-96 animate-pulse" />
            </div>
            <div className="h-10 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full sm:w-48 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-lg sm:rounded-xl animate-pulse" />
                  <div className="space-y-1 sm:space-y-2 flex-1">
                    <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-800 rounded w-12 sm:w-16 animate-pulse" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 sm:w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-1 sm:space-y-2">
                    <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-48" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-pink-950/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col space-y-4 mb-6 sm:mb-8"
        >
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-gray-900 dark:from-white dark:via-pink-400 dark:to-white bg-clip-text text-transparent">
              Gestione Appuntamenti
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg">
              Visualizza e gestisci tutti i tuoi appuntamenti con eleganza
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddAppointment}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90 duration-300" />
            <span className="text-sm sm:text-base">Nuovo Appuntamento</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8"
        >
          {[
            {
              title: 'Appuntamenti Totali',
              value: totalAppointments,
              icon: Calendar,
              gradient: 'from-pink-500 to-pink-600',
              bgGradient: 'from-pink-50 to-pink-100/50 dark:from-pink-950/50 dark:to-pink-900/30',
              delay: 0.1
            },
            {
              title: 'Appuntamenti Oggi',
              value: todayAppointments,
              icon: Clock,
              gradient: 'from-amber-500 to-amber-600',
              bgGradient: 'from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30',
              delay: 0.2
            },
            {
              title: 'Fatturato Stimato',
              value: formatCurrency(totalRevenue),
              icon: Euro,
              gradient: 'from-emerald-500 to-emerald-600',
              bgGradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30',
              delay: 0.3
            },
            {
              title: 'Media per Appuntamento',
              value: formatCurrency(averageRevenue),
              icon: TrendingUp,
              gradient: 'from-blue-500 to-blue-600',
              bgGradient: 'from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30',
              delay: 0.4
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: stat.delay, ease: [0.22, 1, 0.36, 1] }}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20 dark:border-gray-800/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors truncate">
                    {stat.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              
              {/* Subtle animation overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl"
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
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm mb-6 sm:mb-8"
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
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 text-sm sm:text-base"
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
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                      className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                        filterType === filter.key
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25'
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
          className="space-y-3 sm:space-y-4"
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
                  className={`group relative backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm transition-all duration-300 ${
                    statusInfo.isCompleted 
                      ? 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 opacity-75 hover:opacity-90' 
                      : 'bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-800/50 hover:shadow-xl hover:shadow-pink-500/10'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    {/* Client Avatar */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-lg relative flex-shrink-0 ${
                      statusInfo.isCompleted 
                        ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                        : 'bg-gradient-to-br from-pink-500 to-pink-600'
                    }`}>
                      {statusInfo.isCompleted && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                      )}
                      {client ? client.nome.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h4 className={`text-base sm:text-xl font-bold truncate ${
                          statusInfo.isCompleted 
                            ? 'text-gray-600 dark:text-gray-400 line-through' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {client ? `${client.nome} ${client.cognome}` : 'Cliente non trovato'}
                        </h4>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusInfo.color}`}>
                          {statusInfo.isCompleted && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          {statusInfo.status}
                        </span>
                      </div>
                      
                      <div className={`grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-6 text-xs sm:text-sm ${
                        statusInfo.isCompleted 
                          ? 'text-gray-500 dark:text-gray-500' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className={`font-medium truncate ${statusInfo.isCompleted ? 'line-through' : ''}`}>
                            {formatDate(appointment.data)}
                          </span>
                        </div>
                        
                        {appointment.ora && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className={`font-medium ${statusInfo.isCompleted ? 'line-through' : ''}`}>
                              {appointment.ora.slice(0, 5)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Euro className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className={`font-medium ${statusInfo.isCompleted ? 'line-through' : ''}`}>
                            {formatCurrency(appointment.importo)}
                          </span>
                        </div>
                        
                        {appointment.tipo_trattamento && (
                          <div className="flex items-center gap-1 sm:gap-2 col-span-2 sm:col-span-1">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className={`font-medium truncate ${statusInfo.isCompleted ? 'line-through' : ''}`}>
                              {appointment.tipo_trattamento}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditAppointment(appointment)}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors duration-200 group/btn ${
                          statusInfo.isCompleted 
                            ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-pink-100 dark:hover:bg-pink-900/30'
                        }`}
                      >
                        <Edit3 className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          statusInfo.isCompleted 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-gray-600 dark:text-gray-400 group-hover/btn:text-pink-600 dark:group-hover/btn:text-pink-400'
                        }`} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteAppointment(appointment)}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors duration-200 group/btn ${
                          statusInfo.isCompleted 
                            ? 'bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30' 
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                      >
                        <Trash2 className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          statusInfo.isCompleted 
                            ? 'text-gray-500 dark:text-gray-400 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400' 
                            : 'text-gray-600 dark:text-gray-400 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400'
                        }`} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-opacity duration-300 ${
                    statusInfo.isCompleted 
                      ? 'bg-gradient-to-r from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100' 
                      : 'bg-gradient-to-r from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100'
                  }`} />
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
            className="text-center py-12 sm:py-16"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' ? 'Nessun appuntamento trovato' : 'Nessun appuntamento ancora'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base px-4">
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
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Aggiungi Appuntamento
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Appointment Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999]"
              onClick={handleFormCancel}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <AppointmentForm
                  appointment={selectedAppointment}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
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
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base"
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDelete}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 text-sm sm:text-base"
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
