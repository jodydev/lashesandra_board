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
      
      // Get tomorrow's appointments
      const appointments = await this.getTomorrowAppointments();
      console.log('📅 Found appointments:', appointments.length);
      
      if (appointments.length === 0) {
        console.log('ℹ️ No appointments found for tomorrow');
        return { sent: 0, failed: 0, errors: [] };
      }

      // Get message template
      const template = await this.getMessageTemplate();
      console.log('📝 Using template:', template.name);

      const results = { sent: 0, failed: 0, errors: [] as string[] };

      // Process each appointment
      for (const appointment of appointments) {
        try {
          console.log(`📱 Processing appointment for ${appointment.client.nome} ${appointment.client.cognome}`);
          
          // Check if message already sent for this appointment
          const { data: existingMessage } = await supabase
            .from(`${this.tablePrefix}whatsapp_messages`)
            .select('id')
            .eq('appointment_id', appointment.id)
            .eq('status', 'sent')
            .single();

          if (existingMessage) {
            console.log(`⏭️ Message already sent for appointment ${appointment.id}`);
            continue;
          }

          // Generate personalized message
          const messageContent = this.generateMessage(template.content, appointment);
          console.log('💬 Generated message:', messageContent);

          // Save message to database with pending status
          const messageData = await this.saveMessage({
            client_id: appointment.client_id,
            appointment_id: appointment.id,
            phone_number: appointment.client.telefono!,
            message_content: messageContent,
            status: 'pending'
          });

          console.log('💾 Message saved to database:', messageData.id);

          // Send message via Twilio WhatsApp API
          const sendResult = await this.sendTwilioMessage(
            appointment.client.telefono!,
            messageContent
          );

          if (sendResult.success) {
            await this.updateMessageStatus(messageData.id!, 'sent');
            results.sent++;
            console.log(`✅ Message sent successfully to ${appointment.client.nome}`);
          } else {
            await this.updateMessageStatus(messageData.id!, 'failed', sendResult.error);
            results.failed++;
            results.errors.push(`${appointment.client.nome}: ${sendResult.error}`);
            console.log(`❌ Failed to send message to ${appointment.client.nome}: ${sendResult.error}`);
          }

          // Add delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          results.errors.push(`${appointment.client.nome}: ${errorMessage}`);
          console.error(`❌ Error processing appointment ${appointment.id}:`, error);
        }
      }

      console.log('✅ WhatsApp confirmations completed:', results);
      return results;

    } catch (error) {
      console.error('❌ WhatsApp service error:', error);
      return { 
        sent: 0, 
        failed: 0, 
        errors: [error instanceof Error ? error.message : 'Errore di rete'] 
      };
    }
  }

  // Send message via Twilio WhatsApp API
  private async sendTwilioMessage(
    phoneNumber: string, 
    message: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log('📱 Sending Twilio WhatsApp message...');
      console.log('📞 To:', phoneNumber);
      console.log('💬 Message:', message);

      // Twilio configuration
      const accountSid = 'AC7c1b8d8823020e99af99f54728dea952';
      const authToken = '595de72983918890d1e0426d4d33a7eb';
      const fromNumber = 'whatsapp:+14155238886'; // Twilio WhatsApp Sandbox
      
      // Format phone number for WhatsApp
      const formattedPhone = `whatsapp:${phoneNumber.replace(/\D/g, '')}`;
      
      // Create Basic Auth header
      const credentials = btoa(`${accountSid}:${authToken}`);
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'From': fromNumber,
          'To': formattedPhone,
          'Body': message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Twilio API Error:', response.status, data);
        return { 
          success: false, 
          error: data.message || `Twilio API Error: ${response.status}` 
        };
      }

      console.log('✅ Twilio message sent successfully:', data.sid);
      return { 
        success: true, 
        messageId: data.sid 
      };

    } catch (error) {
      console.error('❌ Twilio send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

}

// Hook for using WhatsApp service
export function useWhatsAppService() {
  const { tablePrefix } = useApp();
  return new WhatsAppService(tablePrefix);
}