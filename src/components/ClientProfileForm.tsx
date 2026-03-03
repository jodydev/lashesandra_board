import React, { useState, useEffect } from 'react';
import type { Client, ClientProfileData, EyeCharacteristics, ClientProfile, Treatment, TreatmentCatalogEntry } from '../types';
import TreatmentForm from './TreatmentForm';
import { useSupabaseServices } from '../lib/supabaseService';
import {
  User,
  Eye,
  Heart,
  Calendar,
  Plus,
  Save,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useAppColors } from '../hooks/useAppColors';
import { useToast } from '../hooks/useToast';
import { useApp } from '../contexts/AppContext';

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

  const colors = useAppColors();
  const { showSuccess, showError } = useToast();
  const { appType } = useApp();
  const { treatmentCatalogService } = useSupabaseServices();
  const [catalogEntries, setCatalogEntries] = useState<TreatmentCatalogEntry[]>([]);

  useEffect(() => {
    treatmentCatalogService.getAllByAppType(appType).then(setCatalogEntries).catch(() => setCatalogEntries([]));
  }, [appType, treatmentCatalogService]);

  const textPrimaryColor = '#2C2C2C';
  const textSecondaryColor = '#7A7A7A';
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const surfaceColor = '#FFFFFF';
  const accentDark = colors.primaryDark;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;

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
    { id: 'personal', label: 'Informazioni Personali', icon: User, description: 'Dati anagrafici e contatti' },
    { id: 'eyes', label: 'Caratteristiche Occhi', icon: Eye, description: 'Morfologia e caratteristiche' },
    { id: 'profile', label: 'Profilo Cliente', icon: Heart, description: 'Allergie e condizioni mediche' },
    { id: 'treatments', label: 'Trattamenti', icon: Calendar, description: 'Storico e dettagli trattamenti' },
  ] as const;

  const accentColor = colors.primary;

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader
        title={`${client.nome} ${client.cognome}`}
        showBack
        onBack={onCancel}
        backLabel="Indietro"
        rightAction={{ type: 'label', label: 'Salva', formId: 'client-profile-form', disabled: isLoading }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ backgroundColor: accentSofter }}>
            <span className="text-xs font-semibold" style={{ color: accentDark }}>Grado completamento: {progress}%</span>
          </div>
          <div className="h-2 flex-1 max-w-xs rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: accentGradient }} />
          </div>
        </div>

        <form id="client-profile-form" onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Section navigation (stile ClientList: chip buttons) */}
          <div
            className="rounded-2xl border p-4 sm:p-6 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${surfaceColor}F6, rgba(255,255,255,0.92))`, borderColor: accentSofter }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isActive
                        ? 'text-white border-transparent'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={isActive ? { background: accentGradient } : undefined}
                  >
                    <div className="flex items-center w-full mb-1">
                      <span className="font-semibold text-sm truncate">{section.label}</span>
                    </div>
                    <p className="text-xs text-start leading-relaxed opacity-90 truncate w-full">
                      {section.description}
                    </p>

                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Sections */}
          <div
            className="rounded-2xl border shadow-lg overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${surfaceColor}F6, rgba(255,255,255,0.92))`,
              borderColor: accentSofter,
            }}
          >
              {/* Informazioni Personali */}
              {activeSection === 'personal' && (
                <div className="p-6 sm:p-8">
                  <div className="flex items-center mb-6 sm:mb-8">
                    <div>
                      <h2
                        className="text-2xl font-bold dark:text-gray-100"
                        style={{ color: textPrimaryColor }}
                      >
                        Informazioni Personali
                      </h2>
                      <p
                        className="mt-1 dark:text-gray-400"
                        style={{ color: textSecondaryColor }}
                      >
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
                            <Info className="w-4 h-4 text-gray-400" />
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
                            <Info className="w-4 h-4 text-gray-400" />
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
                            className={`w-2/3 px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 ${
                              validationErrors.data_nascita 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : `border-gray-200 dark:border-gray-600 focus:ring-2 ${colors.focusRing} focus:border-transparent`
                            }`}
                            aria-describedby={validationErrors.data_nascita ? 'data_nascita-error' : undefined}
                          />
                          {formData.data_nascita && !validationErrors.data_nascita && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                          {validationErrors.data_nascita && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                          )}
                        </div>
                        {validationErrors.data_nascita && (
                          <p id="data_nascita-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {validationErrors.data_nascita}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Data di nascita per calcolare l'età
                        </p>
                      </div>

                      {/* Age Display */}
                      {formData.data_nascita && !validationErrors.data_nascita && (
                        <div
                          className="rounded-xl border p-4"
                          style={{
                            backgroundColor: accentSofter,
                            borderColor: accentSoft,
                          }}
                        >
                          <div className="flex items-center">
                            <div
                              className="mr-3 h-2 w-2 rounded-full"
                              style={{ background: accentGradient }}
                            />
                            <span
                              className="text-sm font-medium dark:text-gray-100"
                              style={{ color: accentDark }}
                            >
                              Età: {new Date().getFullYear() - new Date(formData.data_nascita).getFullYear()} anni
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Caratteristiche Occhi */}
              {activeSection === 'eyes' && (
                <div className="p-6 sm:p-8">
                  <div className="flex items-center mb-6 sm:mb-8">
                    <div>
                      <h2
                        className="text-2xl font-bold dark:text-gray-100"
                        style={{ color: textPrimaryColor }}
                      >
                        Caratteristiche Occhi
                      </h2>
                      <p
                        className="mt-1 dark:text-gray-400"
                        style={{ color: textSecondaryColor }}
                      >
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
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                        {validationErrors.colore_occhi && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      {validationErrors.colore_occhi && (
                        <p id="colore_occhi-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
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
                        <div
                          key={key}
                          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
                        >
                          <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">{icon}</span>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {label}
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {options.map((option) => (
                              <label
                                key={option}
                                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                  formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option
                                    ? 'border-transparent text-white'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                style={formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option ? { background: accentGradient } : undefined}
                              >
                                <input
                                  type="radio"
                                  name={key}
                                  value={option}
                                  checked={formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option}
                                  onChange={(e) => handleEyeCharacteristicsChange(key as keyof EyeCharacteristics, e.target.value)}
                                  className="w-4 h-4 accent-[#c2886d] bg-gray-100 border-gray-300 focus:ring-2 focus:ring-offset-0 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-3 text-sm font-medium capitalize">
                                  {option.replace('_', ' ')}
                                </span>
                                {formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option && (
                                  <div className="ml-auto">
                                    <Check className="w-4 h-4" style={{ color: formData.caratteristiche_occhi[key as keyof EyeCharacteristics] === option ? 'white' : undefined }} />
                                  </div>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      </div>
                  </div>
                </div>
              )}

              {/* Profilo Cliente */}
              {activeSection === 'profile' && (
                <div className="p-6 sm:p-8">
                  <div className="flex items-center mb-6 sm:mb-8">
                    <div>
                      <h2
                        className="text-2xl font-bold dark:text-gray-100"
                        style={{ color: textPrimaryColor }}
                      >
                        Profilo Cliente
                      </h2>
                      <p
                        className="mt-1 dark:text-gray-400"
                        style={{ color: textSecondaryColor }}
                      >
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
                        <div
                          key={key}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${checkboxColors.container}`}
                          onClick={() => handleProfileChange(key as keyof ClientProfile, !(formData.profilo_cliente[key as keyof ClientProfile] as boolean))}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={formData.profilo_cliente[key as keyof ClientProfile] as boolean}
                                onChange={(e) => handleProfileChange(key as keyof ClientProfile, e.target.checked)}
                                className="w-5 h-5 accent-[#c2886d] dark:accent-[#a06d52] bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-offset-0 dark:bg-gray-700 dark:border-gray-600"
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
                              <div className="absolute top-4 right-4">
                                <Check className={`w-5 h-5 ${checkboxColors.icon}`} />
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    {/* Note Section */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                      <label className="block text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Note aggiuntive
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(max 500 caratteri)</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={formData.profilo_cliente.note || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleProfileChange('note', e.target.value)}
                          rows={4}
                          placeholder="Scrivi qui eventuali note sul cliente, preferenze o avvertenze importanti..."
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200 resize-none
                            ${validationErrors.note
                              ? 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-400 focus:border-gray-400'
                              : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-400 focus:border-gray-400'
                            }`}
                          aria-describedby={validationErrors.note ? 'note-error' : 'note-help'}
                          maxLength={500}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {(formData.profilo_cliente.note || '').length}/500
                        </div>
                      </div>
                      {validationErrors.note && (
                        <p id="note-error" className="text-sm text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.note}
                        </p>
                      )}
                      <p id="note-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Inserisci solo informazioni utili e brevi che possono facilitare il servizio.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trattamenti — layout più arioso e facile da usare */}
              {activeSection === 'treatments' && (
                <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10">
                    <div>
                      <h2
                        className="text-2xl sm:text-3xl font-bold dark:text-gray-100"
                        style={{ color: textPrimaryColor }}
                      >
                        Trattamenti
                      </h2>
                      <p
                        className="mt-2 text-base dark:text-gray-400"
                        style={{ color: textSecondaryColor }}
                      >
                        Storico e dettagli dei trattamenti effettuati ({formData.trattamenti.length})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addTreatment}
                      className="flex items-center justify-center gap-2 rounded-xl px-6 py-4 min-h-[48px] text-white transition-opacity hover:opacity-90 shadow-lg font-semibold flex-shrink-0"
                      style={{ background: accentGradient }}
                    >
                      <Plus className="w-5 h-5" />
                      Aggiungi Trattamento
                    </button>
                  </div>

                  <div className="space-y-8">
                    {formData.trattamenti.map((treatment, index) => (
                      <div
                        key={treatment.id || index}
                        className="rounded-2xl border overflow-hidden shadow-sm"
                        style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
                      >
                        <TreatmentForm
                          treatment={treatment}
                          index={index}
                          onChange={(updatedTreatment) => handleTreatmentChange(index, updatedTreatment)}
                          onRemove={() => removeTreatment(index)}
                          isLast={index === formData.trattamenti.length - 1}
                          catalogEntries={catalogEntries}
                        />
                      </div>
                    ))}

                    {formData.trattamenti.length === 0 && (
                      <div
                        className="text-center rounded-2xl border-2 border-dashed py-20 sm:py-24 px-6 sm:px-8"
                        style={{ borderColor: accentSofter, backgroundColor: `${backgroundColor}80` }}
                      >
                        <div
                          className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: accentGradient }}
                        >
                          <Calendar className="w-12 h-12 text-white" />
                        </div>
                        <h3
                          className="text-xl sm:text-2xl font-semibold mb-3"
                          style={{ color: textPrimaryColor }}
                        >
                          Nessun trattamento registrato
                        </h3>
                        <p
                          className="text-base mb-8 max-w-sm mx-auto"
                          style={{ color: textSecondaryColor }}
                        >
                          Inizia aggiungendo il primo trattamento per questo cliente
                        </p>
                        <button
                          type="button"
                          onClick={addTreatment}
                          className="inline-flex items-center gap-2 px-8 py-4 min-h-[48px] rounded-xl text-white transition-opacity hover:opacity-90 shadow-lg font-semibold"
                          style={{ background: accentGradient }}
                        >
                          <Plus className="w-5 h-5" />
                          Aggiungi Primo Trattamento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Actions (stile ClientList) */}
          <div
            className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-2xl border p-6 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${surfaceColor}F5, rgba(255,255,255,0.9))`,
              borderColor: accentSofter,
            }}
          >
            <div className="flex items-center text-sm" style={{ color: textSecondaryColor }}>
              <span>Grado completamento profilo: <span className="font-bold text-[#c2886d]">{progress}%</span></span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border-2 px-6 py-3 font-semibold transition-opacity hover:opacity-90 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                style={{ borderColor: accentSofter, color: textSecondaryColor }}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center rounded-xl px-8 py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
                style={{ background: accentGradient }}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    Salva Scheda
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientProfileForm;
