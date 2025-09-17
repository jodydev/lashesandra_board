import { createClient } from '@supabase/supabase-js';
import type { Client, Appointment, ClientWithAppointments, MonthlyStats } from '../types';
import { useApp } from '../contexts/AppContext';

const supabaseUrl = 'https://ufondjehytekkbrgrjgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmb25kamVoeXRla2ticmdyamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODkxOTAsImV4cCI6MjA3MzY2NTE5MH0.6hLsH3Z1rur1crqt4DKQ-3s4JMxD7kuFceroMVlYkd8';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Hook per ottenere i servizi con le tabelle corrette
export function useSupabaseServices() {
  const { tablePrefix } = useApp();
  
  const clientsTable = `${tablePrefix}clients`;
  const appointmentsTable = `${tablePrefix}appointments`;

  // Client operations
  const clientService = {
    async getAll(): Promise<Client[]> {
      const { data, error } = await supabase
        .from(clientsTable)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async getById(id: string): Promise<Client | null> {
      const { data, error } = await supabase
        .from(clientsTable)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(client: Omit<Client, 'id' | 'created_at' | 'spesa_totale'>): Promise<Client> {
      const { data, error } = await supabase
        .from(clientsTable)
        .insert([client])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Client>): Promise<Client> {
      const { data, error } = await supabase
        .from(clientsTable)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from(clientsTable)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async getWithAppointments(id: string): Promise<ClientWithAppointments | null> {
      const { data: client, error: clientError } = await supabase
        .from(clientsTable)
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      if (!client) return null;

      const { data: appointments, error: appointmentsError } = await supabase
        .from(appointmentsTable)
        .select('*')
        .eq('client_id', id)
        .order('data', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      return {
        ...client,
        appointments: appointments || []
      };
    }
  };

  // Appointment operations
  const appointmentService = {
    async getAll(): Promise<Appointment[]> {
      const { data, error } = await supabase
        .from(appointmentsTable)
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async getByClientId(clientId: string): Promise<Appointment[]> {
      const { data, error } = await supabase
        .from(appointmentsTable)
        .select('*')
        .eq('client_id', clientId)
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async getByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
      const { data, error } = await supabase
        .from(appointmentsTable)
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },

    async create(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
      const { data, error } = await supabase
        .from(appointmentsTable)
        .insert([appointment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
      const { data, error } = await supabase
        .from(appointmentsTable)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from(appointmentsTable)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  };

  // Statistics operations
  const statsService = {
    async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: appointments, error: appointmentsError } = await supabase
        .from(appointmentsTable)
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate)
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      const { data: clients, error: clientsError } = await supabase
        .from(clientsTable)
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (clientsError) throw clientsError;

      const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.importo || 0), 0) || 0;
      const totalClients = clients?.length || 0;
      const averageRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;

      // Calculate top clients by revenue
      const clientRevenueMap = new Map<string, { client: Client; revenue: number }>();
      
      appointments?.forEach(apt => {
        const client = clients?.find(c => c.id === apt.client_id);
        if (client) {
          const current = clientRevenueMap.get(apt.client_id) || { client, revenue: 0 };
          current.revenue += apt.importo || 0;
          clientRevenueMap.set(apt.client_id, current);
        }
      });

      const topClients = Array.from(clientRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalClients,
        totalRevenue,
        averageRevenuePerClient,
        topClients
      };
    },

    async getDailyStats(year: number, month: number): Promise<Array<{ day: number; revenue: number; clients: number }>> {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: appointments, error: appointmentsError } = await supabase
        .from(appointmentsTable)
        .select('data, importo, client_id')
        .gte('data', startDate)
        .lte('data', endDate)
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      const { data: clients, error: clientsError } = await supabase
        .from(clientsTable)
        .select('created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (clientsError) throw clientsError;

      // Initialize daily stats
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        revenue: 0,
        clients: 0
      }));

      // Process appointments
      appointments?.forEach(apt => {
        const day = new Date(apt.data).getDate();
        if (day >= 1 && day <= daysInMonth) {
          dailyStats[day - 1].revenue += apt.importo || 0;
        }
      });

      // Process new clients
      clients?.forEach(client => {
        const day = new Date(client.created_at).getDate();
        if (day >= 1 && day <= daysInMonth) {
          dailyStats[day - 1].clients += 1;
        }
      });

      return dailyStats;
    },

    async getTreatmentDistribution(year: number, month: number): Promise<Array<{ name: string; value: number; color: string }>> {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: appointments, error } = await supabase
        .from(appointmentsTable)
        .select('tipo_trattamento, importo')
        .gte('data', startDate)
        .lte('data', endDate)
        .eq('status', 'completed')
        .not('tipo_trattamento', 'is', null);

      if (error) throw error;

      // Count treatments and calculate revenue
      const treatmentMap = new Map<string, { count: number; revenue: number }>();
      
      appointments?.forEach(apt => {
        const treatment = apt.tipo_trattamento || 'Altri';
        const current = treatmentMap.get(treatment) || { count: 0, revenue: 0 };
        current.count += 1;
        current.revenue += apt.importo || 0;
        treatmentMap.set(treatment, current);
      });

      // Convert to array and sort by revenue
      const treatments = Array.from(treatmentMap.entries())
        .map(([name, stats]) => ({
          name,
          value: stats.revenue,
          count: stats.count
        }))
        .sort((a, b) => b.value - a.value);

      // Define colors for treatments
      const colors = ['#E91E63', '#F8BBD9', '#C2185B', '#FCE4EC', '#AD1457', '#E1BEE7', '#BA68C8'];
      
      return treatments.map((treatment, index) => ({
        name: treatment.name,
        value: treatment.value,
        color: colors[index % colors.length]
      }));
    }
  };

  return {
    clientService,
    appointmentService,
    statsService
  };
}
