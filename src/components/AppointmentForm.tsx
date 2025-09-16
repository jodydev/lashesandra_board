import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Euro, 
  Sparkles, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Phone,
  Mail,
  Search
} from 'lucide-react';
import type { Appointment, Client } from '../types';
import { appointmentService, clientService } from '../lib/supabase';
import { formatDateForDatabase, formatDateForDisplay } from '../lib/utils';
import dayjs, { Dayjs } from 'dayjs';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  selectedDate?: Dayjs | null;
  onSuccess: () => void;
  onCancel: () => void;
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
    
    if (!formData.client_id || !formData.data || formData.importo <= 0) {
      setError('Tutti i campi sono obbligatori e l\'importo deve essere maggiore di 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const appointmentData = {
        ...formData,
        data: formatDateForDatabase(formData.data) || '',
        ora: formData.ora || undefined,
        importo: Number(formData.importo),
      };

      if (isEditing && appointment) {
        await appointmentService.update(appointment.id, appointmentData);
      } else {
        await appointmentService.create(appointmentData);
      }

      onSuccess();
    } catch (err) {
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
            className="space-y-6"
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Seleziona Cliente
                </h2>
              </div>
              
              {/* Enhanced Search Input */}
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-pink-500 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Cerca cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 px-6 pl-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl focus:border-pink-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg font-medium shadow-lg shadow-black/5 focus:shadow-pink-500/20"
                  />
                </div>
              </div>

              {/* Clients Grid with Enhanced Cards */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                <AnimatePresence>
                  {filteredClients.map((client, index) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group"
                    >
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, client_id: client.id }))}
                        className={`w-full p-6 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                          formData.client_id === client.id
                            ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20 shadow-lg shadow-pink-500/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-200 dark:hover:border-pink-300 hover:shadow-lg hover:shadow-black/5'
                        }`}
                      >
                        {/* Selection Indicator */}
                        {formData.client_id === client.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-4 right-4 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}

                        <div className="flex items-center gap-6">
                          {/* Avatar with Gradient */}
                          <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                            formData.client_id === client.id
                              ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-pink-400 group-hover:to-pink-500'
                          } transition-all duration-300`}>
                            {client.nome.charAt(0).toUpperCase()}
                            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>

                          {/* Client Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-2">
                              {client.nome} {client.cognome}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                              {client.email && (
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                  <Mail className="w-4 h-4" />
                                  <span className="text-sm font-medium truncate">{client.email}</span>
                                </div>
                              )}
                              {client.telefono && (
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                  <Phone className="w-4 h-4" />
                                  <span className="text-sm font-medium">{client.telefono}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredClients.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Nessun cliente trovato</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div 
            className="space-y-8"
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Data e Ora
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
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
                      className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white disabled:opacity-50"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                  <Euro className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Importo
                </h2>
              </div>
              
              {/* Enhanced Amount Input */}
              <div className="space-y-2 mb-6">
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
                    className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                    required
                  />
                  <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Enhanced Quick Amount Buttons */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Importi Rapidi
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, importo: amount }))}
                      className={`h-14 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg ${
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
            className="space-y-6"
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tipo Trattamento
                </h2>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                {/* Generic Option */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_trattamento: '' }))}
                  className={`w-full p-6 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                    formData.tipo_trattamento === ''
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20 shadow-lg shadow-pink-500/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-200 dark:hover:border-pink-300 hover:shadow-lg hover:shadow-black/5'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      formData.tipo_trattamento === ''
                        ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Appuntamento Generico
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Nessun trattamento specificato
                      </p>
                    </div>
                    {formData.tipo_trattamento === '' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
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
                    className={`w-full p-6 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                      formData.tipo_trattamento === treatment
                        ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20 shadow-lg shadow-pink-500/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-200 dark:hover:border-pink-300 hover:shadow-lg hover:shadow-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                        formData.tipo_trattamento === treatment
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white'
                          : 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 text-pink-600 dark:text-pink-400'
                      }`}>
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {treatment}
                        </h3>
                      </div>
                      {formData.tipo_trattamento === treatment && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
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
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Confirmation Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                  <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Conferma Appuntamento
                </h2>
              </div>
              
              {/* Enhanced Summary Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 via-white to-pink-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-pink-900/20 border-2 border-pink-100 dark:border-pink-800/30 shadow-2xl shadow-pink-500/10">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600" />
                </div>
                
                <div className="relative p-8">
                  {/* Client Header */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-pink-500/30">
                      {selectedClient ? selectedClient.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedClient ? `${selectedClient.nome} ${selectedClient.cognome}` : 'Cliente non selezionato'}
                      </h3>
                      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                        {selectedClient?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">{selectedClient.email}</span>
                          </div>
                        )}
                        {selectedClient?.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">{selectedClient.telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatDateForDisplay(formData.data)}
                      </p>
                    </div>

                    {formData.ora && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orario</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formData.ora}
                        </p>
                      </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                          <Euro className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Importo</span>
                      </div>
                      <p className="text-xl font-bold text-pink-600">
                        {new Intl.NumberFormat('it-IT', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(formData.importo)}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trattamento</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formData.tipo_trattamento || 'Generico'}
                      </p>
                    </div>
                  </div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full mx-auto p-10"
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Aggiorna le informazioni dell\'appuntamento' : 'Crea un nuovo appuntamento nel sistema'}
            </p>
          </div>
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
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Progress Steps */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isActive 
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/30' 
                          : isCompleted 
                            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 shadow-pink-500/10'
                            : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 shadow-black/5'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`mt-3 text-sm font-bold transition-colors duration-300 ${
                      isActive ? 'text-pink-600 dark:text-pink-400' : isCompleted ? 'text-pink-500 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-gradient-to-r from-pink-400 to-pink-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex gap-4 pt-6 border-t border-gray-100 dark:border-gray-800"
          >
            <button
              type="button"
              onClick={handleBack}
              disabled={activeStep === 0}
              className="flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Indietro
            </button>

            {activeStep === steps.length - 1 ? (
              <button
                type="submit"
                disabled={loading || !canProceed()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl font-medium transition-all duration-200 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isEditing ? 'Aggiorna Appuntamento' : 'Salva Appuntamento'}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl font-medium transition-all duration-200 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continua
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}
