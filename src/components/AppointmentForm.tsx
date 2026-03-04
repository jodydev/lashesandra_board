import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Euro, Sparkles, Check, Clock,
  Phone, Mail, Search, AlertTriangle, X, Plus,
  ChevronLeft, ChevronRight, Pencil
} from 'lucide-react';
import type { Appointment, Client, AppointmentChecklistItem, TreatmentCatalogEntry } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { formatDateForDatabase, formatDateForDisplay } from '../lib/utils';
import { getTreatmentDurationMinutes, DEFAULT_APPOINTMENT_DURATION_MINUTES } from '../lib/treatmentDurations';
import dayjs, { Dayjs } from 'dayjs';
import { useApp } from '../contexts/AppContext';
import { hapticSelection } from '../lib/haptics';
import { scheduleAppointmentReminder, cancelAppointmentReminder } from '../lib/localNotifications';
import { isPersonalAppointment } from '../lib/personalEvents';
import PageHeader from './PageHeader';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AppointmentPrefillNew {
  client_id?: string;
  tipo_trattamento?: string;
  importo?: number;
  duration_minutes?: number;
  data?: string;
  ora?: string;
}

interface AppointmentFormProps {
  appointment?: Appointment | null;
  prefillNew?: AppointmentPrefillNew;
  selectedDate?: Dayjs | null;
  appointmentsForOverlap?: Appointment[];
  onSuccess: () => void;
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'client',    icon: User,     label: 'Cliente'     },
  { id: 'datetime',  icon: Calendar, label: 'Quando'      },
  { id: 'treatment', icon: Sparkles, label: 'Servizio'    },
  { id: 'confirm',   icon: Check,    label: 'Conferma'    },
] as const;

