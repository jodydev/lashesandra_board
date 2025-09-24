import { supabase } from './supabase';
import type { 
  WhatsAppMessage, 
  MessageTemplate, 
  WhatsAppConfig, 
  AppointmentWithClient,
  WhatsAppLogEntry 
} from '../types';
import { useApp } from '../contexts/AppContext';

// WhatsApp Business API Service
export class WhatsAppService {
  private config: WhatsAppConfig | null = null;
  private tablePrefix: string;

  constructor(tablePrefix: string = '') {
    this.tablePrefix = tablePrefix;
  }

  // Initialize WhatsApp configuration
  async initializeConfig(): Promise<void> {
    const { data, error } = await supabase
      .from(`${this.tablePrefix}whatsapp_config`)
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Errore nel caricamento configurazione WhatsApp: ${error.message}`);
    }

    this.config = data;
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

  // Generate personalized message
  generateMessage(template: string, appointment: AppointmentWithClient, location: string = 'Via Monsignor Enrico Montalbetti 5, Reggio Calabria'): string {
    const client = appointment.client;
    const appointmentDate = new Date(appointment.data);
    const timeStr = appointment.ora ? appointment.ora : 'orario da confermare';
    
    return template
      .replace(/{nome}/g, client.nome)
      .replace(/{cognome}/g, client.cognome)
      .replace(/{ora}/g, timeStr)
      .replace(/{servizio}/g, appointment.tipo_trattamento || 'trattamento')
      .replace(/{location}/g, location)
      .replace(/{data}/g, appointmentDate.toLocaleDateString('it-IT'));
  }

  // Send WhatsApp message via API
  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      await this.initializeConfig();
    }

    if (!this.config) {
      return { success: false, error: 'Configurazione WhatsApp non trovata' };
    }

    try {
      const response = await fetch(`${this.config.api_url}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace(/\D/g, ''), // Remove non-digits
          type: 'text',
          text: {
            body: message
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error?.message || `Errore API: ${response.status}` 
        };
      }

      return { 
        success: true, 
        messageId: data.messages?.[0]?.id 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      };
    }
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
    const updateData: Partial<WhatsAppMessage> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'sent' || status === 'delivered') {
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
      throw new Error(`Errore nell'aggiornamento messaggio: ${error.message}`);
    }
  }

  // Get appointments for tomorrow
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
      throw new Error(`Errore nel recupero appuntamenti: ${error.message}`);
    }

    return data || [];
  }

  // Get WhatsApp message logs
  async getMessageLogs(limit: number = 50, offset: number = 0): Promise<WhatsAppLogEntry[]> {
    const { data, error } = await supabase
      .from(`${this.tablePrefix}whatsapp_messages`)
      .select(`
        *,
        client:${this.tablePrefix}clients(nome, cognome, telefono),
        appointment:${this.tablePrefix}appointments(data, ora, tipo_trattamento)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Errore nel recupero log messaggi: ${error.message}`);
    }

    return (data || []).map(msg => ({
      id: msg.id,
      client_name: `${msg.client.nome} ${msg.client.cognome}`,
      client_phone: msg.client.telefono,
      appointment_date: msg.appointment.data,
      appointment_time: msg.appointment.ora,
      service: msg.appointment.tipo_trattamento || 'Generico',
      message_status: msg.status,
      message_content: msg.message_content,
      sent_at: msg.sent_at,
      error_message: msg.error_message
    }));
  }

  // Send confirmation messages for tomorrow's appointments
  async sendTomorrowConfirmations(): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    try {
      // Get tomorrow's appointments
      const appointments = await this.getTomorrowAppointments();
      
      if (appointments.length === 0) {
        return results;
      }

      // Get message template
      const template = await this.getMessageTemplate();

      // Process each appointment
      for (const appointment of appointments) {
        try {
          // Check if message already sent for this appointment
          const { data: existingMessage } = await supabase
            .from(`${this.tablePrefix}whatsapp_messages`)
            .select('id')
            .eq('appointment_id', appointment.id)
            .eq('status', 'sent')
            .single();

          if (existingMessage) {
            continue; // Skip if already sent
          }

          // Generate personalized message
          const messageContent = this.generateMessage(template.content, appointment);

          // Save message to database with pending status
          const messageData = await this.saveMessage({
            client_id: appointment.client_id,
            appointment_id: appointment.id,
            phone_number: appointment.client.telefono!,
            message_content: messageContent,
            status: 'pending'
          });

          // Send message via WhatsApp API
          const sendResult = await this.sendMessage(
            appointment.client.telefono!,
            messageContent
          );

          if (sendResult.success) {
            await this.updateMessageStatus(messageData.id, 'sent');
            results.sent++;
          } else {
            await this.updateMessageStatus(messageData.id, 'failed', sendResult.error);
            results.failed++;
            results.errors.push(`${appointment.client.nome}: ${sendResult.error}`);
          }

          // Add delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          results.failed++;
          results.errors.push(`${appointment.client.nome}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
      }

    } catch (error) {
      results.errors.push(`Errore generale: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }

    return results;
  }
}

// Hook for using WhatsApp service
export function useWhatsAppService() {
  const { tablePrefix } = useApp();
  return new WhatsAppService(tablePrefix);
}
