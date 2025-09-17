import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar, 
  Users, 
  Euro,
  Clock,
  X,
  Loader2,
  Check
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { clientService, appointmentService } from '../lib/supabase';
import type { Client, Appointment } from '../types';
import AppointmentForm from './AppointmentForm';

dayjs.locale('it');

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
const formatDateForDisplay = (date: Dayjs) => date.format('dddd, D MMMM YYYY');

export default function ModernCalendarView() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handlePreviousMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
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

  const renderCalendar = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const weeks = [];
    let currentWeek = startOfWeek;

    while (currentWeek.isBefore(endOfWeek) || currentWeek.isSame(endOfWeek, 'week')) {
      const weekDays = [];
      
      for (let i = 0; i < 7; i++) {
        const day = currentWeek.add(i, 'day');
        const isCurrentMonth = day.isSame(currentDate, 'month');
        const isToday = day.isSame(dayjs(), 'day');
        const dayAppointments = getAppointmentsForDate(day);
        const hasAppointments = dayAppointments.length > 0;

        weekDays.push(
          <motion.div
            key={day.format('YYYY-MM-DD')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative"
          >
            <div
              className={`
                h-16 sm:h-24 md:h-28 lg:h-32 p-1 sm:p-2 md:p-3 cursor-pointer rounded-xl sm:rounded-xl border transition-all duration-300
                ${isCurrentMonth 
                  ? isToday 
                    ? 'bg-pink-50 dark:bg-pink-950/20 border-pink-500 shadow-lg shadow-pink-500/20' 
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600'
                  : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'
                }
                hover:shadow-lg hover:shadow-pink-500/10 dark:hover:shadow-pink-500/5
                flex flex-col justify-between
              `}
              onClick={() => handleDateClick(day)}
            >
              {/* Day number */}
              <div className="flex items-start justify-between">
                <span
                  className={`
                    text-xs sm:text-sm md:text-base font-semibold leading-none
                    ${isCurrentMonth 
                      ? isToday 
                        ? 'text-pink-600 dark:text-pink-400' 
                        : 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-600'
                    }
                  `}
                >
                  {day.format('D')}
                </span>
                
                {hasAppointments && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full animate-pulse" />
                )}
              </div>
              
              {/* Appointments preview */}
              {hasAppointments && (
                <div className="space-y-0.5 sm:space-y-1 mt-auto">
                  {dayAppointments
                    .sort((a, b) => {
                      const timeA = a.ora || '00:00';
                      const timeB = b.ora || '00:00';
                      return timeA.localeCompare(timeB);
                    })
                    .slice(0, window.innerWidth < 640 ? 2 : 3)
                    .map((apt) => {
                      const client = getClientById(apt.client_id);
                      const isCompleted = apt.status === 'completed';
                      return (
                        <div
                          key={apt.id}
                          className={`
                            h-2 sm:h-3 md:h-4 px-1 sm:px-1.5 rounded-sm sm:rounded-md bg-pink-100 dark:bg-pink-900/30 
                            flex items-center text-xs font-medium overflow-hidden
                            ${isCompleted ? 'opacity-60 line-through' : ''}
                          `}
                        >
                          {/* Mobile: solo nome e cognome */}
                          <span className="text-pink-600 dark:text-pink-400 whitespace-nowrap text-xs sm:hidden">
                            {client ? `${client.nome} ${client.cognome}` : '?'}
                          </span>
                          
                          {/* Desktop: orario + nome e cognome */}
                          <div className="hidden sm:flex items-center justify-between w-full">
                            <span className="text-pink-700 dark:text-pink-300 whitespace-nowrap text-xs">
                              {apt.ora?.slice(0, 5) || '00:00'}
                            </span>
                            <span className="text-pink-600 dark:text-pink-400 whitespace-nowrap ml-1 text-xs">
                              {client ? `${client.nome} ${client.cognome}` : '?'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  
                  {dayAppointments.length > (window.innerWidth < 640 ? 2 : 3) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                      +{dayAppointments.length - (window.innerWidth < 640 ? 2 : 3)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      }
      
      weeks.push(
        <div key={currentWeek.format('YYYY-MM-DD')} className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
          {weekDays}
        </div>
      );
      
      currentWeek = currentWeek.add(1, 'week');
    }

    return weeks;
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Calendario
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Gestisci i tuoi appuntamenti con eleganza
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewAppointment}
            className="
              inline-flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 
              text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 
              transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/30
            "
          >
            <Plus className="w-5 h-5" />
            Nuovo Appuntamento
          </motion.button>
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
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' 
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

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePreviousMonth}
                className="
                  w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-900/30
                  text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400
                  flex items-center justify-center transition-all duration-200
                "
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {currentDate.format('MMMM YYYY')}
              </h2>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNextMonth}
                className="
                  w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-900/30
                  text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400
                  flex items-center justify-center transition-all duration-200
                "
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                <div key={day} className="text-center py-3">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2 sm:space-y-3">
              {renderCalendar()}
            </div>
          </div>
        </motion.div>
        {/* Appointment Details Modal - Redesigned with premium glass morphism */}
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
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-transparent to-pink-100/20 dark:from-pink-950/20 dark:via-transparent dark:to-pink-900/10 pointer-events-none" />
                
                {selectedDate && (
                  <>
                    {/* Premium Header with floating close button */}
                    <div className="relative p-8 pb-6">
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAppointmentDetails(false)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/5"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                      
                      <div className="flex items-start gap-4">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                          className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25"
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
                            <div className="w-2 h-2 rounded-full bg-pink-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {selectedDateAppointments.length} {selectedDateAppointments.length === 1 ? 'appuntamento' : 'appuntamenti'}
                            </p>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Area with custom scrollbar */}
                    <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent">
                      {selectedDateAppointments.length === 0 ? (
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
                            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/30"
                          >
                            <Plus className="w-5 h-5" />
                            Aggiungi Appuntamento
                          </motion.button>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {selectedDateAppointments
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
                                      : 'bg-white/80 dark:bg-gray-800/80 border-pink-200/50 dark:border-pink-800/30 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-lg hover:shadow-pink-500/10'
                                    }
                                  `}
                                  onClick={() => handleEditAppointment(appointment)}
                                >
                                  {/* Subtle gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-pink-50/20 via-transparent to-transparent dark:from-pink-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  <div className="relative p-5">
                                    <div className="flex items-center gap-4">
                                      {/* Avatar with status indicator */}
                                      <div className="relative">
                                        <div className={`
                                          w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg
                                          ${isCompleted 
                                            ? 'bg-gradient-to-t from-gray-400 to-gray-500' 
                                            : 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-pink-500/25'
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
                                                : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
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
                                        
                               
                                      </div>

                                               {/* Price tag with modern styling */}
                                               <div className="flex items-center justify-between">
                                          <div className={`
                                            inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold
                                            ${isCompleted
                                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through'
                                              : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/20'
                                            }
                                          `}>
                                            {formatCurrency(appointment.importo)}
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