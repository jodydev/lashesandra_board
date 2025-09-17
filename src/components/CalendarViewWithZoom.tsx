import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@mui/material';
import { 
  Plus, 
  Calendar, 
  Users, 
  Euro,
  Loader2,
  X,
  Check,
  Clock
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useGestureDetection } from '../hooks/useGestureDetection';
import type { Client, Appointment, CalendarView } from '../types';
import AppointmentForm from './AppointmentForm';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';

dayjs.locale('it');

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
const formatDateForDisplay = (date: Dayjs) => date.format('dddd, D MMMM YYYY');

export default function CalendarViewWithZoom() {
  const { clientService, appointmentService } = useSupabaseServices();
  const colors = useAppColors();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gesture detection
  const { containerRef, isGesturing, currentScale } = useGestureDetection(
    setCurrentView,
    currentView
  );

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

  // Navigation handlers
  const handlePreviousMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const handlePreviousWeek = () => setCurrentDate(currentDate.subtract(1, 'week'));
  const handleNextWeek = () => setCurrentDate(currentDate.add(1, 'week'));
  const handlePreviousDay = () => setCurrentDate(currentDate.subtract(1, 'day'));
  const handleNextDay = () => setCurrentDate(currentDate.add(1, 'day'));

  const handleDateClick = (date: Dayjs) => {
    setSelectedDate(date);
    setShowAppointmentDetails(true);
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setShowAppointmentForm(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleAppointmentFormSuccess = async () => {
    setShowAppointmentForm(false);
    setEditingAppointment(null);
    // Reload data
    try {
      const [clientsData, appointmentsData] = await Promise.all([
        clientService.getAll(),
        appointmentService.getAll()
      ]);
      setClients(clientsData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error reloading data:', err);
    }
  };

  const handleAppointmentFormCancel = () => {
    setShowAppointmentForm(false);
    setEditingAppointment(null);
  };

  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter(apt => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  // Statistics
  const monthlyStats = {
    totalAppointments: appointments.filter(apt => 
      dayjs(apt.data).isSame(currentDate, 'month')
    ).length,
    totalRevenue: appointments
      .filter(apt => dayjs(apt.data).isSame(currentDate, 'month'))
      .reduce((sum, apt) => sum + apt.importo, 0),
    uniqueClients: new Set(
      appointments
        .filter(apt => dayjs(apt.data).isSame(currentDate, 'month'))
        .map(apt => apt.client_id)
    ).size,
  };

  // View indicator data
  const viewLabels = {
    month: 'Mese',
    week: 'Settimana', 
    day: 'Giorno'
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className={`w-8 h-8 ${colors.textPrimary} animate-spin`} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Caricamento calendario...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md"
        >
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8"
        >
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-${colors.primary} to-gray-900 dark:from-white dark:via-${colors.primaryLight} dark:to-white bg-clip-text text-transparent tracking-tight`}>
              Calendario
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Gestisci i tuoi appuntamenti con eleganza
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bgGradient} text-white rounded-xl shadow-lg ${colors.shadowPrimary}`}
            >
              <Calendar className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {viewLabels[currentView]}
              </span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewAppointment}
              className={`
                inline-flex items-center gap-2 px-6 py-3 ${colors.bgGradient} hover:${colors.gradientFromLight} hover:${colors.gradientToLight}
                text-white font-semibold rounded-xl shadow-lg ${colors.shadowPrimary}
                transition-all duration-200 hover:shadow-lg ${colors.shadowPrimary}
              `}
            >
              <Plus className="w-5 h-5" />
              Nuovo Appuntamento
            </motion.button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8"
        >
          {[
            {
              icon: Calendar,
              value: monthlyStats.totalAppointments,
              label: 'Appuntamenti',
              color: 'pink',
            },
            {
              icon: Users,
              value: monthlyStats.uniqueClients,
              label: 'Clienti',
              color: 'gray',
            },
            {
              icon: Euro,
              value: formatCurrency(monthlyStats.totalRevenue),
              label: 'Fatturato',
              color: 'pink',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -2 }}
              className="
                bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700
                shadow-lg hover:shadow-lg transition-all duration-300
              "
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${stat.color === 'pink' 
                    ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}` 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar Container with Gesture Detection */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
          style={{
            transform: isGesturing ? `scale(${Math.min(Math.max(currentScale, 0.95), 1.05)})` : 'scale(1)',
            transition: isGesturing ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut",
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              {currentView === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  appointments={appointments}
                  clients={clients}
                  onDateClick={handleDateClick}
                  onAppointmentClick={handleEditAppointment}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                  colors={colors}
                />
              )}
              
              {currentView === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  appointments={appointments}
                  clients={clients}
                  onDateClick={handleDateClick}
                  onAppointmentClick={handleEditAppointment}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  colors={colors}
                />
              )}
              
              {currentView === 'day' && (
                <DayView
                  currentDate={currentDate}
                  appointments={appointments}
                  clients={clients}
                  onDateClick={handleDateClick}
                  onAppointmentClick={handleEditAppointment}
                  onNewAppointment={handleNewAppointment}
                  onPreviousDay={handlePreviousDay}
                  onNextDay={handleNextDay}
                  colors={colors}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Gesture Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 Usa il pinch-to-zoom su mobile o Ctrl+scroll su desktop per cambiare vista
          </p>
        </motion.div>

        {/* Appointment Details Modal */}
        <Dialog 
          open={showAppointmentDetails} 
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                onClick={() => setShowAppointmentDetails(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    mass: 0.8
                  }}
                  className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-gray-700/30 w-full max-w-lg max-h-[85vh] overflow-hidden shadow-lg shadow-black/10 dark:shadow-black/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Gradient overlay for depth */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-${colors.primaryLight}/30 via-transparent to-${colors.primaryLight}/20 dark:from-${colors.primaryDark}/20 dark:via-transparent dark:to-${colors.primaryDark}/10 pointer-events-none`} />
                  
                  {selectedDate && (
                    <>
                      {/* Premium Header with floating close button */}
                      <div className="relative p-8 pb-6">
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowAppointmentDetails(false)}
                          className={`absolute top-6 right-6 w-10 h-10 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm ${colors.bgHover} dark:${colors.bgHoverDark} text-gray-500 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark} flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/5`}
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                        
                        <div className="flex items-start gap-4">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                            className={`w-16 h-16 ${colors.bgGradient} text-white rounded-2xl flex items-center justify-center shadow-lg ${colors.shadowPrimary}`}
                          >
                            <Calendar className="w-8 h-8" />
                          </motion.div>
                          
                          <div className="flex-1 pt-1">
                            <motion.h3 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                              className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
                            >
                              {formatDateForDisplay(selectedDate)}
                            </motion.h3>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 }}
                              className="flex items-center gap-2"
                            >
                              <div className={`w-2 h-2 rounded-full ${colors.bgGradient}`} />
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {getAppointmentsForDate(selectedDate).length} {getAppointmentsForDate(selectedDate).length === 1 ? 'appuntamento' : 'appuntamenti'}
                              </p>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content Area with custom scrollbar */}
                      <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent">
                        {getAppointmentsForDate(selectedDate).length === 0 ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center py-16"
                          >
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                              <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                              Giornata libera
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
                              Nessun appuntamento programmato per questa data
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleNewAppointment}
                              className={`inline-flex items-center gap-3 px-6 py-3 ${colors.bgGradient} hover:${colors.gradientFromLight} hover:${colors.gradientToLight} text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg ${colors.shadowPrimary} hover:shadow-lg ${colors.shadowPrimary}`}
                            >
                              <Plus className="w-5 h-5" />
                              Aggiungi Appuntamento
                            </motion.button>
                          </motion.div>
                        ) : (
                          <div className="space-y-4">
                            {getAppointmentsForDate(selectedDate)
                              .sort((a, b) => (a.ora || '00:00').localeCompare(b.ora || '00:00'))
                              .map((appointment, index) => {
                                const client = getClientById(appointment.client_id);
                                const isCompleted = appointment.status === 'completed';
                                
                                return (
                                  <motion.div
                                    key={appointment.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ 
                                      duration: 0.4, 
                                      delay: index * 0.1,
                                      type: "spring",
                                      stiffness: 300
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    className={`
                                      group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                                      ${isCompleted 
                                        ? 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-75' 
                                        : `bg-white/80 dark:bg-gray-800/80 ${colors.borderPrimary} dark:${colors.borderPrimary} hover:${colors.borderPrimary} dark:hover:${colors.borderPrimary} hover:shadow-lg ${colors.shadowPrimaryLight}`
                                      }
                                    `}
                                    onClick={() => handleEditAppointment(appointment)}
                                  >
                                    {/* Subtle gradient overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-r from-${colors.primaryLight}/20 via-transparent to-transparent dark:from-${colors.primaryDark}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    
                                    <div className="relative p-5">
                                      <div className="flex items-center gap-4">
                                        {/* Avatar with status indicator */}
                                        <div className="relative">
                                          <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg
                                            ${isCompleted 
                                              ? 'bg-gradient-to-t from-gray-400 to-gray-500' 
                                              : `${colors.bgGradient} ${colors.shadowPrimary}`
                                            }
                                          `}>
                                            {client ? client.nome.charAt(0).toUpperCase() : '?'}
                                          </div>
                                          {isCompleted && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                              <Check className="w-3 h-3 text-white" />
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`
                                              font-bold truncate
                                              ${isCompleted 
                                                ? 'text-gray-500 dark:text-gray-400 line-through' 
                                                : 'text-gray-900 dark:text-white'
                                              }
                                            `}>
                                              {client 
                                                ? `${client.nome} ${client.cognome}`
                                                : 'Cliente sconosciuto'
                                              }
                                            </h4>
                                            {appointment.ora && (
                                              <div className={`
                                                inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold
                                                ${isCompleted
                                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through'
                                                  : `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}`
                                                }
                                              `}>
                                                <Clock className="w-3 h-3" />
                                                {appointment.ora.slice(0, 5)}
                                              </div>
                                            )}
                                          </div>
                                          
                                          <p className={`
                                            text-sm mb-3 truncate
                                            ${isCompleted 
                                              ? 'text-gray-400 dark:text-gray-500 line-through' 
                                              : 'text-gray-600 dark:text-gray-400'
                                            }
                                          `}>
                                            {appointment.tipo_trattamento || 'Nessun trattamento specificato'}
                                          </p>
                                          
                                          {/* Price tag with modern styling */}
                                          <div className="flex items-center justify-between">
                                            <div className={`
                                              inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold
                                              ${isCompleted
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through'
                                                : `${colors.bgGradient} text-white shadow-lg ${colors.shadowPrimary}`
                                              }
                                            `}>
                                              {formatCurrency(appointment.importo)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Form Dialog */}
        <Dialog 
          open={showAppointmentForm} 
          onClose={handleAppointmentFormCancel}
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
                appointment={editingAppointment}
                selectedDate={selectedDate}
                onSuccess={handleAppointmentFormSuccess}
                onCancel={handleAppointmentFormCancel}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
