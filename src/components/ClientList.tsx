import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Sparkles,
  X,
  NotebookPen
} from 'lucide-react';
import PageHeader from './PageHeader';
import type { Client, Appointment } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';
import dayjs from 'dayjs';

export default function ClientList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientService, appointmentService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'nuovo' | 'abituale'>('all');
  const [showTopClients, setShowTopClients] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  // Apri dialog elimina se si arriva dalla pagina form con confirmDeleteId
  useEffect(() => {
    const state = location.state as { confirmDeleteId?: string } | null;
    if (!state?.confirmDeleteId || clients.length === 0) return;
    const client = clients.find((c) => c.id === state.confirmDeleteId);
    if (client) {
      setClientToDelete(client);
      setShowDeleteDialog(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [clients, location.state, location.pathname, navigate]);

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

  const appPrefix = appType === 'isabellenails' ? '/isabellenails' : '/lashesandra';

  const handleAddClient = () => {
    navigate(`${appPrefix}/clients/new`);
  };

  const handleEditClient = (client: Client) => {
    navigate(`${appPrefix}/clients/${client.id}/edit`);
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


  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
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
        <PageHeader title="Lista Clienti" showBack onBack={() => navigate(-1)} />

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

          {/* Content Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
            <div className="space-y-4">
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
    <div
      className="min-h-screen"
      style={{ backgroundColor }}
    >
      <PageHeader
        title="Lista Clienti"
        showBack
        rightAction={{ type: 'icon', icon: Plus, ariaLabel: 'Aggiungi cliente', onClick: handleAddClient }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Carosello statistiche scrollabile */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {[
              {
                title: 'Clienti Totali',
                value: totalClients,
                subtitle: `${regularClients} abituali, ${newClients} nuovi`,
                icon: Users,
              },
              {
                title: 'Clienti Attivi',
                value: activeClientsThisMonth,
                subtitle: 'questo mese',
                icon: Calendar,
              },
              {
                title: 'Clienti Abituali',
                value: regularClients,
                subtitle: 'abituali',
                icon: Users,
              },
              {
                title: 'Clienti Nuovi',
                value: newClients,
                subtitle: 'nuovi',
                icon: Users,
              },
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
                      <p
                        className="text-xs sm:text-sm font-medium uppercase tracking-wide"
                        style={{ color: textSecondaryColor }}
                      >
                        {stat.title}
                      </p>
                      <p
                        className="text-2xl sm:text-3xl font-semibold dark:text-white truncate"
                        style={{ color: textPrimaryColor }}
                      >
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p
                          className="text-xs truncate"
                          style={{ color: textSecondaryColor }}
                        >
                          {stat.subtitle}
                        </p>
                      )}
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

                 {/* Top Clienti per Fatturato — Classifica */}
        {topSpendingClients.length > 0 && showTopClients && (() => {
          const rankStyles = [
            { emoji: '🏆', label: '1°', bg: 'linear-gradient(135deg, #E8B923, #D4A017)', border: '#D4A017', glow: 'rgba(232, 185, 35, 0.35)' },
            { emoji: '🥈', label: '2°', bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', border: '#A8A8A8', glow: 'rgba(192, 192, 192, 0.3)' },
            { emoji: '🥉', label: '3°', bg: 'linear-gradient(135deg, #CD7F32, #B87333)', border: '#B87333', glow: 'rgba(205, 127, 50, 0.3)' },
          ];
          return (
            <div
              className="my-3 overflow-hidden rounded-2xl border-2 p-4 sm:p-5"
              style={{
                borderColor: rankStyles[0].border,
                background: `linear-gradient(160deg, ${rankStyles[0].glow} 0%, ${surfaceColor} 35%)`,
                boxShadow: `0 4px 20px ${rankStyles[0].glow}`,
              }}
            >
              <div className="mb-4 flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl" aria-hidden>🏆</span>
                <div className="min-w-0 flex-1">
                  <h2
                    className="text-base font-bold tracking-tight sm:text-lg"
                    style={{ color: textPrimaryColor }}
                  >
                    Top Clienti per Fatturato
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: textSecondaryColor }}>
                    I tuoi migliori clienti in classifica
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopClients(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: textSecondaryColor }}
                  aria-label="Nascondi classifica top clienti"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {topSpendingClients.map((client, index) => {
                  const rank = rankStyles[index] ?? rankStyles[0];
                  return (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 rounded-xl border-2 p-3 transition-shadow hover:shadow-md sm:p-4"
                      style={{
                        borderColor: rank.border,
                        background: surfaceColor,
                        boxShadow: `0 2px 12px ${rank.glow}`,
                      }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm"
                        style={{ background: rank.bg }}
                        title={`Posto ${index + 1}`}
                      >
                        <span aria-hidden>{rank.emoji}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold dark:text-white" style={{ color: textPrimaryColor }}>
                          {client.nome} {client.cognome}
                        </p>
                        <p className="text-xs font-bold" style={{ color: rank.border }}>
                          {formatCurrency(client.calculatedRevenue)}
                        </p>
                      </div>
                      {index === 0 && <Sparkles className="h-5 w-5 shrink-0 opacity-90" style={{ color: '#D4A017' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        </div>

        {/* Barra ricerca e filtri */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca clienti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white"
              style={{ borderColor: accentSoft }}
            />
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'Tutti', count: clients.length },
              { key: 'nuovo', label: 'Nuovi', count: newClients },
              { key: 'abituale', label: 'Abituali', count: regularClients },
            ].map((filter) => {
              const isActive = filterType === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setFilterType(filter.key as 'all' | 'nuovo' | 'abituale')}
                  className={`whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-medium sm:text-sm ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
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

        {/* Error Alert */}
        {error && (
          <div className="mb-4 sm:mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Lista clienti */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="group relative rounded-2xl border p-4 shadow-lg sm:p-6"
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
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold text-white shadow-lg sm:h-14 sm:w-14 sm:text-lg ${colors.shadowPrimary}`}
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
                      <button
                        type="button"
                        onClick={() => handleEditClient(client)}
                        className="rounded-xl border bg-white/70 p-2 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ borderColor: accentSofter }}
                      >
                        <Edit3 className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClient(client)}
                        className="rounded-xl border bg-white/70 p-2 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-red-900/30"
                        style={{ borderColor: '#FECACA' }}
                      >
                        <Trash2 className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400" />
                      </button>
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
                          <NotebookPen className="h-3 w-3 sm:h-4 sm:w-4" />
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
                </div>
              ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && !loading && (
          <div
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
              <button
                type="button"
                onClick={handleAddClient}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg sm:text-base"
                style={{ background: accentGradient }}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Aggiungi Cliente
              </button>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
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
                  Sei sicuro di voler eliminare il cliente{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientToDelete?.nome} {clientToDelete?.cognome}
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
