import React, { useState } from 'react';
import type { Treatment, EyeLengthMap } from '../types';
import EyeSchemaCanvas from './EyeSchemaCanvas';
import {
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings,
  Check,
  AlertCircle,
  Target,
  Zap,
} from 'lucide-react';
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const colors = useAppColors();
  const textPrimary = '#2C2C2C';
  const textSecondary = '#7A7A7A';
  const accentSofter = `${colors.primary}14`;

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
    <div
      role="group"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="relative overflow-hidden"
    >
      {/* Header con progresso — più padding e touch target 44px+ */}
      <div className="relative px-5 sm:px-6 lg:px-8 py-5 sm:py-6 border-b" style={{ borderColor: accentSofter }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ background: colors.cssGradient }}
            >
              <span className="text-lg font-bold text-white">{index + 1}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: textPrimary }}>
                Trattamento #{index + 1}
              </h3>
              <p className="text-sm truncate" style={{ color: textSecondary }}>
                {isExpanded ? 'Modifica i dettagli' : 'Clicca per espandere'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs" style={{ color: textSecondary }}>Completamento</div>
                <div className="text-lg font-bold" style={{ color: textPrimary }}>{completionPercentage}%</div>
              </div>
              <div className="w-10 h-10 relative flex-shrink-0">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke={colors.primary}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - completionPercentage / 100}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-3 rounded-xl transition-opacity hover:opacity-90 ${
                  isExpanded ? 'opacity-100' : 'opacity-80'
                }`}
                style={
                  isExpanded
                    ? { background: colors.cssGradient, color: '#fff' }
                    : { color: textSecondary, backgroundColor: accentSofter }
                }
                aria-label={isExpanded ? 'Comprimi' : 'Espandi'}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                aria-label="Rimuovi trattamento"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${completionPercentage}%`, background: colors.cssGradient }}
          />
        </div>
      </div>

      {isExpanded && (
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10"
          >
            {/* Informazioni Base — più spazio e campi più grandi */}
            <div className="" >
              <div className="flex items-center gap-4 mb-8">
                <div>
                  <h4 className="text-lg font-semibold" style={{ color: textPrimary }}>
                    Informazioni Base
                  </h4>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    Dettagli principali del trattamento
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: textPrimary }}>
                    <Calendar className="w-4 h-4" />
                    Data Trattamento
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={treatment.data}
                      onChange={(e) => handleFieldChange('data', e.target.value)}
                      className={`w-full min-h-[44px] px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                        validationErrors.data
                          ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-offset-0 focus:border-transparent'
                      }`}
                      aria-describedby={validationErrors.data ? 'data-error' : undefined}
                    />
                    {treatment.data && !validationErrors.data && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {validationErrors.data && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.data && (
                    <p id="data-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {validationErrors.data}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: textPrimary }}>
                    <Target className="w-4 h-4" />
                    Curvatura
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={treatment.curvatura}
                    onChange={(e) => handleFieldChange('curvatura', e.target.value)}
                    className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                  >
                    <option value="">Seleziona curvatura</option>
                    {curvaturaOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {treatment.curvatura && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>Curvatura selezionata</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: textPrimary }}>
                    <Zap className="w-4 h-4" />
                    Spessore (mm)
                    <span className="text-red-500">*</span>
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
                      className={`w-full min-h-[44px] px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                        validationErrors.spessore
                          ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-offset-0 focus:border-transparent'
                      }`}
                      aria-describedby={validationErrors.spessore ? 'spessore-error' : 'spessore-help'}
                    />
                    {treatment.spessore && !validationErrors.spessore && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {validationErrors.spessore && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.spessore && (
                    <p id="spessore-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {validationErrors.spessore}
                    </p>
                  )}
                  <p id="spessore-help" className="text-xs" style={{ color: textSecondary }}>
                    Range: 0.05 - 0.20 mm
                  </p>
                </div>
              </div>
            </div>

            {/* Lunghezze e schema occhio */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Lunghezze (es. 7-13 mm)
                </label>
                <input
                  type="text"
                  value={treatment.lunghezze}
                  onChange={(e) => handleFieldChange('lunghezze', e.target.value)}
                  placeholder="es. 7-13 mm"
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>

              <EyeSchemaCanvas
                value={treatment.schema_occhio || {}}
                onChange={handleSchemaChange}
              />
            </div>

            {/* Dettagli trattamento — grid con gap maggiore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Colla
                </label>
                <input
                  type="text"
                  value={treatment.colla}
                  onChange={(e) => handleFieldChange('colla', e.target.value)}
                  placeholder="Nome prodotto"
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Tenuta
                </label>
                <input
                  type="text"
                  value={treatment.tenuta}
                  onChange={(e) => handleFieldChange('tenuta', e.target.value)}
                  placeholder="es. 4 settimane"
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Colore ciglia
                </label>
                <input
                  type="text"
                  value={treatment.colore_ciglia}
                  onChange={(e) => handleFieldChange('colore_ciglia', e.target.value)}
                  placeholder="es. nere"
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Tempo applicazione
                </label>
                <input
                  type="text"
                  value={treatment.tempo_applicazione}
                  onChange={(e) => handleFieldChange('tempo_applicazione', e.target.value)}
                  placeholder="es. 2h"
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Refill — touch target più grandi */}
            <div className="space-y-4">
              <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                Refill
              </label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="radio"
                    name={`refill-${index}`}
                    value="si"
                    checked={treatment.refill === 'si'}
                    onChange={(e) => handleFieldChange('refill', e.target.value)}
                    className="w-5 h-5 accent-[#c2886d] bg-gray-100 border-gray-300 rounded-full focus:ring-2 focus:ring-[#c2886d] dark:focus:ring-[#a06d52] dark:ring-offset-gray-800"
                  />
                  <span className="text-sm" style={{ color: textPrimary }}>Sì</span>
                </label>
                <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="radio"
                    name={`refill-${index}`}
                    value="no"
                    checked={treatment.refill === 'no'}
                    onChange={(e) => handleFieldChange('refill', e.target.value)}
                    className="w-5 h-5 accent-[#c2886d] bg-gray-100 border-gray-300 rounded-full focus:ring-2 focus:ring-[#c2886d] dark:focus:ring-[#a06d52] dark:ring-offset-gray-800"
                  />
                  <span className="text-sm" style={{ color: textPrimary }}>No</span>
                </label>
              </div>
            </div>

            {/* Bigodini — griglia più ariosa */}
            <div className="space-y-4">
              <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                Bigodini
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bigodiniOptions.map(bigodino => (
                  <label key={bigodino} className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={treatment.bigodini?.includes(bigodino) || false}
                      onChange={(e) => handleBigodiniChange(bigodino, e.target.checked)}
                      className="w-5 h-5 accent-[#c2886d] bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-[#c2886d] dark:focus:ring-[#a06d52] dark:ring-offset-gray-800"
                    />
                    <span className="text-sm" style={{ color: textPrimary }}>{bigodino}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Colore e prezzo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Colore
                </label>
                <input
                  type="text"
                  value={treatment.colore}
                  onChange={(e) => handleFieldChange('colore', e.target.value)}
                  placeholder="Colore"
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textPrimary }}>
                  Prezzo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={treatment.prezzo}
                  onChange={(e) => handleFieldChange('prezzo', parseFloat(e.target.value))}
                  className="w-full min-h-[44px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default TreatmentForm;
