import { supabase } from './supabase';
import type { 
  WhatsAppMessage, 
  MessageTemplate, 
  AppointmentWithClient,
  WhatsAppLogEntry 
} from '../types';
import { useApp } from '../contexts/AppContext';

// WhatsApp Business API Service
export class WhatsAppService {
  private tablePrefix: string;

  constructor(tablePrefix: string = '') {
    this.tablePrefix = tablePrefix;
  }

  // Get message template
  async getMessageTemplate(templateName: string = 'default'): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from(`${this.tablePrefix}message_templates`)
      .select('*')
      .eq('name', templateName)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Errore nel caricamento template: ${error.message}`);
    }

    if (!data) {
      // Return default template if none exists
      return {
        name: 'default',
        content: 'Ciao {nome}, ti ricordiamo il tuo appuntamento domani alle {ora} per il trattamento {servizio} presso il nostro centro estetico in {location}. Ti aspettiamo 💖',
        is_default: true
      };
    }

    return data;
  }

  // Get tomorrow's appointments with client data
  async getTomorrowAppointments(): Promise<AppointmentWithClient[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(`${this.tablePrefix}appointments`)
      .select(`
        *,
        client:${this.tablePrefix}clients(*)
      `)
      .eq('data', tomorrowStr)
      .eq('status', 'pending')
      .not('client.telefono', 'is', null);

    if (error) {
      throw new Error(`Errore nel caricamento appuntamenti: ${error.message}`);
    }

    return (data || []) as unknown as AppointmentWithClient[];
  }

  // Generate personalized message from template
  generateMessage(template: string, appointment: AppointmentWithClient): string {
    const client = appointment.client;
    const appointmentDate = new Date(appointment.data);
    const timeStr = appointment.ora || 'orario da confermare';
    const location = 'Via Monsignor Enrico Montalbetti 5, Reggio Calabria';
    
    return template
      .replace(/{nome}/g, client.nome)
      .replace(/{cognome}/g, client.cognome)
      .replace(/{ora}/g, timeStr)
      .replace(/{servizio}/g, appointment.tipo_trattamento || 'trattamento')
      .replace(/{location}/g, location)
      .replace(/{data}/g, appointmentDate.toLocaleDateString('it-IT'));
  }

  // Save message to database
  async saveMessage(messageData: Omit<WhatsAppMessage, 'id' | 'created_at' | 'updated_at'>): Promise<WhatsAppMessage> {
    const { data, error } = await supabase
      .from(`${this.tablePrefix}whatsapp_messages`)
      .insert([messageData])
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nel salvataggio messaggio: ${error.message}`);
    }

    return data;
  }

  // Update message status
  async updateMessageStatus(messageId: string, status: WhatsAppMessage['status'], errorMessage?: string): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from(`${this.tablePrefix}whatsapp_messages`)
      .update(updateData)
      .eq('id', messageId);

    if (error) {
      throw new Error(`Errore nell'aggiornamento status messaggio: ${error.message}`);
    }
  }

  // Get message logs with full client and appointment data
  async getMessageLogs(limit: number = 100): Promise<WhatsAppLogEntry[]> {
    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from(`${this.tablePrefix}whatsapp_messages`)
      .select(`
        id,
        message_content,
        status,
        sent_at,
        error_message,
        client_id,
        appointment_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (messagesError) {
      throw new Error(`Errore nel caricamento log messaggi: ${messagesError.message}`);
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Get unique client and appointment IDs
    const clientIds = [...new Set(messages.map(msg => msg.client_id))];
    const appointmentIds = [...new Set(messages.map(msg => msg.appointment_id))];

    // Get clients data
    const { data: clients, error: clientsError } = await supabase
      .from(`${this.tablePrefix}clients`)
      .select('id, nome, cognome, telefono')
      .in('id', clientIds);

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
    }

    // Get appointments data
    const { data: appointments, error: appointmentsError } = await supabase
      .from(`${this.tablePrefix}appointments`)
      .select('id, data, ora, tipo_trattamento')
      .in('id', appointmentIds);

    if (appointmentsError) {
      console.error('Error loading appointments:', appointmentsError);
    }

    // Create lookup maps
    const clientsMap = new Map((clients || []).map(client => [client.id, client]));
    const appointmentsMap = new Map((appointments || []).map(appointment => [appointment.id, appointment]));

    // Transform data to match WhatsAppLogEntry interface
    return messages.map(msg => {
      const client = clientsMap.get(msg.client_id);
      const appointment = appointmentsMap.get(msg.appointment_id);
      
      return {
        id: msg.id,
        client_name: client ? `${client.nome} ${client.cognome}` : 'Cliente Sconosciuto',
        client_phone: client?.telefono || '',
        appointment_date: appointment?.data || '',
        appointment_time: appointment?.ora || '',
        service: appointment?.tipo_trattamento || 'Generico',
        message_status: msg.status,
        message_content: msg.message_content,
        sent_at: msg.sent_at,
        error_message: msg.error_message
      };
    });
  }

  // Send confirmation messages for tomorrow's appointments via Edge Function
  async sendTomorrowConfirmations(): Promise<{ sent: number; failed: number; errors: string[] }> {
    try {
      console.log('🚀 Starting WhatsApp confirmations...');
      console.log('📋 Table prefix:', this.tablePrefix);
      
      // Call Edge Function using Supabase client
      const { data, error } = await supabase.functions.invoke('whatsapp-daily-confirmations-twilio', {
        body: {
          table_prefix: this.tablePrefix
        }
      });

      console.log('📊 Edge Function response:', { data, error });

      if (error) {
        console.error('❌ Edge Function error:', error);
        return { 
          sent: 0, 
          failed: 0, 
          errors: [error.message || 'Edge Function Error'] 
        };
      }

      console.log('✅ Edge Function success:', data);
      return {
        sent: data?.sent || 0,
        failed: data?.failed || 0,
        errors: data?.errors || []
      };

    } catch (error) {
      console.error('❌ WhatsApp service error:', error);
      return { 
        sent: 0, 
        failed: 0, 
        errors: [error instanceof Error ? error.message : 'Errore di rete'] 
      };
    }
  }

}

// Hook for using WhatsApp service
export function useWhatsAppService() {
  const { tablePrefix } = useApp();
  return new WhatsAppService(tablePrefix);
}