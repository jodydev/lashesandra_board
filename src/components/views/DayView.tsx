import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Check, MoreHorizontal } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import type { CalendarViewProps, Appointment } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { isPersonalAppointment } from '../../lib/personalEvents';

dayjs.locale('it');

interface DayViewProps extends CalendarViewProps {
  onPreviousDay: () => void;
  onNextDay: () => void;
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
}: Readonly<DayViewProps>) {
  useApp();
  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;

  const touchStartX = useRef<number | null>(null);

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

  return (
    <div
      className="relative border overflow-hidden min-h-[420px]"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >

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
              className="absolute left-0 right-0 z-10 pointer-events-none"
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
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-90 animate-fade-in">
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
            dayAppointments.map((appointment: Appointment) => {
              const startM = parseMinutes(appointment.ora);
              const durationM = 60;
              const top = minutesToTop(startM);
              const height = Math.max(44, (durationM / 60) * PIXELS_PER_HOUR - 4);
              return (
                <div
                  key={appointment.id}
                  className="absolute left-0 right-0"
                  style={{ top: top + 2, height: height - 1 }}
                >
                  <DayViewCard
                    appointment={appointment}
                    client={getClientById(appointment.client_id)}
                    onClick={() => onAppointmentClick(appointment)}
                    accentGradient={accentGradient}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

interface DayViewCardProps {
  readonly appointment: Appointment;
  readonly client: { nome: string; cognome: string } | undefined;
  readonly onClick: () => void;
  readonly accentGradient: string;
}

function DayViewCard({
  appointment,
  client,
  onClick,
  accentGradient,
}: Readonly<DayViewCardProps>) {
  const isCompleted = appointment.status === 'completed';
  const personal = isPersonalAppointment(appointment);
  const clientName = client ? `${client.nome} ${client.cognome}` : 'Cliente sconosciuto';
  const service = personal ? 'PERSONALE' : (appointment.tipo_trattamento || 'Trattamento').toUpperCase();
  const personalTitle = appointment.tipo_trattamento || 'Impegno personale';
  const startTime = formatTime(appointment.ora);
  const endTime = appointment.ora
    ? formatTime(dayjs(`2000-01-01 ${appointment.ora}`).add(1, 'hour').format('HH:mm'))
    : '';
  const initials = getInitials(clientName);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-92 text-left px-3.5 py-3.5 shadow-md transition-opacity hover:opacity-95 active:opacity-90 flex flex-col justify-between overflow-hidden rounded-2xl"
      style={
        personal
          ? {
              backgroundColor: 'rgba(17,24,39,0.04)',
              border: '1px dashed rgba(0,0,0,0.25)',
            }
          : { background: accentGradient, border: 0 }
      }
    >
      <div className="flex justify-between items-start gap-2">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide truncate ${
            personal ? 'text-gray-700' : 'text-white/95'
          }`}
        >
          {service}
        </span>
        {isCompleted ? (
          <Check className={`w-4 h-4 flex-shrink-0 ${personal ? 'text-gray-700' : 'text-white/90'}`} />
        ) : (
          <MoreHorizontal className={`w-4 h-4 flex-shrink-0 ${personal ? 'text-gray-700' : 'text-white/90'}`} />
        )}
      </div>
      <p className={`font-semibold text-sm truncate mt-1 ${personal ? 'text-gray-900' : 'text-white'}`}>
        {personal ? personalTitle : clientName}
      </p>

      {!personal && (
        <p className="text-[11px] mt-0.5 text-white/85 truncate">
          Appuntamento
        </p>
      )}

      <div className="mt-2 flex items-end justify-end gap-2">
        <p className={`text-xs font-bold ${personal ? 'text-gray-700' : 'text-white/90'}`}>
          {startTime}
          {endTime ? ` – ${endTime}` : ''}
        </p>
      </div>
    </button>
  );
}
