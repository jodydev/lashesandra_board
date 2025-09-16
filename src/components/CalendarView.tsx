import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  Button,
  Stack,
  Container,
  alpha,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarTodayIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Close as CloseIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { motion, AnimatePresence } from 'framer-motion';
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
            transition={{ duration: 0.15 }}
          >
            <Paper
              elevation={0}
              sx={{
                height: { xs: 80, sm: 100, md: 120 },
                p: { xs: 0.75, sm: 1 },
                cursor: 'pointer',
                backgroundColor: isCurrentMonth 
                  ? (isToday ? alpha('#EC4899', 0.05) : '#FFFFFF')
                  : alpha('#000000', 0.01),
                border: isToday 
                  ? '2px solid #EC4899' 
                  : `1px solid ${alpha('#000000', 0.06)}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: isCurrentMonth 
                    ? alpha('#EC4899', 0.03) 
                    : alpha('#000000', 0.02),
                  borderColor: alpha('#EC4899', 0.2),
                  boxShadow: `0 4px 12px ${alpha('#EC4899', 0.08)}`,
                },
              }}
              onClick={() => handleDateClick(day)}
            >
              {/* Day number */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: isToday ? 600 : 500,
                    color: isCurrentMonth 
                      ? (isToday ? '#EC4899' : '#1F2937')
                      : '#9CA3AF',
                    lineHeight: 1,
                  }}
                >
                  {day.format('D')}
                </Typography>
                
                {hasAppointments && (
                  <Box
                    sx={{
                      width: { xs: 6, sm: 8 },
                      height: { xs: 6, sm: 8 },
                      borderRadius: '50%',
                      backgroundColor: '#EC4899',
                    }}
                  />
                )}
              </Box>
              
              {/* Appointments indicator */}
              {hasAppointments && (
                <Stack spacing={0.25} sx={{ mt: 'auto' }}>
                  {dayAppointments
                    .sort((a, b) => {
                      const timeA = a.ora || '00:00';
                      const timeB = b.ora || '00:00';
                      return timeA.localeCompare(timeB);
                    })
                    .slice(0, 4)
                    .map((apt) => {
                      const client = getClientById(apt.client_id);
                      const isCompleted = apt.status === 'completed';
                      return (
                        <Box
                          key={apt.id}
                          sx={{
                            height: { xs: 12, sm: 16 },
                            backgroundColor: alpha('#EC4899', 0.12),
                            borderRadius: 0.5,
                            px: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: { xs: '0.5rem', sm: '0.625rem' },
                              color: '#EC4899',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1,
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {apt.ora?.slice(0, 5) || '00:00'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: { xs: '0.5rem', sm: '0.625rem' },
                              color: '#EC4899',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1,
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {client ? `${client.nome} ${client.cognome}` : 'Cliente'}
                          </Typography>
                        </Box>
                      );
                    })}
                  
                  {dayAppointments.length > 4 && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.5rem', sm: '0.625rem' },
                        color: '#6B7280',
                        fontWeight: 500,
                        textAlign: 'center',
                        lineHeight: 1,
                      }}
                    >
                      +{dayAppointments.length - 4}
                    </Typography>
                  )}
                </Stack>
              )}
            </Paper>
          </motion.div>
        );
      }
      
      weeks.push(
        <Box key={currentWeek.format('YYYY-MM-DD')} display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }}>
          {weekDays}
        </Box>
      );
      
      currentWeek = currentWeek.add(1, 'week');
    }

    return weeks;
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Loading state
  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="400px"
            flexDirection="column"
            gap={2}
          >
            <CircularProgress size={48} sx={{ color: '#EC4899' }} />
            <Typography variant="h6" sx={{ color: '#6B7280' }}>
              Caricamento calendario...
            </Typography>
          </Box>
        </Container>
      </LocalizationProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: '1rem'
              }
            }}
          >
            {error}
          </Alert>
        </Container>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            gap={2}
            mb={4}
          >
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                  color: '#111827',
                  mb: 0.5,
                  letterSpacing: '-0.025em',
                }}
              >
                Calendario
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#6B7280',
                  fontWeight: 400,
                }}
              >
                Gestisci i tuoi appuntamenti
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewAppointment}
              sx={{
                backgroundColor: '#EC4899',
                color: '#FFFFFF',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#DB2777',
                  boxShadow: `0 4px 12px ${alpha('#EC4899', 0.25)}`,
                },
                '&:active': {
                  transform: 'translateY(1px)',
                },
              }}
            >
              Nuovo Appuntamento
            </Button>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Box 
            display="grid" 
            gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" 
            gap={2} 
            mb={4}
          >
            {[
              {
                icon: EventIcon,
                value: monthlyStats.totalAppointments,
                label: 'Appuntamenti',
                color: '#EC4899',
              },
              {
                icon: PeopleIcon,
                value: monthlyStats.uniqueClients,
                label: 'Clienti',
                color: '#111827',
              },
              {
                icon: EuroIcon,
                value: formatCurrency(monthlyStats.totalRevenue),
                label: 'Fatturato',
                color: '#EC4899',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${alpha('#000000', 0.06)}`,
                    borderRadius: 2,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        backgroundColor: alpha(stat.color, 0.1),
                        color: stat.color,
                      }}
                    >
                      <stat.icon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: '#111827',
                          lineHeight: 1.2,
                          mb: 0.25,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card 
            elevation={0}
            sx={{ 
              backgroundColor: '#FFFFFF',
              border: `1px solid ${alpha('#000000', 0.06)}`,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Calendar Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <IconButton 
                  onClick={handlePreviousMonth}
                  sx={{
                    width: 40,
                    height: 40,
                    color: '#6B7280',
                    '&:hover': {
                      backgroundColor: alpha('#EC4899', 0.08),
                      color: '#EC4899',
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#111827',
                    textTransform: 'capitalize',
                  }}
                >
                  {currentDate.format('MMMM YYYY')}
                </Typography>
                
                <IconButton 
                  onClick={handleNextMonth}
                  sx={{
                    width: 40,
                    height: 40,
                    color: '#6B7280',
                    '&:hover': {
                      backgroundColor: alpha('#EC4899', 0.08),
                      color: '#EC4899',
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              {/* Days of week header */}
              <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }} mb={2}>
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                  <Box
                    key={day}
                    sx={{
                      textAlign: 'center',
                      py: 1.5,
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{
                        color: '#6B7280',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {day}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Calendar Grid */}
              <Stack spacing={{ xs: 0.5, sm: 1 }}>
                {renderCalendar()}
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Details Dialog */}
        <Dialog
          open={showAppointmentDetails}
          onClose={() => setShowAppointmentDetails(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 3,
              border: `1px solid ${alpha('#000000', 0.06)}`,
            }
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            {selectedDate && (
              <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        backgroundColor: alpha('#EC4899', 0.1),
                        color: '#EC4899',
                        width: 48,
                        height: 48,
                      }}
                    >
                      <CalendarTodayIcon />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#111827',
                        }}
                      >
                        {formatDateForDisplay(selectedDate)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {selectedDateAppointments.length} appuntamenti
                      </Typography>
                    </Box>
                  </Box>
                  
                  <IconButton
                    onClick={() => setShowAppointmentDetails(false)}
                    sx={{
                      color: '#6B7280',
                      '&:hover': {
                        backgroundColor: alpha('#EC4899', 0.08),
                        color: '#EC4899',
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                {/* Appointments List */}
                {selectedDateAppointments.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <EventIcon 
                      sx={{ 
                        fontSize: 48, 
                        color: '#D1D5DB',
                        mb: 2,
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#6B7280',
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      Nessun appuntamento
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#9CA3AF',
                        mb: 3,
                      }}
                    >
                      Aggiungi il tuo primo appuntamento
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleNewAppointment}
                      sx={{
                        backgroundColor: '#EC4899',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#DB2777',
                        },
                      }}
                    >
                      Aggiungi Appuntamento
                    </Button>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {selectedDateAppointments.map((appointment, index) => {
                      const client = getClientById(appointment.client_id);
                      return (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <ListItem
                            sx={{
                              borderRadius: 2,
                              mb: 1.5,
                              p: 2.5,
                              backgroundColor: alpha('#EC4899', 0.03),
                              border: `1px solid ${alpha('#EC4899', 0.08)}`,
                              '&:hover': {
                                backgroundColor: alpha('#EC4899', 0.05),
                              },
                            }}
                          >
                            <Avatar
                              sx={{
                                backgroundColor: '#EC4899',
                                color: '#FFFFFF',
                                mr: 2,
                                width: 44,
                                height: 44,
                                fontWeight: 600,
                              }}
                            >
                              {client ? client.nome.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                            
                            <ListItemText
                              primary={
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: '#111827',
                                    mb: 0.5,
                                  }}
                                >
                                  {client 
                                    ? `${client.nome} ${client.cognome}`
                                    : 'Cliente sconosciuto'
                                  }
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: '#6B7280',
                                      mb: 0.5,
                                    }}
                                  >
                                    {appointment.tipo_trattamento || 'Nessun trattamento'}
                                    {appointment.ora && (
                                      <Box component="span" sx={{ ml: 1, color: '#EC4899', fontWeight: 600 }}>
                                        • {appointment.ora.slice(0, 5)}
                                      </Box>
                                    )}
                                  </Typography>
                                  <Chip
                                    label={formatCurrency(appointment.importo)}
                                    size="small"
                                    sx={{
                                      backgroundColor: alpha('#EC4899', 0.1),
                                      color: '#EC4899',
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                      height: 24,
                                    }}
                                  />
                                </Box>
                              }
                            />
                            
                            <ListItemSecondaryAction>
                              <IconButton
                                size="small"
                                sx={{
                                  color: '#6B7280',
                                  '&:hover': {
                                    backgroundColor: alpha('#EC4899', 0.08),
                                    color: '#EC4899',
                                  },
                                }}
                              >
                                <MoreHorizIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </motion.div>
                      );
                    })}
                  </List>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Appointment Form Dialog */}
        <Dialog
          open={showAppointmentForm}
          onClose={handleAppointmentFormCancel}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 3,
              border: `1px solid ${alpha('#000000', 0.06)}`,
            }
          }}
        >
          <AppointmentForm
            appointment={editingAppointment}
            selectedDate={selectedDate}
            onSuccess={handleAppointmentFormSuccess}
            onCancel={handleAppointmentFormCancel}
          />
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
}