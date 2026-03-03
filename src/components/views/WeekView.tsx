import React, { useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/it';
import type { CalendarViewProps, Appointment } from '../../types';
import { isPersonalAppointment } from '../../lib/personalEvents';
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '../../lib/treatmentDurations';

dayjs.extend(isoWeek);
dayjs.locale('it');

interface WeekViewProps extends CalendarViewProps {
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const DAY_INITIALS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i); // 08:00 - 20:00 come DayView
const PIXELS_PER_HOUR = 52;
const SWIPE_THRESHOLD_PX = 56;

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

function formatTime(ora: string | undefined) {
  if (!ora) return '00:00';
  return ora.slice(0, 5);
}

function parseMinutes(ora: string | undefined) {
  if (!ora) return 0;
  const [h, m] = ora.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTop(minutes: number) {
  return (minutes - START_HOUR * 60) * (PIXELS_PER_HOUR / 60);
}

function getDurationMinutes(apt: Appointment): number {
  return apt.duration_minutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES;
}

/** Calcola columnIndex e totalColumns per appuntamenti sovrapposti (stessa logica di DayView). */
function getAppointmentLayout(appointments: Appointment[]) {
  const items = appointments.map((apt) => {
    const durationM = getDurationMinutes(apt);
    return {
      appointment: apt,
      startM: parseMinutes(apt.ora),
      endM: parseMinutes(apt.ora) + durationM,
    };
  });
  const columnIndex: number[] = [];
  const totalColumns: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const used = new Set<number>();
    for (let j = 0; j < i; j++) {
      const a = items[i];
      const b = items[j];
      const overlap = a.startM < b.endM && b.startM < a.endM;
      if (overlap) used.add(columnIndex[j]);
    }
    let col = 0;
    while (used.has(col)) col++;
    columnIndex[i] = col;
  }

  for (let i = 0; i < items.length; i++) {
    let maxCol = columnIndex[i];
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const a = items[i];
      const b = items[j];
      const overlap = a.startM < b.endM && b.startM < a.endM;
      if (overlap && columnIndex[j] > maxCol) maxCol = columnIndex[j];
    }
    totalColumns[i] = maxCol + 1;
  }

  return appointments.map((apt, i) => ({
    appointment: apt,
    columnIndex: columnIndex[i],
    totalColumns: totalColumns[i],
  }));
}

