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
