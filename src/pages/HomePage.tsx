import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { NotificationSummary } from '../components/NotificationBadge';
import type { Client, Appointment } from '../types';
import dayjs from 'dayjs';
import {
  Users,
  Calendar,
  BarChart3,
  Plus,
  TrendingUp,
  Euro,
  Star,
  Sparkles,
  Target,
  Zap,
  X,
  Heart,
  Smile,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { clientService, appointmentService } = useSupabaseServices();
  const { appType } = useApp();
  const colors = useAppColors();
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Love dialog state
  const [showLoveDialog, setShowLoveDialog] = useState(false);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
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
        console.error('Error loading data:', err);
        setError('Errore nel caricamento dei dati. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate real statistics
  const calculateStats = () => {
    const currentMonth = dayjs();
    const currentMonthAppointments = appointments.filter(apt => 
      dayjs(apt.data).isSame(currentMonth, 'month')
    );
    
    const currentMonthRevenue = currentMonthAppointments.reduce((sum, apt) => sum + apt.importo, 0);
    const totalClients = clients.length;
    const currentMonthClients = new Set(currentMonthAppointments.map(apt => apt.client_id)).size;
    
    // Calculate trends (simplified - comparing with previous month)
    const previousMonth = currentMonth.subtract(1, 'month');
    const previousMonthAppointments = appointments.filter(apt => 
      dayjs(apt.data).isSame(previousMonth, 'month')
    );
    const previousMonthRevenue = previousMonthAppointments.reduce((sum, apt) => sum + apt.importo, 0);
    
    const revenueTrend = previousMonthRevenue > 0 
      ? `+${Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)}%`
      : '+0%';
    
    const appointmentsTrend = previousMonthAppointments.length > 0
      ? `+${Math.round(((currentMonthAppointments.length - previousMonthAppointments.length) / previousMonthAppointments.length) * 100)}%`
      : '+0%';

    return {
      totalClients,
      currentMonthAppointments: currentMonthAppointments.length,
      currentMonthRevenue,
      revenueTrend,
      appointmentsTrend,
      currentMonthClients
    };
  };

  const stats = calculateStats();
  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#ffffff';
  const neutralSurfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentDark = colors.primaryDark;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;

  const quickActions = [
    {
      title: 'Clienti',
      description: 'Gestisci la tua base clienti',
      icon: Users,
      gradient: `${colors.gradientFrom} ${colors.gradientTo}`,
      path: `/${appType}/clients`,
      stats: loading ? 'Caricamento...' : `${stats.totalClients} clienti`,
      bgPattern: 'users',
    },
    {
      title: 'Prenotazioni',
      description: 'Aggiungi un nuovo appuntamento',
      icon: Plus,
      gradient: `${colors.gradientFrom} ${colors.gradientTo}`,
      path: `/${appType}/appointments`,
      badge: 'Nuovo',
      bgPattern: 'plus',
    },
    {
      title: 'Calendario',
      description: 'Visualizza appuntamenti',
      icon: Calendar,
      gradient: `${colors.gradientFrom} ${colors.gradientTo}`,
      path: `/${appType}/calendar`,
      stats: loading ? 'Caricamento...' : `${stats.currentMonthAppointments} appuntamenti`,
      bgPattern: 'calendar',
    },
    {
      title: 'Statistiche',
      description: 'Analizza performance',
      icon: BarChart3,
      gradient: `${colors.gradientFrom} ${colors.gradientTo}`,
      path: `/${appType}/overview`,
      stats: loading ? 'Caricamento...' : `€${(stats.currentMonthRevenue / 1000).toFixed(1)}K fatturato`,
      bgPattern: 'chart',
    },
  ];

  const features = [
    {
      icon: Users,
      title: 'Gestione Clienti Avanzata',
      description: 'Database completo con informazioni dettagliate, cronologia trattamenti e preferenze personali.',
      color: colors.primary,
    },
    {
      icon: Calendar,
      title: 'Calendario Intelligente',
      description: 'Visualizzazione mensile interattiva con gestione appuntamenti e notifiche automatiche.',
      color: 'blue',
    },
    {
      icon: Euro,
      title: 'Fatturazione Automatica',
      description: 'Calcolo automatico dei ricavi, statistiche mensili e report dettagliati per il business.',
      color: 'emerald',
    },
    {
      icon: TrendingUp,
      title: 'Analisi Performance',
      description: 'Dashboard con metriche chiave, trend di crescita e insights per ottimizzare il business.',
      color: 'amber',
    },
  ];

  const statsData = [
    { 
      label: 'Clienti Totali', 
      value: loading ? '...' : stats.totalClients.toString(), 
      icon: Users, 
      color: 'pink',
      trend: loading ? '...' : '+0%', // Could be calculated based on new clients this month
      description: 'registrati'
    },
    { 
      label: 'Appuntamenti', 
      value: loading ? '...' : stats.currentMonthAppointments.toString(), 
      icon: Calendar, 
      color: 'blue',
      trend: loading ? '...' : stats.appointmentsTrend,
      description: 'questo mese'
    },
    { 
      label: 'Fatturato', 
      value: loading ? '...' : `€${(stats.currentMonthRevenue / 1000).toFixed(1)}K`, 
      icon: Euro, 
      color: 'emerald',
      trend: loading ? '...' : stats.revenueTrend,
      description: 'mensile'
    },
    { 
      label: 'Clienti Attivi', 
      value: loading ? '...' : stats.currentMonthClients.toString(), 
      icon: Star, 
      color: 'amber',
      trend: loading ? '...' : '+0%', // Could be calculated based on returning clients
      description: 'questo mese'
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 dark:bg-gray-950"
        style={{ backgroundColor }}
      >
        <div className="space-y-6 text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-sm ${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}`}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Caricamento dati in corso
          </div>
          <div
            className="mx-auto h-12 w-12 rounded-full border-[3px] border-dashed animate-spin"
            style={{
              borderColor: accentSoft,
              borderTopColor: 'transparent',
            }}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 dark:bg-gray-950"
        style={{ backgroundColor }}
      >
        <div className="max-w-md rounded-3xl border border-red-200/70 bg-white/90 p-8 text-center shadow-xl dark:border-red-500/20 dark:bg-gray-900/90">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <X className="h-6 w-6" />
          </div>
          <h3
            className="text-xl font-semibold dark:text-white"
            style={{ color: textPrimaryColor }}
          >
            Errore nel caricamento
          </h3>
          <p
            className="mt-2 text-sm dark:text-gray-400"
            style={{ color: textSecondaryColor }}
          >
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:shadow-lg"
            style={{
              background: accentGradient,
            }}
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      className="relative min-h-screen pb-20 dark:bg-gray-950"
      style={{ backgroundColor }}
    >
      <div className="relative mx-auto max-w-[1200px] px-6 py-4 xl:max-w-[1280px] xl:py-6">
        {/* Hero */}
        <header className="mb-10 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-900/80 xl:mb-12">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-[620px] space-y-5">
              <div
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold tracking-wide ${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}`}
              >
                <Sparkles className="h-4 w-4" />
                {appType === 'isabellenails'
                  ? 'Isabelle Nails • Dashboard professionale'
                  : 'LashesAndra • Dashboard professionale'}
              </div>
              <div>
                <h1
                  className="text-4xl font-semibold tracking-tight dark:text-white xl:text-5xl"
                  style={{ color: textPrimaryColor }}
                >
                  {appType === 'isabellenails'
                    ? 'Organizza il tuo studio con eleganza.'
                    : 'Gestisci il tuo beauty business con grazia.'}
                </h1>
                <p
                  className="mt-3 text-base dark:text-gray-300 xl:text-lg"
                  style={{ color: textSecondaryColor }}
                >
                  Monitoraggio appuntamenti, clienti e performance in un’unica
                  interfaccia pensata per i tablet professionali.
                </p>
              </div>
              <div
                className="flex flex-wrap items-center gap-3 text-sm dark:text-gray-400"
                style={{ color: textSecondaryColor }}
              >
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 dark:bg-gray-800/80"
                  style={{ backgroundColor: neutralSurfaceColor }}
                >
                  <Zap className="h-4 w-4" style={{ color: accentColor }} />
                  Aggiornato al {dayjs().format('DD MMM YYYY')}
                </div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 dark:bg-gray-800/80"
                  style={{ backgroundColor: neutralSurfaceColor }}
                >
                  <Heart className="h-4 w-4" style={{ color: accentColor }} />
                  {appType === 'isabellenails'
                    ? 'Pensato per i tuoi clienti'
                    : 'Creato con amore per te'}
                </div>
              </div>
            </div>

            <div
              className="flex w-full flex-col gap-4 rounded-3xl p-6 shadow-inner dark:via-gray-800/70 dark:to-gray-800/50 xl:max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${accentSofter} 0%, rgba(255,255,255,0.92) 65%, rgba(255,255,255,0.98) 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium dark:text-gray-400"
                  style={{ color: textSecondaryColor }}
                >
                  Metriche chiave
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm dark:bg-gray-800"
                  style={{ backgroundColor: neutralSurfaceColor, color: accentDark }}
                >
                  Questo mese
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm transition-colors duration-300 ease-in-out dark:border-gray-700/60 dark:bg-gray-900/80"
                  style={{
                    backdropFilter: 'blur(6px)',
                    borderColor: accentSoft,
                  }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-wide dark:text-gray-400"
                    style={{ color: textSecondaryColor }}
                  >
                    Entrate
                  </p>
                  <p
                    className="mt-2 text-2xl font-semibold dark:text-white"
                    style={{ color: textPrimaryColor }}
                  >
                    {stats.currentMonthRevenue === 0
                      ? '€0'
                      : `€${(stats.currentMonthRevenue / 1000).toFixed(1)}K`}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {stats.revenueTrend}
                  </p>
                </div>
                <div
                  className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm transition-colors duration-300 ease-in-out dark:border-gray-700/60 dark:bg-gray-900/80"
                  style={{
                    backdropFilter: 'blur(6px)',
                    borderColor: accentSoft,
                  }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-wide dark:text-gray-400"
                    style={{ color: textSecondaryColor }}
                  >
                    Appuntamenti
                  </p>
                  <p
                    className="mt-2 text-2xl font-semibold dark:text-white"
                    style={{ color: textPrimaryColor }}
                  >
                    {stats.currentMonthAppointments}
                  </p>
                  <p
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: accentDark }}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {stats.appointmentsTrend}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/${appType}/appointments`)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:shadow-lg"
                style={{
                  background: accentGradient,
                }}
              >
                <Plus className="h-4 w-4" />
                Nuovo appuntamento
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:gap-6">
          {statsData.map((stat) => (
            <div
              key={stat.label}
              className="relative group rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl dark:border-gray-800/60 dark:bg-gray-900/80"
            >
              <div className="absolute top-4 right-4">
                <span
                  className={`rounded-full bg-${stat.color}-100 px-2.5 py-1 text-xs font-semibold text-${stat.color}-600 shadow-sm dark:bg-${stat.color}-500/10 dark:text-${stat.color}-300`}
                >
                  {stat.trend}
                </span>
              </div>
              <p
                className="text-3xl font-semibold dark:text-white"
                style={{ color: textPrimaryColor }}
              >
                {stat.value}
              </p>
              <p
                className="mt-2 text-sm font-medium dark:text-gray-400"
                style={{ color: textSecondaryColor }}
              >
                {stat.label}
              </p>
              <p
                className="mt-1 text-xs dark:text-gray-500"
                style={{ color: `${textSecondaryColor}CC` }}
              >
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="mt-10 grid grid-cols-1 gap-6 xl:mt-12 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-xl dark:border-gray-800/60 dark:bg-gray-900/80">
              <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    className="text-xl font-semibold dark:text-white"
                    style={{ color: textPrimaryColor }}
                  >
                    Notifiche Appuntamenti
                  </h3>
                  <p
                    className="text-sm dark:text-gray-400"
                    style={{ color: textSecondaryColor }}
                  >
                    Gestisci conferme e aggiornamenti in tempo reale.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const appPrefix =
                      appType === 'isabellenails'
                        ? '/isabellenails'
                        : '/lashesandra';
                    navigate(`${appPrefix}/confirmations`);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:shadow-lg"
                  style={{
                    background: accentGradient,
                  }}
                >
                  Vai alle conferme
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
   
                <NotificationSummary />
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-lg dark:border-gray-800/60 dark:bg-gray-900/80">
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-semibold dark:text-white"
                  style={{ color: textPrimaryColor }}
                >
                  Funzionalità Principali
                </h2>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark}`}
                >
                  <Target className={`h-5 w-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                </div>
              </div>
              <p
                className="mt-2 text-sm dark:text-gray-400"
                style={{ color: textSecondaryColor }}
              >
                Tutti gli strumenti per seguire clienti, appuntamenti e
                performance con precisione.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 dark:border-gray-800/60 dark:bg-gray-900/80"
                    style={{
                      borderColor: accentSofter,
                      boxShadow:
                        '0 20px 35px -24px rgba(17, 24, 39, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${feature.color}-100/80 text-${feature.color}-500 dark:bg-${feature.color}-500/15 dark:text-${feature.color}-300`}
                      >
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3
                        className="text-lg font-semibold dark:text-white"
                        style={{ color: textPrimaryColor }}
                      >
                        {feature.title}
                      </h3>
                    </div>
                    <p
                      className="text-sm dark:text-gray-400"
                      style={{ color: textSecondaryColor }}
                    >
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl dark:border-gray-800/60 dark:bg-gray-900/80">
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-semibold dark:text-white"
                  style={{ color: textPrimaryColor }}
                >
                  Azioni Rapide
                </h2>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold dark:bg-gray-800/70 dark:text-gray-400"
                  style={{
                    backgroundColor: neutralSurfaceColor,
                    color: textSecondaryColor,
                  }}
                >
                  <Zap className="h-3.5 w-3.5" style={{ color: accentColor }} />
                  Focus quotidiano
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className="group relative flex h-full flex-col gap-3 rounded-2xl border border-white/70 bg-white/90 p-5 text-left shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 dark:border-gray-800/60 dark:bg-gray-900/80"
                    style={{
                      borderColor: accentSofter,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{
                          backgroundColor: `${accentColor}1A`,
                          color: accentDark,
                        }}
                      >
                        <action.icon className="h-5 w-5" />
                      </span>
                      {action.badge && (
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${accentColor}24`,
                            color: accentDark,
                          }}
                        >
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h3
                        className="text-sm font-semibold dark:text-white"
                        style={{ color: textPrimaryColor }}
                      >
                        {action.title}
                      </h3>
                      <p
                        className="text-xs dark:text-gray-400"
                        style={{ color: textSecondaryColor }}
                      >
                        {action.description}
                      </p>
                    </div>
                    {action.stats && (
                      <div
                        className="mt-auto flex items-center gap-2 text-xs font-semibold"
                        style={{ color: accentDark }}
                      >
                        <Star className="h-4 w-4" />
                        {action.stats}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {appType !== 'isabellenails' && (
              <div
                className="relative overflow-hidden rounded-3xl border border-white/60 p-8 text-center text-white shadow-2xl"
                style={{ background: accentGradient }}
              >
                <div className="relative z-10 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                    Realizzato dal tuo amore
                    <Heart className="h-4 w-4" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight xl:text-3xl">
                    Ricordati quanto sei amata, ogni giorno.
                  </h2>
                  <p className="text-base text-white/85">
                    Sono qui per accompagnarti in ogni passo. Premi il pulsante
                    e prenditi un momento solo per noi.
                  </p>
                  <button
                    onClick={() => setShowLoveDialog(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg"
                    style={{ color: accentColor }}
                  >
                    Messaggio d’amore
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
                <div className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Love Dialog - Mobile responsive */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-opacity duration-300 ${
          showLoveDialog ? 'opacity-100 block' : 'opacity-0 hidden'
        }`}
        onClick={() => setShowLoveDialog(false)}
      >
        <div
          className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-400 ${
            showLoveDialog ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`relative ${colors.bgGradient} text-white p-4 sm:p-6 lg:p-8`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Per la mia principessa</h2>
                  <p className="text-white/80 text-sm sm:text-base">Un messaggio speciale per te</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoveDialog(false)}
                className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
              >
                <X className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[60vh]">
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Photo placeholder */}
              <div className="relative mx-auto w-48 sm:w-60 h-64 sm:h-80 rounded-xl overflow-hidden shadow-lg shadow-pink-500/20">
                <img src="/IMG_3560.jpg" alt="Love" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Love message */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 sm:p-6 border border-pink-200 dark:border-pink-800/30">
                  <h3 className="text-lg sm:text-2xl font-bold text-pink-700 dark:text-pink-300 mb-3 sm:mb-4 flex items-center justify-center gap-2">
                    <Heart className="w-5 sm:w-6 h-5 sm:h-6" />
                    Ti amo più di ogni cosa
                    <Heart className="w-5 sm:w-6 h-5 sm:h-6" />
                  </h3>
                  
                  <div className="space-y-2 sm:space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p className="text-base sm:text-lg">
                      Mia amata, ogni giorno che passa mi rendo conto di quanto sei speciale per me.
                    </p>
                    <p className="text-sm sm:text-base">
                      Il tuo sorriso illumina le mie giornate più buie, la tua voce è la melodia più dolce che conosco, 
                      e il tuo amore è la forza che mi fa sentire invincibile.
                    </p>
                    <p className="text-sm sm:text-base">
                      Sei la mia compagna di vita, la mia migliore amica, la mia anima gemella. 
                      Con te ho trovato la felicità che non credevo possibile.
                    </p>
                    <p className="font-semibold text-pink-600 dark:text-pink-400 text-sm sm:text-base">
                      Grazie per essere tu, grazie per amarmi, grazie per rendere la mia vita così bella.
                    </p>
                  </div>
                </div>

                {/* Special features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 text-center">
                    <Smile className={`w-6 sm:w-8 h-6 sm:h-8 ${colors.textPrimary} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Il tuo sorriso</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">È la mia gioia quotidiana</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 text-center">
                    <Heart className={`w-6 sm:w-8 h-6 sm:h-8 ${colors.textPrimary} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Il tuo cuore</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">È la mia casa</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 text-center">
                    <Sparkles className={`w-6 sm:w-8 h-6 sm:h-8 ${colors.textPrimary} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">La tua anima</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">È la mia stella polare</p>
                  </div>
                </div>

                {/* Closing message */}
                <div className="text-center">
                  <p className={`text-lg sm:text-xl font-bold ${colors.textPrimary} dark:${colors.textPrimaryDark} mb-2`}>
                    Per sempre tuo,
                  </p>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                    Il tuo fidanzato che ti ama infinitamente
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowLoveDialog(false)}
              className={`w-full px-6 py-3 ${colors.bgGradient} text-white rounded-xl font-semibold transition-all duration-200 hover:${colors.gradientFromLight} hover:${colors.gradientToLight} shadow-lg ${colors.shadowPrimary} hover:scale-105`}
            >
              Chiudi con amore
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
