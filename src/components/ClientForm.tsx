import React, { useState, useEffect, useRef } from 'react';
import { CircularProgress } from '@mui/material';
import { useSupabaseServices } from '../lib/supabaseService';
import { formatDateForDatabase, parseDateFromDatabase } from '../lib/utils';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Camera, Bell, Check, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

interface ClientFormProps {
  readonly clientId?: string;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
  readonly onRequestDelete?: () => void;
}

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

export default function ClientForm({ clientId, onSuccess, onCancel, onRequestDelete }: ClientFormProps) {
  const { clientService } = useSupabaseServices();
  const { appType } = useApp();
  const colors = useAppColors();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#ffffff';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSoft = `${colors.primary}29`;
  const accentSofter = `${colors.primary}14`;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [promemoriaAppuntamenti, setPromemoriaAppuntamenti] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
      console.error('loadClient', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.nome.trim() || !formData.cognome.trim()) {
      setError('Nome e cognome sono obbligatori');
      return;
    }
    if (formData.importo && (Number.isNaN(Number(formData.importo)) || Number(formData.importo) <= 0)) {
      setError("L'importo deve essere un numero maggiore di 0");
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
      console.error('handleSubmit', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  if (loading && !isEditing) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center" style={{ backgroundColor: `${surfaceColor}CC` }}>
        <div className="flex flex-col items-center gap-4">
          <CircularProgress
            size={90}
            thickness={4}
            sx={{
              color: colors.primary,
              '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
            }}
          />
          <p className="text-lg font-semibold" style={{ color: textPrimaryColor }}>Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative min-h-[480px]" style={{ backgroundColor: surfaceColor }}>
      {/* Top bar: Annulla | Nuovo Cliente | Salva */}
      <header className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: accentSofter }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-1 font-medium disabled:opacity-50"
          style={{ color: accentColor }}
        >
          <span className="text-lg leading-none" aria-hidden>‹</span> Annulla
        </button>
        <h1 className="text-lg font-bold" style={{ color: textPrimaryColor }}>
          {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </h1>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="font-medium disabled:opacity-50"
          style={{ color: accentColor }}
        >
          Salva
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <form onSubmit={handleSubmit} className="px-4 py-6">
          {/* Avatar + Aggiungi foto */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: accentSofter }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" style={{ color: textSecondaryColor }} />
                )}
              </div>
              <button
                type="button"
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <button
              type="button"
              onClick={handlePhotoClick}
              className="mt-2 text-sm font-medium"
              style={{ color: accentColor }}
            >
              Aggiungi foto
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* INFORMAZIONI PERSONALI */}
          <section className="mb-6">
            <h2 className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: textSecondaryColor }}>
              Informazioni personali
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome"
                required
                disabled={loading}
                className="w-full px-4 py-3 border rounded-xl outline-none transition disabled:opacity-50"
                style={{ backgroundColor: accentSofter, borderColor: accentSoft, color: textPrimaryColor }}
              />
              <input
                type="text"
                value={formData.cognome}
                onChange={(e) => setFormData((prev) => ({ ...prev, cognome: e.target.value }))}
                placeholder="Cognome"
                required
                disabled={loading}
                className="w-full px-4 py-3 border rounded-xl outline-none transition disabled:opacity-50"
                style={{ backgroundColor: accentSofter, borderColor: accentSoft, color: textPrimaryColor }}
              />
            </div>
          </section>

          {/* CONTATTI */}
          <section className="mb-6">
            <h2 className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: textSecondaryColor }}>
              Contatti
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Telefono"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 border rounded-xl outline-none transition disabled:opacity-50"
                  style={{ backgroundColor: accentSofter, borderColor: accentSoft, color: textPrimaryColor }}
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: textSecondaryColor }} />
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 border rounded-xl outline-none transition disabled:opacity-50"
                  style={{ backgroundColor: accentSofter, borderColor: accentSoft, color: textPrimaryColor }}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: textSecondaryColor }} />
              </div>
            </div>
          </section>

          {/* NOTE E PREFERENZE */}
          <section className="mb-6">
            <h2 className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: textSecondaryColor }}>
              Note e preferenze
            </h2>
            <textarea
              value={formData.tipo_trattamento}
              onChange={(e) => setFormData((prev) => ({ ...prev, tipo_trattamento: e.target.value }))}
              placeholder="Allergie, preferenze, trattamenti precedenti..."
              disabled={loading}
              rows={4}
              className="w-full px-4 py-3 border rounded-xl outline-none transition resize-none disabled:opacity-50"
              style={{ backgroundColor: accentSofter, borderColor: accentSoft, color: textPrimaryColor }}
            />
          </section>

          {/* Promemoria appuntamenti */}
          <section className="mb-8">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ backgroundColor: accentSofter, borderColor: accentSoft }}>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-medium" style={{ color: textPrimaryColor }}>Promemoria appuntamenti</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={promemoriaAppuntamenti}
                onClick={() => setPromemoriaAppuntamenti((v) => !v)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ backgroundColor: promemoriaAppuntamenti ? accentColor : textSecondaryColor }}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${promemoriaAppuntamenti ? 'left-6' : 'left-1'}`}
                  style={{ backgroundColor: surfaceColor }}
                />
              </button>
            </div>
          </section>

        </form>
      </div>

      {/* Pulsanti fissi in basso */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
        {isEditing && onRequestDelete && (
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={loading}
            aria-label="Elimina cliente"
            className="w-full py-3.5 rounded-xl font-semibold text-red-600 shadow-md disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center gap-2 mb-3 border"
            style={{ backgroundColor: surfaceColor, borderColor: accentSoft }}
          >
            <Trash2 className="w-5 h-5 shrink-0" aria-hidden />
            Elimina Cliente
          </button>
        )}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          style={{ background: accentGradient }}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Salva Cliente
            </>
          )}
        </button>
      </div>
    </div>
  );
}
