import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Treatment, EyeLengthMap } from '../types';
import EyeSchemaCanvas from './EyeSchemaCanvas';
import { FiTrash2, FiPlus, FiCalendar } from 'react-icons/fi';
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
  const colors = useAppColors();

  const handleFieldChange = (field: keyof Treatment, value: any) => {
    onChange({ ...treatment, [field]: value });
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl flex items-center justify-center`}>
            <span className={`text-sm font-medium ${colors.textPrimary} dark:${colors.textPrimaryDark}`}>
              {index + 1}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Trattamento #{index + 1}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FiPlus className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 text-red-500 hover:text-red-700 transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-6"
          >
            {/* Data e informazioni base */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="inline w-4 h-4 mr-1" />
                  Data
                </label>
                <input
                  type="date"
                  value={treatment.data}
                  onChange={(e) => handleFieldChange('data', e.target.value)}
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Curvatura
                </label>
                <select
                  value={treatment.curvatura}
                  onChange={(e) => handleFieldChange('curvatura', e.target.value)}
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                >
                  <option value="">Seleziona curvatura</option>
                  {curvaturaOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spessore (mm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="0.20"
                  value={treatment.spessore}
                  onChange={(e) => handleFieldChange('spessore', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
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
