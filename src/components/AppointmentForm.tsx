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
import { useSupabaseServices } from '../lib/supabaseService';
import { formatDateForDatabase, formatDateForDisplay } from '../lib/utils';
import { useAppColors } from '../hooks/useAppColors';
import dayjs, { Dayjs } from 'dayjs';
import { useApp } from '../contexts/AppContext';
interface AppointmentFormProps {
  appointment?: Appointment | null;
  selectedDate?: Dayjs | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const treatmentTypesLashesAndra = [
  // Extension Ciglia Classiche & Volume
  'Extension One to One (Classiche)',
  'Refill One to One',
  'Volume Russo 2D-6D',
  'Refill Volume Russo',
  'Volume Egiziano 3D',
  'Refill Volume 3D',
  'Mega Volume 7D+',
  'Refill Mega Volume',

  // Effetti Speciali
  'Extension Effetto Wet',
  'Extension Effetto Eyeliner',
  'Extension Effetto Foxy Eye',
  'Extension Effetto Cat Eye',
  'Extension Effetto Doll Eye',
  'Extension Effetto Kim Kardashian (Wispy)',
  'Extension Effetto Manga',
  'Extension Effetto Hollywood',

  // Laminazioni
  'Laminazione Ciglia',
  'Laminazione Ciglia con Colore',
  'Laminazione Sopracciglia',
  'Laminazione Sopracciglia con Tintura',
  'Brow Lift & Styling',

  // Trattamenti Cura Ciglia & Sopracciglia
  'Rimozione Extension Ciglia',
  'Trattamento Rinforzante Ciglia',
  'Trattamento Idratante Ciglia',
  'Trattamento Nutriente Ciglia con Cheratina',
  'Trattamento Crescita Ciglia',
  'Trattamento Styling Sopracciglia',
];


const treatmentTypesIsabelle = [
  // Manicure
  'Manicure Classica',
  'Manicure Spa',
  'Manicure con Parafina',
  'French Manicure',
  'Manicure Giapponese (P-Shine)',

  // Pedicure
  'Pedicure Estetica',
  'Pedicure Curativa',
  'Pedicure Spa',
  'Pedicure con Scrub e Maschera',

  // Smalto
  'Smalto Classico',
  'Smalto Semipermanente',
  'Rimozione Smalto',
  'Rimozione Semipermanente',
  
  // Ricostruzione e Gel
  'Ricostruzione in Gel',
  'Ricostruzione in Acrilico',
  'Copertura in Gel',
  'Allungamento con Cartina',
  'Refill Gel/Acrilico',

  // Nail Art & Decorazioni
  'French Gel',
  'Babyboomer',
  'Nail Art Base',
  'Nail Art Avanzata',
  'Applicazione Strass/Decorazioni',

  // Trattamenti specifici
  'Pulizia Profonda Unghie',
  'Trattamento Rinforzante',
  'Trattamento Idratante Mani',
  'Trattamento Calli e Duroni',
  'Scrub Mani e Piedi',
];


const steps = [
  { id: 'client', title: 'Cliente', icon: User, description: 'Seleziona il cliente per l\'appuntamento' },
  { id: 'datetime', title: 'Dettagli', icon: Calendar, description: 'Imposta data, ora e importo' },
  { id: 'treatment', title: 'Trattamento', icon: Sparkles, description: 'Scegli il tipo di servizio' },
  { id: 'confirm', title: 'Conferma', icon: Check, description: 'Verifica e salva l\'appuntamento' }
];

const quickAmountsLashesAndra = [20, 30, 40, 50, 60, 70, 80, 90];
const quickAmountsIsabelle = [10, 20, 30, 40, 50, 60, 70, 80];

export default function AppointmentForm({ 
  appointment, 
  selectedDate, 
  onSuccess,
  onCancel 
}: AppointmentFormProps) {
  const { appointmentService, clientService } = useSupabaseServices();
  const { appType } = useApp();
  const colors = useAppColors();
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
    
    if (!formData.client_id || !formData.data || formData.tipo_trattamento === '') {
      setError('Tutti i campi sono obbligatori!');
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
      case 1: return formData.data;
      case 2: return formData.tipo_trattamento !== '' && formData.importo !== 0;
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
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl sm:rounded-xl flex items-center justify-center`}>
                    <User className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Seleziona Cliente
                  </h2>
                </div>
                
                {/* View Toggle Buttons - Hidden on mobile */}
                {!isMobile && (
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <motion.button
                      type="button"
                      onClick={() => setViewType('list')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        viewType === 'list'
                          ? `bg-white dark:bg-gray-700 ${colors.textPrimary} dark:${colors.textPrimaryDark} shadow-lg`
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
                          ? `bg-white dark:bg-gray-700 ${colors.textPrimary} dark:${colors.textPrimaryDark} shadow-lg`
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
              
              {/* Enhanced Search Input */}
              <div className="relative group mb-4 sm:mb-6">
                <div className={`absolute inset-0 ${colors.bgGradientLight} rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <Search className={`absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ${colors.textHover} transition-colors duration-200`} />
                  <input
                    type="text"
                    placeholder="Cerca cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full h-12 sm:h-14 px-4 sm:px-6 pl-12 sm:pl-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:${colors.borderPrimary} focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base sm:text-lg font-medium shadow-lg shadow-black/5 ${colors.shadowPrimaryLight}`}
                  />
                </div>
              </div>

              {/* Clients Container with Toggle View */}
              <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-600 scrollbar-track-transparent">
                {(viewType === 'list' || isMobile) ? (
                  /* List View - Always on mobile */
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
                            className={`w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-500 text-left relative overflow-hidden backdrop-blur-sm ${
                              formData.client_id === client.id
                                ? `${colors.borderPrimary} ${colors.bgPrimary} dark:${colors.bgPrimaryDark} shadow-lg ${colors.shadowPrimary} ring-2 ${colors.borderPrimary}`
                                : `border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 hover:${colors.borderPrimary} hover:shadow-lg hover:shadow-black/5 ${colors.bgGradientHover} dark:${colors.bgPrimaryDark}`
                            }`}
                          >
                            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                              {/* Enhanced Avatar with Multiple Layers */}
                              <div className="relative">
                                <motion.div 
                                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg transition-all duration-500 ${
                                    formData.client_id === client.id
                                      ? `${colors.bgGradient} ${colors.shadowPrimary} scale-110`
                                      : `bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 group-hover:${colors.bgGradient} group-hover:scale-105 shadow-gray-500/20`
                                  }`}
                                  whileHover={{ scale: formData.client_id === client.id ? 1.1 : 1.05 }}
                                >
                                  {/* Client Initial */}
                                  <span className="relative z-10 drop-shadow-lg">
                                    {client.nome.charAt(0).toUpperCase()}
                                  </span>
                                  
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.div>

                                {/* Status Indicator Ring */}
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-gray-800 transition-all duration-300 ${
                                  formData.client_id === client.id 
                                    ? 'bg-green-500 shadow-lg shadow-green-500/40' 
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`} />
                              </div>

                              {/* Enhanced Client Info */}
                              <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                                <motion.h3 
                                  className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate leading-tight"
                                  layout
                                >
                                  {client.nome} {client.cognome}
                                </motion.h3>
                                
                                <div className="flex flex-col gap-1 sm:gap-1.5">
                                  {client.email && (
                                    <motion.div 
                                      className="flex items-center gap-2 text-gray-500 dark:text-gray-400 group/info"
                                      whileHover={{ x: 2 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover/info:bg-pink-100 dark:group-hover/info:bg-pink-900/30 transition-colors duration-200">
                                        <Mail className="w-2 h-2 sm:w-2.5 sm:h-2.5" strokeWidth={2.5} />
                                      </div>
                                      <span className="text-xs sm:text-sm font-medium truncate group-hover/info:text-gray-700 dark:group-hover/info:text-gray-300 transition-colors duration-200">
                                        {client.email}
                                      </span>
                                    </motion.div>
                                  )}
                                  {client.telefono && (
                                    <motion.div 
                                      className="flex items-center gap-2 text-gray-500 dark:text-gray-400 group/info"
                                      whileHover={{ x: 2 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover/info:bg-pink-100 dark:group-hover/info:bg-pink-900/30 transition-colors duration-200">
                                        <Phone className="w-2 h-2 sm:w-2.5 sm:h-2.5" strokeWidth={2.5} />
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
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                  formData.client_id === client.id
                                    ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}`
                                    : `bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 ${colors.bgHover} dark:${colors.bgHoverDark} ${colors.textHover}`
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
                                <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                              </motion.div>
                            </div>

                            {/* Subtle Bottom Border Animation */}
                            <motion.div
                              className="absolute bottom-0 left-0 h-full bg-gradient-to-r from-pink-200 to-pink-300"
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
                  /* Grid View - Only on desktop */
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                            className={`w-full p-4 rounded-3xl border transition-all duration-500 text-left relative overflow-hidden backdrop-blur-sm ${
                              formData.client_id === client.id
                                ? `${colors.borderPrimary} ${colors.bgPrimary} dark:${colors.bgPrimaryDark} shadow-lg ${colors.shadowPrimary} ring-2 ${colors.borderPrimary}`
                                : `border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 hover:${colors.borderPrimary} hover:shadow-lg hover:shadow-black/10 ${colors.bgGradientHover} dark:${colors.bgPrimaryDark}`
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
                                <div className={`relative w-20 h-20 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-lg transition-all duration-500 ${
                                  formData.client_id === client.id
                                    ? `${colors.bgGradient} ${colors.shadowPrimary}`
                                    : `bg-gradient-to-br from-gray-400 to-gray-500 group-hover:${colors.bgGradient} shadow-black/20`
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
                                      <div className="w-5 h-5 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover/contact:bg-pink-100 dark:group-hover/contact:bg-pink-900/30 transition-colors duration-200">
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
                                      <div className="w-5 h-5 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover/contact:bg-pink-100 dark:group-hover/contact:bg-pink-900/30 transition-colors duration-200">
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

                            <div className="absolute bottom-0 left-0 h-full bg-gradient-to-r from-pink-400 to-pink-500" />
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
            className="space-y-6 sm:space-y-8 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Date and Time Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl sm:rounded-2xl flex items-center justify-center`}>
                    <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Data e Orario
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Seleziona quando si svolgerà l'appuntamento
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Enhanced Date Input with Modern Design */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Data Appuntamento
                      <span className="text-pink-500 ml-1">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={formData.data.format('YYYY-MM-DD')}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className={`w-full px-3 py-3 sm:px-4 sm:py-4 pl-10 sm:pl-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-4 ${colors.focusRing} focus:${colors.borderPrimary} transition-all duration-300 text-gray-900 dark:text-white text-sm sm:text-base font-medium group-hover:border-gray-300 dark:group-hover:border-gray-600`}
                        required
                      />
                      <div className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                        <Calendar className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={3} />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Time Input */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Orario
                      <span className="text-gray-400 ml-1 font-normal">(opzionale)</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="time"
                        value={formData.ora}
                        onChange={handleChange('ora')}
                        className={`w-full px-3 py-3 sm:px-4 sm:py-4 pl-10 sm:pl-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-4 ${colors.focusRing} focus:${colors.borderPrimary} transition-all duration-300 text-gray-900 dark:text-white text-sm sm:text-base font-medium group-hover:border-gray-300 dark:group-hover:border-gray-600`}
                      />
                      <div className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                        <Clock className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Visual Feedback for Current Selection */}
            {(formData.data || formData.tipo_trattamento !== '') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-gradient-to-r from-pink-50 to-pink-100/50 dark:from-pink-900/10 dark:to-pink-800/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-pink-200/50 dark:border-pink-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-pink-900 dark:text-pink-100">
                      Dettagli configurati
                    </p>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs text-pink-700 dark:text-pink-300 flex-wrap">
                      {formData.data && (
                        <span>📅 {formData.data.format('DD/MM/YYYY')}</span>
                      )}
                      {formData.ora && (
                        <span>🕐 {formData.ora}</span>
                      )}
                      {formData.tipo_trattamento !== '' && (
                        <span>💰 €{formData.importo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
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
            
            {/* Treatment Grid */}
            <div className="space-y-3 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent">
             
              {/* Generic Option - Featured */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_trattamento: '' }))}
                  className={`group w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                    formData.tipo_trattamento === ''
                      ? `${colors.borderPrimary} ${colors.bgPrimary} dark:${colors.bgPrimaryDark} shadow-lg ${colors.shadowPrimary}`
                      : `border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:${colors.borderPrimary} hover:shadow-lg hover:shadow-black/5`
                  }`}
                >
                  {/* Subtle gradient overlay */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    formData.tipo_trattamento === '' 
                      ? `${colors.bgGradientLight}` 
                      : `${colors.bgGradientLight}`
                  }`} />
                  
                  <div className="relative flex items-center gap-3 sm:gap-4">
                    {/* Icon Container */}
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      formData.tipo_trattamento === ''
                        ? `${colors.bgGradient} text-white ${colors.shadowPrimary}`
                        : `bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${colors.bgHover} dark:${colors.bgHoverDark} ${colors.textHover} dark:${colors.textHoverDark}`
                    }`}>
                      <Clock className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 ${colors.textHover} dark:${colors.textHoverDark} transition-colors`}>
                        Appuntamento Generico
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Nessun trattamento specificato
                      </p>
                    </div>
                    
                    {/* Selection Indicator */}
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      formData.tipo_trattamento === ''
                        ? `${colors.borderPrimary} ${colors.bgGradient}`
                        : `border-gray-300 dark:border-gray-600 hover:${colors.borderPrimary}`
                    }`}>
                      {formData.tipo_trattamento === '' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>

              {/* Treatment Options */}
              <div className="space-y-2">
                {(appType === 'isabellenails' ? treatmentTypesIsabelle : treatmentTypesLashesAndra).map((treatment, index) => (
                  <motion.div
                    key={treatment}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + (index * 0.02) }}
                  >
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo_trattamento: treatment }))}
                      className={`group w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 text-left relative overflow-hidden ${
                        formData.tipo_trattamento === treatment
                          ? `${colors.borderPrimary} ${colors.bgPrimary} dark:${colors.bgPrimaryDark} shadow-lg ${colors.shadowPrimaryLight}`
                          : `border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:${colors.borderPrimary} hover:shadow-md hover:shadow-black/5`
                      }`}
                    >
                      {/* Hover gradient */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${colors.bgGradientLight}`} />
                      
                      <div className="relative flex items-center gap-3 sm:gap-4">
                        {/* Treatment Icon */}
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                          formData.tipo_trattamento === treatment
                            ? `${colors.bgGradient} text-white ${colors.shadowPrimary}`
                            : `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark} ${colors.bgHover} dark:${colors.bgHoverDark}`
                        }`}>
                          <Sparkles className="w-3 h-3 sm:w-5 sm:h-5" strokeWidth={2} />
                        </div>
                        
                        {/* Treatment Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm sm:text-base font-semibold transition-colors duration-300 ${
                            formData.tipo_trattamento === treatment
                              ? `${colors.textPrimary} dark:${colors.textPrimaryDark}`
                              : `text-gray-900 dark:text-white ${colors.textHover} dark:${colors.textHoverDark}`
                          }`}>
                            {treatment}
                          </h3>
                        </div>
                        
                        {/* Selection Radio */}
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          formData.tipo_trattamento === treatment
                            ? `${colors.borderPrimary} ${colors.bgGradient}`
                            : `border-gray-300 dark:border-gray-600 hover:${colors.borderPrimary}`
                        }`}>
                          {formData.tipo_trattamento === treatment && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Amount Card with Premium Design */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl sm:rounded-2xl flex items-center justify-center`}>
                    <Euro className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Importo Servizio
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Definisci il prezzo del trattamento
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Premium Amount Input */}
                <div className="space-y-2 sm:space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Importo in Euro
                    <span className="text-pink-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={formData.importo || ''}
                      onChange={handleChange('importo')}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-3 sm:px-4 sm:py-4 pl-10 sm:pl-12 pr-12 sm:pr-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-4 ${colors.focusRing} focus:${colors.borderPrimary} transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base font-medium group-hover:border-gray-300 dark:group-hover:border-gray-600`}
                      required
                    />
                    <div className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                      <Euro className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={3} />
                    </div>
                    <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm font-semibold text-gray-400 dark:text-gray-500">
                      EUR
                    </div>
                  </div>
                </div>

                {/* Redesigned Quick Amount Buttons */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Importi Frequenti
                    </label>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      Tocca per selezionare
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {(appType === 'isabellenails' ? quickAmountsIsabelle : quickAmountsLashesAndra).map((amount, index) => (
                      <motion.button
                        key={amount}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, importo: amount }))}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative h-12 sm:h-16 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg overflow-hidden ${
                          formData.importo === amount
                            ? `${colors.bgGradient} text-white ${colors.shadowPrimary} shadow-xl`
                            : `bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:${colors.borderPrimary} hover:shadow-xl ${colors.shadowPrimaryLight}`
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="text-sm sm:text-lg font-bold">€{amount}</span>
                        </div>
                        {formData.importo === amount && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white/20 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            className="space-y-4 sm:space-y-6 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            
            {/* Premium Summary Card with Glass Morphism */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto"
            >

              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl shadow-black/10 dark:shadow-black/30">
                {/* Animated Background Gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-pink-600/5"
                  animate={{
                    background: [
                      "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, transparent 50%, rgba(236, 72, 153, 0.05) 100%)",
                      "linear-gradient(135deg, rgba(236, 72, 153, 0.02) 0%, transparent 50%, rgba(236, 72, 153, 0.08) 100%)",
                      "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, transparent 50%, rgba(236, 72, 153, 0.05) 100%)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative p-4 sm:p-8">
                  {/* Client Profile Section */}
                  <motion.div 
                    className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-10 pb-4 sm:pb-8 border-b border-gray-100 dark:border-gray-800"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <motion.div 
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {/* Avatar with Glow Effect */}
                      <div className={`absolute inset-0 ${colors.bgGradient} rounded-2xl sm:rounded-3xl blur-lg opacity-30 scale-110`} />
                      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${colors.bgGradient} flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-xl`}>
                        {selectedClient ? selectedClient.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        {selectedClient ? `${selectedClient.nome} ${selectedClient.cognome}` : 'Cliente non selezionato'}
                      </h3>
                      <div className="flex flex-col gap-1 sm:gap-2">
                        {selectedClient?.email && (
                          <motion.div 
                            className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-400"
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={2} />
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{selectedClient.email}</span>
                          </motion.div>
                        )}
                        {selectedClient?.telefono && (
                          <motion.div 
                            className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-400"
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={2} />
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{selectedClient.telefono}</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Details Grid with Enhanced Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    {/* Date Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group"
                    >
                      <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg shadow-black/5 hover:shadow-xl ${colors.shadowPrimaryLight} transition-all duration-300`}>
                        <div className={`absolute inset-0 ${colors.bgGradientLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        
                        <div className="relative">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <motion.div 
                              className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}
                              whileHover={{ rotate: 10 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={2} />
                            </motion.div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</span>
                          </div>
                          <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                            {formatDateForDisplay(formData.data)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Time Card */}
                    {formData.ora && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="group"
                      >
                        <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg shadow-black/5 hover:shadow-xl ${colors.shadowPrimaryLight} transition-all duration-300`}>
                          <div className={`absolute inset-0 ${colors.bgGradientLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          
                          <div className="relative">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                              <motion.div 
                                className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}
                                whileHover={{ rotate: 10 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              >
                                <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={2} />
                              </motion.div>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orario</span>
                            </div>
                            <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                              {formData.ora.split(':')[0]}:{formData.ora.split(':')[1]}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Amount Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group"
                    >
                      <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg shadow-black/5 hover:shadow-xl ${colors.shadowPrimaryLight} transition-all duration-300`}>
                        <div className={`absolute inset-0 ${colors.bgGradientLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        
                        <div className="relative">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <motion.div 
                              className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}
                              whileHover={{ rotate: 10 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Euro className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={2} />
                            </motion.div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Importo</span>
                          </div>
                          <p className={`text-base sm:text-xl font-bold ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
                            {new Intl.NumberFormat('it-IT', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(formData.importo)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Treatment Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group"
                    >
                      <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg shadow-black/5 hover:shadow-xl ${colors.shadowPrimaryLight} transition-all duration-300`}>
                        <div className={`absolute inset-0 ${colors.bgGradientLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        
                        <div className="relative">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <motion.div 
                              className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg sm:rounded-xl flex items-center justify-center`}
                              whileHover={{ rotate: 10 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} strokeWidth={2} />
                            </motion.div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trattamento</span>
                          </div>
                          <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                            {formData.tipo_trattamento || 'Generico'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Success Indicator */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1, type: "spring", stiffness: 300, damping: 25 }}
                    className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-800"
                  >
                    <div className={`flex items-center justify-center gap-2 sm:gap-3 ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      >
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                      </motion.div>
                      <span className="font-semibold text-xs sm:text-sm">Pronto per il salvataggio</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 rounded-2xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-100 dark:border-gray-800 flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${colors.bgGradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${colors.shadowPrimary}`}>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">
                  {isEditing ? 'Aggiorna le informazioni dell\'appuntamento' : 'Crea un nuovo appuntamento nel sistema'}
                </p>
              </div>
            </div>
            <button
                 type="button"
                 onClick={onCancel}
                 className={`${isMobile ? 'px-3 py-2' : 'px-4 py-3 lg:px-6'} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ${isMobile ? 'rounded-lg' : 'rounded-xl lg:rounded-2xl'} font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs sm:text-sm flex items-center justify-center gap-2`}
               >
                 <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 lg:w-5 lg:h-5'}`} />
                 {!isMobile && 'Annulla'}
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
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-12 sm:h-12'} rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isActive 
                          ? `${colors.bgGradient} text-white ${colors.shadowPrimary}` 
                          : isCompleted 
                            ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark} ${colors.shadowPrimaryLight}`
                            : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 shadow-black/5'
                      }`}
                    >
                      <Icon className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 sm:w-5 sm:h-5'}`} />
                    </div>
                    {!isMobile && (
                      <p className={`mt-2 text-xs sm:text-sm font-bold transition-colors duration-300 ${
                        isActive ? `${colors.textPrimary} dark:${colors.textPrimaryDark}` : isCompleted ? `${colors.textPrimary} dark:${colors.textPrimaryDark}` : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`${isMobile ? 'w-3' : 'w-8 sm:w-12'} h-1 ${isMobile ? 'mx-1' : 'mx-2 sm:mx-3'} rounded-full transition-all duration-300 ${
                      isCompleted ? colors.bgGradient : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          {isMobile && (
            <div className="mt-2 text-center">
              <p className={`text-sm font-semibold ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
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
                  className={`flex-1 ${isMobile ? 'px-4 py-3' : 'px-6 py-3'} ${colors.bgGradient} text-white ${isMobile ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-200 hover:${colors.gradientFromLight} hover:${colors.gradientToLight} shadow-lg ${colors.shadowPrimary} disabled:opacity-50 flex items-center justify-center gap-2 text-sm`}
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
                  className={`flex-1 ${isMobile ? 'px-4 py-3' : 'px-6 py-3'} ${colors.bgGradient} text-white ${isMobile ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-200 hover:${colors.gradientFromLight} hover:${colors.gradientToLight} shadow-lg ${colors.shadowPrimary} disabled:opacity-50 flex items-center justify-center gap-2 text-sm`}
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
