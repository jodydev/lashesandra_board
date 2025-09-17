import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Euro, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Phone,
  Mail,
  Search,
  List,
  Grid3X3,
  X
} from 'lucide-react';
import type { Appointment, Client } from '../types';
import { appointmentService, clientService } from '../lib/supabase';
import { formatDateForDatabase, formatDateForDisplay } from '../lib/utils';
import dayjs, { Dayjs } from 'dayjs';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  selectedDate?: Dayjs | null;
  onSuccess: () => void;
}

const treatmentTypes = [
  'One to One',
  'Volume Egiziano 3D',
  'Volume Russo 2D-6D',
  'Mega Volume 7D+',
  'Laminazione Ciglia',
  'Laminazione Sopracciglia',
  'Refill One to One',
  'Refill Volume 3D',
  'Refill Volume Russo',
  'Refill Mega Volume',
  'Rimozione Extension Ciglia',
  'Extension Effetto Wet',
  'Extension Effetto Eyeliner',
  'Extension Effetto Foxy Eye',
  'Extension Effetto Cat Eye',
  'Extension Effetto Doll Eye',
  'Trattamento Rinforzante Ciglia',
  'Trattamento Idratante Ciglia',
];

const steps = [
  { id: 'client', title: 'Cliente', icon: User, description: 'Seleziona il cliente per l\'appuntamento' },
  { id: 'datetime', title: 'Dettagli', icon: Calendar, description: 'Imposta data, ora e importo' },
  { id: 'treatment', title: 'Trattamento', icon: Sparkles, description: 'Scegli il tipo di servizio' },
  { id: 'confirm', title: 'Conferma', icon: Check, description: 'Verifica e salva l\'appuntamento' }
];

const quickAmounts = [40, 50, 60, 70, 80, 100, 120, 150];

