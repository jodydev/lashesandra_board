import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Save, 
  RotateCcw, 
  Eye, 
  Copy, 
  Check,
  AlertCircle,
  Sparkles,
  User,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import type { MessageTemplate } from '../types';

interface MessageTemplateEditorProps {
  onSave?: (template: MessageTemplate) => void;
  onCancel?: () => void;
}

const defaultTemplate = {
  name: 'default',
  content: 'Ciao {nome}, ti ricordiamo il tuo appuntamento domani alle {ora} per il trattamento {servizio} presso il nostro centro estetico in {location}. Ti aspettiamo 💖',
  is_default: true
};

const availablePlaceholders = [
  { key: '{nome}', label: 'Nome cliente', icon: User, description: 'Nome del cliente' },
  { key: '{cognome}', label: 'Cognome cliente', icon: User, description: 'Cognome del cliente' },
  { key: '{ora}', label: 'Orario appuntamento', icon: Clock, description: 'Orario dell\'appuntamento' },
  { key: '{servizio}', label: 'Tipo trattamento', icon: Sparkles, description: 'Servizio prenotato' },
  { key: '{location}', label: 'Indirizzo salone', icon: MapPin, description: 'Posizione del centro' },
  { key: '{data}', label: 'Data appuntamento', icon: Calendar, description: 'Data dell\'appuntamento' }
];

export default function MessageTemplateEditor({ onSave, onCancel }: MessageTemplateEditorProps) {
  const colors = useAppColors();
  const { tablePrefix } = useApp();
  const [template, setTemplate] = useState<MessageTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(`${tablePrefix}message_templates`)
        .select('*')
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTemplate(data);
      }
    } catch (err) {
      console.error('Errore nel caricamento template:', err);
      setError('Errore nel caricamento del template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const templateData = {
        ...template,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(`${tablePrefix}message_templates`)
        .upsert([templateData], { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSave?.(data);
    } catch (err) {
      console.error('Errore nel salvataggio:', err);
      setError('Errore nel salvataggio del template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTemplate(defaultTemplate);
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = template.content;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      
      setTemplate(prev => ({ ...prev, content: newText }));
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Errore nella copia:', err);
    }
  };

  const generatePreview = () => {
    return template.content
      .replace(/{nome}/g, 'Andreea')
      .replace(/{cognome}/g, 'Vlasie')
      .replace(/{ora}/g, '13:30')
      .replace(/{servizio}/g, 'Laminazione Ciglia')
      .replace(/{location}/g, 'Via Monsignor Enrico Montalbetti 5, Reggio Calabria')
      .replace(/{data}/g, '25/09/2025');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${colors.bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editor Template Messaggi
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Personalizza il messaggio di conferma WhatsApp
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                previewMode
                  ? `${colors.bgPrimary} dark:${colors.bgPrimaryDark} ${colors.textPrimary} dark:${colors.textPrimaryDark}`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Modifica' : 'Anteprima'}
            </motion.button>
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
            className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        {previewMode ? (
          /* Preview Mode */
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Anteprima Messaggio
                </h3>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                  {generatePreview()}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Dati di Test Utilizzati
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Nome:</strong> Andreea</div>
                <div><strong>Cognome:</strong> Vlasie</div>
                <div><strong>Orario:</strong> 13:30</div>
                <div><strong>Servizio:</strong> Laminazione Ciglia</div>
                <div><strong>Location:</strong> Via Monsignor Enrico Montalbetti 5, Reggio Calabria</div>
                <div><strong>Data:</strong> 25/09/2025</div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Edit Mode */
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Template Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nome Template
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-200 text-gray-900 dark:text-white"
                placeholder="Nome del template"
              />
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Contenuto Messaggio
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copia
                    </>
                  )}
                </motion.button>
              </div>
              
              <textarea
                id="message-content"
                value={template.content}
                onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-200 text-gray-900 dark:text-white resize-none"
                placeholder="Inserisci il contenuto del messaggio..."
              />
            </div>

            {/* Placeholders */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Placeholders Disponibili
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePlaceholders.map((placeholder, index) => (
                  <motion.button
                    key={placeholder.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => insertPlaceholder(placeholder.key)}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-500 hover:shadow-lg transition-all duration-200 text-left"
                  >
                    <div className={`w-8 h-8 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <placeholder.icon className={`w-4 h-4 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {placeholder.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {placeholder.description}
                      </div>
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                        {placeholder.key}
                      </code>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Ripristina
          </motion.button>

          <div className="flex items-center gap-3">
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Annulla
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2 ${colors.bgGradient} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salva Template
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
