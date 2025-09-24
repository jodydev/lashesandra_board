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
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  data: string;
  ora?: string;
  importo: number;
  tipo_trattamento?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ClientWithAppointments extends Client {
  appointments?: Appointment[];
}

export interface MonthlyStats {
  totalClients: number;
  totalRevenue: number;
  averageRevenuePerClient: number;
  topClients: Array<{
    client: Client;
    revenue: number;
  }>;
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
