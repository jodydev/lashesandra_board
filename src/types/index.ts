export interface Client {
  id: string;
  nome: string;
  cognome: string;
  telefono?: string;
  email?: string;
  tipo_trattamento?: string;
  data_ultimo_appuntamento?: string;
  spesa_totale: number;
  importo?: number;
  tipo_cliente: 'nuovo' | 'abituale';
  /** URL pubblico della foto profilo (Supabase Storage bucket client-avatars). */
  foto_url?: string | null;
  created_at: string;
}

/** Voce della checklist "da fare" per un appuntamento (es. pulizia, patch test, schema da seguire). */
export interface AppointmentChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

/** Voce del listino prezzi/durate (tipi di trattamento). */
export interface TreatmentCatalogEntry {
  id: string;
  app_type: 'lashesandra' | 'isabellenails';
  name: string;
  base_price: number;
  duration_minutes: number;
  sort_order: number;
  /** Costo stimato materiali/tempo per singola seduta (opzionale, per calcolo margine). */
  estimated_cost?: number | null;
  created_at?: string;
}

/** Link configurato tra voce di listino e materiale di inventario. */
export interface TreatmentMaterialLink {
  id: string;
  treatment_catalog_id: string;
  material_id: string;
  /** Quantità consumata per singola seduta (stessa unità di Material.quantity). */
  quantity_per_session: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  data: string;
  /** Solo per eventi personali: data fine periodo (inclusiva). Default uguale a data. */
  end_date?: string;
  ora?: string;
  importo: number;
  tipo_trattamento?: string;
  /** Durata della seduta in minuti (usata per blocco slot in calendario). Default 60. */
  duration_minutes?: number;
  /** Riferimento al listino; se valorizzato, tipo/importo/durata coerenti con il listino. */
  treatment_catalog_id?: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  /** Note rapide per la seduta (es. refill, ricordarsi bigodino 0.15). */
  note?: string | null;
  /** Checklist "da fare" opzionale (es. pulizia, patch test, schema da seguire). */
  checklist?: AppointmentChecklistItem[] | null;
  /**
   * Campo non persistito su DB: usato lato UI per distinguere
   * eventi personali da appuntamenti di lavoro.
   */
  kind?: 'work' | 'personal';
  created_at: string;
}

export interface ClientWithAppointments extends Client {
  appointments?: Appointment[];
}

export interface MonthlyStats {
  totalClients: number;
  totalRevenue: number;
  totalAppointments: number;
  averageRevenuePerClient: number;
  topClients: Array<{
    client: Client;
    revenue: number;
  }>;
}

export interface RetentionBucket {
  weeks: 3 | 4 | 5;
  totalClients: number;
  retainedClients: number;
  percentage: number;
}

export interface RetentionStats {
  periodStart: string;
  periodEnd: string;
  buckets: RetentionBucket[];
}

export interface RiskyClient {
  client: Client;
  noShowCount: number;
  cancellationCount: number;
  lastIssueDate: string;
}

export interface NoShowCancellationStats {
  periodStart: string;
  periodEnd: string;
  totalAppointments: number;
  noShowCount: number;
  cancellationCount: number;
  noShowPercentage: number;
  cancellationPercentage: number;
  riskyClients: RiskyClient[];
}

export interface TreatmentMarginEntry {
  name: string;
  count: number;
  marginTotal: number;
  marginAverage: number;
}

export interface TreatmentMarginStats {
  periodStart: string;
  periodEnd: string;
  items: TreatmentMarginEntry[];
}

export interface TreatmentWithCount {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  client: Client;
  appointment: Appointment;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarViewProps {
  currentDate: import('dayjs').Dayjs;
  appointments: Appointment[];
  clients: Client[];
  onDateClick: (date: import('dayjs').Dayjs) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onNewAppointment: () => void;
  colors: ReturnType<typeof import('../hooks/useAppColors').useAppColors>;
}

// Tipi per le schede cliente estese
export interface EyeCharacteristics {
  colore_occhi?: string;
  forma_occhi: 'mandorla' | 'rotondi' | 'normali';
  posizione_occhi: 'sporgenti' | 'incavati' | 'normali';
  distanza_occhi: 'ravvicinati' | 'distanziati' | 'normali';
  angolo_esterno: 'normale' | 'alto' | 'basso';
  asimmetria: 'si' | 'no';
  lunghezza_ciglia_naturali: 'corte' | 'medie' | 'lunghe';
  foltezza_ciglia_naturali: 'rade' | 'medie' | 'folte';
  direzione_crescita_ciglia: 'in_basso' | 'dritte' | 'in_alto';
}

export interface ClientProfile {
  allergie: boolean;
  pelle_sensibile: boolean;
  terapia_ormonale: boolean;
  gravidanza: boolean;
  lenti_contatto: boolean;
  occhiali: boolean;
  lacrimazione: boolean;
  note?: string;
}

export interface EyeLengthMap {
  [key: string]: number; // posizione -> lunghezza in mm
}

export interface Treatment {
  id?: string;
  data: string;
  /** Id voce listino (opzionale); se valorizzato il prezzo può essere prefilled dal listino. */
  treatment_catalog_id?: string | null;
  curvatura: string;
  spessore: number;
  lunghezze: string;
  schema_occhio: EyeLengthMap;
  colla: string;
  tenuta: string;
  colore_ciglia: string;
  refill: 'si' | 'no';
  tempo_applicazione: string;
  bigodini: string[];
  colore: string;
  prezzo: number;
  created_at?: string;
}

export interface ClientProfileData {
  id?: string;
  client_id: string;
  data_nascita?: string;
  caratteristiche_occhi: EyeCharacteristics;
  profilo_cliente: ClientProfile;
  trattamenti: Treatment[];
  created_at?: string;
  updated_at?: string;
}

export interface ClientWithProfile extends Client {
  profile?: ClientProfileData;
}

// WhatsApp System Types
export interface WhatsAppMessage {
  id?: string;
  client_id: string;
  appointment_id: string;
  phone_number: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sent_at?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessageTemplate {
  id?: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppConfig {
  id?: string;
  api_url: string;
  api_token: string;
  phone_number_id: string;
  business_account_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentWithClient extends Appointment {
  client: Client;
}

export interface WhatsAppLogEntry {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time?: string;
  service: string;
  message_status: 'pending' | 'sent' | 'failed' | 'delivered';
  message_content: string;
  sent_at?: string;
  error_message?: string;
}

// Refill / richiami clienti
/** Settimane consigliate per il refill dopo l'ultimo trattamento (extension). */
export const REFILL_WEEKS = 3;
export type RecallFilter = 'overdue' | 'this_week' | 'next_two_weeks';
export interface RecallEntry {
  client: Client;
  lastAppointmentDate: string;
  lastAppointmentTreatment?: string;
  suggestedRefillDate: string;
  filter: RecallFilter;
}

// Inventario materiali
export interface Material {
  id: string;
  name: string;
  quantity: number | null;
  threshold: number | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

/** Log di consumo materiali per singolo appuntamento (per idempotenza scarico). */
export interface AppointmentMaterialUsage {
  id: string;
  appointment_id: string;
  material_id: string;
  quantity_used: number;
  created_at: string;
}
