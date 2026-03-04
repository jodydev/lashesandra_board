import type {
  Client,
  Appointment,
  ClientWithAppointments,
  MonthlyStats,
  ClientProfileData,
  Material,
  TreatmentCatalogEntry,
  TreatmentMaterialLink,
  AppointmentMaterialUsage,
  RetentionStats,
  RetentionBucket,
  NoShowCancellationStats,
  RiskyClient,
  TreatmentMarginStats,
} from '../types';
import { useApp } from '../contexts/AppContext';
import { supabase } from './supabase';
import dayjs from 'dayjs';

// Servizio semplificato per l'uso diretto
export const supabaseService = {
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getClientProfile(clientId: string): Promise<ClientProfileData | null> {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  async saveClientProfile(profileData: ClientProfileData): Promise<ClientProfileData> {
    const { data, error } = await supabase
      .from('client_profiles')
      .upsert([profileData], { 
        onConflict: 'client_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Hook per ottenere i servizi con le tabelle corrette
export function useSupabaseServices() {
  const { tablePrefix } = useApp();
  
  const clientsTable = `${tablePrefix}clients`;
  const appointmentsTable = `${tablePrefix}appointments`;
  const clientProfilesTable = `${tablePrefix}client_profiles`;
  const materialsTable = `${tablePrefix}materials`;
  const treatmentMaterialsTable = `${tablePrefix}treatment_materials`;
  const appointmentMaterialsUsageTable = `${tablePrefix}appointment_materials_usage`;

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
      if (error?.code === 'PGRST204' && (error?.message?.includes('checklist') || error?.message?.includes('note'))) {
        const { note: _n, checklist: _c, ...payload } = appointment;
        const retry = await supabase.from(appointmentsTable).insert([payload]).select().single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
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
      if (error?.code === 'PGRST204' && (error?.message?.includes('checklist') || error?.message?.includes('note'))) {
        const { note: _n, checklist: _c, ...payload } = updates;
        const retry = await supabase.from(appointmentsTable).update(payload).eq('id', id).select().single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
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

  // Listino tipi di trattamento (tabella condivisa, filtrata per app_type)
  const treatmentCatalogService = {
    async getAllByAppType(appType: 'lashesandra' | 'isabellenails'): Promise<TreatmentCatalogEntry[]> {
      const { data, error } = await supabase
        .from('treatments_catalog')
        .select('*')
        .eq('app_type', appType)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    async create(entry: Omit<TreatmentCatalogEntry, 'id' | 'created_at'>): Promise<TreatmentCatalogEntry> {
      const { data, error } = await supabase
        .from('treatments_catalog')
        .insert([entry])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Pick<TreatmentCatalogEntry, 'name' | 'base_price' | 'duration_minutes' | 'sort_order'>>): Promise<TreatmentCatalogEntry> {
      const { data, error } = await supabase
        .from('treatments_catalog')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('treatments_catalog')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
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
      const totalAppointments = appointments?.length || 0;
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
        totalAppointments,
        averageRevenuePerClient,
        topClients
      };
    },

    async getDailyStats(year: number, month: number): Promise<Array<{ day: number; revenue: number; clients: number; appointments: number }>> {
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
        clients: 0,
        appointments: 0
      }));

      // Process appointments
      appointments?.forEach(apt => {
        const day = new Date(apt.data).getDate();
        if (day >= 1 && day <= daysInMonth) {
          dailyStats[day - 1].revenue += apt.importo || 0;
          dailyStats[day - 1].appointments += 1;
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

    async getTreatmentDistribution(year: number, month: number): Promise<Array<{ name: string; value: number; count: number; color: string }>> {
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
        count: treatment.count,
        color: colors[index % colors.length]
      }));
    },

    async getRetentionStats(periodStart: string, periodEnd: string): Promise<RetentionStats> {
      const windowStart = dayjs(periodStart).subtract(5, 'week').format('YYYY-MM-DD');
      const windowEnd = dayjs(periodEnd).add(5, 'week').format('YYYY-MM-DD');

      const { data: appointments, error } = await supabase
        .from(appointmentsTable)
        .select('client_id, data, status')
        .gte('data', windowStart)
        .lte('data', windowEnd)
        .eq('status', 'completed');

      if (error) throw error;

      const byClient = new Map<string, string[]>();
      (appointments || []).forEach((apt) => {
        if (!apt.client_id || !apt.data) return;
        const list = byClient.get(apt.client_id) || [];
        list.push(apt.data);
        byClient.set(apt.client_id, list);
      });

      byClient.forEach((dates, clientId) => {
        const sorted = [...dates].sort((a, b) => {
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        });
        byClient.set(clientId, sorted);
      });

      const start = dayjs(periodStart);
      const end = dayjs(periodEnd);
      const clientsInPeriod = new Set<string>();
      const lastInPeriod = new Map<string, dayjs.Dayjs>();

      byClient.forEach((dates, clientId) => {
        const inPeriodDates = dates.filter((d) => {
          const dd = dayjs(d);
          return (dd.isSame(start) || dd.isAfter(start)) && (dd.isSame(end) || dd.isBefore(end));
        });
        if (!inPeriodDates.length) return;
        clientsInPeriod.add(clientId);
        const lastDateString = inPeriodDates.at(-1) as string;
        lastInPeriod.set(clientId, dayjs(lastDateString));
      });

      const buckets: RetentionBucket[] = [3, 4, 5].map((weeks) => {
        let retained = 0;
        clientsInPeriod.forEach((clientId) => {
          const lastDate = lastInPeriod.get(clientId);
          if (!lastDate) return;
          const maxReturnDate = lastDate.add(weeks, 'week');
          const allDates = byClient.get(clientId) || [];
          const hasReturn = allDates.some((d) => {
            const dd = dayjs(d);
            return dd.isAfter(lastDate) && (dd.isSame(maxReturnDate) || dd.isBefore(maxReturnDate));
          });
          if (hasReturn) retained += 1;
        });

        const total = clientsInPeriod.size;
        const percentage = total > 0 ? (retained / total) * 100 : 0;

        return {
          weeks: weeks as RetentionBucket['weeks'],
          totalClients: total,
          retainedClients: retained,
          percentage: Math.round(percentage),
        };
      });

      return {
        periodStart,
        periodEnd,
        buckets,
      };
    },

    async getNoShowCancellationStats(periodStart: string, periodEnd: string): Promise<NoShowCancellationStats> {
      const { data: appointments, error: appointmentsError } = await supabase
        .from(appointmentsTable)
        .select('id, client_id, data, status, importo')
        .gte('data', periodStart)
        .lte('data', periodEnd);

      if (appointmentsError) throw appointmentsError;

      const allAppointments = appointments || [];
      const totalAppointments = allAppointments.length;

      // Assunzione attuale: un appuntamento cancellato con importo 0 è un no-show.
      let noShowCount = 0;
      let cancellationCount = 0;

      allAppointments.forEach((apt) => {
        if (apt.status === 'cancelled') {
          const amount = apt.importo || 0;
          if (amount === 0) {
            noShowCount += 1;
          } else {
            cancellationCount += 1;
          }
        }
      });

      const noShowPercentage =
        totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0;
      const cancellationPercentage =
        totalAppointments > 0 ? (cancellationCount / totalAppointments) * 100 : 0;

      // Clienti a rischio: conteggio no-show/cancellazioni negli ultimi 90 giorni
      const riskWindowStart = dayjs(periodEnd).subtract(90, 'day').format('YYYY-MM-DD');
      const { data: riskAppointments, error: riskError } = await supabase
        .from(appointmentsTable)
        .select('id, client_id, data, status, importo')
        .gte('data', riskWindowStart)
        .lte('data', periodEnd);

      if (riskError) throw riskError;

      const riskMap = new Map<
        string,
        { noShow: number; cancelled: number; lastIssueDate: string }
      >();

      (riskAppointments || []).forEach((apt) => {
        if (apt.status !== 'cancelled') return;
        const amount = apt.importo || 0;
        const isNoShow = amount === 0;
        const clientId = apt.client_id;
        if (!clientId || !apt.data) return;
        const current = riskMap.get(clientId) || {
          noShow: 0,
          cancelled: 0,
          lastIssueDate: apt.data,
        };
        if (isNoShow) {
          current.noShow += 1;
        } else {
          current.cancelled += 1;
        }
        if (dayjs(apt.data).isAfter(dayjs(current.lastIssueDate))) {
          current.lastIssueDate = apt.data;
        }
        riskMap.set(clientId, current);
      });

      const clientIds = Array.from(riskMap.keys());
      let clientsById = new Map<string, Client>();
      if (clientIds.length > 0) {
        const { data: clients, error: clientsError } = await supabase
          .from(clientsTable)
          .select('*')
          .in('id', clientIds);
        if (clientsError) throw clientsError;
        (clients || []).forEach((c) => {
          clientsById.set(c.id, c as Client);
        });
      }

      const thirtyDaysAgo = dayjs(periodEnd).subtract(30, 'day');
      const riskyClients: RiskyClient[] = [];

      riskMap.forEach((value, clientId) => {
        const totalIssues = value.noShow + value.cancelled;
        const lastIssue = dayjs(value.lastIssueDate);
        const hasRecentNoShow = value.noShow > 0 && lastIssue.isAfter(thirtyDaysAgo);

        if (totalIssues < 2 && !hasRecentNoShow) {
          return;
        }

        const client = clientsById.get(clientId);
        if (!client) return;

        riskyClients.push({
          client,
          noShowCount: value.noShow,
          cancellationCount: value.cancelled,
          lastIssueDate: value.lastIssueDate,
        });
      });

      riskyClients.sort((a, b) => {
        if (a.lastIssueDate < b.lastIssueDate) return 1;
        if (a.lastIssueDate > b.lastIssueDate) return -1;
        return 0;
      });

      return {
        periodStart,
        periodEnd,
        totalAppointments,
        noShowCount,
        cancellationCount,
        noShowPercentage: Math.round(noShowPercentage),
        cancellationPercentage: Math.round(cancellationPercentage),
        riskyClients,
      };
    },

    async getTreatmentMarginStats(
      periodStart: string,
      periodEnd: string,
      appType: 'lashesandra' | 'isabellenails',
    ): Promise<TreatmentMarginStats> {
      const { data: catalog, error: catalogError } = await supabase
        .from('treatments_catalog')
        .select('*')
        .eq('app_type', appType);

      if (catalogError) throw catalogError;

      const catalogById = new Map<string, TreatmentCatalogEntry>();
      (catalog || []).forEach((entry) => {
        if (!entry.id) return;
        catalogById.set(entry.id, entry as TreatmentCatalogEntry);
      });

      const { data: appointments, error: appointmentsError } = await supabase
        .from(appointmentsTable)
        .select('treatment_catalog_id, tipo_trattamento, importo')
        .gte('data', periodStart)
        .lte('data', periodEnd)
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      const marginMap = new Map<
        string,
        { name: string; count: number; marginTotal: number }
      >();

      (appointments || []).forEach((apt) => {
        const catalogId = apt.treatment_catalog_id as string | null;
        const catalogEntry = catalogId ? catalogById.get(catalogId) : undefined;
        const name =
          catalogEntry?.name || apt.tipo_trattamento || 'Altro trattamento';
        const price = apt.importo || 0;
        const estimatedCost =
          (catalogEntry as TreatmentCatalogEntry | undefined)?.estimated_cost || 0;
        const margin = price - estimatedCost;

        const current = marginMap.get(name) || {
          name,
          count: 0,
          marginTotal: 0,
        };
        current.count += 1;
        current.marginTotal += margin;
        marginMap.set(name, current);
      });

      const items = Array.from(marginMap.values())
        .map((entry) => {
          const marginAverage = entry.count > 0 ? entry.marginTotal / entry.count : 0;
          return {
            name: entry.name,
            count: entry.count,
            marginTotal: entry.marginTotal,
            marginAverage,
          };
        })
        .sort((a, b) => b.marginTotal - a.marginTotal);

      return {
        periodStart,
        periodEnd,
        items,
      };
    },
  };

  // Client Profile operations
  const clientProfileService = {
    async getByClientId(clientId: string): Promise<ClientProfileData | null> {
      const { data, error } = await supabase
        .from(clientProfilesTable)
        .select('*')
        .eq('client_id', clientId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    },

    async save(profileData: ClientProfileData): Promise<ClientProfileData> {
      const { data, error } = await supabase
        .from(clientProfilesTable)
        .upsert([profileData], { 
          onConflict: 'client_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(clientId: string): Promise<void> {
      const { error } = await supabase
        .from(clientProfilesTable)
        .delete()
        .eq('client_id', clientId);
      
      if (error) throw error;
    }
  };

  // Materials / Inventario
  const materialService = {
    async getAll(): Promise<Material[]> {
      const { data, error } = await supabase
        .from(materialsTable)
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async getById(id: string): Promise<Material | null> {
      const { data, error } = await supabase
        .from(materialsTable)
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(material: Omit<Material, 'id' | 'created_at'>): Promise<Material> {
      const { data, error } = await supabase
        .from(materialsTable)
        .insert([material])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Material>): Promise<Material> {
      const { data, error } = await supabase
        .from(materialsTable)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from(materialsTable)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    /** Materiali sotto soglia (per alert Home). */
    async getBelowThreshold(): Promise<Material[]> {
      const { data, error } = await supabase
        .from(materialsTable)
        .select('*')
        .not('threshold', 'is', null)
        .order('name', { ascending: true });
      if (error) throw error;
      const list = data || [];
      return list.filter((m: Material) => m.quantity !== null && m.threshold !== null && m.quantity < m.threshold);
    },
  };

  // Trattamenti ↔ materiali (configurazione listino)
  const treatmentMaterialsService = {
    async getAll(): Promise<TreatmentMaterialLink[]> {
      const { data, error } = await supabase
        .from(treatmentMaterialsTable)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async getByTreatmentCatalogId(treatmentCatalogId: string): Promise<TreatmentMaterialLink[]> {
      const { data, error } = await supabase
        .from(treatmentMaterialsTable)
        .select('*')
        .eq('treatment_catalog_id', treatmentCatalogId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    /**
     * Sostituisce completamente la configurazione materiali per una voce di listino.
     * Strategia: delete by treatment_catalog_id, poi insert batch delle nuove righe.
     */
    async replaceForTreatment(
      treatmentCatalogId: string,
      rows: { material_id: string; quantity_per_session: number }[],
    ): Promise<void> {
      const { error: delError } = await supabase
        .from(treatmentMaterialsTable)
        .delete()
        .eq('treatment_catalog_id', treatmentCatalogId);
      if (delError) throw delError;

      if (!rows.length) return;

      const payload = rows.map(r => ({
        treatment_catalog_id: treatmentCatalogId,
        material_id: r.material_id,
        quantity_per_session: r.quantity_per_session,
      }));

      const { error: insError } = await supabase
        .from(treatmentMaterialsTable)
        .insert(payload);
      if (insError) throw insError;
    },
  };

  // Log consumo materiali per appuntamento (per evitare doppi scarichi)
  const appointmentMaterialsUsageService = {
    async getByAppointmentId(appointmentId: string): Promise<AppointmentMaterialUsage[]> {
      const { data, error } = await supabase
        .from(appointmentMaterialsUsageTable)
        .select('*')
        .eq('appointment_id', appointmentId);
      if (error) throw error;
      return data || [];
    },

    async insertMany(usages: { appointment_id: string; material_id: string; quantity_used: number }[]): Promise<void> {
      if (!usages.length) return;
      const { error } = await supabase
        .from(appointmentMaterialsUsageTable)
        .insert(usages);
      if (error) throw error;
    },
  };

  const storageService = {
    bucketName: 'client-avatars' as const,
    /** Carica la foto profilo e restituisce l'URL pubblico. Sovrascrive se esiste già. */
    async uploadClientAvatar(clientId: string, file: File): Promise<string> {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${clientId}/avatar.${ext}`;
      const { error } = await supabase.storage.from(this.bucketName).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(this.bucketName).getPublicUrl(path);
      return publicUrl;
    },
  };

  return {
    clientService,
    appointmentService,
    statsService,
    clientProfileService,
    materialService,
    treatmentCatalogService,
    storageService,
    treatmentMaterialsService,
    appointmentMaterialsUsageService,
  };
}
