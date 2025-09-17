import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Euro } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import type { CalendarViewProps } from '../../types';

interface WeekViewProps extends CalendarViewProps {
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export default function WeekView({ 
  currentDate, 
  appointments, 
  clients, 
  onDateClick, 
  onAppointmentClick, 
  onPreviousWeek,
  onNextWeek,
  colors 
}: WeekViewProps) {
  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter(apt => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  const getWeekDays = () => {
    const startOfWeek = currentDate.startOf('week');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }
    
    return days;
  };

  const weekDays = getWeekDays();
  const isToday = (date: Dayjs) => date.isSame(dayjs(), 'day');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
      <div className="p-6 sm:p-8">
        {/* Week Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPreviousWeek}
            className={`
              w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 ${colors.bgHover} dark:${colors.bgHoverDark}
              text-gray-600 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark}
              flex items-center justify-center transition-all duration-200
            `}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {weekDays[0].format('D MMM')} - {weekDays[6].format('D MMM YYYY')}
          </h2>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNextWeek}
            className={`
              w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 ${colors.bgHover} dark:${colors.bgHoverDark}
              text-gray-600 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark}
              flex items-center justify-center transition-all duration-200
            `}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <motion.div
                key={day.format('YYYY-MM-DD')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  min-h-[200px] sm:min-h-[300px] p-3 sm:p-4 rounded-2xl border transition-all duration-300
                  ${isCurrentDay 
                    ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.borderPrimary} shadow-lg ${colors.shadowPrimary}` 
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }
                `}
                onClick={() => onDateClick(day)}
              >
                {/* Day Header */}
                <div className="flex flex-col items-center mb-4">
                  <span className={`
                    text-sm font-semibold uppercase tracking-wider
                    ${isCurrentDay 
                      ? `${colors.textPrimary} dark:${colors.textPrimaryDark}` 
                      : 'text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {day.format('ddd')}
                  </span>
                  <span className={`
                    text-2xl font-bold mt-1
                    ${isCurrentDay 
                      ? `${colors.textPrimary} dark:${colors.textPrimaryDark}` 
                      : 'text-gray-900 dark:text-white'
                    }
                  `}>
                    {day.format('D')}
                  </span>
                </div>

                {/* Appointments */}
                <div className="space-y-2">
                  {dayAppointments
                    .sort((a, b) => (a.ora || '00:00').localeCompare(b.ora || '00:00'))
                    .map((appointment) => {
                      const client = getClientById(appointment.client_id);
                      const isCompleted = appointment.status === 'completed';
                      
                      return (
                        <motion.div
                          key={appointment.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            p-2 sm:p-3 rounded-xl border cursor-pointer transition-all duration-200
                            ${isCompleted 
                              ? 'bg-gray-100 dark:bg-gray-600/50 border-gray-200 dark:border-gray-500 opacity-75' 
                              : `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.borderPrimary} dark:${colors.borderPrimary} hover:shadow-md ${colors.shadowPrimaryLight}`
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(appointment);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold text-gray-400  ${isCompleted ? 'line-through' : ''}`}>
                              {appointment.ora?.slice(0, 5) || '00:00'}
                            </span>
                          </div>
                          
                          <div className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'} truncate`}>
                            {client ? `${client.nome} ${client.cognome}` : 'Cliente sconosciuto'}
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-600 dark:text-gray-400'} truncate`}>
                              {appointment.tipo_trattamento || 'Nessun trattamento'}
                            </span>
                            <div className={`flex items-center gap-1 text-xs font-bold ${isCompleted ? 'text-gray-400 line-through' : colors.textPrimary}`}>
                              <Euro className="w-3 h-3" />
                              {appointment.importo.toFixed(0)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  
                  {dayAppointments.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        Nessun appuntamento
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
