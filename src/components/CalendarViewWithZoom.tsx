import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@mui/material';
import { 
  Plus, 
  Calendar, 
  Check,
  Clock
} from 'lucide-react';
import PageHeader from './PageHeader';
import FullPageLoader from './FullPageLoader';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { useSupabaseServices } from '../lib/supabaseService';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';
import type { Client, Appointment, CalendarView } from '../types';
import AppointmentForm from './AppointmentForm';
import type { AppointmentPrefillNew } from './AppointmentForm';
import PersonalCommitmentForm from './PersonalCommitmentForm';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import { isPersonalAppointment, loadPersonalAppointments, savePersonalAppointments } from '../lib/personalEvents';

dayjs.locale('it');

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
const formatDateForDisplay = (date: Dayjs) => date.format('dddd, D MMMM YYYY');

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

export default function CalendarViewWithZoom() {
  const navigate = useNavigate();
  const { appType } = useApp();
  const { clientService, appointmentService } = useSupabaseServices();
  const colors = useAppColors();
  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentDark = colors.primaryDark;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [currentView, setCurrentView] = useState<CalendarView>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [personalAppointments, setPersonalAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [prefillNew, setPrefillNew] = useState<AppointmentPrefillNew | undefined>(undefined);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showNewEntryChooser, setShowNewEntryChooser] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingPersonal, setEditingPersonal] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const personal = loadPersonalAppointments(appType);
        setPersonalAppointments(personal);

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
  }, [appType]);

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
    setEditingPersonal(null);
    setPrefillNew(undefined);
    setSelectedDate(currentDate);
    setShowNewEntryChooser(true);
  };

  const openWorkAppointmentForm = () => {
    setShowNewEntryChooser(false);
    setEditingAppointment(null);
    setPrefillNew(undefined);
    setShowAppointmentForm(true);
  };

  const openPersonalCommitmentForm = () => {
    setShowNewEntryChooser(false);
    setEditingPersonal(null);
    setShowPersonalForm(true);
  };

  // View handlers
  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    if (isPersonalAppointment(appointment)) {
      setEditingPersonal(appointment);
      setShowPersonalForm(true);
      return;
    }
    setPrefillNew(undefined);
    setSelectedDate(dayjs(appointment.data));
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleQuickAddSlot = (date: Dayjs, time: string) => {
    setEditingAppointment(null);
    setEditingPersonal(null);
    setSelectedDate(date);
    setPrefillNew({
      data: date.format('YYYY-MM-DD'),
      ora: time,
    });
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

  const allAppointments = [...appointments, ...personalAppointments];

  const getAppointmentsForDate = (date: Dayjs) => {
    return allAppointments.filter(apt => dayjs(apt.data).isSame(date, 'day'));
  };

  const getClientById = (clientId: string) => {
    return clients.find((client: Client) => client.id === clientId);
  };

  // View indicator data
  const viewLabels = {
    month: 'Mese',
    week: 'Settimana', 
    day: 'Giorno'
  };

  // Loading state
  if (loading) {
    return <FullPageLoader message="Caricamento calendario..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor }}>
        <PageHeader title="Agenda" showBack backLabel="Indietro" />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Date strip: week around current date for day picker
  const dateStripStart = currentDate.startOf('week');
  const dateStripDays = Array.from({ length: 14 }, (_, i) => dateStripStart.add(i, 'day'));

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader
        title="Agenda"
        showBack
        backLabel="Indietro"
        rightAction={{ type: 'icon', icon: Plus, ariaLabel: 'Nuovo evento', onClick: handleNewAppointment }}
      />

      <div className="max-w-4xl mx-auto h-screen pt-4">
        {/* View selector: Giorno | Settimana | Mese */}
        <div
          className="flex rounded-full p-1 border mb-4 mx-2"
          style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
        >
          {(['day', 'week', 'month'] as CalendarView[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => handleViewChange(view)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-full"
              style={
                currentView === view
                  ? { background: accentGradient, color: surfaceColor }
                  : { color: textSecondaryColor }
              }
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>

        {/* Date strip (horizontal scroll) - visible for day view */}
        {currentView === 'day' && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 bg-white">
            <div className="flex gap-2 min-w-max">
              {dateStripDays.map((day) => {
                const isSelected = day.isSame(currentDate, 'day');
                const label = DAY_LABELS[(day.day() + 6) % 7];
                return (
                  <button
                    key={day.format('YYYY-MM-DD')}
                    type="button"
                    onClick={() => setCurrentDate(day)}
                    className="flex flex-col items-center min-w-[52px] py-2.5 px-2 font-bold text-sm"
                    style={
                      isSelected
                        ? { background: accentColor, color: surfaceColor }
                        : { color: textPrimaryColor }
                    }
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">
                      {label}
                    </span>
                    <span>{day.format('D')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Container */}
        <div className="relative h-screen">
              {currentView === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  appointments={allAppointments}
                  clients={clients}
                  onDateClick={handleDateClick}
                  onAppointmentClick={handleEditAppointment}
                  onNewAppointment={handleNewAppointment}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                  colors={colors}
                />
              )}
              
              {currentView === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  appointments={allAppointments}
                  clients={clients}
                  onDateClick={handleDateClick}
                  onAppointmentClick={handleEditAppointment}
                  onNewAppointment={handleNewAppointment}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  colors={colors}
                />
              )}
              
              {currentView === 'day' && (
                <DayView
                  currentDate={currentDate}
                  appointments={allAppointments}
                  clients={clients}
                  onDateClick={handleDateClick}
                  onAppointmentClick={handleEditAppointment}
                  onNewAppointment={handleNewAppointment}
                  onPreviousDay={handlePreviousDay}
                  onNextDay={handleNextDay}
                  colors={colors}
                  onQuickAddSlot={handleQuickAddSlot}
                />
              )}
        </div>


        {/* Appointment Details Modal — stile ClientForm */}
        <Dialog
          open={showAppointmentDetails}
          onClose={() => setShowAppointmentDetails(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 },
              maxHeight: '90vh',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            },
            className: 'bg-white',
          }}
        >
          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selectedDate && (
              <>
                <PageHeader
                  title={formatDateForDisplay(selectedDate)}
                  showBack
                  onBack={() => setShowAppointmentDetails(false)}
                  variant="static"
                />

                <div className="flex-1 overflow-y-auto pb-8">
                  <div className="px-4 py-6">
                    {/* Sezione appuntamenti — label uppercase come ClientForm */}
                    <section className="mb-6">
                      <h2
                        className="text-xs font-medium uppercase tracking-wide mb-3"
                        style={{ color: textSecondaryColor }}
                      >
                        {getAppointmentsForDate(selectedDate).length === 0
                          ? 'Eventi'
                          : `${getAppointmentsForDate(selectedDate).length} ${getAppointmentsForDate(selectedDate).length === 1 ? 'evento' : 'eventi'}`
                        }
                      </h2>

                      {getAppointmentsForDate(selectedDate).length === 0 ? (
                        <div className="text-center py-10">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: accentSofter }}
                          >
                            <Calendar className="w-8 h-8" style={{ color: textSecondaryColor }} />
                          </div>
                          <h3 className="text-lg font-bold mb-2" style={{ color: textPrimaryColor }}>Nessun evento</h3>
                          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: textSecondaryColor }}>
                            Nessun evento programmato per questa data
                          </p>
                          <button
                            type="button"
                            onClick={handleNewAppointment}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg disabled:opacity-50"
                            style={{ background: accentGradient }}
                          >
                            <Plus className="w-5 h-5" />
                            Aggiungi evento
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getAppointmentsForDate(selectedDate)
                            .sort((a, b) => (a.ora || '00:00').localeCompare(b.ora || '00:00'))
                            .map((appointment) => {
                              const isPersonal = isPersonalAppointment(appointment);
                              const client = getClientById(appointment.client_id);
                              const isCompleted = appointment.status === 'completed';
                              return (
                                <button
                                  key={appointment.id}
                                  type="button"
                                  onClick={() => handleEditAppointment(appointment)}
                                  className="w-full text-left px-4 py-3 rounded-xl border outline-none"
                                  style={{
                                    backgroundColor: surfaceColor,
                                    borderColor: isPersonal ? accentSofter : (isCompleted ? accentSofter : accentSoft),
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                        
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`font-bold truncate block ${isCompleted ? 'line-through' : ''}`}
                                          style={{ color: isCompleted ? textSecondaryColor : textPrimaryColor }}
                                        >
                                          {isPersonal
                                            ? (appointment.tipo_trattamento || 'Impegno personale')
                                            : (client ? `${client.nome} ${client.cognome}` : 'Cliente sconosciuto')
                                          }
                                        </span>
                                        {isPersonal && (
                                          <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-semibold"
                                            style={{ backgroundColor: accentSofter, color: textSecondaryColor }}
                                          >
                                            Impegno Personale
                                          </span>
                                        )}
                                        {appointment.ora && (
                                          <span
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-medium"
                                            style={
                                              isCompleted
                                                ? { backgroundColor: accentSofter, color: textSecondaryColor }
                                                : { backgroundColor: accentSofter, color: accentColor }
                                            }
                                          >
                                            <Clock className="w-3 h-3" />
                                            {appointment.ora.slice(0, 5)}
                                          </span>
                                        )}
                                      </div>
                                      {!isPersonal && (
                                        <>
                                          <p
                                            className={`text-sm truncate mt-0.5 ${isCompleted ? 'line-through' : ''}`}
                                            style={{ color: textSecondaryColor }}
                                          >
                                            {appointment.tipo_trattamento || 'Nessun trattamento specificato'}
                                          </p>
                                          <div className="mt-2">
                                            <span
                                              className={`text-sm font-bold ${isCompleted ? 'line-through' : ''}`}
                                            >
                                              {formatCurrency(appointment.importo)}
                                            </span>
                                          </div>
                                          {(appointment.note || (appointment.checklist && appointment.checklist.length > 0)) && (
                                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: textSecondaryColor }}>
                                              {appointment.note && (
                                                <span className="truncate max-w-full" title={appointment.note}>
                                                  {appointment.note.length > 35 ? `${appointment.note.slice(0, 35)}…` : appointment.note}
                                                </span>
                                              )}
                                              {appointment.checklist && appointment.checklist.length > 0 && (
                                                <span className="flex-shrink-0">
                                                  {appointment.checklist.filter((i: { done?: boolean }) => i.done).length}/{appointment.checklist.length} da fare
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    {isCompleted && (
                                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Appointment Form — schermata a tutto schermo (stile ClientForm) */}
        {showAppointmentForm && (
          <div className="fixed inset-0 z-50 flex flex-col h-screen min-h-full" style={{ backgroundColor: surfaceColor }}>
            <AppointmentForm
              appointment={editingAppointment}
              prefillNew={prefillNew}
              selectedDate={selectedDate}
              appointmentsForOverlap={allAppointments}
              onSuccess={handleAppointmentFormSuccess}
              onCancel={handleAppointmentFormCancel}
            />
          </div>
        )}

        {/* Personal Commitment Form — full screen */}
        {showPersonalForm && (
          <div className="fixed inset-0 z-50 flex flex-col h-screen min-h-full" style={{ backgroundColor: surfaceColor }}>
            <PersonalCommitmentForm
              commitment={editingPersonal}
              selectedDate={selectedDate}
              onCancel={() => {
                setShowPersonalForm(false);
                setEditingPersonal(null);
              }}
              onSave={(apt) => {
                setPersonalAppointments((prev: Appointment[]) => {
                  const next = prev.some((p: Appointment) => p.id === apt.id)
                    ? prev.map((p: Appointment) => (p.id === apt.id ? apt : p))
                    : [apt, ...prev];
                  savePersonalAppointments(appType, next);
                  return next;
                });
                setShowPersonalForm(false);
                setEditingPersonal(null);
              }}
            />
          </div>
        )}

        {/* New entry chooser */}
        <Dialog
          open={showNewEntryChooser}
          onClose={() => setShowNewEntryChooser(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
              bgcolor: 'background.paper',
            },
            className: 'bg-white',
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-lg font-bold" style={{ color: textPrimaryColor }}>
                Cosa vuoi inserire?
              </h2>
              <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
                Scegli se registrare un appuntamento di lavoro o un impegno personale.
              </p>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <button
                type="button"
                onClick={openWorkAppointmentForm}
                className="w-full px-4 py-3 rounded-2xl font-semibold text-white shadow-lg"
                style={{ background: accentGradient }}
              >
                Appuntamento di lavoro
              </button>
              <button
                type="button"
                onClick={openPersonalCommitmentForm}
                className="w-full px-4 py-3 rounded-2xl font-semibold border"
                style={{ borderColor: accentSofter, color: textPrimaryColor, backgroundColor: surfaceColor }}
              >
                Impegno personale
              </button>
              <button
                type="button"
                onClick={() => setShowNewEntryChooser(false)}
                className="w-full px-4 py-2 rounded-2xl font-semibold"
                style={{ color: textSecondaryColor }}
              >
                Annulla
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
