import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  Users, 
  Filter,
  Star,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent } from '@mui/material';
import type { Client, Appointment } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import ClientForm from './ClientForm';
import { formatCurrency } from '../lib/utils';
import dayjs from 'dayjs';

export default function ClientList() {
  const { clientService, appointmentService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'nuovo' | 'abituale'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientsData, appointmentsData] = await Promise.all([
        clientService.getAll(),
        appointmentService.getAll()
      ]);
      setClients(clientsData);
      setAppointments(appointmentsData);
    } catch (err) {
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await clientService.delete(clientToDelete.id);
      await loadClients();
      setShowDeleteDialog(false);
      setClientToDelete(null);
    } catch (err) {
      setError('Errore nell\'eliminazione del cliente');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedClient(null);
    loadClients();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedClient(null);
  };

  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#ffffff';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentDark = colors.primaryDark;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;

  // Filter and search clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono?.includes(searchTerm);
    
    const matchesFilter = filterType === 'all' || client.tipo_cliente === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate enhanced statistics
  const totalClients = clients.length;
  const newClients = clients.filter(c => c.tipo_cliente === 'nuovo').length;
  const regularClients = clients.filter(c => c.tipo_cliente === 'abituale').length;
  
  // Calculate revenue from completed appointments only
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  
  // Client activity statistics (only completed appointments)
  const currentMonth = dayjs();
  const currentMonthAppointments = completedAppointments.filter(apt => 
    dayjs(apt.data).isSame(currentMonth, 'month')
  );
  const activeClientsThisMonth = new Set(currentMonthAppointments.map(apt => apt.client_id)).size;
  
  // Calculate revenue per client from completed appointments
  const clientRevenueMap = new Map<string, number>();
  completedAppointments.forEach(apt => {
    const currentRevenue = clientRevenueMap.get(apt.client_id) || 0;
    clientRevenueMap.set(apt.client_id, currentRevenue + apt.importo);
  });
  
  // Create top clients with calculated revenue from completed appointments
  const topSpendingClients = clients
    .map(client => ({
      ...client,
      calculatedRevenue: clientRevenueMap.get(client.id) || 0
    }))
    .filter(client => client.calculatedRevenue > 0) // Only clients with completed appointments
    .sort((a, b) => b.calculatedRevenue - a.calculatedRevenue)
    .slice(0, 3);
  

  // Loading skeleton
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Skeleton */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
            <div className="space-y-3">
              <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-48 sm:w-64 animate-pulse" />
              <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-800 rounded-xl w-64 sm:w-96 animate-pulse" />
            </div>
            <div className="h-10 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-32 sm:w-40 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-800 rounded w-12 sm:w-16 animate-pulse" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 sm:w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
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
    <div
      className="min-h-screen"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8"
        >
          <div className="space-y-3">
           
            <h1
              className="text-3xl font-semibold sm:text-4xl lg:text-5xl tracking-tight dark:text-white"
              style={{ color: textPrimaryColor }}
            >
              Gestione Clienti
            </h1>
            <p
              className="text-sm sm:text-base lg:text-lg dark:text-gray-300"
              style={{ color: textSecondaryColor }}
            >
              Visualizza e gestisci tutti i tuoi clienti con eleganza
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddClient}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-7 py-3 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
            style={{
              background: accentGradient,
            }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90 duration-300" />
            <span className="text-sm sm:text-base">Nuovo Cliente</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
        >
          {[
            {
              title: 'Clienti Totali',
              value: totalClients,
              subtitle: `${regularClients} abituali, ${newClients} nuovi`,
              icon: Users,
              delay: 0.1,
            },
            {
              title: 'Clienti Attivi',
              value: activeClientsThisMonth,
              subtitle: 'questo mese',
              icon: Calendar,
              delay: 0.2,
            },
            {
              title: 'Clienti Abituali',
              value: regularClients,
              subtitle: 'abituali',
              icon: Users,
              delay: 0.3,
            },
            {
              title: 'Clienti Nuovi',
              value: newClients,
              subtitle: 'nuovi',
              icon: Users,
              delay: 0.4,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: stat.delay, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${accentSofter} 100%)`,
                borderColor: accentSoft,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <p
                    className="text-xs sm:text-sm font-medium uppercase tracking-wide"
                    style={{ color: textSecondaryColor }}
                  >
                    {stat.title}
                  </p>
                  <p
                    className="text-2xl font-semibold dark:text-white"
                    style={{ color: textPrimaryColor }}
                  >
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p
                      className="text-xs sm:text-sm truncate dark:text-gray-300"
                      style={{ color: `${textSecondaryColor}CC` }}
                    >
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
                  style={{ background: accentGradient }}
                >
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              
              {/* Subtle animation overlay */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </motion.div>
          ))}
        </motion.div>

        {/* Top Clients Section */}
        {topSpendingClients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 sm:mb-8"
          >
            <div className="mb-5 flex items-center gap-3 sm:mb-6">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg"
                style={{ background: accentGradient }}
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2
                className="text-lg font-semibold dark:text-white sm:text-xl"
                style={{ color: textPrimaryColor }}
              >
                Top Clienti per Fatturato
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topSpendingClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="rounded-2xl border p-4 sm:p-5 shadow-lg transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${surfaceColor}F2, ${accentSofter})`,
                    borderColor: accentSoft,
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold text-white sm:h-12 sm:w-12 sm:text-lg"
                        style={{ background: accentGradient }}
                      >
                        {index + 1}
                      </div>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1">
                          <Sparkles
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            style={{ color: accentColor }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-sm font-semibold dark:text-white sm:text-base"
                        style={{ color: textPrimaryColor }}
                      >
                        {client.nome} {client.cognome}
                      </h3>
                      <p
                        className="text-xs sm:text-sm truncate dark:text-gray-400"
                        style={{ color: textSecondaryColor }}
                      >
                        {client.tipo_cliente === 'nuovo' ? 'Nuovo cliente' : 'Cliente abituale'}
                      </p>
                      <p
                        className="mt-1 text-sm font-semibold sm:text-lg"
                        style={{ color: accentDark }}
                      >
                        {formatCurrency(client.calculatedRevenue)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-4 sm:mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl"
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
          className="mb-6 rounded-2xl border p-4 shadow-lg sm:mb-8 sm:p-6"
          style={{
            background: `linear-gradient(135deg, ${surfaceColor}F5, rgba(255,255,255,0.92))`,
            borderColor: accentSofter,
          }}
        >
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:space-y-0">
            {/* Search Bar */}
            <div className="relative max-w-full flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Cerca clienti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border bg-white/80 px-10 py-2.5 text-sm text-gray-900 shadow-inner transition-all duration-200 placeholder:text-gray-500 focus:outline-none sm:px-12 sm:py-3 sm:text-base dark:bg-gray-800 dark:text-white"
                style={{ borderColor: accentSoft }}
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              <Filter className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400 sm:mr-2 sm:h-5 sm:w-5" />
              <div className="flex min-w-max gap-2">
                {[
                  { key: 'all', label: 'Tutti', count: clients.length },
                  { key: 'nuovo', label: 'Nuovi', count: newClients },
                  { key: 'abituale', label: 'Abituali', count: clients.length - newClients },
                ].map((filter) => {
                  const isActive = filterType === filter.key;
                  return (
                    <motion.button
                      key={filter.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterType(filter.key as any)}
                      className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
                        isActive ? 'text-white shadow-lg' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      style={
                        isActive
                          ? {
                              background: accentGradient,
                              boxShadow: '0px 12px 24px -12px rgba(0,0,0,0.25)',
                            }
                          : {
                              backgroundColor: `${surfaceColor}F2`,
                              border: `1px solid ${accentSofter}`,
                            }
                      }
                    >
                      {filter.label} ({filter.count})
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clients Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative rounded-2xl border p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 sm:p-6"
                style={{
                  background: `linear-gradient(135deg, ${surfaceColor}F8, rgba(255,255,255,0.9))`,
                  borderColor: accentSofter,
                }}
              >
                {/* Client Avatar and Info */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex flex-1 min-w-0 items-center space-x-3 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold text-white shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14 sm:text-lg ${colors.shadowPrimary}`}
                        style={{ background: accentGradient }}
                      >
                        {client.nome.charAt(0).toUpperCase()}
                      </div>
                        {client.tipo_cliente === 'nuovo' && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-5 sm:w-5">
                            <Star className="h-2 w-2 sm:h-3 sm:w-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h3
                          className="truncate text-sm font-semibold dark:text-white sm:text-lg"
                          style={{ color: textPrimaryColor }}
                        >
                          {client.nome} {client.cognome}
                        </h3>
                        <div
                          className={`inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium sm:px-2.5`}
                          style={{
                            backgroundColor:
                              client.tipo_cliente === 'nuovo' ? '#DCFCE7' : accentSofter,
                            color:
                              client.tipo_cliente === 'nuovo' ? '#047857' : accentDark,
                          }}
                        >
                          {client.tipo_cliente === 'nuovo' ? 'Nuovo Cliente' : 'Cliente Abituale'}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditClient(client)}
                        className="rounded-xl border bg-white/70 p-2 transition-colors duration-200 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ borderColor: accentSofter }}
                      >
                        <Edit3 className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteClient(client)}
                        className="rounded-xl border bg-white/70 p-2 transition-colors duration-200 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-red-900/30"
                        style={{ borderColor: '#FECACA' }}
                      >
                        <Trash2 className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-4 space-y-2 sm:space-y-3">
                    {client.telefono && (
                      <div className="flex items-center space-x-3 text-xs sm:text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-gray-600 shadow-inner dark:bg-gray-800 dark:text-gray-400">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {client.telefono}
                        </span>
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-center space-x-3 text-xs sm:text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-gray-600 shadow-inner dark:bg-gray-800 dark:text-gray-400">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {client.email}
                        </span>
                      </div>
                    )}

                    {client.tipo_trattamento && (
                      <div className="flex items-center space-x-3 text-xs sm:text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-gray-600 shadow-inner dark:bg-gray-800 dark:text-gray-400">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {client.tipo_trattamento}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Revenue Information */}
                  <div className="border-t pt-3 sm:pt-4" style={{ borderColor: accentSofter }}>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs sm:text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        Spesa Totale
                      </span>
                      <span
                        className="text-sm font-semibold sm:text-lg"
                        style={{
                          background: accentGradient,
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                        }}
                      >
                        {formatCurrency(client.spesa_totale)}
                      </span>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: accentSofter }}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredClients.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border p-10 text-center shadow-lg sm:p-14"
            style={{
              background: `linear-gradient(135deg, ${surfaceColor}F7, rgba(255,255,255,0.9))`,
              borderColor: accentSofter,
            }}
          >
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: accentSofter }}
            >
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3
              className="mb-2 text-lg font-semibold dark:text-white sm:text-xl"
              style={{ color: textPrimaryColor }}
            >
              {searchTerm || filterType !== 'all' ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}
            </h3>
            <p
              className="mx-auto mb-6 max-w-lg text-sm sm:text-base"
              style={{ color: textSecondaryColor }}
            >
              {searchTerm || filterType !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo il tuo primo cliente'}
            </p>
            {(!searchTerm && filterType === 'all') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddClient}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 sm:text-base"
                style={{ background: accentGradient }}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Aggiungi Cliente
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Client Form Dialog */}
        <Dialog 
          open={showForm} 
          onClose={handleFormCancel}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh',
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
              <ClientForm
                clientId={selectedClient?.id}
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              onClick={() => setShowDeleteDialog(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-sm sm:max-w-md w-full p-4 sm:p-6 mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Conferma Eliminazione
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                    Sei sicuro di voler eliminare il cliente{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {clientToDelete?.nome} {clientToDelete?.cognome}
                    </span>
                    ? Questa azione non può essere annullata.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base"
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 text-sm sm:text-base"
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
