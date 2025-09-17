import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import type { CalendarViewProps } from '../../types';

interface MonthViewProps extends CalendarViewProps {
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthView({ 
  currentDate, 
  appointments, 
  clients, 
  onDateClick, 
  onAppointmentClick, 
  onPreviousMonth,
  onNextMonth,
  colors 
}: MonthViewProps) {
  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter(apt => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
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
                    ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.borderPrimary} shadow-lg ${colors.shadowPrimary}` 
                    : `bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:${colors.borderPrimary} dark:hover:${colors.borderPrimary}`
                  : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'
                }
                hover:shadow-lg ${colors.shadowPrimaryLight} dark:hover:${colors.shadowPrimaryLight}
                flex flex-col justify-between
              `}
              onClick={() => onDateClick(day)}
            >
              {/* Day number */}
              <div className="flex items-start justify-between">
                <span
                  className={`
                    text-xs sm:text-sm md:text-base font-semibold leading-none
                    ${isCurrentMonth 
                      ? isToday 
                        ? `${colors.textPrimary} dark:${colors.textPrimaryDark}` 
                        : 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-600'
                    }
                  `}
                >
                  {day.format('D')}
                </span>
                
                {hasAppointments && (
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${colors.bgGradient} rounded-full animate-pulse`} />
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
                            h-2 sm:h-3 md:h-4 px-1 sm:px-1.5 rounded-sm sm:rounded-md ${colors.bgPrimary} dark:${colors.bgPrimaryDark}
                            flex items-center text-xs font-medium overflow-hidden
                            ${isCompleted ? 'opacity-60 line-through' : ''}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                        >
                          {/* Mobile: solo nome e cognome */}
                          <span className={`${colors.textPrimary} dark:${colors.textPrimaryDark} whitespace-nowrap text-xs sm:hidden`}>
                            {client ? `${client.nome} ${client.cognome}` : '?'}
                          </span>
                          
                          {/* Desktop: orario + nome e cognome */}
                          <div className="hidden sm:flex items-center justify-between w-full">
                            <span className={`${colors.textPrimary} dark:${colors.textPrimaryDark} whitespace-nowrap text-xs`}>
                              {apt.ora?.slice(0, 5) || '00:00'}
                            </span>
                            <span className={`${colors.textPrimary} dark:${colors.textPrimaryDark} whitespace-nowrap ml-1 text-xs`}>
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
      <div className="p-6 sm:p-8">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPreviousMonth}
            className={`
              w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 ${colors.bgHover} dark:${colors.bgHoverDark}
              text-gray-600 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark}
              flex items-center justify-center transition-all duration-200
            `}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {currentDate.format('MMMM YYYY')}
          </h2>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNextMonth}
            className={`
              w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 ${colors.bgHover} dark:${colors.bgHoverDark}
              text-gray-600 dark:text-gray-400 ${colors.textHover} dark:${colors.textHoverDark}
              flex items-center justify-center transition-all duration-200
            `}
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
    </div>
  );
}
