import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Send, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Phone,
  Sparkles,
  Eye,
  X
} from 'lucide-react';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { useWhatsAppService } from '../lib/whatsappService';
import { supabase } from '../lib/supabase';
import MessageTemplateEditor from './MessageTemplateEditor';
import MessageLogTable from './MessageLogTable';
import type { AppointmentWithClient } from '../types';
import dayjs from 'dayjs';

interface AdminPanelProps {
  onClose?: () => void;
}

type TabType = 'overview' | 'appointments' | 'templates' | 'logs' | 'settings';

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const colors = useAppColors();
  const { tablePrefix } = useApp();
  const whatsappService = useWhatsAppService();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Overview data
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    todayAppointments: 0
  });
  
  // Appointments data
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  // WhatsApp status
  const [whatsappStatus, setWhatsappStatus] = useState({
    isConfigured: false,
    isActive: false,
    lastRun: null as string | null
  });

  useEffect(() => {
    loadOverviewData();
    loadAppointments();
    checkWhatsAppStatus();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Load today's appointments
      const today = dayjs().format('YYYY-MM-DD');
      const { data: todayAppointments } = await supabase
        .from(`${tablePrefix}appointments`)
        .select('*')
        .eq('data', today);
      
      // Load message stats
      const messageLogs = await whatsappService.getMessageLogs(1000);
      const pendingCount = messageLogs.filter(log => log.message_status === 'pending').length;
      const sentCount = messageLogs.filter(log => log.message_status === 'sent' || log.message_status === 'delivered').length;
      const failedCount = messageLogs.filter(log => log.message_status === 'failed').length;
      
      setStats({
        totalAppointments: todayAppointments?.length || 0,
        pendingMessages: pendingCount,
        sentMessages: sentCount,
        failedMessages: failedCount,
        todayAppointments: todayAppointments?.length || 0
      });
      
    } catch (err) {
      console.error('Errore nel caricamento dati overview:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const { data: appointments, error: appointmentsError } = await supabase
        .from(`${tablePrefix}appointments`)
        .select('*')
        .eq('data', selectedDate)
        .order('ora', { ascending: true });
      
      if (appointmentsError) throw appointmentsError;
      
      if (appointments && appointments.length > 0) {
        const clientIds = appointments.map(apt => apt.client_id);
        const { data: clients, error: clientsError } = await supabase
          .from(`${tablePrefix}clients`)
          .select('*')
          .in('id', clientIds);
        
        if (clientsError) throw clientsError;
        
        const appointmentsWithClients = appointments.map(appointment => ({
          ...appointment,
          client: clients?.find(client => client.id === appointment.client_id) || null
        }));
        
        setAppointments(appointmentsWithClients);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Errore nel caricamento appuntamenti:', err);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      await whatsappService.initializeConfig();
      setWhatsappStatus({
        isConfigured: true,
        isActive: true,
        lastRun: null // TODO: Get from database
      });
    } catch (err) {
      setWhatsappStatus({
        isConfigured: false,
        isActive: false,
        lastRun: null
      });
    }
  };

  const handleSendConfirmations = async () => {
    try {
      setLoading(true);
      const results = await whatsappService.sendTomorrowConfirmations();
      
      if (results.sent > 0 || results.failed > 0) {
        await loadOverviewData();
        setError(null);
      }
      
      if (results.errors.length > 0) {
        setError(`Alcuni messaggi non sono stati inviati: ${results.errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Errore nell\'invio conferme:', err);
      setError('Errore nell\'invio dei messaggi di conferma');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSingleMessage = async (appointmentId: string) => {
    try {
      // TODO: Implement single message sending
      console.log('Sending single message for appointment:', appointmentId);
    } catch (err) {
      console.error('Errore nell\'invio singolo messaggio:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: BarChart3 },
    { id: 'appointments', label: 'Appuntamenti', icon: Calendar },
    { id: 'templates', label: 'Template', icon: MessageSquare },
    { id: 'logs', label: 'Log Messaggi', icon: Eye },
    { id: 'settings', label: 'Impostazioni', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Appuntamenti Oggi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayAppointments}</p>
            </div>
            <div className={`w-12 h-12 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl flex items-center justify-center`}>
              <Calendar className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messaggi Inviati</p>
              <p className="text-2xl font-bold text-green-600">{stats.sentMessages}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Attesa</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingMessages}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Falliti</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedMessages}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* WhatsApp Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stato WhatsApp
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            whatsappStatus.isConfigured && whatsappStatus.isActive
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {whatsappStatus.isConfigured && whatsappStatus.isActive ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Attivo
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Non Configurato
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendConfirmations}
            disabled={loading || !whatsappStatus.isConfigured}
            className={`flex items-center gap-2 px-4 py-2 ${colors.bgGradient} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Invio...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Invia Conferme
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadOverviewData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Appuntamenti del Giorno
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              loadAppointments();
            }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-200 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((appointment, index) => (
          <motion.div
            key={appointment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl flex items-center justify-center`}>
                  <Users className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {appointment.client?.nome} {appointment.client?.cognome}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {appointment.client?.telefono}
                    </span>
                    {appointment.ora && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.ora}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      {appointment.tipo_trattamento || 'Generico'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendSingleMessage(appointment.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                  Invia
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}

        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Nessun appuntamento per questa data
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'appointments':
        return renderAppointments();
      case 'templates':
        return <MessageTemplateEditor />;
      case 'logs':
        return <MessageLogTable onRefresh={loadOverviewData} />;
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Impostazioni WhatsApp in arrivo...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${colors.bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pannello Amministratore WhatsApp
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestisci l'invio automatico dei messaggi di conferma
              </p>
            </div>
          </div>
          
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark} shadow-lg`
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-200px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
