import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { CalendarViewProps, Appointment } from '../../types';
import { isPersonalAppointment } from '../../lib/personalEvents';

dayjs.extend(isoWeek);
dayjs.locale('it');

interface MonthViewProps extends CalendarViewProps {
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

function formatTime(ora: string | undefined) {
  if (!ora) return '00:00';
  return ora.slice(0, 5);
}

export default function MonthView({
  currentDate,
  appointments,
  clients,
  onDateClick,
  onAppointmentClick,
  onPreviousMonth,
  onNextMonth,
  colors,
}: Readonly<MonthViewProps>) {
  const accentColor = colors.primary;
  const accentSofter = `${colors.primary}14`;
  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter((apt) => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find((c) => c.id === clientId);
  };

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startOfGrid = startOfMonth.startOf('isoWeek');
  const endOfGrid = endOfMonth.endOf('isoWeek');

  const weeks: Dayjs[] = [];
  let weekStart = startOfGrid;
  while (weekStart.isBefore(endOfGrid) || weekStart.isSame(endOfGrid, 'day')) {
    weeks.push(weekStart);
    weekStart = weekStart.add(1, 'week');
  }

  return (
    <div
      className="overflow-hidden h-screen"
    >
      {/* Header: mese + frecce */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white" style={{ borderColor: accentSofter }}>
        <button
          type="button"
          onClick={onPreviousMonth}
          className="p-2 rounded-xl hover:opacity-80"
          style={{ color: textSecondaryColor }}
          aria-label="Mese precedente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold capitalize" style={{ color: textPrimaryColor }}>
          {currentDate.format('MMMM YYYY')}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-xl hover:opacity-80"
          style={{ color: textSecondaryColor }}
          aria-label="Mese successivo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </header>

      {/* Intestazione giorni settimana */}
      <div className="grid grid-cols-7 border-b bg-white" style={{ borderColor: accentSofter }}>
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: textSecondaryColor }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Griglia settimane */}
      <div className="divide-y" style={{ borderColor: accentSofter }}>
        {weeks.map((weekStartDate) => (
          <div key={weekStartDate.format('YYYY-MM-DD')} className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => {
              const day = weekStartDate.add(i, 'day');
              const isCurrentMonth = day.isSame(currentDate, 'month');
              const isToday = day.isSame(dayjs(), 'day');
              const dayAppointments = getAppointmentsForDate(day).sort((a, b) =>
                (a.ora || '00:00').localeCompare(b.ora || '00:00')
              );
              const visibleCount = 3;
              const visible = dayAppointments.slice(0, visibleCount);
              const extra = dayAppointments.length - visibleCount;

              return (
                <div
                  key={day.format('YYYY-MM-DD')}
                  className="min-h-[118px] sm:min-h-[140px] border-r last:border-r-0 flex flex-col"
                  style={{
                    borderColor: accentSofter,
                    backgroundColor: !isCurrentMonth ? "#e5e7eb" : surfaceColor,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onDateClick(day)}
                    className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 mt-2 mx-2 sm:mx-2.5 rounded-full text-base sm:text-lg font-bold"
                    style={
                      !isCurrentMonth
                        ? { color: textSecondaryColor }
                        : isToday
                          ? { backgroundColor: accentColor, color: surfaceColor }
                          : { color: textPrimaryColor }
                    }
                  >
                    {day.format('D')}
                  </button>

                  <div className="flex-1 p-2 sm:p-2.5 space-y-1 overflow-hidden">
                    {visible.map((apt) => (
                      <MonthViewMiniCard
                        key={apt.id}
                        appointment={apt}
                        client={getClientById(apt.client_id)}
                        isCurrentMonth={isCurrentMonth}
                        colors={colors}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                      />
                    ))}
                    {extra > 0 && (
                      <button
                        type="button"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          onDateClick(day);
                        }}
                        className="w-full text-left text-xs font-semibold pl-2 py-1"
                        style={{ color: accentColor, fontSize: '14px' }}
                      >
                        +{extra}
                      </button>
                    )}
                  </div>
                </div>
              );

            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MonthViewMiniCardProps {
  readonly key?: string;
  readonly appointment: Appointment;
  readonly client: { nome: string; cognome: string } | undefined;
  readonly isCurrentMonth: boolean;
  readonly colors: ReturnType<typeof import('../../hooks/useAppColors').useAppColors>;
  readonly onClick: (e: any) => void;
}

function MonthViewMiniCard({
  appointment,
  client,
  isCurrentMonth,
  colors,
  onClick,
}: MonthViewMiniCardProps) {
  const isCompleted = appointment.status === 'completed';
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;
  const personal = isPersonalAppointment(appointment);
  const clientName = client ? `${client.nome} ${client.cognome}` : '—';
  const time = formatTime(appointment.ora);
  const personalTitle = appointment.tipo_trattamento || 'Impegno personale';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md border-l-2 pl-1.5 pr-1 py-0.5 ${!isCurrentMonth && 'opacity-60'} ${isCompleted && 'opacity-70'}`}
      style={{
        borderColor: personal ? textSecondaryColor : accentSoft,
        backgroundColor: personal ? 'rgba(17,24,39,0.04)' : accentSofter,
      }}
    >
      <span
        className="text-[10px] font-semibold block truncate text-left"
        style={{ color: textSecondaryColor }}
      >
        {personal ? `${personalTitle} · ${time}` : `${clientName} · ${time}`}
      </span>
    </button>
  );
}
