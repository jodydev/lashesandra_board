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
import { clientService, appointmentService } from '../lib/supabase';
import ClientForm from './ClientForm';
import { formatCurrency } from '../lib/utils';
import dayjs from 'dayjs';

export default function ClientList() {
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
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-8 py-0">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-64 animate-pulse" />
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-xl w-96 animate-pulse" />
            </div>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-40 animate-pulse mt-4 sm:mt-0" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-8 py-0">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-gray-900 dark:from-white dark:via-pink-400 dark:to-white bg-clip-text text-transparent">
              Gestione Clienti
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Visualizza e gestisci tutti i tuoi clienti con eleganza
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddClient}
            className="group relative mt-6 sm:mt-0 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
            Nuovo Cliente
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: 'Clienti Totali',
              value: totalClients,
              subtitle: `${regularClients} abituali, ${newClients} nuovi`,
              icon: Users,
              gradient: 'from-pink-500 to-pink-600',
              bgGradient: 'from-pink-50 to-pink-100/50 dark:from-pink-950/50 dark:to-pink-900/30',
              delay: 0.1
            },
            {
              title: 'Clienti Attivi',
              value: activeClientsThisMonth,
              subtitle: 'questo mese',
              icon: Calendar,
              gradient: 'from-emerald-500 to-emerald-600',
              bgGradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30',
              delay: 0.2
            }
          ].map((stat) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: stat.delay, ease: [0.22, 1, 0.36, 1] }}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-800/50 shadow-lg hover:shadow-lg transition-all duration-300 group cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Subtle animation overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.div>
          ))}
        </motion.div>

        {/* Top Clients Section */}
        {topSpendingClients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Top Clienti per Fatturato
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSpendingClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {client.nome} {client.cognome}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.tipo_cliente === 'nuovo' ? 'Nuovo cliente' : 'Cliente abituale'}
                      </p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
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
              className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca clienti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              {[
                { key: 'all', label: 'Tutti', count: clients.length },
                { key: 'nuovo', label: 'Nuovi', count: newClients },
                { key: 'abituale', label: 'Abituali', count: clients.length - newClients }
              ].map((filter) => (
                <motion.button
                  key={filter.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                    filterType === filter.key
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label} ({filter.count})
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Clients Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer"
              >
                {/* Client Avatar and Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform duration-300">
                        {client.nome.charAt(0).toUpperCase()}
                      </div>
                      {client.tipo_cliente === 'nuovo' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {client.nome} {client.cognome}
                      </h3>
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        client.tipo_cliente === 'nuovo'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-pink-200  text-gray-700'
                      }`}>
                        {client.tipo_cliente === 'nuovo' ? 'Nuovo Cliente' : 'Cliente Abituale'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="transition-opacity duration-200">
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditClient(client)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-xl transition-colors duration-200 group/btn"
                      >
                        <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/btn:text-pink-600 dark:group-hover/btn:text-pink-400" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteClient(client)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors duration-200 group/btn"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 mb-4">
                  {client.telefono && (
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{client.telefono}</span>
                    </div>
                  )}
                  
                  {client.email && (
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{client.email}</span>
                    </div>
                  )}

                  {client.tipo_trattamento && (
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <Sparkles className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{client.tipo_trattamento}</span>
                    </div>
                  )}
                </div>

                {/* Revenue Information */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Spesa Totale</span>
                    <span className="font-bold text-lg bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent">
                      {formatCurrency(client.spesa_totale)}
                    </span>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
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
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {searchTerm || filterType !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo il tuo primo cliente'
              }
            </p>
            {(!searchTerm && filterType === 'all') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddClient}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 "
              onClick={() => setShowDeleteDialog(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Conferma Eliminazione
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Sei sicuro di voler eliminare il cliente{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {clientToDelete?.nome} {clientToDelete?.cognome}
                    </span>
                    ? Questa azione non può essere annullata.
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
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
