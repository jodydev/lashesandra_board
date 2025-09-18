import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Client, ClientProfileData, EyeCharacteristics, ClientProfile, Treatment } from '../types';
import TreatmentForm from './TreatmentForm';
import { FiUser, FiEye, FiHeart, FiCalendar, FiPlus, FiSave, FiArrowLeft } from 'react-icons/fi';
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
  const colors = useAppColors();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Notifica per campi importanti
    if (field === 'data_nascita' && value) {
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
    
    // Notifica per campi importanti delle caratteristiche occhi
    if (field === 'colore_occhi' && value) {
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
    
    // Notifica per campi importanti del profilo cliente
    if (field === 'note' && value && value.length > 10) {
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
    { id: 'personal', label: 'Informazioni Personali', icon: FiUser },
    { id: 'eyes', label: 'Caratteristiche Occhi', icon: FiEye },
    { id: 'profile', label: 'Profilo Cliente', icon: FiHeart },
    { id: 'treatments', label: 'Trattamenti', icon: FiCalendar }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Torna indietro
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Scheda Cliente
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            {client.nome} {client.cognome}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                    }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Sections */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
            <AnimatePresence mode="wait">
              {/* Informazioni Personali */}
              {activeSection === 'personal' && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FiUser className="w-5 h-5 mr-2" />
                    Informazioni Personali
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome e Cognome
                      </label>
                      <input
                        type="text"
                        value={`${client.nome} ${client.cognome}`}
                        disabled
                        className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefono
                      </label>
                      <input
                        type="text"
                        value={client.telefono || ''}
                        placeholder="Example: +39 123 456 7890"
                        className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 placeholder-gray-500`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data di Nascita
                      </label>
                      <input
                        type="date"
                        value={formData.data_nascita || ''}
                        onChange={(e) => handlePersonalInfoChange('data_nascita', e.target.value)}
                        className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                      />
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
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FiEye className="w-5 h-5 mr-2" />
                    Caratteristiche Occhi
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colore Occhi
                      </label>
                      <input
                        type="text"
                        value={formData.caratteristiche_occhi.colore_occhi || ''}
                        onChange={(e) => handleEyeCharacteristicsChange('colore_occhi', e.target.value)}
                        placeholder="es. marroni, azzurri, verdi..."
                        className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                      />
                    </div>

                    {/* Radio Groups */}
                    {[
                      { key: 'forma_occhi', label: 'Forma degli Occhi', options: ['mandorla', 'rotondi', 'normali'] },
                      { key: 'posizione_occhi', label: 'Posizione degli Occhi', options: ['sporgenti', 'incavati', 'normali'] },
                      { key: 'distanza_occhi', label: 'Distanza tra Occhi', options: ['ravvicinati', 'distanziati', 'normali'] },
                      { key: 'angolo_esterno', label: 'Angolo Esterno', options: ['normale', 'alto', 'basso'] },
                      { key: 'asimmetria', label: 'Asimmetria', options: ['si', 'no'] },
                      { key: 'lunghezza_ciglia_naturali', label: 'Lunghezza Ciglia Naturali', options: ['corte', 'medie', 'lunghe'] },
                      { key: 'foltezza_ciglia_naturali', label: 'Foltezza Ciglia Naturali', options: ['rade', 'medie', 'folte'] },
                      { key: 'direzione_crescita_ciglia', label: 'Direzione Crescita Ciglia', options: ['in_basso', 'dritte', 'in_alto'] }
                    ].map(({ key, label, options }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {label}
                        </label>
                        <div className="flex flex-wrap gap-4">
                          {options.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value={option}
                                checked={formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option}
                                onChange={(e) => handleEyeCharacteristicsChange(key as keyof EyeCharacteristics, e.target.value)}
                                className="w-4 h-4 accent-pink-600 bg-gray-100 border-gray-300 rounded-xl focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2"                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {option.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
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
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FiHeart className="w-5 h-5 mr-2" />
                    Profilo Cliente
                  </h2>

                  <div className="space-y-4">
                    {[
                      { key: 'allergie', label: 'Allergie' },
                      { key: 'pelle_sensibile', label: 'Pelle Sensibile' },
                      { key: 'terapia_ormonale', label: 'Terapia Ormonale' },
                      { key: 'gravidanza', label: 'Gravidanza' },
                      { key: 'lenti_contatto', label: 'Lenti a Contatto' },
                      { key: 'occhiali', label: 'Occhiali' },
                      { key: 'lacrimazione', label: 'Lacrimazione' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.profilo_cliente[key as keyof ClientProfile] as boolean}
                          onChange={(e) => handleProfileChange(key as keyof ClientProfile, e.target.checked)}
                          className="w-4 h-4 accent-pink-600 bg-gray-100 border-gray-300 rounded-xl focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2"                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      </label>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Note
                      </label>
                      <textarea
                        value={formData.profilo_cliente.note || ''}
                        onChange={(e) => handleProfileChange('note', e.target.value)}
                        rows={4}
                        placeholder="Note aggiuntive sul cliente..."
                        className={`w-full px-3 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                      />
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
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <FiCalendar className="w-5 h-5 mr-2" />
                      Trattamenti ({formData.trattamenti.length})
                    </h2>
                    <button
                      type="button"
                      onClick={addTreatment}
                      className={`flex items-center px-4 py-2 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg ${colors.shadowPrimary}`}
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Aggiungi Trattamento
                    </button>
                  </div>

                  <div className="space-y-6">
                    <AnimatePresence>
                      {formData.trattamenti.map((treatment, index) => (
                        <TreatmentForm
                          key={treatment.id || index}
                          treatment={treatment}
                          index={index}
                          onChange={(updatedTreatment) => handleTreatmentChange(index, updatedTreatment)}
                          onRemove={() => removeTreatment(index)}
                          isLast={index === formData.trattamenti.length - 1}
                        />
                      ))}
                    </AnimatePresence>

                    {formData.trattamenti.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <FiCalendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nessun trattamento registrato</p>
                        <p className="text-sm">Clicca su "Aggiungi Trattamento" per iniziare</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center px-6 py-2 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg ${colors.shadowPrimary}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  Salva Scheda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientProfileForm;
