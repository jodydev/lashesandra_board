import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { Client } from '../types';
import { clientService } from '../lib/supabase';
import { formatDateForDatabase, parseDateFromDatabase } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Sparkles, Euro, Calendar, ChevronDown, Check, Star } from 'lucide-react';
import { X } from 'lucide-react';

interface ClientFormProps {
  clientId?: string;
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

export default function ClientForm({ clientId, onSuccess, onCancel }: ClientFormProps) {
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
          data_ultimo_appuntamento: parseDateFromDatabase(client.data_ultimo_appuntamento),
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

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setFormData(prev => ({
      ...prev,
      data_ultimo_appuntamento: date
    }));
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
        data_ultimo_appuntamento: formatDateForDatabase(formData.data_ultimo_appuntamento),
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
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl mx-auto p-6"
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
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditing ? 'Aggiorna le informazioni del cliente' : 'Aggiungi un nuovo cliente al sistema'}
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
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Personal Information Section */}
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
                    Informazioni Personali
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
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
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Contatti
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                        placeholder="+39 123 456 7890"
                      />
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Tipo Cliente
                  </h2>
                </div>
                
                <div className="flex gap-4">
                  {[
                    { value: 'nuovo', label: 'Nuovo Cliente', icon: User },
                    { value: 'abituale', label: 'Cliente Abituale', icon: Star }
                  ].map(({ value, label, icon: Icon }) => (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo_cliente: value }))}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        formData.tipo_cliente === value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          formData.tipo_cliente === value
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${
                            formData.tipo_cliente === value
                              ? 'text-pink-700 dark:text-pink-300'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {label}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {value === 'nuovo' ? 'Prima volta nel salone' : 'Cliente di fiducia'}
                          </p>
                        </div>
                        {formData.tipo_cliente === value && (
                          <Check className="w-5 h-5 text-pink-500 ml-auto" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex gap-4 pt-6 border-t border-gray-100 dark:border-gray-800"
              >
                <motion.button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Annulla
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                      {isEditing ? 'Aggiorna Cliente' : 'Salva Cliente'}
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </LocalizationProvider>
  );
}