export default function WeekView({
  currentDate,
  appointments,
  clients,
  onDateClick,
  onAppointmentClick,
  onNewAppointment,
  onPreviousWeek,
  onNextWeek,
  colors,
}: Readonly<WeekViewProps>) {
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;

  const touchStartX = useRef<number | null>(null);

  const startOfWeek = currentDate.startOf('isoWeek');
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day')),
    [startOfWeek]
  );

  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter((apt) => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find((c) => c.id === clientId);
  };

  const isToday = (date: Dayjs) => date.isSame(dayjs(), 'day');
  const now = dayjs();
  const nowMinutes = now.hour() * 60 + now.minute();
  const todayInWeek = weekDays.some((d: Dayjs) => d.isSame(dayjs(), 'day'));
  const showNowLine =
    todayInWeek &&
    nowMinutes >= START_HOUR * 60 &&
    nowMinutes <= (END_HOUR + 1) * 60;

  const gridHeight = HOURS.length * PIXELS_PER_HOUR;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const delta = endX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (delta > 0) onPreviousWeek();
      else onNextWeek();
    },
    [onPreviousWeek, onNextWeek]
  );

  const monthLabel = currentDate.format('MMMM');

  return (
    <div
      className="relative border overflow-hidden min-h-[320px]"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >
      {/* Header: mese + frecce */}
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: accentSofter }}>
        <button
          type="button"
          onClick={onPreviousWeek}
          className="p-2 rounded-xl hover:opacity-80"
          style={{ color: textSecondaryColor }}
          aria-label="Settimana precedente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold capitalize" style={{ color: textPrimaryColor }}>
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={onNextWeek}
          className="p-2 rounded-xl hover:opacity-80"
          style={{ color: textSecondaryColor }}
          aria-label="Settimana successiva"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </header>

      {/* Griglia settimana: asse orario + 7 colonne (stile Google) */}
      <div
        className="relative overflow-x-auto overflow-y-auto scrollbar-hide touch-pan-y max-h-[calc(100vh-280px)] sm:max-h-[520px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex min-w-0" style={{ minWidth: 'min(100%, 28rem)' }}>
          {/* Colonna asse orario + celle vuote per allineare le ore */}
          <div className="flex-shrink-0 w-14 flex flex-col">
            <div className="h-[72px] border-b flex flex-col justify-end pb-1" style={{ borderColor: accentSofter }}>
              <span className="text-[10px] font-medium text-transparent select-none">0</span>
            </div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-2 text-xs font-medium"
                style={{ height: PIXELS_PER_HOUR, color: textSecondaryColor }}
              >
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 colonne giorno */}
          <div className="flex-1 flex min-w-0">
            {weekDays.map((day: Dayjs, dayIndex: number) => {
              const current = isToday(day);
              const dayAppointments = getAppointmentsForDate(day).sort((a, b) =>
                (a.ora || '00:00').localeCompare(b.ora || '00:00')
              );

              return (
                <div
                  key={day.format('YYYY-MM-DD')}
                  className="flex-1 min-w-0 flex flex-col border-r last:border-r-0"
                  style={{ borderColor: accentSofter, minWidth: '2.5rem' }}
                >
                  {/* Intestazione: iniziale + data (stile Google) */}
                  <button
                    type="button"
                    onClick={() => onDateClick(day)}
                    className="relative flex flex-col items-center py-2 px-0.5 border-b flex-shrink-0 min-h-[72px] justify-end"
                    style={{
                      borderColor: accentSofter,
                      backgroundColor: current ? accentSofter : 'transparent',
                    }}
                  >
                    <span
                      className="text-[11px] font-semibold uppercase"
                      style={{ color: current ? accentColor : textSecondaryColor }}
                    >
                      {DAY_INITIALS[dayIndex]}
                    </span>
                    <span
                      className="mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: current ? accentSofter : 'transparent',
                        color: current ? accentColor : textPrimaryColor,
                        border: current ? `2px solid ${accentColor}` : undefined,
                      }}
                    >
                      {day.format('D')}
                    </span>
                    {current && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </button>

                  {/* Cella griglia ore (contenitore per eventi) */}
                  <div
                    className="relative flex-shrink-0"
                    style={{ height: gridHeight }}
                  >
                    {/* Linee orizzontali (slot ore) */}
                    {HOURS.slice(0, -1).map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-b"
                        style={{
                          top: (h - START_HOUR) * PIXELS_PER_HOUR,
                          height: PIXELS_PER_HOUR,
                          borderColor: accentSofter,
                        }}
                      />
                    ))}

                    {/* Eventi per questo giorno */}
                    {getAppointmentLayout(dayAppointments).map(({ appointment, columnIndex, totalColumns }) => {
                      const startM = parseMinutes(appointment.ora);
                      const durationM = getDurationMinutes(appointment);
                      const top = minutesToTop(startM) + 2;
                      const height = Math.max(28, (durationM / 60) * PIXELS_PER_HOUR - 4);
                      const aptDateTime = dayjs(appointment.data)
                        .hour(Math.floor(startM / 60))
                        .minute(startM % 60)
                        .second(0)
                        .millisecond(0);
                      const isPast = aptDateTime.isBefore(now);
                      const gapPercent = 2;
                      const widthPercent = totalColumns > 1
                        ? (100 - gapPercent * (totalColumns - 1)) / totalColumns
                        : 100;
                      const leftPercent = totalColumns > 1
                        ? columnIndex * (widthPercent + gapPercent)
                        : 0;
                      return (
                        <div
                          key={appointment.id}
                          className={`absolute z-10 min-w-0 ${totalColumns > 1 ? '' : 'left-0.5 right-0.5'}`}
                          style={{
                            top,
                            height,
                            ...(totalColumns > 1
                              ? { left: `${leftPercent}%`, width: `${widthPercent}%` }
                              : {}),
                          }}
                        >
                          <WeekViewEventCard
                            appointment={appointment}
                            client={getClientById(appointment.client_id)}
                            onClick={() => onAppointmentClick(appointment)}
                            accentGradient={accentGradient}
                            isPast={isPast}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linea ora corrente: pillola rossa con orario + barra (stile DayView) */}
        {showNowLine && (
          <div
            className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
            style={{
              top: 72 + minutesToTop(nowMinutes),
              marginLeft: 56,
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: '#EF4444' }}
              >
                {now.format('HH:mm')}
              </div>
              <div className="relative flex-1 min-w-0">
                <div
                  className="h-[2px] rounded-full"
                  style={{ backgroundColor: '#EF4444' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

interface WeekViewEventCardProps {
  readonly appointment: Appointment;
  readonly client: { nome: string; cognome: string } | undefined;
  readonly onClick: () => void;
  readonly accentGradient: string;
  readonly isPast: boolean;
}

function WeekViewEventCard({
  appointment,
  client,
  onClick,
  accentGradient,
  isPast,
}: Readonly<WeekViewEventCardProps>) {
  const personal = isPersonalAppointment(appointment);
  const clientName = client ? `${client.nome} ${client.cognome}` : 'Cliente';
  const service = personal ? 'PERSONALE' : (appointment.tipo_trattamento || 'Trattamento').toUpperCase();
  const personalTitle = appointment.tipo_trattamento || 'Impegno personale';
  const time = formatTime(appointment.ora);

  const isPastStyle = isPast && !personal;
  const pastCardStyle = {
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
    border: '1px solid rgba(107, 114, 128, 0.25)',
  };
  const cardStyle = personal
    ? { backgroundColor: '#000000', border: 0 }
    : (isPastStyle ? pastCardStyle : { background: accentGradient, border: 0 });

  const serviceClass = personal ? 'text-white/95' : (isPastStyle ? 'text-gray-600' : 'text-white/95');
  const titleClass = personal ? 'text-white' : (isPastStyle ? 'text-gray-700' : 'text-white');
  const timeClass = personal ? 'text-white/85' : (isPastStyle ? 'text-gray-500' : 'text-white/85');

  const buttonClass = isPast
    ? 'shadow-sm hover:shadow-md opacity-90 hover:opacity-100 active:opacity-95'
    : 'shadow-sm hover:opacity-95 active:opacity-90';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-full text-left p-1 flex flex-col justify-between overflow-hidden rounded-lg ${buttonClass}`}
      style={cardStyle}
    >
      <span className={`text-[10px] font-semibold uppercase tracking-wide truncate leading-tight ${serviceClass}`}>
        {service}
      </span>
      <p className={`font-semibold text-[11px] truncate leading-tight mt-0.5 ${titleClass}`}>
        {personal ? personalTitle : clientName}
      </p>
      <p className={`text-[10px] leading-tight ${timeClass}`}>{time}</p>
    </button>
  );
}
