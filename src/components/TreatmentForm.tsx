import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import type { Treatment, EyeLengthMap } from '../types';
import EyeSchemaCanvas from './EyeSchemaCanvas';
import { 
  FiTrash2, 
  FiPlus, 
  FiCalendar, 
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiSave,
  FiClock,
  FiDollarSign,
  FiSettings,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiEye,
  FiTarget,
  FiZap
} from 'react-icons/fi';
import { useAppColors } from '../hooks/useAppColors';

interface TreatmentFormProps {
  treatment: Treatment;
  index: number;
  onChange: (treatment: Treatment) => void;
  onRemove: () => void;
  isLast: boolean;
}

const TreatmentForm: React.FC<TreatmentFormProps> = ({
  treatment,
  index,
  onChange,
  onRemove,
  isLast
}) => {
  const [isExpanded, setIsExpanded] = useState(isLast);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [20, -20]);
  
  const colors = useAppColors();

  // Calcola il progresso di completamento del trattamento
  React.useEffect(() => {
    let completedFields = 0;
    let totalFields = 0;

    const requiredFields = ['data', 'curvatura', 'spessore', 'lunghezze', 'colla', 'tenuta', 'colore_ciglia', 'tempo_applicazione', 'refill', 'prezzo'];
    
    requiredFields.forEach(field => {
      totalFields += 1;
      const value = treatment[field as keyof Treatment];
      if (value !== undefined && value !== null && value !== '') {
        completedFields += 1;
      }
    });

    // Bigodini contano come un campo
    totalFields += 1;
    if (treatment.bigodini && treatment.bigodini.length > 0) {
      completedFields += 1;
    }

    setCompletionPercentage(Math.round((completedFields / totalFields) * 100));
  }, [treatment]);

  // Validazione dei campi
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'data':
        if (value) {
          const treatmentDate = new Date(value);
          const today = new Date();
          if (treatmentDate > today) return 'La data non può essere futura';
        }
        return '';
      case 'spessore':
        if (value && (value < 0.05 || value > 0.20)) {
          return 'Lo spessore deve essere tra 0.05 e 0.20 mm';
        }
        return '';
      case 'prezzo':
        if (value && value < 0) return 'Il prezzo non può essere negativo';
        return '';
      case 'tempo_applicazione':
        if (value && !/^\d+[hm]?$/.test(value)) {
          return 'Formato non valido (es. 2h, 120m)';
        }
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof Treatment, value: any) => {
    onChange({ ...treatment, [field]: value });
    
    // Validazione in tempo reale
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleSchemaChange = (schema: EyeLengthMap) => {
    onChange({ ...treatment, schema_occhio: schema });
  };

  const handleBigodiniChange = (bigodino: string, checked: boolean) => {
    const currentBigodini = treatment.bigodini || [];
    const newBigodini = checked
      ? [...currentBigodini, bigodino]
      : currentBigodini.filter(b => b !== bigodino);
    
    onChange({ ...treatment, bigodini: newBigodini });
  };

  const bigodiniOptions = ['S', 'M', 'L', 'S1', 'M1', 'L1', 'XL', 'XL1'];
  const curvaturaOptions = ['A', 'B', 'C', 'D', 'L', 'L+', 'M', 'M+'];

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
      style={{ y }}
    >
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className={`absolute -top-20 -right-20 w-40 h-40 ${colors.bgGradientLight} dark:opacity-5 rounded-full blur-2xl`}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header con Progress */}
      <div className="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`w-12 h-12 ${colors.bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg font-bold text-white">
                {index + 1}
              </span>
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Trattamento #{index + 1}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isExpanded ? 'Modifica i dettagli' : 'Clicca per espandere'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">Completamento</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{completionPercentage}%</div>
              </div>
              <div className="w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
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
                    animate={{ pathLength: completionPercentage / 100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </svg>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isExpanded 
                    ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}` 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={isExpanded ? 'Comprimi' : 'Espandi'}
              >
                {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                aria-label="Rimuovi trattamento"
              >
                <FiTrash2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full ${colors.bgGradient} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="p-6 space-y-8"
          >
            {/* Informazioni Base */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className={`p-3 rounded-xl ${colors.bgPrimary} dark:${colors.bgPrimaryDark} mr-4`}>
                  <FiSettings className={`w-5 h-5 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Informazioni Base
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dettagli principali del trattamento
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FiCalendar className="inline w-4 h-4 mr-2" />
                    Data Trattamento
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={treatment.data}
                      onChange={(e) => handleFieldChange('data', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                        validationErrors.data 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : `border-gray-200 dark:border-gray-600 focus:ring-2 ${colors.focusRing} focus:border-transparent`
                      }`}
                      aria-describedby={validationErrors.data ? 'data-error' : undefined}
                    />
                    {treatment.data && !validationErrors.data && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <FiCheck className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                    {validationErrors.data && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <FiAlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.data && (
                    <p id="data-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.data}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FiTarget className="inline w-4 h-4 mr-2" />
                    Curvatura
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={treatment.curvatura}
                    onChange={(e) => handleFieldChange('curvatura', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                      treatment.curvatura 
                        ? `border-gray-200 dark:border-gray-600 focus:ring-2 ${colors.focusRing} focus:border-transparent` 
                        : `border-gray-200 dark:border-gray-600 focus:ring-2 ${colors.focusRing} focus:border-transparent`
                    }`}
                  >
                    <option value="">Seleziona curvatura</option>
                    {curvaturaOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {treatment.curvatura && (
                    <div className="mt-2 flex items-center text-green-600 dark:text-green-400">
                      <FiCheck className="w-4 h-4 mr-1" />
                      <span className="text-sm">Curvatura selezionata</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FiZap className="inline w-4 h-4 mr-2" />
                    Spessore (mm)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.05"
                      max="0.20"
                      value={treatment.spessore}
                      onChange={(e) => handleFieldChange('spessore', parseFloat(e.target.value))}
                      placeholder="0.07"
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                        validationErrors.spessore 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : `border-gray-200 dark:border-gray-600 focus:ring-2 ${colors.focusRing} focus:border-transparent`
                      }`}
                      aria-describedby={validationErrors.spessore ? 'spessore-error' : 'spessore-help'}
                    />
                    {treatment.spessore && !validationErrors.spessore && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <FiCheck className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                    {validationErrors.spessore && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <FiAlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.spessore && (
                    <p id="spessore-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.spessore}
                    </p>
                  )}
                  <p id="spessore-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Range: 0.05 - 0.20 mm
                  </p>
                </div>
              </div>
            </div>

            {/* Lunghezze e schema occhio */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lunghezze (es. 7-13 mm)
                </label>
                <input
                  type="text"
                  value={treatment.lunghezze}
                  onChange={(e) => handleFieldChange('lunghezze', e.target.value)}
                  placeholder="es. 7-13 mm"
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>

              <EyeSchemaCanvas
                value={treatment.schema_occhio || {}}
                onChange={handleSchemaChange}
              />
            </div>

            {/* Dettagli trattamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colla
                </label>
                <input
                  type="text"
                  value={treatment.colla}
                  onChange={(e) => handleFieldChange('colla', e.target.value)}
                  placeholder="Nome prodotto"
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tenuta
                </label>
                <input
                  type="text"
                  value={treatment.tenuta}
                  onChange={(e) => handleFieldChange('tenuta', e.target.value)}
                  placeholder="es. 4 settimane"
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colore ciglia
                </label>
                <input
                  type="text"
                  value={treatment.colore_ciglia}
                  onChange={(e) => handleFieldChange('colore_ciglia', e.target.value)}
                  placeholder="es. nere"
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tempo applicazione
                </label>
                <input
                  type="text"
                  value={treatment.tempo_applicazione}
                  onChange={(e) => handleFieldChange('tempo_applicazione', e.target.value)}
                  placeholder="es. 2h"
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>
            </div>

            {/* Refill */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Refill
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`refill-${index}`}
                    value="si"
                    checked={treatment.refill === 'si'}
                    onChange={(e) => handleFieldChange('refill', e.target.value)}
                    className="w-4 h-4 accent-pink-600 bg-gray-100 border-gray-300 rounded-xl focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2"                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sì</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`refill-${index}`}
                    value="no"
                    checked={treatment.refill === 'no'}
                    onChange={(e) => handleFieldChange('refill', e.target.value)}
                    className="w-4 h-4 accent-pink-600 bg-gray-100 border-gray-300 rounded-xl focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2"                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
            </div>

            {/* Bigodini */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Bigodini
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bigodiniOptions.map(bigodino => (
                  <label key={bigodino} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={treatment.bigodini?.includes(bigodino) || false}
                      onChange={(e) => handleBigodiniChange(bigodino, e.target.checked)}
                      className="w-4 h-4 accent-pink-600 bg-gray-100 border-gray-300 rounded-xl focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2"                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{bigodino}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Colore e prezzo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colore
                </label>
                <input
                  type="text"
                  value={treatment.colore}
                  onChange={(e) => handleFieldChange('colore', e.target.value)}
                  placeholder="Colore"
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prezzo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={treatment.prezzo}
                  onChange={(e) => handleFieldChange('prezzo', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TreatmentForm;
