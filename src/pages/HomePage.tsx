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
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white dark:from-gray-900 dark:via-gray-900 flex items-center justify-center ${
        appType === 'isabellenails' 
          ? 'to-purple-50/30 dark:to-purple-950/20' 
          : 'to-pink-50/30 dark:to-pink-950/20'
      }`}>
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-full ${colors.textPrimary} dark:${colors.textPrimaryDark} text-sm font-medium mb-6`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            Caricamento dati...
          </div>
          <div className={`w-8 h-8 border-4 ${colors.borderPrimary} border-t-${colors.primary} rounded-full animate-spin mx-auto`}></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-pink-950/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="p-4 bg-red-100 dark:bg-red-950/30 rounded-2xl text-red-600 dark:text-red-400 mb-4">
            <X className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">Errore di caricamento</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
      >
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-full ${colors.textPrimary} dark:${colors.textPrimaryDark} text-sm font-medium mb-6`}>
            <Sparkles className="w-4 h-4" />
           {appType === 'isabellenails' ? 'Benvenuta nel tuo spazio di lavoro migliore amica del mio amore' : 'Benvenuto nel tuo spazio di lavoro amore mio'}
          </div>
          
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-${colors.primary} to-gray-900 dark:from-white dark:via-${colors.primaryLight} dark:to-white bg-clip-text text-transparent mb-6 leading-tight`}>
            {appType === 'isabellenails' ? 'Isabelle Nails Board' : 'LashesAndra Board'}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            La piattaforma completa per gestire il tuo business estetico con eleganza e professionalità.
            Monitora clienti, appuntamenti e performance in un'unica soluzione moderna.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
            {statsData.map((stat) => (
              <div
                key={stat.label}
                className="group"
              >
                <div className={`
                  relative p-6 rounded-2xl bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700
                  shadow-lg hover:shadow-lg transition-all duration-300
                  hover:border-${stat.color}-200 dark:hover:border-${stat.color}-800
                `}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`
                      p-2 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-950/30
                      text-${stat.color}-600 dark:text-${stat.color}-400
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className={`
                      text-xs font-semibold px-2 py-1 rounded-full
                      bg-${stat.color}-100 dark:bg-${stat.color}-950/30
                      text-${stat.color}-600 dark:text-${stat.color}-400
                    `}>
                      {stat.trend}
                    </div>
                  </div>
                  
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {stat.label}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications Widget */}
        <div className="mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Notifiche Appuntamenti
              </h3>
              <button
                onClick={() => {
                  const appPrefix = appType === 'isabellenails' ? '/isabellenails' : '/lashesandra';
                  navigate(`${appPrefix}/confirmations`);
                }}
                className={`px-4 py-2 ${colors.bgGradient} text-white rounded-xl font-medium hover:${colors.gradientFromLight} hover:${colors.gradientToLight} transition-colors`}
              >
                Vai alle conferme
              </button>
            </div>
            <NotificationSummary />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark}`}>
              <Zap className={`w-5 h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Azioni Rapide
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <div
                key={action.title}
                className="group cursor-pointer hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                onClick={() => navigate(action.path)}
              >
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-lg transition-all duration-500">
                  {/* Gradient Header */}
                  <div className={`
                    relative p-6 bg-gradient-to-br ${action.gradient} text-white
                    group-hover:scale-105 transition-transform duration-500 origin-top
                  `}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                        <action.icon className="w-6 h-6" />
                      </div>
                      {action.badge && (
                        <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                          {action.badge}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                    <p className="text-white/90 text-sm leading-relaxed">{action.description}</p>
                    
                    {/* Decorative Pattern */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                    <div className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full bg-white/5" />
                  </div>
                  
     
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <div className={`absolute inset-0 ${colors.primary}/20 rounded-2xl blur-xl`} />
                <div className={`relative p-3 rounded-2xl ${colors.bgGradient} shadow-lg`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Funzionalità Principali
              </h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Scopri tutti gli strumenti avanzati che trasformeranno il modo di gestire il tuo business estetico
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group hover:-translate-y-2 transition-all duration-300"
              >
                <div className="relative h-full">
                  {/* Background Glow Effect */}
                  <div className={`absolute -inset-1 ${colors.bgGradientLight} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700`} />
                  
                  {/* Main Card */}
                  <div className={`relative h-full p-8 lg:p-10 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-lg ${colors.shadowPrimaryLight} transition-all duration-700 overflow-hidden`}>
                    
                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${feature.color}-400 to-${feature.color}-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                    
                    <div className="flex items-start gap-6">
                      {/* Icon Container */}
                      <div className="relative flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        {/* Icon Background Glow */}
                        <div className={`absolute inset-0 bg-${feature.color}-500/20 rounded-2xl blur-lg scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                        
                        {/* Icon Container */}
                        <div className={`
                          relative p-5 rounded-2xl
                          bg-gradient-to-br from-${feature.color}-50 to-${feature.color}-100
                          dark:from-${feature.color}-950/30 dark:to-${feature.color}-900/20
                          border border-${feature.color}-200/50 dark:border-${feature.color}-800/30
                          shadow-lg shadow-${feature.color}-500/10
                          group-hover:shadow-lg group-hover:shadow-${feature.color}-500/20
                          transition-all duration-500
                        `}>
                          <feature.icon className={`w-8 h-8 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                            text-xl lg:text-2xl font-bold mb-4
                            text-${feature.color}-600 dark:text-${feature.color}-400
                            group-hover:text-${feature.color}-700 dark:group-hover:text-${feature.color}-300
                            transition-colors duration-300
                          `}
                        >
                          {feature.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base lg:text-lg group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                          {feature.description}
                        </p>

                      </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${colors.primaryLight}/30 group-hover:${colors.primaryLight}/60 transition-colors duration-500`} />
                    <div className={`absolute bottom-8 right-8 w-1 h-1 rounded-full ${colors.primaryLight}/40 group-hover:${colors.primaryLight}/80 transition-colors duration-500`} />
                    
                    {/* Hover Gradient Overlay */}
                    <div className={`
                      absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100
                      bg-gradient-to-br from-${feature.color}-50/30 via-transparent to-${feature.color}-100/20
                      dark:from-${feature.color}-950/20 dark:via-transparent dark:to-${feature.color}-900/10
                      transition-opacity duration-700 pointer-events-none
                    `} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Call to Action */}
        {appType !== 'isabellenails' && (
        <div>
          <div className={`relative overflow-hidden rounded-3xl ${colors.bgGradient} p-12 text-center text-white`}>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                Realizzato dal tuo Amore <Heart
                className="w-4 h-4"
              />
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ricordati sempre quanto il tuo fidanzato ti ama.
              </h2>
              
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
                Lui ci sarà sempre per te, dovrai solamente dargli la possibilità di farlo.
              </p>
              
              <button
                onClick={() => setShowLoveDialog(true)}
                className={`inline-flex items-center gap-3 px-8 py-4 bg-white ${colors.textPrimary} rounded-2xl font-semibold text-lg shadow-lg hover:shadow-lg transition-all duration-300 hover:scale-105`}
              >
                Clicca qui per ricordarti quanto il tuo fidanzato ti ama
                <Heart className="w-5 h-5" />
              </button>
            </div>
            
            {/* Background Decorations */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-white/30" />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-white/40" />
            <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>
        )}
      </div>

      {/* Love Dialog */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-opacity duration-300 ${
          showLoveDialog ? 'opacity-100 block' : 'opacity-0 hidden'
        }`}
        onClick={() => setShowLoveDialog(false)}
      >
        <div
          className={`bg-white dark:bg-gray-900 rounded-3xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-400 ${
            showLoveDialog ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`relative ${colors.bgGradient} text-white p-8`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Per la mia principessa</h2>
                  <p className="text-white/80">Un messaggio speciale per te</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoveDialog(false)}
                className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[60vh]">
            <div className="text-center space-y-6">
              {/* Photo placeholder */}
              <div className="relative mx-auto w-60 h-80 rounded-3xl overflow-hidden shadow-lg shadow-pink-500/20">
                <img src="/IMG_3560.jpg" alt="Love" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Love message */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl p-6 border border-pink-200 dark:border-pink-800/30">
                  <h3 className="text-2xl font-bold text-pink-700 dark:text-pink-300 mb-4 flex items-center justify-center gap-2">
                    <Heart className="w-6 h-6" />
                    Ti amo più di ogni cosa
                    <Heart className="w-6 h-6" />
                  </h3>
                  
                  <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p className="text-lg">
                      Mia amata, ogni giorno che passa mi rendo conto di quanto sei speciale per me.
                    </p>
                    <p>
                      Il tuo sorriso illumina le mie giornate più buie, la tua voce è la melodia più dolce che conosco, 
                      e il tuo amore è la forza che mi fa sentire invincibile.
                    </p>
                    <p>
                      Sei la mia compagna di vita, la mia migliore amica, la mia anima gemella. 
                      Con te ho trovato la felicità che non credevo possibile.
                    </p>
                    <p className="font-semibold text-pink-600 dark:text-pink-400">
                      Grazie per essere tu, grazie per amarmi, grazie per rendere la mia vita così bella.
                    </p>
                  </div>
                </div>

                {/* Special features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                    <Smile className={`w-8 h-8 ${colors.textPrimary} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Il tuo sorriso</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">È la mia gioia quotidiana</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                    <Heart className={`w-8 h-8 ${colors.textPrimary} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Il tuo cuore</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">È la mia casa</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                    <Sparkles className={`w-8 h-8 ${colors.textPrimary} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">La tua anima</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">È la mia stella polare</p>
                  </div>
                </div>

                {/* Closing message */}
                <div className="text-center">
                  <p className={`text-xl font-bold ${colors.textPrimary} dark:${colors.textPrimaryDark} mb-2`}>
                    Per sempre tuo,
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Il tuo fidanzato che ti ama infinitamente
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowLoveDialog(false)}
              className={`w-full px-6 py-3 ${colors.bgGradient} text-white rounded-2xl font-semibold transition-all duration-200 hover:${colors.gradientFromLight} hover:${colors.gradientToLight} shadow-lg ${colors.shadowPrimary} hover:scale-105`}
            >
              Chiudi con amore
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
