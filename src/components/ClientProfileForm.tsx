import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

import type { Client, ClientProfileData, EyeCharacteristics, ClientProfile, Treatment } from '../types';
import TreatmentForm from './TreatmentForm';
import { 
  FiUser, 
  FiEye, 
  FiHeart, 
  FiCalendar, 
  FiPlus, 
  FiSave, 
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { useAppColors } from '../hooks/useAppColors';
import { useToast } from '../hooks/useToast';

interface ClientProfileFormProps {
  client: Client;
  initialData?: ClientProfileData;
  onSave: (data: ClientProfileData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
  client,
  initialData,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ClientProfileData>({
    client_id: client.id,
    data_nascita: '',
    caratteristiche_occhi: {
      forma_occhi: 'normali',
      posizione_occhi: 'normali',
      distanza_occhi: 'normali',
      angolo_esterno: 'normale',
      asimmetria: 'no',
      lunghezza_ciglia_naturali: 'medie',
      foltezza_ciglia_naturali: 'medie',
      direzione_crescita_ciglia: 'dritte'
    },
    profilo_cliente: {
      allergie: false,
      pelle_sensibile: false,
      terapia_ormonale: false,
      gravidanza: false,
      lenti_contatto: false,
      occhiali: false,
      lacrimazione: false,
      note: ''
    },
    trattamenti: []
  });

  const [activeSection, setActiveSection] = useState<'personal' | 'eyes' | 'profile' | 'treatments'>('personal');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  
  const colors = useAppColors();
  const { showSuccess, showError } = useToast();

  // Helper function per colori dinamici delle checkbox
  const getCheckboxColors = (isActive: boolean) => {
    if (isActive) {
      return {
        container: `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.borderPrimary} dark:${colors.borderPrimary} accent-${colors.bgPrimary} dark:accent-${colors.bgPrimaryDark}`,
        text: `${colors.textPrimary} dark:${colors.textPrimaryDark}`,
        textSecondary: `${colors.textPrimary} dark:${colors.textPrimaryDark}`,
        icon: colors.textPrimary
      };
    }
    return {
      container: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
      text: 'text-gray-900 dark:text-gray-100',
      textSecondary: 'text-gray-600 dark:text-gray-400',
      icon: colors.textPrimary
    };
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Calcola il progresso di completamento del form
  useEffect(() => {
    let completedFields = 0;
    let totalFields = 0;

    // Informazioni personali
    totalFields += 1;
    if (formData.data_nascita) completedFields += 1;

    // Caratteristiche occhi
    const eyeFields = Object.keys(formData.caratteristiche_occhi).length;
    totalFields += eyeFields;
    Object.values(formData.caratteristiche_occhi).forEach(value => {
      if (value && value !== '') completedFields += 1;
    });

    // Profilo cliente (solo note contano come campo da compilare)
    totalFields += 1;
    if (formData.profilo_cliente.note && formData.profilo_cliente.note.length > 0) completedFields += 1;

    setProgress(Math.round((completedFields / totalFields) * 100));
  }, [formData]);

  // Validazione dei campi
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'data_nascita':
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          if (birthDate > today) return 'La data di nascita non può essere futura';
          if (today.getFullYear() - birthDate.getFullYear() > 120) return 'Data di nascita non valida';
        }
        return '';
      case 'colore_occhi':
        if (value && value.length < 2) return 'Inserisci almeno 2 caratteri';
        return '';
      case 'note':
        if (value && value.length > 500) return 'Le note non possono superare i 500 caratteri';
        return '';
      default:
        return '';
    }
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validazione in tempo reale
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    // Notifica per campi importanti
    if (field === 'data_nascita' && value && !error) {
      showSuccess('Data di nascita aggiornata');
    }
  };

  const handleEyeCharacteristicsChange = (field: keyof EyeCharacteristics, value: any) => {
    setFormData(prev => ({
      ...prev,
      caratteristiche_occhi: {
        ...prev.caratteristiche_occhi,
        [field]: value
      }
    }));
    
    // Validazione in tempo reale
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    // Notifica per campi importanti delle caratteristiche occhi
    if (field === 'colore_occhi' && value && !error) {
      showSuccess('Colore occhi aggiornato');
    }
  };

  const handleProfileChange = (field: keyof ClientProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      profilo_cliente: {
        ...prev.profilo_cliente,
        [field]: value
      }
    }));
    
    // Validazione in tempo reale
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    // Notifica per campi importanti del profilo cliente
    if (field === 'note' && value && value.length > 10 && !error) {
      showSuccess('Note aggiunte al profilo');
    }
  };

  const handleTreatmentChange = (index: number, treatment: Treatment) => {
    const newTreatments = [...formData.trattamenti];
    newTreatments[index] = treatment;
    setFormData(prev => ({ ...prev, trattamenti: newTreatments }));
  };

  const addTreatment = () => {
    const newTreatment: Treatment = {
      data: new Date().toISOString().split('T')[0],
      curvatura: '',
      spessore: 0.07,
      lunghezze: '',
      schema_occhio: {},
      colla: '',
      tenuta: '',
      colore_ciglia: '',
      refill: 'no',
      tempo_applicazione: '',
      bigodini: [],
      colore: '',
      prezzo: 0
    };

    setFormData(prev => ({
      ...prev,
      trattamenti: [...prev.trattamenti, newTreatment]
    }));
    
    showSuccess('Nuovo trattamento aggiunto');
  };

  const removeTreatment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trattamenti: prev.trattamenti.filter((_, i) => i !== index)
    }));

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Pulisce i dati prima del salvataggio: converte stringhe vuote in undefined
      const cleanedData = {
        ...formData,
        data_nascita: formData.data_nascita || undefined,
        caratteristiche_occhi: {
          ...formData.caratteristiche_occhi,
          colore_occhi: formData.caratteristiche_occhi.colore_occhi || undefined
        },
        profilo_cliente: {
          ...formData.profilo_cliente,
          note: formData.profilo_cliente.note || undefined
        }
      };
      
      await onSave(cleanedData);
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      showError('Errore nel salvataggio del profilo. Riprova.');
    }
  };

  const sections = [
    { 
      id: 'personal', 
      label: 'Informazioni Personali', 
      icon: FiUser,
      description: 'Dati anagrafici e contatti',
      color: 'blue'
    },
    { 
      id: 'eyes', 
      label: 'Caratteristiche Occhi', 
      icon: FiEye,
      description: 'Morfologia e caratteristiche',
      color: 'purple'
    },
    { 
      id: 'profile', 
      label: 'Profilo Cliente', 
      icon: FiHeart,
      description: 'Allergie e condizioni mediche',
      color: 'green'
    },
    { 
      id: 'treatments', 
      label: 'Trattamenti', 
      icon: FiCalendar,
      description: 'Storico e dettagli trattamenti',
      color: 'orange'
    }
  ] as const;

  return (
    <div ref={containerRef} >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y }}
          className={`absolute -top-40 -right-40 w-80 h-80 ${colors.bgGradientLight} dark:opacity-10 rounded-full blur-3xl`}
        />
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
          className={`absolute -bottom-40 -left-40 w-96 h-96 ${colors.bgGradientLight} dark:opacity-10 rounded-full blur-3xl`}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header with Progress */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Scheda Cliente
          </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            {client.nome} {client.cognome}
          </p>
              </div>
        </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Completamento</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{progress}%</div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className={colors.textPrimary}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress / 100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-full ${colors.bgGradient} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Modern Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const colorClasses = {
                  blue: isActive ? `${colors.bgPrimary} ${colors.borderPrimary} ${colors.textPrimary} dark:${colors.bgPrimaryDark} dark:${colors.borderPrimary} dark:${colors.textPrimaryDark}` : `hover:${colors.bgPrimary} hover:${colors.borderHover} dark:hover:${colors.bgPrimaryDark}`,
                  purple: isActive ? `${colors.bgPrimary} ${colors.borderPrimary} ${colors.textPrimary} dark:${colors.bgPrimaryDark} dark:${colors.borderPrimary} dark:${colors.textPrimaryDark}` : `hover:${colors.bgPrimary} hover:${colors.borderHover} dark:hover:${colors.bgPrimaryDark}`,
                  green: isActive ? `${colors.bgPrimary} ${colors.borderPrimary} ${colors.textPrimary} dark:${colors.bgPrimaryDark} dark:${colors.borderPrimary} dark:${colors.textPrimaryDark}` : `hover:${colors.bgPrimary} hover:${colors.borderHover} dark:hover:${colors.bgPrimaryDark}`,
                  orange: isActive ? `${colors.bgPrimary} ${colors.borderPrimary} ${colors.textPrimary} dark:${colors.bgPrimaryDark} dark:${colors.borderPrimary} dark:${colors.textPrimaryDark}` : `hover:${colors.bgPrimary} hover:${colors.borderHover} dark:hover:${colors.bgPrimaryDark}`
                };
                
                return (
                  <motion.button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                      isActive 
                        ? colorClasses[section.color as keyof typeof colorClasses]
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center w-full mb-2">
                      <Icon className={`w-5 h-5 mr-2 ${isActive ? '' : 'group-hover:scale-110 transition-transform duration-200'}`} />
                      <span className="font-semibold text-sm">{section.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                      {section.description}
                    </p>
                    {isActive && (
                      <motion.div
                        layoutId="activeSection"
                        className="absolute inset-0 rounded-xl border-2 border-current opacity-20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Form Sections */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {/* Informazioni Personali */}
              {activeSection === 'personal' && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-8"
                >
                  <div className="flex items-center mb-8">
                    <div className={`p-3 rounded-xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark} mr-4`}>
                      <FiUser className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Informazioni Personali
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Dati anagrafici e informazioni di contatto
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Nome e Cognome
                      </label>
                        <div className="relative">
                      <input
                        type="text"
                        value={`${client.nome} ${client.cognome}`}
                        disabled
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FiInfo className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Informazioni non modificabili
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Telefono
                      </label>
                        <div className="relative">
                      <input
                            type="tel"
                        value={client.telefono || ''}
                            placeholder="+39 123 456 7890"
                            disabled
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FiInfo className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Numero di telefono del cliente
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Data di Nascita
                          <span className="text-red-500 ml-1">*</span>
                      </label>
                        <div className="relative">
                      <input
                        type="date"
                        value={formData.data_nascita || ''}
                        onChange={(e) => handlePersonalInfoChange('data_nascita', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                              validationErrors.data_nascita 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : `border-gray-200 dark:border-gray-600 focus:ring-2 ${colors.focusRing} focus:border-transparent`
                            }`}
                            aria-describedby={validationErrors.data_nascita ? 'data_nascita-error' : undefined}
                          />
                          {formData.data_nascita && !validationErrors.data_nascita && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                          {validationErrors.data_nascita && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FiAlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                          )}
                        </div>
                        {validationErrors.data_nascita && (
                          <p id="data_nascita-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                            <FiAlertCircle className="w-4 h-4 mr-1" />
                            {validationErrors.data_nascita}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Data di nascita per calcolare l'età
                        </p>
                      </div>

                      {/* Age Display */}
                      {formData.data_nascita && !validationErrors.data_nascita && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-4 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl border ${colors.borderPrimary} dark:${colors.borderPrimary}`}
                        >
                          <div className="flex items-center">
                            <div className={`w-2 h-2 ${colors.bgGradient} rounded-full mr-3`}></div>
                            <span className={`text-sm font-medium ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
                              Età: {new Date().getFullYear() - new Date(formData.data_nascita).getFullYear()} anni
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Caratteristiche Occhi */}
              {activeSection === 'eyes' && (
                <motion.div
                  key="eyes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-8"
                >
                  <div className="flex items-center mb-8">
                    <div className={`p-3 rounded-xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark} mr-4`}>
                      <FiEye className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Caratteristiche Occhi
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Morfologia e caratteristiche specifiche degli occhi
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Colore Occhi */}
                    <div className={`${colors.bgGradientLight} rounded-2xl p-6 border ${colors.borderPrimary} dark:${colors.borderPrimary}`}>
                      <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Colore degli Occhi
                      </label>
                      <div className="relative">
                      <input
                        type="text"
                        value={formData.caratteristiche_occhi.colore_occhi || ''}
                        onChange={(e) => handleEyeCharacteristicsChange('colore_occhi', e.target.value)}
                          placeholder="es. marroni, azzurri, verdi, grigi..."
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                            validationErrors.colore_occhi 
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                              : `${colors.borderPrimary} dark:${colors.borderPrimary} focus:ring-2 ${colors.focusRing} focus:border-transparent`
                          }`}
                          aria-describedby={validationErrors.colore_occhi ? 'colore_occhi-error' : undefined}
                        />
                        {formData.caratteristiche_occhi.colore_occhi && !validationErrors.colore_occhi && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FiCheck className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                        {validationErrors.colore_occhi && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FiAlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      {validationErrors.colore_occhi && (
                        <p id="colore_occhi-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                          <FiAlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.colore_occhi}
                        </p>
                      )}
                    </div>

                    {/* Radio Groups Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {[
                        { key: 'forma_occhi', label: 'Forma degli Occhi', options: ['mandorla', 'rotondi', 'normali'], icon: '👁️' },
                        { key: 'posizione_occhi', label: 'Posizione degli Occhi', options: ['sporgenti', 'incavati', 'normali'], icon: '👀' },
                        { key: 'distanza_occhi', label: 'Distanza tra Occhi', options: ['ravvicinati', 'distanziati', 'normali'], icon: '👁️‍🗨️' },
                        { key: 'angolo_esterno', label: 'Angolo Esterno', options: ['normale', 'alto', 'basso'], icon: '↗️' },
                        { key: 'asimmetria', label: 'Asimmetria', options: ['si', 'no'], icon: '⚖️' },
                        { key: 'lunghezza_ciglia_naturali', label: 'Lunghezza Ciglia Naturali', options: ['corte', 'medie', 'lunghe'], icon: '👁️' },
                        { key: 'foltezza_ciglia_naturali', label: 'Foltezza Ciglia Naturali', options: ['rade', 'medie', 'folte'], icon: '👁️' },
                        { key: 'direzione_crescita_ciglia', label: 'Direzione Crescita Ciglia', options: ['in_basso', 'dritte', 'in_alto'], icon: '👁️' }
                      ].map(({ key, label, options, icon }) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">{icon}</span>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {label}
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {options.map((option) => (
                              <motion.label
                                key={option}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option
                                    ? `${colors.borderPrimary} ${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}`
                                    : `border-gray-200 dark:border-gray-600 hover:${colors.borderHover} dark:hover:${colors.borderPrimary} text-gray-700 dark:text-gray-300`
                                }`}
                              >
                              <input
                                type="radio"
                                name={key}
                                value={option}
                                checked={formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option}
                                onChange={(e) => handleEyeCharacteristicsChange(key as keyof EyeCharacteristics, e.target.value)}
                                  className={`w-4 h-4 ${colors.textPrimary} accent-pink-500 bg-gray-100 border-gray-300 focus:ring-2 ${colors.focusRing} dark:focus:ring-${colors.focusRing} dark:ring-offset-gray-800`}
                                />
                                <span className="ml-3 text-sm font-medium capitalize">
                                {option.replace('_', ' ')}
                              </span>
                                {formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto"
                                  >
                                    <FiCheck className={`w-4 h-4 ${colors.textPrimary}`} />
                                  </motion.div>
                                )}
                              </motion.label>
                          ))}
                        </div>
                        </motion.div>
                      ))}
                      </div>
                  </div>
                </motion.div>
              )}

              {/* Profilo Cliente */}
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-8"
                >
                  <div className="flex items-center mb-8">
                    <div className={`p-3 rounded-xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark} mr-4`}>
                      <FiHeart className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Profilo Cliente
                  </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Allergie, condizioni mediche e note importanti
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Checkboxes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'allergie', label: 'Allergie', description: 'Reazioni allergiche note', icon: '⚠️' },
                        { key: 'pelle_sensibile', label: 'Pelle Sensibile', description: 'Pelle particolarmente sensibile', icon: '🤲' },
                        { key: 'terapia_ormonale', label: 'Terapia Ormonale', description: 'In corso di terapia ormonale', icon: '💊' },
                        { key: 'gravidanza', label: 'Gravidanza', description: 'Stato di gravidanza', icon: '🤱' },
                        { key: 'lenti_contatto', label: 'Lenti a Contatto', description: 'Utilizzo di lenti a contatto', icon: '👁️' },
                        { key: 'occhiali', label: 'Occhiali', description: 'Utilizzo di occhiali', icon: '👓' },
                        { key: 'lacrimazione', label: 'Lacrimazione', description: 'Tendenza alla lacrimazione', icon: '💧' }
                      ].map(({ key, label, description, icon }) => {
                        const isActive = formData.profilo_cliente[key as keyof ClientProfile] as boolean;
                        const checkboxColors = getCheckboxColors(isActive);
                        
                        return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${checkboxColors.container}`}
                          onClick={() => handleProfileChange(key as keyof ClientProfile, !(formData.profilo_cliente[key as keyof ClientProfile] as boolean))}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={formData.profilo_cliente[key as keyof ClientProfile] as boolean}
                                onChange={(e) => handleProfileChange(key as keyof ClientProfile, e.target.checked)}
                                className={`w-5 h-5 ${colors.textPrimary} accent-pink-500 dark:accent-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-2 ${colors.focusRing} dark:focus:ring-${colors.focusRing} dark:ring-offset-gray-800`}
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{icon}</span>
                                <h3 className={`text-lg font-semibold ${checkboxColors.text}`}>
                                  {label}
                                </h3>
                              </div>
                              <p className={`text-sm mt-1 ${checkboxColors.textSecondary}`}>
                                {description}
                              </p>
                            </div>
                            {formData.profilo_cliente[key as keyof ClientProfile] as boolean && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-4 right-4"
                              >
                                <FiCheck className={`w-5 h-5 ${checkboxColors.icon}`} />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                        );
                      })}
                    </div>

                    {/* Note Section */}
                    <div className={`${colors.bgGradientLight} rounded-2xl p-6 border ${colors.borderPrimary} dark:${colors.borderPrimary}`}>
                      <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Note Aggiuntive
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          (max 500 caratteri)
                        </span>
                      </label>
                      <div className="relative">
                      <textarea
                        value={formData.profilo_cliente.note || ''}
                        onChange={(e) => handleProfileChange('note', e.target.value)}
                        rows={4}
                          placeholder="Note aggiuntive sul cliente, preferenze particolari, allergie specifiche..."
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 resize-none ${
                            validationErrors.note 
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                              : `${colors.borderPrimary} dark:${colors.borderPrimary} focus:ring-2 ${colors.focusRing} focus:border-transparent`
                          }`}
                          aria-describedby={validationErrors.note ? 'note-error' : 'note-help'}
                          maxLength={500}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {(formData.profilo_cliente.note || '').length}/500
                        </div>
                      </div>
                      {validationErrors.note && (
                        <p id="note-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                          <FiAlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.note}
                        </p>
                      )}
                      <p id="note-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Inserisci informazioni aggiuntive che potrebbero essere utili per il trattamento
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Trattamenti */}
              {activeSection === 'treatments' && (
                <motion.div
                  key="treatments"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark} mr-4`}>
                        <FiCalendar className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Trattamenti
                    </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          Storico e dettagli dei trattamenti effettuati ({formData.trattamenti.length})
                        </p>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={addTreatment}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center px-6 py-3 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg ${colors.shadowPrimary} font-semibold`}
                    >
                      <FiPlus className="w-5 h-5 mr-2" />
                      Aggiungi Trattamento
                    </motion.button>
                  </div>

                  <div className="space-y-6">
                    <AnimatePresence>
                      {formData.trattamenti.map((treatment, index) => (
                        <motion.div
                          key={treatment.id || index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                        >
                          <TreatmentForm
                          treatment={treatment}
                          index={index}
                          onChange={(updatedTreatment) => handleTreatmentChange(index, updatedTreatment)}
                          onRemove={() => removeTreatment(index)}
                          isLast={index === formData.trattamenti.length - 1}
                        />
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {formData.trattamenti.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600"
                      >
                        <div className={`w-20 h-20 mx-auto mb-6 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-full flex items-center justify-center`}>
                          <FiCalendar className={`w-10 h-10 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Nessun trattamento registrato
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Inizia aggiungendo il primo trattamento per questo cliente
                        </p>
                        <motion.button
                          type="button"
                          onClick={addTreatment}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`inline-flex items-center px-6 py-3 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg ${colors.shadowPrimary} font-semibold`}
                        >
                          <FiPlus className="w-5 h-5 mr-2" />
                          Aggiungi Primo Trattamento
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Modern Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
          >
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className={`w-2 h-2 ${colors.bgGradient} rounded-full mr-2`}></div>
              <span>Profilo {progress}% completato</span>
            </div>

            <div className="flex gap-4">
              <motion.button
              type="button"
              onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-semibold"
            >
              Annulla
              </motion.button>
              <motion.button
              type="submit"
              disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className={`flex items-center px-8 py-3 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg ${colors.shadowPrimary} font-semibold`}
            >
              {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Salvataggio...
                </>
              ) : (
                <>
                    <FiSave className="w-5 h-5 mr-3" />
                  Salva Scheda
                </>
              )}
              </motion.button>
          </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default ClientProfileForm;