const QUICK_TIMES = ['08:00','09:00','10:00','10:30','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

const DURATIONS = [
  { mins: 30,  label: '30 min' },
  { mins: 45,  label: '45 min' },
  { mins: 60,  label: '1 ora'  },
  { mins: 90,  label: '1h 30'  },
  { mins: 120, label: '2 ore'  },
  { mins: 180, label: '3 ore'  },
];

const QUICK_AMOUNTS_LASHES = [20, 30, 40, 50, 60, 70, 80, 90];
const QUICK_AMOUNTS_NAILS  = [10, 20, 30, 40, 50, 60, 70, 80];

const TREATMENTS_LASHES = [
  'Extension One to One (Classiche)', 'Refill One to One', 'Volume Russo 2D-6D',
  'Refill Volume Russo', 'Volume Egiziano 3D', 'Mega Volume 7D+',
  'Laminazione Ciglia', 'Laminazione Sopracciglia', 'Brow Lift & Styling',
  'Rimozione Extension Ciglia', 'Trattamento Rinforzante Ciglia',
];

const TREATMENTS_NAILS = [
  'Manicure Classica', 'Manicure Spa', 'French Manicure',
  'Pedicure Estetica', 'Pedicure Curativa', 'Smalto Semipermanente',
  'Ricostruzione in Gel', 'Ricostruzione in Acrilico', 'Refill Gel/Acrilico',
  'French Gel', 'Babyboomer', 'Nail Art Avanzata',
];

const DATE_PRESETS = [
  { label: 'Oggi',        fn: () => dayjs()            },
  { label: 'Domani',      fn: () => dayjs().add(1,'day')},
  { label: 'Dopodomani',  fn: () => dayjs().add(2,'day')},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseOraToMinutes(ora?: string) {
  if (!ora) return 0;
  const [h, m] = ora.trim().split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function getEndMinutes(apt: Appointment) {
  return parseOraToMinutes(apt.ora) + (apt.duration_minutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES);
}
function getOverlaps(date: Dayjs, startM: number, endM: number, list: Appointment[], excludeId?: string) {
  return list.filter(apt => {
    if (apt.id === excludeId) return false;
    if (!dayjs(apt.data).isSame(date, 'day')) return false;
    return startM < getEndMinutes(apt) && parseOraToMinutes(apt.ora) < endM;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Floating label input */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#B09080', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </p>
  );
}

/** Chip-style pill button */
function Chip({ active, onClick, children, disabled }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 16px',
        borderRadius: 100,
        border: `1.5px solid ${active ? '#C07850' : '#E8D5C8'}`,
        background: active ? '#C07850' : '#FFF',
        color: active ? '#FFF' : '#7A6058',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </button>
  );
}

/** Large selectable card row */
function SelectRow({ noPhoneIcon, selected, onClick, left, title, subtitle, right }: {
  noPhoneIcon?: boolean;
  selected: boolean; onClick: () => void;
  left?: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: 18,
        border: `1.5px solid ${selected ? '#C07850' : '#EDE0D8'}`,
        background: selected ? '#FDF4EF' : '#FFFFFF',
        cursor: 'pointer',
        textAlign: 'left' as const,
        transition: 'border-color 0.2s, background 0.2s',
        boxShadow: selected ? '0 2px 12px rgba(192,120,80,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#2C2C2C', marginBottom: 2 }}>{title}</p>
        {subtitle &&  (
          <p style={{ fontSize: 13, color: '#9A8880', display: 'flex', alignItems: 'center', gap: 6 }}>
            {!noPhoneIcon && <Phone size={12} color="#B09080" />}
            {subtitle}
          </p>
        )}
      </div>
      {right ?? (
        <div style={{
          width: 22, height: 22, borderRadius: 11,
          border: `2px solid ${selected ? '#C07850' : '#D5C4BC'}`,
          background: selected ? '#C07850' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.18s ease',
        }}>
          {selected && <Check size={12} color="#fff" strokeWidth={3} />}
        </div>
      )}
    </motion.button>
  );
}

/** Avatar circle: foto profilo se presente, altrimenti iniziale del nome */
function Avatar({ name, imageUrl, size = 44 }: { name: string; imageUrl?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const borderRadius = size * 0.35;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background: 'linear-gradient(135deg, #C07850, #A05830)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.38,
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

/** Section card wrapper */
function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 24,
      border: '1.5px solid #EDE0D8',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Section header inside a card */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5EAE4', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12, background: '#FDF4EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color="#C07850" strokeWidth={2} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#2C2C2C' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: '#9A8880', marginTop: 1 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepClient({
  clients, formData, setFormData, searchQuery, setSearchQuery
}: {
  clients: Client[];
  formData: any;
  setFormData: (fn: any) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
}) {
  const filtered = clients.filter(c =>
    `${c.nome} ${c.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.telefono?.includes(searchQuery)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#B09080" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Cerca per nome, email o telefono…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            height: 50, paddingLeft: 44, paddingRight: 16,
            borderRadius: 16, border: '1.5px solid #EDE0D8',
            background: '#FFF', fontSize: 15, color: '#2C2C2C',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence initial={false}>
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.03, duration: 0.22 }}
            >
              <SelectRow
                selected={formData.client_id === client.id}
                onClick={() => { hapticSelection(); setFormData((p: any) => ({ ...p, client_id: client.id })); }}
                left={<Avatar name={client.nome} imageUrl={client.foto_url} />}
                title={`${client.nome} ${client.cognome}`}
                subtitle={[client.telefono].filter(Boolean).join(' · ')}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#B09080' }}>
            <User size={32} color="#D5C4BC" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>Nessun cliente trovato</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDateTime({ formData, setFormData }: { formData: any; setFormData: (fn: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Date */}
      <SectionCard>
        <SectionHeader icon={Calendar} title="Data appuntamento" />
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="date"
            value={formData.data.format('YYYY-MM-DD')}
            onChange={e => setFormData((p: any) => ({ ...p, data: dayjs(e.target.value) }))}
            style={{
              width: '85%', boxSizing: 'border-box',
              height: 52, padding: '0 16px',
              borderRadius: 14, border: '1.5px solid #EDE0D8',
              background: '#FAFAFA', fontSize: 16, color: '#2C2C2C',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          {/* Presets */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {DATE_PRESETS.map(p => (
              <Chip
                key={p.label}
                active={formData.data.isSame(p.fn(), 'day')}
                onClick={() => setFormData((prev: any) => ({ ...prev, data: p.fn() }))}
              >
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Time */}
      <SectionCard>
        <SectionHeader icon={Clock} title="Orario" subtitle="Scorri per scegliere l'orario" />
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="time"
            value={formData.ora}
            onChange={e => setFormData((p: any) => ({ ...p, ora: e.target.value }))}
            style={{
              width: '85%', boxSizing: 'border-box',
              height: 52, padding: '0 16px',
              borderRadius: 14, border: '1.5px solid #EDE0D8',
              background: '#FAFAFA', fontSize: 20, fontWeight: 700, color: '#C07850',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          {/* Quick slots — horizontal scroll */}
          <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 4, scrollbarWidth: 'none' }}>
            {QUICK_TIMES.map(t => (
              <Chip
                key={t}
                active={formData.ora === t}
                onClick={() => setFormData((p: any) => ({ ...p, ora: t }))}
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function StepTreatment({
  formData, setFormData, catalogEntries, appType
}: {
  formData: any; setFormData: (fn: any) => void;
  catalogEntries: TreatmentCatalogEntry[]; appType: string;
}) {
  const [search, setSearch] = useState('');
  const useCatalog = catalogEntries.length > 0;
  const staticList = appType === 'isabellenails' ? TREATMENTS_NAILS : TREATMENTS_LASHES;
  const quickAmounts = appType === 'isabellenails' ? QUICK_AMOUNTS_NAILS : QUICK_AMOUNTS_LASHES;

  const filteredCatalog = catalogEntries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const filteredStatic = staticList.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Treatment search + list */}
      <SectionCard>
        <SectionHeader icon={Sparkles} title="Tipo di trattamento" subtitle="Scegli il servizio da eseguire" />
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#B09080" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Cerca trattamento…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                height: 44, paddingLeft: 40, paddingRight: 14,
                borderRadius: 12, border: '1.5px solid #EDE0D8',
                background: '#FAFAFA', fontSize: 14, color: '#2C2C2C',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div style={{ height: 1, background: '#F5EAE4' }} />

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {useCatalog
              ? filteredCatalog.map(entry => {
                  const sel = formData.treatment_catalog_id === entry.id;
                  return (
                    <SelectRow
                      key={entry.id}
                      selected={sel}
                      onClick={() => {
                        hapticSelection();
                        setFormData((p: any) => ({
                          ...p,
                          treatment_catalog_id: entry.id,
                          tipo_trattamento: entry.name,
                          importo: entry.base_price,
                          duration_minutes: entry.duration_minutes,
                        }));
                      }}
                      title={entry.name}
                      noPhoneIcon
                      subtitle={`€${entry.base_price} · ${entry.duration_minutes} min`}
                    />
                  );
                })
              : filteredStatic.map(t => (
                  <SelectRow
                    key={t}
                    selected={formData.tipo_trattamento === t}
                    onClick={() => {
                      hapticSelection();
                      setFormData((p: any) => ({
                        ...p, treatment_catalog_id: null,
                        tipo_trattamento: t,
                        duration_minutes: getTreatmentDurationMinutes(appType, t),
                      }));
                    }}
                    title={t}
                  />
                ))
            }
          </div>
        </div>
      </SectionCard>

      {/* Duration */}
      <SectionCard>
        <SectionHeader icon={Clock} title="Durata seduta" subtitle="Imposta il blocco nel calendario" />
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {DURATIONS.map(d => (
              <button
                key={d.mins}
                type="button"
                onClick={() => setFormData((p: any) => ({ ...p, duration_minutes: d.mins }))}
                style={{
                  padding: '12px 8px',
                  borderRadius: 14,
                  border: `1.5px solid ${formData.duration_minutes === d.mins ? '#C07850' : '#EDE0D8'}`,
                  background: formData.duration_minutes === d.mins ? '#C07850' : '#FFF',
                  color: formData.duration_minutes === d.mins ? '#FFF' : '#5A4A44',
                  fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Amount */}
      <SectionCard>
        <SectionHeader icon={Euro} title="Importo" subtitle="Imposta il prezzo del trattamento" />
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Input */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              fontWeight: 800, fontSize: 18, color: '#C07850',
            }}>€</span>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.importo || ''}
              onChange={e => setFormData((p: any) => ({ ...p, importo: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              style={{
                width: '100%', boxSizing: 'border-box',
                height: 60, paddingLeft: 36, paddingRight: 16,
                borderRadius: 16, border: '1.5px solid #EDE0D8',
                background: '#FAFAFA', fontSize: 28, fontWeight: 800, color: '#2C2C2C',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          {/* Quick amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {quickAmounts.map(amt => (
              <motion.button
                key={amt}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => setFormData((p: any) => ({ ...p, importo: amt }))}
                style={{
                  padding: '13px 4px',
                  borderRadius: 14,
                  border: `1.5px solid ${formData.importo === amt ? '#C07850' : '#EDE0D8'}`,
                  background: formData.importo === amt ? '#C07850' : '#FFF',
                  color: formData.importo === amt ? '#FFF' : '#5A4A44',
                  fontWeight: 800, fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative' as const,
                }}
              >
                €{amt}
                {formData.importo === amt && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 14, height: 14, borderRadius: 7,
                      background: 'rgba(255,255,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Check size={8} color="#fff" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function StepConfirm({
  formData, setFormData, selectedClient, goToStep, newChecklistLabel, setNewChecklistLabel
}: {
  formData: any;
  setFormData: (fn: any) => void;
  selectedClient?: Client;
  goToStep: (s: number) => void;
  newChecklistLabel: string;
  setNewChecklistLabel: (s: string) => void;
}) {
  const addChecklist = () => {
    const label = newChecklistLabel.trim();
    if (!label) return;
    setFormData((p: any) => ({
      ...p,
      checklist: [...(p.checklist ?? []), { id: crypto.randomUUID(), label, done: false }],
    }));
    setNewChecklistLabel('');
  };

  const summaryFields = [
    { icon: Calendar, label: 'Data',        value: formData.data ? formData.data.format('dddd DD MMMM YYYY') : '—', step: 1 },
    { icon: Clock,    label: 'Orario',      value: formData.ora || '—',                                               step: 1 },
    { icon: Sparkles, label: 'Trattamento', value: formData.tipo_trattamento || 'Generico',                           step: 2 },
    { icon: Clock,    label: 'Durata',      value: `${formData.duration_minutes ?? 60} min`,                          step: 2 },
    { icon: Euro,     label: 'Importo',     value: `€${formData.importo ?? 0}`,                                       step: 2 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Client hero */}
      <SectionCard>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar
            name={selectedClient ? `${selectedClient.nome} ${selectedClient.cognome}` : '?'}
            imageUrl={selectedClient?.foto_url}
            size={60}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 18, color: '#2C2C2C' }}>
              {selectedClient ? `${selectedClient.nome} ${selectedClient.cognome}` : 'Cliente non selezionato'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
              {selectedClient?.telefono && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={12} color="#B09080" />
                  <span style={{ fontSize: 13, color: '#7A6058' }}>{selectedClient.telefono}</span>
                </div>
              )}
              {selectedClient?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={12} color="#B09080" />
                  <span style={{ fontSize: 13, color: '#7A6058' }}>{selectedClient.email}</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goToStep(0)}
            style={{ padding: 8, borderRadius: 10, border: '1.5px solid #EDE0D8', background: '#FDF4EF', cursor: 'pointer' }}
          >
            <Pencil size={14} color="#C07850" />
          </button>
        </div>
      </SectionCard>

      {/* Details summary */}
      <SectionCard>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {summaryFields.map((f, i) => (
            <div key={f.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FDF4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <f.icon size={15} color="#C07850" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#B09080', letterSpacing: '0.02em' }}>{f.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C', textAlign: 'right' as const, maxWidth: 180 }}>{f.value}</span>
                  <button
                    type="button"
                    onClick={() => goToStep(f.step)}
                    style={{ padding: '4px 6px', borderRadius: 8, border: '1.5px solid #EDE0D8', background: '#FFF', cursor: 'pointer' }}
                  >
                    <Pencil size={11} color="#C07850" />
                  </button>
                </div>
              </div>
              {i < summaryFields.length - 1 && <div style={{ height: 1, background: '#F5EAE4' }} />}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Note */}
      <SectionCard>
        <SectionHeader icon={Pencil} title="Note seduta" subtitle="Visibili solo a te" />
        <div style={{ padding: '16px 20px' }}>
          <textarea
            value={formData.note}
            onChange={e => setFormData((p: any) => ({ ...p, note: e.target.value }))}
            placeholder="es. bigodino 0.15, patch test già effettuato…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 14, border: '1.5px solid #EDE0D8',
              background: '#FAFAFA', fontSize: 14, color: '#2C2C2C',
              fontFamily: 'inherit', resize: 'none', outline: 'none',
              lineHeight: 1.5,
            }}
          />
        </div>
      </SectionCard>

      {/* Checklist */}
      <SectionCard>
        <SectionHeader icon={Check} title="Checklist" subtitle="Da fare durante la seduta (opzionale)" />
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Items */}
          <AnimatePresence initial={false}>
            {(formData.checklist ?? []).map((item: AppointmentChecklistItem) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <button
                  type="button"
                  onClick={() => setFormData((p: any) => ({
                    ...p,
                    checklist: (p.checklist ?? []).map((i: AppointmentChecklistItem) =>
                      i.id === item.id ? { ...i, done: !i.done } : i
                    ),
                  }))}
                  style={{
                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                    border: `2px solid ${item.done ? '#22c55e' : '#D5C4BC'}`,
                    background: item.done ? '#22c55e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {item.done && <Check size={12} color="#fff" strokeWidth={3} />}
                </button>
                <span style={{
                  flex: 1, fontSize: 14, color: item.done ? '#B09080' : '#2C2C2C',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => setFormData((p: any) => ({
                    ...p,
                    checklist: (p.checklist ?? []).filter((i: AppointmentChecklistItem) => i.id !== item.id),
                  }))}
                  style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  <X size={14} color="#B09080" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add item */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              type="text"
              value={newChecklistLabel}
              onChange={e => setNewChecklistLabel(e.target.value)}
              placeholder="Aggiungi voce…"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklist(); } }}
              style={{
                flex: 1, height: 44, padding: '0 14px',
                borderRadius: 12, border: '1.5px solid #EDE0D8',
                background: '#FAFAFA', fontSize: 14, color: '#2C2C2C',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={addChecklist}
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#C07850', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Plus size={18} color="#fff" />
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AppointmentForm({
  appointment,
  prefillNew,
  selectedDate,
  appointmentsForOverlap = [],
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const { appointmentService, clientService, treatmentCatalogService } = useSupabaseServices();
  const { appType } = useApp();

  const [formData, setFormData] = useState({
    client_id: '',
    data: selectedDate ?? dayjs(),
    ora: '',
    importo: 0,
    tipo_trattamento: '',
    duration_minutes: DEFAULT_APPOINTMENT_DURATION_MINUTES,
    treatment_catalog_id: null as string | null,
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    note: '',
    checklist: [] as AppointmentChecklistItem[],
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<TreatmentCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [prevStep, setPrevStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [overlapDismissed, setOverlapDismissed] = useState(false);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');

  const prefillAppliedRef = useRef(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    clientService.getAll().then(setClients).catch(() => {});
    treatmentCatalogService.getAllByAppType(appType).then(setCatalogEntries).catch(() => {});
  }, [appType]);

  useEffect(() => {
    if (!appointment) return;
    const list: AppointmentChecklistItem[] = Array.isArray(appointment.checklist)
      ? appointment.checklist.map((item: any) => ({
          id: item?.id ?? crypto.randomUUID(),
          label: item?.label ?? String(item),
          done: item?.done ?? false,
        }))
      : [];
    setFormData({
      client_id: appointment.client_id,
      data: dayjs(appointment.data),
      ora: appointment.ora || '',
      importo: appointment.importo,
      tipo_trattamento: appointment.tipo_trattamento || '',
      duration_minutes: appointment.duration_minutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES,
      treatment_catalog_id: appointment.treatment_catalog_id ?? null,
      status: appointment.status || 'pending',
      note: appointment.note ?? '',
      checklist: list,
    });
    setIsEditing(true);
  }, [appointment]);

  useEffect(() => {
    if (appointment || !prefillNew || clients.length === 0 || prefillAppliedRef.current) return;
    prefillAppliedRef.current = true;
    const duration = prefillNew.duration_minutes ?? getTreatmentDurationMinutes(appType, prefillNew.tipo_trattamento);
    const catalogEntry = catalogEntries.find(e => e.name === (prefillNew.tipo_trattamento ?? ''));
    const hasClient = !!prefillNew.client_id;
    setFormData(prev => ({
      ...prev,
      client_id: prefillNew.client_id ?? prev.client_id,
      tipo_trattamento: prefillNew.tipo_trattamento ?? prev.tipo_trattamento,
      importo: prefillNew.importo ?? prev.importo,
      duration_minutes: duration,
      treatment_catalog_id: catalogEntry?.id ?? null,
      data: prefillNew.data ? dayjs(prefillNew.data) : (selectedDate ?? dayjs()),
      ora: prefillNew.ora?.trim() || '09:00',
    }));
    setActiveStep(hasClient ? 3 : 0);
  }, [prefillNew, clients.length, catalogEntries]);

  // ── Overlap detection ──────────────────────────────────────────────────────
  const overlapping = useMemo(() => {
    if (!appointmentsForOverlap.length || !formData.data || !formData.ora) return [];
    const startM = parseOraToMinutes(formData.ora);
    return getOverlaps(formData.data, startM, startM + (formData.duration_minutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES), appointmentsForOverlap, appointment?.id);
  }, [appointmentsForOverlap, formData.data, formData.ora, formData.duration_minutes, appointment?.id]);

  useEffect(() => { setOverlapDismissed(false); }, [overlapping]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const canProceed = () => {
    switch (activeStep) {
      case 0: return !!formData.client_id;
      case 1: return !!formData.data;
      case 2: return formData.importo !== 0;
      case 3: return true;
    }
  };

  const goToStep = (step: number) => {
    setPrevStep(activeStep);
    setActiveStep(step);
  };
  const goNext = () => { if (canProceed()) goToStep(activeStep + 1); };
  const goBack = () => { if (activeStep > 0) goToStep(activeStep - 1); else onCancel(); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.client_id || !formData.data || formData.tipo_trattamento === undefined) {
      setError('Tutti i campi obbligatori devono essere compilati.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = {
        ...formData,
        data: formatDateForDatabase(formData.data) || '',
        ora: formData.ora || undefined,
        importo: Number(formData.importo),
        duration_minutes: formData.duration_minutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES,
        treatment_catalog_id: formData.treatment_catalog_id || null,
        note: formData.note?.trim() || null,
        checklist: formData.checklist?.length ? formData.checklist : null,
      };
      const selectedClient = clients.find(c => c.id === formData.client_id);
      const clientName = selectedClient
        ? `${selectedClient.nome ?? ''} ${selectedClient.cognome ?? ''}`.trim() || 'Cliente'
        : 'Cliente';
      if (isEditing && appointment) {
        const updated = await appointmentService.update(appointment.id, data);
        await cancelAppointmentReminder(updated.id);
        await scheduleAppointmentReminder(updated, clientName);
      } else {
        const created = await appointmentService.create(data);
        await scheduleAppointmentReminder(created, clientName);
      }
      setShowSuccess(true);
      setTimeout(() => onSuccess(), 1600);
    } catch {
      setError("Errore nel salvataggio dell'appuntamento");
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const direction = activeStep > prevStep ? 1 : -1;
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const stepTitles = ['Seleziona cliente', 'Seleziona data e ora', 'Servizio e importo', 'Riepilogo'];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen safe-area-header flex flex-col min-h-0 flex-1"
      style={{ backgroundColor }}
    >

      {/* ── Header ── */}
      <PageHeader
        title={stepTitles[activeStep]}
        showBack
        onBack={goBack}
        skipSafeAreaTop
      />

      {/* ── Overlap warning ── */}
      <AnimatePresence>
        {overlapping.length > 0 && !overlapDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              margin: '12px 16px 0',
              padding: '12px 16px',
              borderRadius: 16,
              background: '#FFF8EC',
              border: '1.5px solid #F0C060',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertTriangle size={18} color="#C08010" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#7A5010' }}>
                  Sovrapposizione con {overlapping.length} appuntament{overlapping.length > 1 ? 'i' : 'o'}
                </p>
                {overlapping.map(apt => {
                  const sm = parseOraToMinutes(apt.ora);
                  const em = getEndMinutes(apt);
                  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
                  const c = clients.find(x => x.id === apt.client_id);
                  const label = isPersonalAppointment(apt) ? (apt.tipo_trattamento || 'Impegno personale') : c ? `${c.nome} ${c.cognome}` : 'Cliente';
                  return (
                    <p key={apt.id} style={{ fontSize: 12, color: '#9A6010', marginTop: 3 }}>
                      {fmt(sm)}–{fmt(em)} · {label}
                    </p>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setOverlapDismissed(true)}
                style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={16} color="#C08010" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              margin: '12px 16px 0',
              padding: '12px 16px',
              borderRadius: 16,
              background: '#FFF0F0',
              border: '1.5px solid #FFB0B0',
              fontSize: 14, color: '#C02020', fontWeight: 600,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step content ── */}
      <form
        id="appt-form"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={activeStep}
              custom={direction}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
              style={{ padding: '20px 16px 120px' }}
            >
              {activeStep === 0 && (
                <StepClient
                  clients={clients}
                  formData={formData}
                  setFormData={setFormData}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}
              {activeStep === 1 && (
                <StepDateTime formData={formData} setFormData={setFormData} />
              )}
              {activeStep === 2 && (
                <StepTreatment
                  formData={formData}
                  setFormData={setFormData}
                  catalogEntries={catalogEntries}
                  appType={appType}
                />
              )}
              {activeStep === 3 && (
                <StepConfirm
                  formData={formData}
                  setFormData={setFormData}
                  selectedClient={selectedClient}
                  goToStep={goToStep}
                  newChecklistLabel={newChecklistLabel}
                  setNewChecklistLabel={setNewChecklistLabel}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </form>

      {/* ── Bottom CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(to top, #FAF0E8 70%, transparent)',
      }}>
        {activeStep < STEPS.length - 1 ? (
          <motion.button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: 56,
              borderRadius: 18, border: 'none',
              background: canProceed()
                ? 'linear-gradient(135deg, #C07850, #A05830)'
                : '#E8D5C8',
              color: canProceed() ? '#FFF' : '#B09080',
              fontWeight: 800, fontSize: 17,
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canProceed() ? '0 6px 24px rgba(192,120,80,0.4)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
              fontFamily: 'inherit',
            }}
          >
            Continua
            <ChevronRight size={20} strokeWidth={2.5} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: 56,
              borderRadius: 18, border: 'none',
              background: loading ? '#E8D5C8' : 'linear-gradient(135deg, #C07850, #A05830)',
              color: loading ? '#B09080' : '#FFF',
              fontWeight: 800, fontSize: 17,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 6px 24px rgba(192,120,80,0.4)',
              fontFamily: 'inherit',
            }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: 11 }}
              />
            ) : (
              <>
                {isEditing ? 'Aggiorna appuntamento' : 'Salva appuntamento'}
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* ── Success overlay ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(250,240,232,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 32px' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
                }}
              >
                <Check size={38} color="#fff" strokeWidth={3} />
              </motion.div>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#2C2C2C', textAlign: 'center' }}>
                {isEditing ? 'Appuntamento aggiornato!' : 'Appuntamento salvato!'}
              </p>
              <p style={{ fontSize: 14, color: '#9A8880', textAlign: 'center' }}>
                Tutto pronto ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}