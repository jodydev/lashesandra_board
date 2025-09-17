import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSupabaseServices } from '../lib/supabaseService';
import { formatDateForDatabase, parseDateFromDatabase } from '../lib/utils';
import { useAppColors } from '../hooks/useAppColors';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Check, Star } from 'lucide-react';

interface ClientFormProps {
  clientId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClientForm({ clientId, onSuccess, onCancel }: ClientFormProps) {
  const { clientService } = useSupabaseServices();
  const colors = useAppColors();
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    telefono: '',
    email: '',
    tipo_trattamento: '',
    data_ultimo_appuntamento: null as dayjs.Dayjs | null,
    importo: '',
    tipo_cliente: 'nuovo' as 'nuovo' | 'abituale',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const client = await clientService.getById(clientId!);
      if (client) {
        setFormData({
          nome: client.nome,
          cognome: client.cognome,
          telefono: client.telefono || '',
          email: client.email || '',
          tipo_trattamento: client.tipo_trattamento || '',
          data_ultimo_appuntamento: parseDateFromDatabase(client.data_ultimo_appuntamento || null),
          importo: client.importo?.toString() || '',
          tipo_cliente: client.tipo_cliente,
        });
        setIsEditing(true);
      }
    } catch (err) {
      setError('Errore nel caricamento del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.nome.trim() || !formData.cognome.trim()) {
      setError('Nome e cognome sono obbligatori');
      return;
    }

    if (formData.importo && (isNaN(Number(formData.importo)) || Number(formData.importo) <= 0)) {
      setError('L\'importo deve essere un numero maggiore di 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const clientData = {
        ...formData,
        data_ultimo_appuntamento: formatDateForDatabase(formData.data_ultimo_appuntamento) || undefined,
        importo: formData.importo ? Number(formData.importo) : undefined,
      };

      if (isEditing && clientId) {
        await clientService.update(clientId, clientData);
      } else {
        await clientService.create(clientData);
      }

      onSuccess();
    } catch (err) {
      setError('Errore nel salvataggio del cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditing) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress 
            size={90}
            thickness={4}
            sx={{
              color: colors.primary,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-5">
              Caricamento in corso...
            </h3>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 relative">
        {/* Scrollable Content */}
        <div className="flex-1 pb-20">
          <div className="w-full px-4 sm:px-6 py-4 sm:py-6  overflow-y-auto max-h-[70vh]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 sm:mb-8"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.bgGradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${colors.shadowPrimary}`}>
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                      {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      {isEditing ? 'Aggiorna le informazioni del cliente' : 'Aggiungi un nuovo cliente al tuo elenco'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl flex items-start gap-3"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 dark:bg-red-400 rounded-full" />
                    </div>
                    <p className="text-sm sm:text-base text-red-700 dark:text-red-300 font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Form Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
                  <div className="space-y-6 sm:space-y-8">
                    {/* Personal Information Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl sm:rounded-xl flex items-center justify-center`}>
                          <User className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                          Informazioni Personali
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Nome Field */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nome *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.nome}
                              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                              required
                              disabled={loading}
                              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 ${colors.focusRing} focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base`}
                              placeholder="Inserisci il nome"
                            />
                          </div>
                        </div>

                        {/* Cognome Field */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cognome *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.cognome}
                              onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                              required
                              disabled={loading}
                              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 ${colors.focusRing} focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base`}
                              placeholder="Inserisci il cognome"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Contact Information Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl sm:rounded-xl flex items-center justify-center`}>
                          <Phone className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                          Contatti
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Telefono Field */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Telefono
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.telefono}
                              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                              disabled={loading}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base"
                              placeholder="+39 123 456 7890"
                            />
                            <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Client Type Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl sm:rounded-xl flex items-center justify-center`}>
                          <User className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                          Tipo Cliente
                        </h2>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {[
                          { value: 'nuovo', label: 'Nuovo Cliente', icon: User },
                          { value: 'abituale', label: 'Cliente Abituale', icon: Star }
                        ].map(({ value, label, icon: Icon }) => (
                          <motion.button
                            key={value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, tipo_cliente: value as 'nuovo' | 'abituale' }))}
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
                              formData.tipo_cliente === value
                                ? `${colors.borderPrimary} ${colors.bgPrimary} dark:${colors.bgPrimaryDark}`
                                : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:${colors.borderPrimary}`
                            } disabled:opacity-50`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-xl flex items-center justify-center ${
                                formData.tipo_cliente === value
                                  ? `${colors.bgGradient} text-white`
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <p className={`font-medium text-sm sm:text-base ${
                                  formData.tipo_cliente === value
                                    ? `${colors.textPrimary} dark:${colors.textPrimaryDark}`
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {label}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {value === 'nuovo' ? 'Prima volta nel prenota' : 'Cliente di fiducia'}
                                </p>
                              </div>
                              {formData.tipo_cliente === value && (
                                <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary} flex-shrink-0`} />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Fixed Bottom Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-sm sm:text-base"
            >
              Annulla
            </motion.button>
            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-3.5 ${colors.bgGradient} text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-200 hover:${colors.gradientFromLight} hover:${colors.gradientToLight} shadow-lg ${colors.shadowPrimary} disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isEditing ? 'Aggiorna Cliente' : 'Salva Cliente'}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </LocalizationProvider>
  );
}
