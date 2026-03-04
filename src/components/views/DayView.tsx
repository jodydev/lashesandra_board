import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Check, MoreHorizontal, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import type { CalendarViewProps, Appointment, Client } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { isPersonalAppointment } from '../../lib/personalEvents';
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '../../lib/treatmentDurations';

dayjs.locale('it');

interface DayViewProps extends CalendarViewProps {
  onPreviousDay: () => void;
  onNextDay: () => void;
  onQuickAddSlot?: (date: Dayjs, time: string) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00
const PIXELS_PER_HOUR = 64;
const START_HOUR = 8;
const SWIPE_THRESHOLD_PX = 56;

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

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

function getInitials(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return 'C';
  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || 'C';
}

export default function DayView({
  currentDate,
  appointments,
  clients,
  onAppointmentClick,
  onNewAppointment,
  onPreviousDay,
  onNextDay,
  colors,
  onQuickAddSlot,
}: Readonly<DayViewProps>) {
  useApp();
  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;

  const touchStartX = useRef<number | null>(null);
  const [quickAdd, setQuickAdd] = useState<{ minutes: number; timeLabel: string } | null>(null);

  const getAppointmentsForDate = (date: Dayjs) => {
    return appointments.filter((apt) => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find((c) => c.id === clientId);
  };

  const dayAppointments = useMemo(
    () =>
      getAppointmentsForDate(currentDate).sort((a, b) =>
        (a.ora || '00:00').localeCompare(b.ora || '00:00')
      ),
    [currentDate, appointments]
  );

  /** Per ogni appuntamento: columnIndex (0-based) e totalColumns nella sua fascia sovrapposta */
  const appointmentLayout = useMemo(() => {
    const items = dayAppointments.map((apt) => {
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

    return dayAppointments.map((apt, i) => ({
      appointment: apt,
      columnIndex: columnIndex[i],
      totalColumns: totalColumns[i],
    }));
  }, [dayAppointments]);

  const isToday = currentDate.isSame(dayjs(), 'day');

  // Stato per linea oraria live
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => {
      setNow(dayjs());
    }, 60 * 1000); // aggiorna ogni minuto
    return () => clearInterval(id);
  }, [isToday]);

  const nowMinutes = now.hour() * 60 + now.minute();
  const showNowLine =
    isToday &&
    nowMinutes >= START_HOUR * 60 &&
    nowMinutes <= (START_HOUR + 12) * 60;
  const timelineHeight = 12 * PIXELS_PER_HOUR;

  const dayLabel = DAY_LABELS[(currentDate.day() + 6) % 7];
  const dateNum = currentDate.date();

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
      if (delta > 0) onPreviousDay();
      else onNextDay();
    },
    [onPreviousDay, onNextDay]
  );

  const monthLabel = currentDate.format('MMMM');

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onQuickAddSlot) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutesFromStart = Math.round(((y / PIXELS_PER_HOUR) * 60) / 15) * 15;
      let absoluteMinutes = START_HOUR * 60 + minutesFromStart;
      if (absoluteMinutes < START_HOUR * 60) absoluteMinutes = START_HOUR * 60;
      if (absoluteMinutes > (START_HOUR + 12) * 60) absoluteMinutes = (START_HOUR + 12) * 60;
      const h = Math.floor(absoluteMinutes / 60);
      const m = absoluteMinutes % 60;
      const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      setQuickAdd({ minutes: absoluteMinutes, timeLabel });
    },
    [onQuickAddSlot]
  );

  const handleQuickAddConfirm = () => {
    if (!onQuickAddSlot || !quickAdd) return;
    onQuickAddSlot(currentDate, quickAdd.timeLabel);
    setQuickAdd(null);
  };

  return (
    <div
      className="relative border overflow-hidden min-h-[420px] mb-40"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >
      {/* Header: mese + frecce */}
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: accentSofter }}>
        <button
          type="button"
          onClick={onPreviousDay}
          className="p-2 rounded-xl hover:opacity-80"
          style={{ color: textSecondaryColor }}
          aria-label="Giorno precedente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold capitalize" style={{ color: textPrimaryColor }}>
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={onNextDay}
          className="p-2 rounded-xl hover:opacity-80"
          style={{ color: textSecondaryColor }}
          aria-label="Giorno successivo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </header>

      {/* Area swipeabile: asse orario + timeline */}
      <div
        className="flex overflow-x-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Asse orario (sinistra) */}
        <div
          className="flex-shrink-0 w-14 pt-2 pr-2 border-r"
          style={{ borderColor: accentSofter }}
        >
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex items-start justify-end text-xs font-medium"
              style={{ height: PIXELS_PER_HOUR, color: textSecondaryColor }}
            >
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Timeline + eventi */}
        <div
          className="flex-1 min-w-0 relative pl-3 pr-2 py-2"
          style={{ minHeight: timelineHeight }}
          onClick={handleTimelineClick}
        >
          {/* Griglia ore (stile Apple: linee orizzontali sempre visibili) */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t pointer-events-none"
              style={{
                top: (h - START_HOUR) * PIXELS_PER_HOUR,
                borderColor: 'rgba(0,0,0,0.06)',
              }}
            />
          ))}

          {/* Linea ora corrente: pillola rossa con orario + barra sfumata */}
          {showNowLine && (
            <div
              className="absolute -left-10 right-0 z-10 pointer-events-none"
              style={{ top: minutesToTop(nowMinutes) }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  {now.format('HH:mm')}
                </div>
                <div className="relative flex-1">
                  <div
                    className="h-[2px] rounded-full"
                    style={{
                      backgroundColor: "#EF4444",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {dayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 w-12 h-12 text-gray-300"
                fill="none"
                viewBox="0 0 48 48"
              >
                <rect
                  x="8"
                  y="14"
                  width="32"
                  height="26"
                  rx="4"
                  fill="#F3F4F6"
                />
                <rect
                  x="14"
                  y="21"
                  width="20"
                  height="2"
                  rx="1"
                  fill="#E5E7EB"
                />
                <rect
                  x="14"
                  y="27"
                  width="12"
                  height="2"
                  rx="1"
                  fill="#E5E7EB"
                />
                <rect
                  x="14"
                  y="33"
                  width="16"
                  height="2"
                  rx="1"
                  fill="#E5E7EB"
                />
                <rect
                  x="12"
                  y="8"
                  width="4"
                  height="8"
                  rx="2"
                  fill="#F87171"
                />
                <rect
                  x="32"
                  y="8"
                  width="4"
                  height="8"
                  rx="2"
                  fill="#60A5FA"
                />
              </svg>
              <p className="text-base font-medium mb-1">
                Nessun appuntamento
              </p>
              <span className="text-xs" style={{ color: textSecondaryColor }}>
                Nessun evento trovato per questa giornata.
              </span>
            </div>
          ) : (
            appointmentLayout.map(({ appointment, columnIndex, totalColumns }) => {
              const startM = parseMinutes(appointment.ora);
              const durationM = getDurationMinutes(appointment);
              const top = minutesToTop(startM);
              const height = Math.max(44, (durationM / 60) * PIXELS_PER_HOUR - 4);
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
                  className="absolute min-w-0"
                  style={{
                    top: top + 2,
                    height: height - 1,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      backgroundColor: isPast ? 'rgba(0,0,0,0.03)' : accentSofter,
                    }}
                  />
                  <div className="relative z-10">
                    <DayViewCard
                      appointment={appointment}
                      durationMinutes={getDurationMinutes(appointment)}
                      client={getClientById(appointment.client_id)}
                      onClick={() => onAppointmentClick(appointment)}
                      accentGradient={accentGradient}
                      isPast={isPast}
                    />
                  </div>
                </div>
              );
            })
          )}

          {onQuickAddSlot && quickAdd && (
            <button
              type="button"
              onClick={handleQuickAddConfirm}
              className="absolute left-2 right-2 md:left-8 md:right-auto flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-white via-[#FFF5EB] to-white shadow-md transition-all border hover:shadow-lg hover:bg-gradient-to-r hover:from-[#ffeada] hover:to-[#fff7ed] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 active:scale-95"
              style={{
                top: minutesToTop(quickAdd.minutes - 20),
                color: accentColor,
                border: `1.5px solid ${accentSofter}`,
                zIndex: 20,
              }}
              aria-label={`Aggiungi appuntamento alle ${quickAdd.timeLabel}`}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={17} strokeWidth={2.5} color={accentColor} />
                <span>
                  Inserisci appuntamento alle <span style={{ fontWeight: 700 }}>{quickAdd.timeLabel}</span>
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

interface DayViewCardProps {
  readonly appointment: Appointment;
  readonly durationMinutes: number;
  readonly client: Client | undefined;
  readonly onClick: () => void;
  readonly accentGradient: string;
  readonly isPast: boolean;
}

function DayViewCard({
  appointment,
  durationMinutes,
  client,
  onClick,
  accentGradient,
  isPast,
}: Readonly<DayViewCardProps>) {
  const isCompleted = appointment.status === 'completed';
  const personal = isPersonalAppointment(appointment);
  const clientName = client ? `${client.nome} ${client.cognome}` : 'Cliente sconosciuto';
  const service = personal ? 'PERSONALE' : (appointment.tipo_trattamento || 'Trattamento').toUpperCase();
  const personalTitle = appointment.tipo_trattamento || 'Impegno personale';
  const startTime = formatTime(appointment.ora);
  const endTime = appointment.ora
    ? formatTime(dayjs(`2000-01-01 ${appointment.ora}`).add(durationMinutes, 'minute').format('HH:mm'))
    : '';

  const isPastStyle = isPast && !personal;
  const pastCardStyle = {
    backgroundColor: '#e5e7eb',
    border: '1px solid rgba(107, 114, 128, 0.25)',
  };

  const labelText = isPast ? 'Appuntamento Completato' : 'Appuntamento da svolgere';
  const mutedPalette = isPastStyle; // solo appuntamenti lavoro passati usano grigio
  const serviceClass = personal ? 'text-white/95' : (mutedPalette ? 'text-gray-600' : 'text-white/95');
  const titleClass = personal ? 'text-white' : (isPastStyle ? 'text-gray-700' : 'text-white');
  const labelClass = personal ? 'text-white/85' : (isPastStyle ? 'text-gray-500' : 'text-white/85');
  const timeClass = personal ? 'text-white/90' : (mutedPalette ? 'text-gray-600' : 'text-white/90');
  const iconClass = personal ? 'text-white/90' : (mutedPalette ? 'text-gray-600' : 'text-white/90');

  const cardStyle = personal
    ? { backgroundColor: '#000000', border: 0 }
    : (isPastStyle ? pastCardStyle : { background: accentGradient, border: 0 });

  const buttonClass = isPast
    ? 'shadow-sm hover:shadow-md opacity-90 hover:opacity-100 active:opacity-95'
    : 'shadow-md hover:opacity-95 active:opacity-90';

  return (
    <button
      type="button"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full h-92 text-left px-3.5 py-3.5 flex flex-col justify-between overflow-hidden rounded-2xl ${buttonClass}`}
      style={cardStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`text-[11px] font-semibold uppercase tracking-wide truncate ${serviceClass}`}>
            {service}
          </span>
        </div>
        {isCompleted ? (
          <Check className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
        ) : (
          <MoreHorizontal className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
        )}
      </div>
      <p className={`font-semibold text-sm truncate mt-1 ${titleClass}`}>
        {personal ? personalTitle : clientName}
      </p>

      {!personal && (
        <p className={`text-[11px] mt-0.5 truncate ${labelClass}`}>
          {labelText}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
      {!personal && client && (
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[11px] font-semibold"
              style={{ background: accentGradient, color: '#FFFFFF' }}
            >
              {client.foto_url ? (
                <img
                  src={client.foto_url}
                  alt={clientName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  {client.nome.charAt(0).toUpperCase()}
                  {client.cognome.charAt(0).toUpperCase()}
                </>
              )}
            </div>
          )}
        <p className={`text-sm font-bold ${timeClass}`}>
          {startTime}
          {endTime ? ` – ${endTime}` : ''}
        </p>
      </div>
    </button>
  );
}
