import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronLeft
} from 'lucide-react';
import type { Appointment, Client } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import AppointmentForm from '../components/AppointmentForm';
import { formatDate, formatCurrency } from '../lib/utils';
import { useApp } from '../contexts/AppContext';

export default function AppointmentsPage() {
  const navigate = useNavigate();
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
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => new Date(a.data).toDateString() === today.toDateString()).length;
  const weekAppointments = appointments.filter(a => new Date(a.data) >= startOfWeek).length;
  const monthAppointments = appointments.filter(a => new Date(a.data) >= startOfMonth).length;
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

  // Loading skeleton (stile ClientList)
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor }}>
        <header
          className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800"
          style={{ borderColor: accentSofter }}
        >
          <button type="button" className="flex items-center gap-1.5 font-medium" style={{ color: accentColor }} aria-label="Indietro">
            <ChevronLeft className="h-6 w-6" />
            <span>Indietro</span>
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold dark:text-white" style={{ color: textPrimaryColor }}>
            Gestione Appuntamenti
          </h1>
          <div className="h-9 w-9" />
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-800 rounded w-12 sm:w-16" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 sm:w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
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
    <div className="min-h-screen pt-14" style={{ backgroundColor }}>
      {/* Header navigazione: Indietro | Gestione Appuntamenti | + (stile ClientList) */}
      <header
        className="z-30 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800"
        style={{ borderColor: accentSofter }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-90"
          style={{ color: accentColor }}
          aria-label="Indietro"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1
          className="text-lg font-bold dark:text-white"
          style={{ color: textPrimaryColor }}
        >
          Gestione Appuntamenti
        </h1>
        <button
          type="button"
          onClick={handleAddAppointment}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-opacity hover:opacity-90"
          style={{ color: accentColor }}
          aria-label="Nuovo appuntamento"
        >
          <Plus className="h-6 w-6" />
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Carosello statistiche scrollabile */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {[
              { title: 'Appuntamenti Totali', value: totalAppointments, icon: Calendar },
              { title: 'Appuntamenti Di Oggi', value: todayAppointments, icon: Clock },
              { title: 'Fatturato Totale Stimato', value: formatCurrency(totalRevenue), icon: Euro },
              { title: 'Media appuntamento', value: formatCurrency(averageRevenue), icon: TrendingUp },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center group relative overflow-hidden rounded-2xl border p-6 sm:p-7"
                  style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5">
                      <p className="text-xs sm:text-sm font-medium uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                        {stat.title}
                      </p>
                      <p className="text-2xl sm:text-3xl font-semibold dark:text-white truncate" style={{ color: textPrimaryColor }}>
                        {stat.value}
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
            })}
          </div>
        </div>

        {/* Barra ricerca e filtri (stile ClientList: una riga, filtri con count) */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca appuntamenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white"
              style={{ borderColor: accentSoft }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 shrink-0 text-gray-400" />
            {[
              { key: 'all', label: 'Tutti', count: totalAppointments },
              { key: 'oggi', label: 'Oggi', count: todayAppointments },
              { key: 'questa_settimana', label: 'Settimana', count: weekAppointments },
              { key: 'questo_mese', label: 'Mese', count: monthAppointments },
            ].map((filter) => {
              const isActive = filterType === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setFilterType(filter.key as typeof filterType)}
                  className={`whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-medium sm:text-sm ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                  style={
                    isActive
                      ? { background: accentGradient }
                      : { backgroundColor: surfaceColor, border: `1px solid ${accentSofter}` }
                  }
                >
                  {filter.label} ({filter.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert (stile ClientList) */}
        {error && (
          <div className="mb-4 sm:mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Lista appuntamenti in griglia (stile ClientList) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredAppointments.map((appointment) => {
            const client = getClientById(appointment.client_id);
            const statusInfo = getStatusInfo(appointment);
            return (
              <div
                key={appointment.id}
                className="group relative rounded-2xl border p-4 shadow-lg sm:p-6"
                style={{
                  background: statusInfo.isCompleted
                    ? 'linear-gradient(135deg, rgba(243,244,246,0.95) 0%, rgba(229,231,235,0.9) 100%)'
                    : `linear-gradient(135deg, ${surfaceColor}F8, rgba(255,255,255,0.9))`,
                  borderColor: accentSofter,
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex flex-1 min-w-0 items-center space-x-3 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold text-white shadow-lg sm:h-14 sm:w-14 sm:text-lg ${colors.shadowPrimary}`}
                        style={{ background: statusInfo.isCompleted ? 'linear-gradient(135deg, #9CA3AF, #6B7280)' : accentGradient }}
                      >
                        {client ? client.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                      {statusInfo.isCompleted && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-5 sm:w-5">
                          <Check className="h-2 w-2 sm:h-3 sm:w-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3
                        className="truncate text-sm font-semibold dark:text-white sm:text-lg"
                        style={{
                          color: statusInfo.isCompleted ? '#6B7280' : textPrimaryColor,
                          textDecoration: statusInfo.isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {client ? `${client.nome} ${client.cognome}` : 'Cliente non trovato'}
                      </h3>
                      <span
                        className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium sm:px-2.5"
                        style={statusInfo.badgeStyle}
                      >
                        {statusInfo.isCompleted && <Check className="h-3 w-3" />}
                        {statusInfo.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditAppointment(appointment)}
                      className="rounded-xl border bg-white/70 p-2 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                      style={{ borderColor: accentSofter }}
                    >
                      <Edit3 className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAppointment(appointment)}
                      className="rounded-xl border bg-white/70 p-2 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-red-900/30"
                      style={{ borderColor: '#FECACA' }}
                    >
                      <Trash2 className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Dettagli appuntamento (stile righe con icona come ClientList) */}
                <div className="mb-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-3 text-xs sm:text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-gray-600 shadow-inner dark:bg-gray-800 dark:text-gray-400">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300" style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                      {formatDate(appointment.data)}
                    </span>
                  </div>
                  {appointment.ora && (
                    <div className="flex items-center space-x-3 text-xs sm:text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-gray-600 shadow-inner dark:bg-gray-800 dark:text-gray-400">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300" style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                        {appointment.ora.slice(0, 5)}
                      </span>
                    </div>
                  )}
                  {appointment.tipo_trattamento && (
                    <div className="flex items-center space-x-3 text-xs sm:text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-gray-600 shadow-inner dark:bg-gray-800 dark:text-gray-400">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate" style={{ textDecoration: statusInfo.isCompleted ? 'line-through' : 'none' }}>
                        {appointment.tipo_trattamento}
                      </span>
                    </div>
                  )}
                </div>

                {/* Importo in fondo card (stile Spesa Totale in ClientList) */}
                <div className="border-t pt-3 sm:pt-4" style={{ borderColor: accentSofter }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm" style={{ color: textSecondaryColor }}>
                      Importo
                    </span>
                    <span
                      className="text-sm font-semibold sm:text-lg"
                      style={{
                        background: statusInfo.isCompleted ? undefined : accentGradient,
                        WebkitBackgroundClip: statusInfo.isCompleted ? undefined : 'text',
                        color: statusInfo.isCompleted ? '#6B7280' : 'transparent',
                      }}
                    >
                      {formatCurrency(appointment.importo)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State (stile ClientList) */}
        {filteredAppointments.length === 0 && !loading && (
          <div
            className="rounded-2xl border p-10 text-center shadow-lg sm:p-14"
            style={{
              background: `linear-gradient(135deg, ${surfaceColor}F7, rgba(255,255,255,0.9))`,
              borderColor: accentSofter,
            }}
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: accentSofter }}>
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold dark:text-white sm:text-xl" style={{ color: textPrimaryColor }}>
              {searchTerm || filterType !== 'all' ? 'Nessun appuntamento trovato' : 'Nessun appuntamento ancora'}
            </h3>
            <p className="mx-auto mb-6 max-w-lg text-sm sm:text-base" style={{ color: textSecondaryColor }}>
              {searchTerm || filterType !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo il tuo primo appuntamento'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                type="button"
                onClick={handleAddAppointment}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg sm:text-base"
                style={{ background: accentGradient }}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Nuovo Appuntamento
              </button>
            )}
          </div>
        )}

        {/* Appointment Form — schermata a tutto schermo (stile ClientForm) */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex flex-col h-screen min-h-full" style={{ backgroundColor: surfaceColor }}>
            <AppointmentForm
              appointment={selectedAppointment}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Delete Confirmation Modal (stile ClientList) */}
        {showDeleteDialog && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowDeleteDialog(false)}
          >
            <div
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
                  Sei sicuro di voler eliminare l'appuntamento del{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {appointmentToDelete && formatDate(appointmentToDelete.data)}
                  </span>
                  ? Questa azione non può essere annullata.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(false)}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 text-sm sm:text-base"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
