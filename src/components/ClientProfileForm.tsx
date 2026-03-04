import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client, ClientProfileData, EyeCharacteristics, ClientProfile, Treatment, TreatmentCatalogEntry } from '../types';
import TreatmentForm from './TreatmentForm';
import { useSupabaseServices } from '../lib/supabaseService';
import {
  User, Eye, Heart, Calendar, Plus,
  Check, AlertCircle, Info, ChevronRight, Sparkles,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useAppColors } from '../hooks/useAppColors';
import { useToast } from '../hooks/useToast';
import { useApp } from '../contexts/AppContext';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:       '#FAF0E8',
  surface:  '#FFFFFF',
  accent:   '#C07850',
  accentDk: '#A05830',
  accentSft:'rgba(192,120,80,0.10)',
  accentMid:'rgba(192,120,80,0.20)',
  border:   '#EDE0D8',
  text:     '#2C2C2C',
  muted:    '#9A8880',
  red:      '#EF4444',
  ok:       '#22C55E',
} as const;

const GRAD = `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`;

// ─── Shared primitives ────────────────────────────────────────────────────────
function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>
        {children}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
      </p>
      {hint && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  height: 50, padding: '0 16px',
  borderRadius: 14, border: `1.5px solid ${C.border}`,
  background: '#FAFAFA', fontSize: 15, color: C.text,
  fontFamily: 'inherit', outline: 'none',
};

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? C.ok : pct >= 40 ? C.accent : C.muted;
  return (
    <div style={{ height: 4, borderRadius: 100, background: '#F0E8E0', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
    </div>
  );
}

// ─── Section IDs ──────────────────────────────────────────────────────────────
type Section = 'personal' | 'eyes' | 'profile' | 'treatments';

const SECTIONS: { id: Section; label: string; short: string; icon: React.ElementType }[] = [
  { id: 'personal',   label: 'Informazioni',    short: 'Info',       icon: User     },
  { id: 'eyes',       label: 'Caratteristiche', short: 'Occhi',      icon: Eye      },
  { id: 'profile',    label: 'Profilo',         short: 'Profilo',    icon: Heart    },
  { id: 'treatments', label: 'Trattamenti',     short: 'Tratt.',     icon: Calendar },
];

// ─── Radio chip row ───────────────────────────────────────────────────────────
function RadioRow({ label, name, options, value, onChange }: {
  label: string; name: string;
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 16px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => {
          const active = value === o.value;
          return (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input
                type="radio" name={name} value={o.value} checked={active}
                onChange={() => onChange(o.value)}
                style={{ display: 'none' }}
              />
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 100,
                border: `1.5px solid ${active ? C.accent : C.border}`,
                background: active ? C.accent : C.surface,
                color: active ? '#FFF' : C.muted,
                fontSize: 13, fontWeight: 700,
                transition: 'all 0.12s ease',
              }}>
                {active && <Check size={11} strokeWidth={3} />}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Toggle card (checkbox replacement) ──────────────────────────────────────
function ToggleCard({ label, description, emoji, checked, onChange }: {
  label: string; description: string; emoji: string;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 16px',
        borderRadius: 18,
        border: `1.5px solid ${checked ? C.accent : C.border}`,
        background: checked ? C.accentSft : C.surface,
        cursor: 'pointer', transition: 'all 0.12s ease',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{label}</p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{description}</p>
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: 8, flexShrink: 0,
        border: `1.5px solid ${checked ? C.accent : C.border}`,
        background: checked ? C.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Check size={13} color="#FFF" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ─── Default form state ───────────────────────────────────────────────────────
function defaultFormData(clientId: string): ClientProfileData {
  return {
    client_id: clientId,
    data_nascita: '',
    caratteristiche_occhi: {
      forma_occhi:              'normali',
      posizione_occhi:          'normali',
      distanza_occhi:           'normali',
      angolo_esterno:           'normale',
      asimmetria:               'no',
      lunghezza_ciglia_naturali:'medie',
      foltezza_ciglia_naturali: 'medie',
      direzione_crescita_ciglia:'dritte',
    },
    profilo_cliente: {
      allergie:         false,
      pelle_sensibile:  false,
      terapia_ormonale: false,
      gravidanza:       false,
      lenti_contatto:   false,
      occhiali:         false,
      lacrimazione:     false,
      note:             '',
    },
    trattamenti: [],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClientProfileFormProps {
  client: Client;
  initialData?: ClientProfileData;
  onSave: (data: ClientProfileData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
  client, initialData, onSave, onCancel, isLoading = false,
}) => {
  const [formData,  setFormData]  = useState<ClientProfileData>(() => defaultFormData(client.id));
  const [section,   setSection]   = useState<Section>('personal');
  const [valErrors, setValErrors] = useState<Record<string, string>>({});
  const [progress,  setProgress]  = useState(0);

  const { showError } = useToast();
  const { appType }   = useApp();
  const { treatmentCatalogService } = useSupabaseServices();
  const [catalog, setCatalog] = useState<TreatmentCatalogEntry[]>([]);

  useEffect(() => {
    treatmentCatalogService.getAllByAppType(appType).then(setCatalog).catch(() => setCatalog([]));
  }, [appType]);

  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);

  // ── Progress ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let done = 0, total = 0;
    total += 1; if (formData.data_nascita) done++;
    const eyeVals = Object.values(formData.caratteristiche_occhi);
    total += eyeVals.length;
    done  += eyeVals.filter(v => v !== undefined && v !== '').length;
    total += 1; if (formData.profilo_cliente.note?.length) done++;
    setProgress(total > 0 ? Math.round((done / total) * 100) : 0);
  }, [formData]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const validate = (field: string, val: any): string => {
    if (field === 'data_nascita' && val) {
      const d = new Date(val);
      if (d > new Date()) return 'Non può essere futura';
      if (new Date().getFullYear() - d.getFullYear() > 120) return 'Data non valida';
    }
    if (field === 'colore_occhi' && val && val.length < 2) return 'Min 2 caratteri';
    if (field === 'note' && val && val.length > 500) return 'Max 500 caratteri';
    return '';
  };

  const setPersonal = (field: string, val: string) => {
    setFormData(p => ({ ...p, [field]: val }));
    setValErrors(p => ({ ...p, [field]: validate(field, val) }));
  };

  const setEye = (field: keyof EyeCharacteristics, val: any) => {
    setFormData(p => ({ ...p, caratteristiche_occhi: { ...p.caratteristiche_occhi, [field]: val } }));
    setValErrors(p => ({ ...p, [field]: validate(field, val) }));
  };

  const setProfile = (field: keyof ClientProfile, val: any) => {
    setFormData(p => ({ ...p, profilo_cliente: { ...p.profilo_cliente, [field]: val } }));
    setValErrors(p => ({ ...p, [field]: validate(field, val) }));
  };

  const handleTreatmentChange = (i: number, t: Treatment) => {
    const ts = [...formData.trattamenti]; ts[i] = t;
    setFormData(p => ({ ...p, trattamenti: ts }));
  };

  const addTreatment = () => {
    const t: Treatment = {
      data: new Date().toISOString().split('T')[0],
      curvatura: '', spessore: 0.07, lunghezze: '',
      schema_occhio: {}, colla: '', tenuta: '',
      colore_ciglia: '', refill: 'no', tempo_applicazione: '',
      bigodini: [], colore: '', prezzo: 0,
    };
    setFormData(p => ({ ...p, trattamenti: [...p.trattamenti, t] }));
  };

  const removeTreatment = (i: number) =>
    setFormData(p => ({ ...p, trattamenti: p.trattamenti.filter((_, idx) => idx !== i) }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        ...formData,
        data_nascita: formData.data_nascita || undefined,
        caratteristiche_occhi: {
          ...formData.caratteristiche_occhi,
          colore_occhi: formData.caratteristiche_occhi.colore_occhi || undefined,
        },
        profilo_cliente: {
          ...formData.profilo_cliente,
          note: formData.profilo_cliente.note || undefined,
        },
      });
    } catch {
      showError('Errore nel salvataggio del profilo. Riprova.');
    }
  };

  // Age calc
  const age = formData.data_nascita && !valErrors.data_nascita
    ? new Date().getFullYear() - new Date(formData.data_nascita).getFullYear()
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageHeader
        title={`${client.nome} ${client.cognome}`}
        showBack onBack={onCancel} backLabel="Indietro"
        rightAction={{ type: 'label', label: 'Salva', formId: 'cpf', disabled: isLoading }}
      />

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '16px 16px 80px' }}
        className="safe-area-content-below-header">

        {/* Progress header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 20, padding: '12px 16px',
          background: C.surface, border: `1.5px solid ${C.border}`,
          borderRadius: 18,
        }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 17, color: '#FFF',
          }}>
            {client.foto_url
              ? <img src={client.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 13 }} />
              : client.nome.charAt(0).toUpperCase()
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{client.nome} {client.cognome}</p>
              <span style={{
                fontSize: 12, fontWeight: 800,
                color: progress >= 80 ? C.ok : progress >= 40 ? C.accent : C.muted,
              }}>
                {progress}%
              </span>
            </div>
            <ProgressBar pct={progress} />
          </div>
        </div>

        {/* Section tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20,
        }}>
          {SECTIONS.map(s => {
            const Icon  = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id} type="button"
                onClick={() => setSection(s.id)}
                style={{
                  padding: '10px 4px', borderRadius: 16,
                  border: `1.5px solid ${active ? C.accent : C.border}`,
                  background: active ? C.accent : C.surface,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={active ? '#FFF' : C.muted} />
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#FFF' : C.muted }}>{s.short}</span>
              </button>
            );
          })}
        </div>

        {/* Section content */}
        <form id="cpf" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >

              {/* ── PERSONAL ── */}
              {section === 'personal' && (
                <>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Informazioni personali</p>

                  {/* Read-only info */}
                  <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
                      Dati cliente (sola lettura)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <User size={14} color={C.muted} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{client.nome} {client.cognome}</span>
                    </div>
                    {client.telefono && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Info size={14} color={C.muted} />
                        <span style={{ fontSize: 13, color: C.muted }}>{client.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Data nascita */}
                  <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 16px' }}>
                    <FieldLabel required>Data di nascita</FieldLabel>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date" value={formData.data_nascita || ''}
                        onChange={e => setPersonal('data_nascita', e.target.value)}
                        style={{ ...inputStyle, borderColor: valErrors.data_nascita ? C.red : C.border }}
                      />
                      {formData.data_nascita && !valErrors.data_nascita && (
                        <Check size={14} color={C.ok} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      )}
                    </div>
                    {valErrors.data_nascita && (
                      <p style={{ fontSize: 11, color: C.red, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} /> {valErrors.data_nascita}
                      </p>
                    )}
                    {age !== null && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                        padding: '8px 12px', borderRadius: 10, background: C.accentSft,
                      }}>
                        <Sparkles size={13} color={C.accent} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{age} anni</span>
                      </div>
                    )}
                  </div>

                  {/* Colore occhi */}
                  <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 16px' }}>
                    <FieldLabel>Colore degli occhi</FieldLabel>
                    <input
                      type="text"
                      value={formData.caratteristiche_occhi.colore_occhi || ''}
                      onChange={e => setEye('colore_occhi', e.target.value)}
                      placeholder="es. marroni, azzurri, verdi…"
                      style={{ ...inputStyle, borderColor: valErrors.colore_occhi ? C.red : C.border }}
                    />
                    {valErrors.colore_occhi && (
                      <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{valErrors.colore_occhi}</p>
                    )}
                  </div>
                </>
              )}

              {/* ── EYES ── */}
              {section === 'eyes' && (
                <>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Caratteristiche occhi</p>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: -8 }}>Morfologia e caratteristiche delle ciglia</p>

                  {([
                    { key: 'forma_occhi',               label: 'Forma degli occhi',        opts: ['mandorla','rotondi','normali'] },
                    { key: 'posizione_occhi',            label: 'Posizione degli occhi',    opts: ['sporgenti','incavati','normali'] },
                    { key: 'distanza_occhi',             label: 'Distanza tra occhi',       opts: ['ravvicinati','distanziati','normali'] },
                    { key: 'angolo_esterno',             label: 'Angolo esterno',           opts: ['normale','alto','basso'] },
                    { key: 'asimmetria',                 label: 'Asimmetria',               opts: ['si','no'] },
                    { key: 'lunghezza_ciglia_naturali',  label: 'Lunghezza ciglia naturali', opts: ['corte','medie','lunghe'] },
                    { key: 'foltezza_ciglia_naturali',   label: 'Foltezza ciglia naturali', opts: ['rade','medie','folte'] },
                    { key: 'direzione_crescita_ciglia',  label: 'Direzione crescita',       opts: ['in_basso','dritte','in_alto'] },
                  ] as { key: keyof EyeCharacteristics; label: string; opts: string[] }[]).map(({ key, label, opts }) => (
                    <RadioRow
                      key={key}
                      label={label}
                      name={key}
                      options={opts.map(o => ({ value: o, label: o.replace('_', ' ') }))}
                      value={(formData.caratteristiche_occhi[key] as string) || ''}
                      onChange={v => setEye(key, v)}
                    />
                  ))}
                </>
              )}

              {/* ── PROFILE ── */}
              {section === 'profile' && (
                <>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Profilo cliente</p>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: -8 }}>Allergie e condizioni importanti</p>

                  {([
                    { key: 'allergie',         label: 'Allergie',            description: 'Reazioni allergiche note',          emoji: '⚠️' },
                    { key: 'pelle_sensibile',  label: 'Pelle sensibile',     description: 'Pelle particolarmente sensibile',   emoji: '🤲' },
                    { key: 'terapia_ormonale', label: 'Terapia ormonale',    description: 'In corso di terapia ormonale',      emoji: '💊' },
                    { key: 'gravidanza',       label: 'Gravidanza',          description: 'Stato di gravidanza',               emoji: '🤱' },
                    { key: 'lenti_contatto',   label: 'Lenti a contatto',    description: 'Utilizzo di lenti a contatto',      emoji: '👁️' },
                    { key: 'occhiali',         label: 'Occhiali',            description: 'Utilizzo di occhiali',              emoji: '👓' },
                    { key: 'lacrimazione',     label: 'Lacrimazione',        description: 'Tendenza alla lacrimazione',         emoji: '💧' },
                  ] as { key: keyof ClientProfile; label: string; description: string; emoji: string }[]).map(({ key, label, description, emoji }) => (
                    <ToggleCard
                      key={key}
                      label={label}
                      description={description}
                      emoji={emoji}
                      checked={formData.profilo_cliente[key] as boolean}
                      onChange={v => setProfile(key, v)}
                    />
                  ))}

                  {/* Note */}
                  <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 16px' }}>
                    <FieldLabel hint="Max 500 caratteri">Note aggiuntive</FieldLabel>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        value={formData.profilo_cliente.note || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile('note', e.target.value)}
                        rows={3} maxLength={500}
                        placeholder="Preferenze, avvertenze, note utili…"
                        style={{
                          ...inputStyle, height: 'auto', padding: '12px 16px',
                          resize: 'none', lineHeight: 1.6,
                          borderColor: valErrors.note ? C.red : C.border,
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: 12, bottom: 10,
                        fontSize: 11, color: C.muted, pointerEvents: 'none',
                      }}>
                        {(formData.profilo_cliente.note || '').length}/500
                      </span>
                    </div>
                    {valErrors.note && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{valErrors.note}</p>}
                  </div>
                </>
              )}

              {/* ── TREATMENTS ── */}
              {section === 'treatments' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Trattamenti</p>
                      <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                        {formData.trattamenti.length} registrat{formData.trattamenti.length !== 1 ? 'i' : 'o'}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={addTreatment}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        height: 44, padding: '0 18px', borderRadius: 14,
                        border: 'none', background: GRAD,
                        fontWeight: 800, fontSize: 14, color: '#FFF',
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 14px rgba(192,120,80,0.35)',
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} /> Aggiungi
                    </motion.button>
                  </div>

                  {formData.trattamenti.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '48px 24px',
                        borderRadius: 28, border: `2px dashed ${C.border}`,
                        background: C.surface, textAlign: 'center',
                      }}
                    >
                      <div style={{
                        width: 64, height: 64, borderRadius: 22, background: C.accentSft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                      }}>
                        <Calendar size={28} color={C.accent} />
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 17, color: C.text }}>Nessun trattamento</p>
                      <p style={{ fontSize: 13, color: C.muted, marginTop: 8, maxWidth: 240, lineHeight: 1.6 }}>
                        Aggiungi il primo trattamento per tracciare lunghezze, curvature e prodotti usati.
                      </p>
                      <motion.button
                        type="button" whileTap={{ scale: 0.97 }}
                        onClick={addTreatment}
                        style={{
                          marginTop: 20, height: 48, padding: '0 24px',
                          borderRadius: 15, border: 'none', background: GRAD,
                          fontWeight: 800, fontSize: 14, color: '#FFF',
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 8,
                          boxShadow: '0 5px 18px rgba(192,120,80,0.32)',
                        }}
                      >
                        <Plus size={16} /> Primo trattamento
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {formData.trattamenti.map((t, i) => (
                        <TreatmentForm
                          key={(t as any).id || i}
                          treatment={t}
                          index={i}
                          onChange={updated => handleTreatmentChange(i, updated)}
                          onRemove={() => removeTreatment(i)}
                          isLast={i === formData.trattamenti.length - 1}
                          catalogEntries={catalog}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </form>

        {/* Section navigation footer */}
        <div style={{
          position: 'fixed',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          left: 0, right: 0, zIndex: 40,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: '12px 16px',
          display: 'flex', gap: 10,
          maxWidth: 540, margin: '0 auto',
        }}>
          {/* Prev */}
          {SECTIONS.findIndex(s => s.id === section) > 0 && (
            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === section);
                if (idx > 0) setSection(SECTIONS[idx - 1].id);
              }}
              style={{
                flex: 1, height: 50, borderRadius: 16,
                border: `1.5px solid ${C.border}`, background: C.surface,
                fontWeight: 700, fontSize: 14, color: C.text,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ← Indietro
            </button>
          )}

          {/* Next or Save */}
          {SECTIONS.findIndex(s => s.id === section) < SECTIONS.length - 1 ? (
            <motion.button
              type="button" whileTap={{ scale: 0.97 }}
              onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === section);
                setSection(SECTIONS[idx + 1].id);
              }}
              style={{
                flex: 2, height: 50, borderRadius: 16, border: 'none', background: GRAD,
                fontWeight: 800, fontSize: 15, color: '#FFF', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(192,120,80,0.35)',
              }}
            >
              Avanti <ChevronRight size={17} />
            </motion.button>
          ) : (
            <motion.button
              type="submit" form="cpf" whileTap={{ scale: 0.97 }} disabled={isLoading}
              style={{
                flex: 2, height: 50, borderRadius: 16, border: 'none',
                background: isLoading ? C.border : GRAD,
                fontWeight: 800, fontSize: 15,
                color: isLoading ? C.muted : '#FFF',
                cursor: isLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(192,120,80,0.35)',
              }}
            >
              {isLoading
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: 10 }}
                  />
                : <><Check size={17} strokeWidth={2.5} /> Salva scheda</>
              }
            </motion.button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientProfileForm;