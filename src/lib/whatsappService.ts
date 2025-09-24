import { supabase } from './supabase';
import type { 
  WhatsAppMessage, 
  MessageTemplate, 
  AppointmentWithClient,
  WhatsAppLogEntry 
} from '../types';
import { useApp } from '../contexts/AppContext';
import dayjs from 'dayjs';

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

  // Send confirmation messages for tomorrow's appointments
  async sendTomorrowConfirmations(): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };
    try {
      console.log('🚀 Starting WhatsApp confirmations...');
      console.log('📋 Table prefix:', this.tablePrefix);

      // 1. Get WhatsApp config
      const { data: config, error: configError } = await supabase
        .from(`${this.tablePrefix}whatsapp_config`)
        .select('*')
        .eq('is_active', true)
        .single();

      if (configError || !config) {
        const errorMessage = configError?.message || 'WhatsApp non configurato o non attivo.';
        results.errors.push(errorMessage);
        console.error('❌ WhatsApp config error:', errorMessage);
        return results;
      }

      // 2. Get tomorrow's appointments
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const { data: appointments, error: appointmentsError } = await supabase
        .from(`${this.tablePrefix}appointments`)
        .select(`
          id,
          data,
          ora,
          tipo_trattamento,
          client:client_id (
            id,
            nome,
            cognome,
            telefono
          )
        `)
        .eq('data', tomorrow)
        .not('client.telefono', 'is', null)
        .not('client.telefono', 'eq', '');

      if (appointmentsError) {
        results.errors.push(`Errore nel recupero appuntamenti: ${appointmentsError.message}`);
        console.error('❌ Appointments error:', appointmentsError);
        return results;
      }

      if (!appointments || appointments.length === 0) {
        results.errors.push('Nessun appuntamento trovato per domani.');
        console.log('📅 No appointments found for tomorrow.');
        return results;
      }

      console.log('📅 Found appointments:', appointments.length);

      // 3. Get default message template
      const { data: template, error: templateError } = await supabase
        .from(`${this.tablePrefix}message_templates`)
        .select('*')
        .eq('is_default', true)
        .single();

      if (templateError || !template) {
        const errorMessage = templateError?.message || 'Template messaggio predefinito non trovato.';
        results.errors.push(errorMessage);
        console.error('❌ Template error:', errorMessage);
        return results;
      }

      console.log('📝 Using template:', template.name);

      // 4. Process each appointment
      for (const appointment of appointments) {
        const client = appointment.client as any;
        if (!client || !client.telefono) {
          results.failed++;
          results.errors.push(`Cliente o numero di telefono mancante per appuntamento ${appointment.id}`);
          continue;
        }

        // Check for duplicate send
        const { data: existingMessage, error: existingMessageError } = await supabase
          .from(`${this.tablePrefix}whatsapp_messages`)
          .select('id, status')
          .eq('appointment_id', appointment.id)
          .eq('client_id', client.id)
          .in('status', ['sent', 'delivered', 'pending'])
          .single();

        if (existingMessageError && existingMessageError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking existing message:', existingMessageError);
          results.failed++;
          results.errors.push(`Errore nel controllo duplicati per ${client.nome}: ${existingMessageError.message}`);
          continue;
        }

        if (existingMessage) {
          console.log(`⏭️ Message already sent for appointment ${appointment.id}`);
          // Only add to errors if it's not already in the list
          if (!results.errors.some(e => e.includes('Tutti i messaggi di conferma sono già stati inviati'))) {
              results.errors.push(`Messaggio già inviato per ${client.nome} (status: ${existingMessage.status})`);
          }
          continue;
        }

        console.log('📱 Processing appointment for', client.nome, client.cognome);

        const messageContent = template.content
          .replace(/{nome}/g, client.nome || '')
          .replace(/{cognome}/g, client.cognome || '')
          .replace(/{ora}/g, appointment.ora || '')
          .replace(/{servizio}/g, appointment.tipo_trattamento || 'trattamento')
          .replace(/{location}/g, 'Via Monsignor Enrico Montalbetti 5, Reggio Calabria') // Hardcoded location
          .replace(/{data}/g, dayjs(appointment.data).format('DD/MM/YYYY'));

        // Save message to DB with 'pending' status
        const { data: savedMessage, error: saveError } = await supabase
          .from(`${this.tablePrefix}whatsapp_messages`)
          .insert({
            client_id: client.id,
            appointment_id: appointment.id,
            phone_number: client.telefono,
            message_content: messageContent,
            status: 'pending'
          })
          .select()
          .single();

        if (saveError || !savedMessage) {
          results.failed++;
          results.errors.push(`Errore nel salvataggio messaggio per ${client.nome}: ${saveError?.message || 'Sconosciuto'}`);
          console.error('❌ Save message error:', saveError);
          continue;
        }

        console.log('💾 Message saved to database:', savedMessage.id);

        // Send message via Twilio
        try {
          const twilioResponse = await this.sendTwilioMessage(
            client.telefono,
            messageContent
          );

          if (twilioResponse.success) {
            results.sent++;
            await supabase
              .from(`${this.tablePrefix}whatsapp_messages`)
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', savedMessage.id);
          } else {
            results.failed++;
            results.errors.push(`Failed to send message to ${client.nome}: ${twilioResponse.error}`);
            await supabase
              .from(`${this.tablePrefix}whatsapp_messages`)
              .update({ status: 'failed', error_message: twilioResponse.error })
              .eq('id', savedMessage.id);
          }
        } catch (sendError) {
          results.failed++;
          const errorMessage = sendError instanceof Error ? sendError.message : 'Errore sconosciuto durante l\'invio Twilio';
          results.errors.push(`Failed to send message to ${client.nome}: ${errorMessage}`);
          await supabase
            .from(`${this.tablePrefix}whatsapp_messages`)
            .update({ status: 'failed', error_message: errorMessage })
            .eq('id', savedMessage.id);
          console.error('❌ Twilio send error:', sendError);
        }
      }
    } catch (error) {
      console.error('❌ WhatsApp service error:', error);
      results.errors.push(error instanceof Error ? error.message : 'Errore di rete');
    }
    
    console.log('✅ WhatsApp confirmations completed:', results);
    
    // Add special message if all messages were already sent
    if (results.sent === 0 && results.failed === 0 && results.errors.some(e => e.includes('Messaggio già inviato'))) {
      results.errors = ['Tutti i messaggi di conferma sono già stati inviati per gli appuntamenti di domani'];
    }
    
    return results;
  }

  // Send message via Twilio WhatsApp API
  private async sendTwilioMessage(
    phoneNumber: string, 
    message: string
  ): Promise<{ success: boolean; error?: string; messageId?: string; twilioError?: any }> {
    try {
      console.log('📱 Sending Twilio WhatsApp message...');
      console.log('📞 To:', phoneNumber);
      console.log('💬 Message:', message);

      // Get Twilio configuration from environment or database
      const config = await this.getTwilioConfig();
      
      // Format phone number for WhatsApp
      const formattedPhone = `whatsapp:${phoneNumber.replace(/\D/g, '')}`;
      
      // Create Basic Auth header
      const credentials = btoa(`${config.accountSid}:${config.authToken}`);
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'From': config.fromNumber,
          'To': formattedPhone,
          'Body': message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Twilio API Error:', response.status, data);
        return { 
          success: false, 
          error: data.message || `Twilio API Error: ${response.status}`,
          twilioError: data
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

  // Get Twilio configuration (environment variables or database)
  private async getTwilioConfig(): Promise<{
    accountSid: string;
    authToken: string;
    fromNumber: string;
    isProduction: boolean;
  }> {
    // Check if we're in production mode
    const isProduction = import.meta.env.PROD || import.meta.env.VITE_WHATSAPP_MODE === 'production';
    
    if (isProduction) {
      // Production mode: use environment variables
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
      
      if (!accountSid || !authToken || !phoneNumber) {
        throw new Error('Missing Twilio configuration in environment variables');
      }
      
      return {
        accountSid,
        authToken,
        fromNumber: phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`,
        isProduction: true
      };
    } else {
      // Development mode: use database configuration
      const { data: config, error } = await supabase
        .from(`${this.tablePrefix}whatsapp_config`)
        .select('*')
        .eq('is_active', true)
        .single();

      if (error || !config) {
        throw new Error('WhatsApp configuration not found in database');
      }

      return {
        accountSid: config.api_token, // In our DB, api_token contains the account SID
        authToken: config.api_url, // In our DB, api_url contains the auth token
        fromNumber: config.phone_number_id, // In our DB, phone_number_id contains the WhatsApp number
        isProduction: false
      };
    }
  }

}

// Hook for using WhatsApp service
export function useWhatsAppService() {
  const { tablePrefix } = useApp();
  return new WhatsAppService(tablePrefix);
}