import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Euro, User, Calendar, Plus } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import type { CalendarViewProps } from '../../types';

interface DayViewProps extends CalendarViewProps {
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export default function DayView({ 
  currentDate, 
  appointments, 
  clients, 
  onDateClick, 
  onAppointmentClick, 
  onNewAppointment,
  onPreviousDay,
  onNextDay,
  colors 
}: DayViewProps) {
  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter(apt => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  const dayAppointments = getAppointmentsForDate(currentDate);
  const isToday = currentDate.isSame(dayjs(), 'day');

  // Group appointments by hour for better organization
  const groupAppointmentsByHour = () => {
    const grouped: { [hour: string]: typeof dayAppointments } = {};
    
    dayAppointments.forEach(apt => {
      const hour = apt.ora ? apt.ora.slice(0, 2) : '00';
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(apt);
    });
    
    return grouped;
  };

  const groupedAppointments = groupAppointmentsByHour();
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
      <div className="p-6 sm:p-8">
        {/* Day Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPreviousDay}
            className={`
              w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 ${colors.bgHover} dark:${colors.bgHoverDark}
              text-gray-600 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark}
              flex items-center justify-center transition-all duration-200
            `}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {currentDate.format('dddd, D MMMM YYYY')}
            </h2>
            {isToday && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mt-2 ${colors.bgGradient} text-white shadow-lg ${colors.shadowPrimary}`}
              >
                <Calendar className="w-4 h-4" />
                Oggi
              </motion.div>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNextDay}
            className={`
              w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 ${colors.bgHover} dark:${colors.bgHoverDark}
              text-gray-600 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark}
              flex items-center justify-center transition-all duration-200
            `}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Appointments List */}
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent">
          {dayAppointments.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
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
                onClick={onNewAppointment}
                className={`inline-flex items-center gap-3 px-6 py-3 ${colors.bgGradient} hover:${colors.gradientFromLight} hover:${colors.gradientToLight} text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg ${colors.shadowPrimary} hover:shadow-lg ${colors.shadowPrimary}`}
              >
                <Plus className="w-5 h-5" />
                Aggiungi Appuntamento
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {hours.map((hour) => {
                const hourAppointments = groupedAppointments[hour] || [];
                
                return (
                  <div key={hour} className="relative">
                    {/* Hour Label */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-shrink-0 w-16 text-right">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {hour}:00
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                    </div>

                    {/* Appointments for this hour */}
                    <div className="ml-20 space-y-3">
                      {hourAppointments.map((appointment, index) => {
                        const client = getClientById(appointment.client_id);
                        const isCompleted = appointment.status === 'completed';
                        
                        return (
                          <motion.div
                            key={appointment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                              ${isCompleted 
                                ? 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-75' 
                                : `bg-white/80 dark:bg-gray-800/80 ${colors.borderPrimary} dark:${colors.borderPrimary} hover:${colors.borderPrimary} dark:hover:${colors.borderPrimary} hover:shadow-lg ${colors.shadowPrimaryLight}`
                              }
                            `}
                            onClick={() => onAppointmentClick(appointment)}
                          >
                            {/* Subtle gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-${colors.primaryLight}/20 via-transparent to-transparent dark:from-${colors.primaryDark}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            
                            <div className="relative p-6">
                              <div className="flex items-start gap-4">
                                {/* Avatar with status indicator */}
                    
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <h4 className={`
                                      text-sm font-bold truncate
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
                                      
                                  

   
                                  <div className="
                                      inline-flex items-center gap-2 px-4">
                                      
                                      <span className={`
                                    text-sm ml-2 font-normal
                                    ${isCompleted 
                                      ? 'text-gray-400 dark:text-gray-500 line-through' 
                                      : 'text-gray-600 dark:text-gray-400'
                                    }
                                  `}>
                                                   {appointment.tipo_trattamento || 'Nessun trattamento specificato'}
                                                    </span>    
                                    </div>
                                  </div>
                                  
                                
                          
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
