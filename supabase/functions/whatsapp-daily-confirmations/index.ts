import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// WhatsApp Business API configuration
interface WhatsAppConfig {
  api_url: string;
  api_token: string;
  phone_number_id: string;
  business_account_id: string;
  is_active: boolean;
}

interface AppointmentWithClient {
  id: string;
  client_id: string;
  data: string;
  ora?: string;
  tipo_trattamento?: string;
  status: string;
  client: {
    id: string;
    nome: string;
    cognome: string;
    telefono?: string;
  };
}

interface MessageTemplate {
  name: string;
  content: string;
  is_default: boolean;
}

interface WhatsAppMessage {
  client_id: string;
  appointment_id: string;
  phone_number: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  error_message?: string;
}

Deno.serve(async (req: Request) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get table prefix from request or default
    const url = new URL(req.url);
    const tablePrefix = url.searchParams.get('table_prefix') || '';

    console.log('🚀 Starting WhatsApp daily confirmations...');

    // Get WhatsApp configuration
    const { data: config, error: configError } = await supabase
      .from(`${tablePrefix}whatsapp_config`)
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error('WhatsApp configuration not found or inactive');
    }

    const whatsappConfig: WhatsAppConfig = config;

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`📅 Processing appointments for: ${tomorrowStr}`);

    // Get tomorrow's appointments with client data
    const { data: appointments, error: appointmentsError } = await supabase
      .from(`${tablePrefix}appointments`)
      .select(`
        *,
        client:${tablePrefix}clients(*)
      `)
      .eq('data', tomorrowStr)
      .eq('status', 'pending')
      .not('client.telefono', 'is', null);

    if (appointmentsError) {
      throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No appointments found for tomorrow',
        sent: 0,
        failed: 0,
        errors: []
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`📱 Found ${appointments.length} appointments to process`);

    // Get message template
    const { data: template, error: templateError } = await supabase
      .from(`${tablePrefix}message_templates`)
      .select('*')
      .eq('is_default', true)
      .single();

    if (templateError && templateError.code !== 'PGRST116') {
      throw new Error(`Error fetching template: ${templateError.message}`);
    }

    const messageTemplate: MessageTemplate = template || {
      name: 'default',
      content: 'Ciao {nome}, ti ricordiamo il tuo appuntamento domani alle {ora} per il trattamento {servizio} presso il nostro centro estetico in {location}. Ti aspettiamo 💖',
      is_default: true
    };

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each appointment
    for (const appointment of appointments as AppointmentWithClient[]) {
      try {
        // Check if message already sent for this appointment
        const { data: existingMessage } = await supabase
          .from(`${tablePrefix}whatsapp_messages`)
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('status', 'sent')
          .single();

        if (existingMessage) {
          console.log(`⏭️ Message already sent for appointment ${appointment.id}`);
          continue;
        }

        // Generate personalized message
        const messageContent = generateMessage(messageTemplate.content, appointment);

        // Save message to database with pending status
        const messageData: WhatsAppMessage = {
          client_id: appointment.client_id,
          appointment_id: appointment.id,
          phone_number: appointment.client.telefono!,
          message_content: messageContent,
          status: 'pending'
        };

        const { data: savedMessage, error: saveError } = await supabase
          .from(`${tablePrefix}whatsapp_messages`)
          .insert([messageData])
          .select()
          .single();

        if (saveError) {
          throw new Error(`Error saving message: ${saveError.message}`);
        }

        // Send message via WhatsApp API
        const sendResult = await sendWhatsAppMessage(
          whatsappConfig,
          appointment.client.telefono!,
          messageContent
        );

        if (sendResult.success) {
          // Update message status to sent
          await supabase
            .from(`${tablePrefix}whatsapp_messages`)
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', savedMessage.id);

          results.sent++;
          console.log(`✅ Message sent successfully to ${appointment.client.nome}`);
        } else {
          // Update message status to failed
          await supabase
            .from(`${tablePrefix}whatsapp_messages`)
            .update({
              status: 'failed',
              error_message: sendResult.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', savedMessage.id);

          results.failed++;
          results.errors.push(`${appointment.client.nome}: ${sendResult.error}`);
          console.log(`❌ Failed to send message to ${appointment.client.nome}: ${sendResult.error}`);
        }

        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${appointment.client.nome}: ${errorMessage}`);
        console.error(`❌ Error processing appointment ${appointment.id}:`, error);
      }
    }

    console.log('✅ WhatsApp daily confirmations completed:', results);

    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp confirmations processed',
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in WhatsApp daily confirmations:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function generateMessage(template: string, appointment: AppointmentWithClient): string {
  const client = appointment.client;
  const appointmentDate = new Date(appointment.data);
  const timeStr = appointment.ora || 'orario da confermare';
  const location = 'Via Monsignor Enrico Montalbetti 5, Reggio Calabria'; // TODO: Make this configurable
  
  return template
    .replace(/{nome}/g, client.nome)
    .replace(/{cognome}/g, client.cognome)
    .replace(/{ora}/g, timeStr)
    .replace(/{servizio}/g, appointment.tipo_trattamento || 'trattamento')
    .replace(/{location}/g, location)
    .replace(/{data}/g, appointmentDate.toLocaleDateString('it-IT'));
}

async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${config.api_url}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_token}`,
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
        error: data.error?.message || `API Error: ${response.status}` 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