export default function AppointmentForm({ 
  appointment, 
  selectedDate, 
  onSuccess
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    data: selectedDate || dayjs(),
    ora: '',
    importo: 0,
    tipo_trattamento: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    loadClients();
    if (appointment) {
      setFormData({
        client_id: appointment.client_id,
        data: dayjs(appointment.data),
        ora: appointment.ora || '',
        importo: appointment.importo,
        tipo_trattamento: appointment.tipo_trattamento || '',
        status: appointment.status || 'pending',
      });
      setIsEditing(true);
    }
  }, [appointment]);


  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      setError('Errore nel caricamento dei clienti');
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      data: dayjs(date)
    }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('handleSubmit chiamato', { formData, activeStep });
    
    if (!formData.client_id || !formData.data || formData.importo <= 0) {
      setError('Tutti i campi sono obbligatori e l\'importo deve essere maggiore di 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Inizio salvataggio...');

      const appointmentData = {
        ...formData,
        data: formatDateForDatabase(formData.data) || '',
        ora: formData.ora || undefined,
        importo: Number(formData.importo),
      };

      console.log('Dati appuntamento:', appointmentData);

      if (isEditing && appointment) {
        console.log('Aggiornamento appuntamento...');
        await appointmentService.update(appointment.id, appointmentData);
      } else {
        console.log('Creazione nuovo appuntamento...');
        await appointmentService.create(appointmentData);
      }

      console.log('Appuntamento salvato con successo!');
      onSuccess();
    } catch (err) {
      console.error('Errore nel salvataggio:', err);
      setError('Errore nel salvataggio dell\'appuntamento');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedClient = () => {
    return clients.find(client => client.id === formData.client_id);
  };

  const filteredClients = clients.filter(client =>
    `${client.nome} ${client.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.telefono?.includes(searchQuery)
  );

  const canProceed = () => {
    switch (activeStep) {
      case 0: return formData.client_id !== '';
      case 1: return formData.data && formData.importo > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    const selectedClient = getSelectedClient();

    switch (activeStep) {
      case 0:
        return (
          <motion.div 
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Client Selection Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Seleziona Cliente
                  </h2>
                </div>
                
                {/* View Toggle Buttons */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <motion.button
                    type="button"
                    onClick={() => setViewType('list')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      viewType === 'list'
                        ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setViewType('grid')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      viewType === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              
              {/* Enhanced Search Input */}
              <div className="relative group mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-pink-500 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Cerca cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 sm:h-14 px-4 sm:px-6 pl-12 sm:pl-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-pink-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base sm:text-lg font-medium shadow-lg shadow-black/5 focus:shadow-pink-500/20"
                  />
                </div>
              </div>

              {/* Clients Container with Toggle View */}
              <div className="max-h-[50vh] sm:max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-600 scrollbar-track-transparent">
                {viewType === 'list' ? (
                  /* List View */
                  <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence>
                      {filteredClients.map((client, index) => (
                        <motion.div
                          key={client.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.08,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                          className="group"
                        >
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, client_id: client.id }))}
                            className={`w-full p-5 sm:p-6 rounded-3xl border transition-all duration-500 text-left relative overflow-hidden backdrop-blur-sm ${
                              formData.client_id === client.id
                                ? 'border-pink-500/50 bg-gradient-to-br from-pink-50/80 via-white/90 to-pink-100/60 dark:from-pink-950/40 dark:via-gray-900/90 dark:to-pink-900/30 shadow-2xl shadow-pink-500/20 ring-2 ring-pink-500/20'
                                : 'border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 hover:border-pink-300/60 dark:hover:border-pink-400/40 hover:shadow-xl hover:shadow-black/5 hover:bg-gradient-to-br hover:from-white hover:to-pink-50/30 dark:hover:from-gray-800 dark:hover:to-pink-950/20'
                            }`}
                          >
                            {/* Subtle Background Pattern */}
                            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-transparent to-pink-600" />
                            </div>

                            {/* Selection Indicator with Enhanced Animation */}
                            <AnimatePresence>
                              {formData.client_id === client.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                                  transition={{ 
                                    type: "spring", 
                                    stiffness: 300, 
                                    damping: 20,
                                    duration: 0.6
                                  }}
                                  className="absolute top-4 right-4 sm:top-5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/40 ring-2 ring-white/50 dark:ring-gray-900/50"
                                >
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                              {/* Enhanced Avatar with Multiple Layers */}
                              <div className="relative">
                                <motion.div 
                                  className={`relative w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-xl transition-all duration-500 ${
                                    formData.client_id === client.id
                                      ? 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 shadow-pink-500/40 scale-110'
                                      : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 group-hover:from-pink-400 group-hover:via-pink-500 group-hover:to-pink-600 group-hover:scale-105 shadow-gray-500/20'
                                  }`}
                                  whileHover={{ scale: formData.client_id === client.id ? 1.1 : 1.05 }}
                                >
                                  {/* Animated Background Ring */}
                                  <motion.div 
                                    className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/20 to-transparent"
                                    animate={{
                                      opacity: formData.client_id === client.id ? [0.2, 0.4, 0.2] : 0
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  />
                                  
                                  {/* Client Initial */}
                                  <span className="relative z-10 drop-shadow-sm">
                                    {client.nome.charAt(0).toUpperCase()}
                                  </span>
                                  
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.div>

                                {/* Status Indicator Ring */}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white dark:border-gray-800 transition-all duration-300 ${
                                  formData.client_id === client.id 
                                    ? 'bg-green-500 shadow-lg shadow-green-500/40' 
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`} />
                              </div>

                              {/* Enhanced Client Info */}
                              <div className="flex-1 min-w-0 space-y-2">
                                <motion.h3 
                                  className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate leading-tight"
                                  layout
                                >
                                  {client.nome} {client.cognome}
                                </motion.h3>
                                
                                <div className="flex flex-col gap-1.5 sm:gap-2">
                                  {client.email && (
                                    <motion.div 
                                      className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 group/info"
                                      whileHover={{ x: 2 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover/info:bg-pink-100 dark:group-hover/info:bg-pink-900/30 transition-colors duration-200">
                                        <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={2.5} />
                                      </div>
                                      <span className="text-xs sm:text-sm font-medium truncate group-hover/info:text-gray-700 dark:group-hover/info:text-gray-300 transition-colors duration-200">
                                        {client.email}
                                      </span>
                                    </motion.div>
                                  )}
                                  {client.telefono && (
                                    <motion.div 
                                      className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 group/info"
                                      whileHover={{ x: 2 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover/info:bg-pink-100 dark:group-hover/info:bg-pink-900/30 transition-colors duration-200">
                                        <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={2.5} />
                                      </div>
                                      <span className="text-xs sm:text-sm font-medium group-hover/info:text-gray-700 dark:group-hover/info:text-gray-300 transition-colors duration-200">
                                        {client.telefono}
                                      </span>
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              {/* Subtle Arrow Indicator */}
                              <motion.div
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                  formData.client_id === client.id
                                    ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20 group-hover:text-pink-500'
                                }`}
                                animate={{
                                  x: formData.client_id === client.id ? [0, 3, 0] : 0
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: formData.client_id === client.id ? Infinity : 0,
                                  ease: "easeInOut"
                                }}
                              >
                                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                              </motion.div>
                            </div>

                            {/* Subtle Bottom Border Animation */}
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-pink-600"
                              initial={{ width: 0 }}
                              animate={{ 
                                width: formData.client_id === client.id ? '100%' : '0%'
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Grid View */
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    <AnimatePresence>
                      {filteredClients.map((client, index) => (
                        <motion.div
                          key={client.id}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.08,
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                          }}
                          className="group"
                        >
                          <motion.button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, client_id: client.id }))}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={`w-full p-4 rounded-3xl border transition-all duration-500 text-left relative overflow-hidden backdrop-blur-sm ${
                              formData.client_id === client.id
                                ? 'border-pink-500/30 bg-gradient-to-br from-pink-50/90 via-white/95 to-pink-100/80 dark:from-pink-950/50 dark:via-gray-900/95 dark:to-pink-900/40 shadow-2xl shadow-pink-500/25 ring-2 ring-pink-500/20'
                                : 'border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 hover:border-pink-300/50 dark:hover:border-pink-400/30 hover:shadow-xl hover:shadow-black/10 hover:bg-gradient-to-br hover:from-white hover:to-pink-50/40 dark:hover:from-gray-800 dark:hover:to-pink-950/30'
                            }`}
                          >
                            {/* Animated Background Glow */}
                            <motion.div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                              animate={{
                                background: formData.client_id === client.id 
                                  ? "radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 70%)"
                                  : "radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.05) 0%, transparent 70%)"
                              }}
                            />

                            {/* Selection Indicator with Premium Animation */}
                            <AnimatePresence>
                              {formData.client_id === client.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                                  transition={{ 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 20,
                                    duration: 0.6
                                  }}
                                  className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30"
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                                  >
                                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                              {/* Premium Avatar with Layered Design */}
                              <motion.div 
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              >
                                {/* Outer Ring */}
                                <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
                                  formData.client_id === client.id
                                    ? 'bg-gradient-to-br from-pink-500/20 to-pink-600/20 scale-110'
                                    : 'bg-gradient-to-br from-gray-300/20 to-gray-400/20 scale-100 group-hover:from-pink-400/20 group-hover:to-pink-500/20 group-hover:scale-105'
                                }`} />
                                
                                {/* Main Avatar */}
                                <div className={`relative w-20 h-20 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-xl transition-all duration-500 ${
                                  formData.client_id === client.id
                                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-pink-500/30'
                                    : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-pink-400 group-hover:to-pink-500 shadow-black/20'
                                }`}>
                                  <motion.span
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                  >
                                    {client.nome.charAt(0).toUpperCase()}
                                  </motion.span>
                                  
                                  {/* Subtle Inner Highlight */}
                                  <div className="absolute inset-2 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                              </motion.div>

                              {/* Client Information with Enhanced Typography */}
                              <div className="w-full space-y-3">
                                <motion.h3 
                                  className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 + 0.2 }}
                                >
                                  {client.nome} {client.cognome}
                                </motion.h3>
                                
                                {/* Contact Information with Modern Icons */}
                                <div className="space-y-2">
                                  {client.email && (
                                    <motion.div 
                                      className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 group/contact"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 + 0.3 }}
                                    >
                                      <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover/contact:bg-pink-100 dark:group-hover/contact:bg-pink-900/30 transition-colors duration-200">
                                        <Mail className="w-3 h-3" strokeWidth={2.5} />
                                      </div>
                                      <span className="text-sm font-medium truncate max-w-[140px] group-hover/contact:text-gray-700 dark:group-hover/contact:text-gray-300 transition-colors duration-200">
                                        {client.email}
                                      </span>
                                    </motion.div>
                                  )}
                                  
                                  {client.telefono && (
                                    <motion.div 
                                      className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 group/contact"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 + 0.4 }}
                                    >
                                      <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover/contact:bg-pink-100 dark:group-hover/contact:bg-pink-900/30 transition-colors duration-200">
                                        <Phone className="w-3 h-3" strokeWidth={2.5} />
                                      </div>
                                      <span className="text-sm font-medium group-hover/contact:text-gray-700 dark:group-hover/contact:text-gray-300 transition-colors duration-200">
                                        {client.telefono}
                                      </span>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Subtle Bottom Accent Line */}
                            <motion.div
                              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ 
                                width: formData.client_id === client.id ? '100%' : '0%'
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />

                            {/* Hover State Indicator */}
                            <motion.div
                              className="absolute inset-0 rounded-3xl border-2 border-pink-500/0 group-hover:border-pink-500/20 transition-all duration-300"
                              animate={{
                                borderColor: formData.client_id === client.id 
                                  ? 'rgba(236, 72, 153, 0.3)' 
                                  : 'rgba(236, 72, 153, 0)'
                              }}
                            />
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {filteredClients.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 sm:py-12"
                  >
                    <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">Nessun cliente trovato</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div 
            className="space-y-6 sm:space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Date and Time Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Data e Ora
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Enhanced Date Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data Appuntamento *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.data.format('YYYY-MM-DD')}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                      required
                    />
                    <Calendar className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Time Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Orario
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.ora}
                      onChange={handleChange('ora')}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white disabled:opacity-50 text-sm sm:text-base"
                    />
                    <Clock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Amount Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                  <Euro className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Importo
                </h2>
              </div>
              
              {/* Enhanced Amount Input */}
              <div className="space-y-2 mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Importo (€) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.importo || ''}
                    onChange={handleChange('importo')}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base"
                    required
                  />
                  <Euro className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Enhanced Quick Amount Buttons */}
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Importi Rapidi
                </label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, importo: amount }))}
                      className={`h-10 sm:h-14 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg ${
                        formData.importo === amount
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/30'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-pink-200 dark:hover:border-pink-300 hover:shadow-pink-500/10'
                      }`}
                    >
                      €{amount}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Treatment Selection Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Tipo Trattamento
                </h2>
              </div>
              
              <div className="space-y-2 sm:space-y-4 max-h-[50vh] sm:max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-600 scrollbar-track-transparent">
                {/* Generic Option */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_trattamento: '' }))}
                  className={`w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                    formData.tipo_trattamento === ''
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20 shadow-lg shadow-pink-500/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-200 dark:hover:border-pink-300 hover:shadow-lg hover:shadow-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      formData.tipo_trattamento === ''
                        ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Appuntamento Generico
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">
                        Nessun trattamento specificato
                      </p>
                    </div>
                    {formData.tipo_trattamento === '' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Treatment Options */}
                {treatmentTypes.map((treatment, index) => (
                  <motion.button
                    key={treatment}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipo_trattamento: treatment }))}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={`w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                      formData.tipo_trattamento === treatment
                        ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20 shadow-lg shadow-pink-500/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-200 dark:hover:border-pink-300 hover:shadow-lg hover:shadow-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-6">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                        formData.tipo_trattamento === treatment
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white'
                          : 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 text-pink-600 dark:text-pink-400'
                      }`}>
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                          {treatment}
                        </h3>
                      </div>
                      {formData.tipo_trattamento === treatment && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            className="space-y-4 sm:space-y-6 h-full flex flex-col overflow-y-scroll"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Confirmation Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-shrink-0"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Conferma Appuntamento
                </h2>
              </div>
            </motion.div>
            
            {/* Scrollable Summary Card */}
            <div className="space-y-2 sm:space-y-4 max-h-[50vh] sm:max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-600 scrollbar-track-transparent">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pb-4"
              >
                {/* Enhanced Summary Card */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-50 via-white to-pink-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-pink-900/20 border-2 border-pink-100 dark:border-pink-800/30 shadow-2xl shadow-pink-500/10">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600" />
                  </div>
                  
                  <div className="relative p-4 sm:p-6">
                    {/* Client Header */}
                    <div className="flex items-center gap-3 sm:gap-6 mb-6 sm:mb-8">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg shadow-pink-500/30">
                        {selectedClient ? selectedClient.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {selectedClient ? `${selectedClient.nome} ${selectedClient.cognome}` : 'Cliente non selezionato'}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-400">
                          {selectedClient?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="font-medium text-xs sm:text-sm truncate">{selectedClient.email}</span>
                            </div>
                          )}
                          {selectedClient?.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="font-medium text-xs sm:text-sm">{selectedClient.telefono}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                          {formatDateForDisplay(formData.data)}
                        </p>
                      </div>

                      {formData.ora && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orario</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            {formData.ora}
                          </p>
                        </div>
                      )}

                      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                            <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Importo</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-pink-600">
                          {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(formData.importo)}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl sm:rounded-xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trattamento</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                          {formData.tipo_trattamento || 'Generico'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-100 dark:border-gray-800 flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  {isEditing ? 'Aggiorna le informazioni dell\'appuntamento' : 'Crea un nuovo appuntamento nel sistema'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAppointmentForm(false)}
              className="hidden sm:flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Annulla
            </button>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl flex items-center gap-3 flex-shrink-0"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 dark:bg-red-400 rounded-full" />
              </div>
              <p className="text-red-700 dark:text-red-300 font-medium text-sm sm:text-base">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Steps */}
        <div className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0`}>
          <div className={`flex items-center ${isMobile ? 'justify-between' : 'justify-center'} max-w-2xl mx-auto`}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isActive 
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/30' 
                          : isCompleted 
                            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 shadow-pink-500/10'
                            : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 shadow-black/5'
                      }`}
                    >
                      <Icon className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'}`} />
                    </div>
                    {!isMobile && (
                      <p className={`mt-2 text-sm font-bold transition-colors duration-300 ${
                        isActive ? 'text-pink-600 dark:text-pink-400' : isCompleted ? 'text-pink-500 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`${isMobile ? 'w-4' : 'w-12'} h-1 ${isMobile ? 'mx-1' : 'mx-3'} rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          {isMobile && (
            <div className="mt-2 text-center">
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                {steps[activeStep].title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {steps[activeStep].description}
              </p>
            </div>
          )}
        </div>

         {/* Form Content - Scrollable */}
         <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
           <form onSubmit={handleSubmit} className={`${isMobile ? 'p-4' : 'p-6'} h-full flex flex-col`}>
             <div className="flex-1">
            
                 <motion.div
                   key={activeStep}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.3 }}
                 >
                   {renderStepContent()}
                 </motion.div>
         
             </div>

             {/* Action Buttons - Fixed at bottom */}
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.7 }}
               className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 ${isMobile ? 'pt-4' : 'pt-6'} border-t border-gray-100 dark:border-gray-800 flex-shrink-0`}
             >

               <button
                 type="button"
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleBack();
                 }}
                 disabled={activeStep === 0}
                 className={`flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-3'} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ${isMobile ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
               >
                 <ChevronLeft className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                 Indietro
               </button>

              {activeStep === steps.length - 1 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 ${isMobile ? 'px-4 py-3' : 'px-6 py-3'} bg-gradient-to-r from-pink-500 to-pink-600 text-white ${isMobile ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-200 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm`}
                >
                  {loading ? (
                    <>
                      <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-white/30 border-t-white rounded-full animate-spin`} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      {isEditing ? 'Aggiorna Appuntamento' : 'Salva Appuntamento'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={!canProceed()}
                  className={`flex-1 ${isMobile ? 'px-4 py-3' : 'px-6 py-3'} bg-gradient-to-r from-pink-500 to-pink-600 text-white ${isMobile ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-200 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm`}
                >
                  Continua
                  <ChevronRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </button>
              )}
             </motion.div>
           </form>
         </div>
     </div>
   );
}
