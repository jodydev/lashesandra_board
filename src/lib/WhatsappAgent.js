/**
 * WhatsApp Agent - Automazione invio messaggi di conferma
 * Gestisce l'invio automatico di messaggi WhatsApp per appuntamenti del giorno successivo
 */

import { WhatsAppService } from './whatsappService';

class WhatsappAgent {
  constructor(tablePrefix = '') {
    this.whatsappService = new WhatsAppService(tablePrefix);
    this.isRunning = false;
    this.lastRun = null;
  }

  /**
   * Avvia il processo di invio messaggi per gli appuntamenti di domani
   * @returns {Promise<Object>} Risultati dell'operazione
   */
  async runDailyConfirmation() {
    if (this.isRunning) {
      console.log('WhatsApp Agent già in esecuzione, skip...');
      return { error: 'Agent già in esecuzione' };
    }

    this.isRunning = true;
    console.log('🚀 Avvio WhatsApp Agent per conferme giornaliere...');

    try {
      // Verifica configurazione WhatsApp
      await this.whatsappService.initializeConfig();
      
      // Invia messaggi di conferma
      const results = await this.whatsappService.sendTomorrowConfirmations();
      
      this.lastRun = new Date();
      
      console.log('✅ WhatsApp Agent completato:', {
        messaggiInviati: results.sent,
        messaggiFalliti: results.failed,
        errori: results.errors
      });

      return {
        success: true,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors,
        timestamp: this.lastRun.toISOString()
      };

    } catch (error) {
      console.error('❌ Errore WhatsApp Agent:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Invia un messaggio di conferma manuale per un appuntamento specifico
   * @param {string} appointmentId - ID dell'appuntamento
   * @returns {Promise<Object>} Risultato dell'invio
   */
  async sendSingleConfirmation(appointmentId) {
    try {
      console.log(`📱 Invio conferma manuale per appuntamento: ${appointmentId}`);
      
      // Recupera appuntamento con dettagli cliente
      const { data: appointment, error } = await supabase
        .from(`${this.tablePrefix}appointments`)
        .select(`
          *,
          client:${this.tablePrefix}clients(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        throw new Error('Appuntamento non trovato');
      }

      if (!appointment.client.telefono) {
        throw new Error('Numero di telefono cliente non disponibile');
      }

      // Verifica se messaggio già inviato
      const { data: existingMessage } = await supabase
        .from(`${this.tablePrefix}whatsapp_messages`)
        .select('id, status')
        .eq('appointment_id', appointmentId)
        .eq('status', 'sent')
        .single();

      if (existingMessage) {
        return {
          success: false,
          error: 'Messaggio già inviato per questo appuntamento'
        };
      }

      // Genera messaggio personalizzato
      const template = await this.whatsappService.getMessageTemplate();
      const messageContent = this.whatsappService.generateMessage(
        template.content, 
        appointment
      );

      // Salva messaggio nel database
      const messageData = await this.whatsappService.saveMessage({
        client_id: appointment.client_id,
        appointment_id: appointment.id,
        phone_number: appointment.client.telefono,
        message_content: messageContent,
        status: 'pending'
      });

      // Invia messaggio
      const sendResult = await this.whatsappService.sendMessage(
        appointment.client.telefono,
        messageContent
      );

      if (sendResult.success) {
        await this.whatsappService.updateMessageStatus(messageData.id, 'sent');
        return {
          success: true,
          messageId: sendResult.messageId,
          message: 'Messaggio inviato con successo'
        };
      } else {
        await this.whatsappService.updateMessageStatus(messageData.id, 'failed', sendResult.error);
        return {
          success: false,
          error: sendResult.error
        };
      }

    } catch (error) {
      console.error('❌ Errore invio singolo messaggio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reinvia un messaggio fallito
   * @param {string} messageId - ID del messaggio da reinviare
   * @returns {Promise<Object>} Risultato del reinvio
   */
  async resendMessage(messageId) {
    try {
      console.log(`🔄 Reinvio messaggio: ${messageId}`);
      
      // Recupera messaggio
      const { data: message, error } = await supabase
        .from(`${this.tablePrefix}whatsapp_messages`)
        .select('*')
        .eq('id', messageId)
        .single();

      if (error || !message) {
        throw new Error('Messaggio non trovato');
      }

      // Invia messaggio
      const sendResult = await this.whatsappService.sendMessage(
        message.phone_number,
        message.message_content
      );

      if (sendResult.success) {
        await this.whatsappService.updateMessageStatus(messageId, 'sent');
        return {
          success: true,
          messageId: sendResult.messageId,
          message: 'Messaggio reinviato con successo'
        };
      } else {
        await this.whatsappService.updateMessageStatus(messageId, 'failed', sendResult.error);
        return {
          success: false,
          error: sendResult.error
        };
      }

    } catch (error) {
      console.error('❌ Errore reinvio messaggio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ottiene statistiche dell'agent
   * @returns {Object} Statistiche
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      status: this.isRunning ? 'running' : 'idle'
    };
  }

  /**
   * Verifica lo stato della configurazione WhatsApp
   * @returns {Promise<Object>} Stato della configurazione
   */
  async checkConfiguration() {
    try {
      await this.whatsappService.initializeConfig();
      return {
        configured: !!this.whatsappService.config,
        hasApiUrl: !!this.whatsappService.config?.api_url,
        hasToken: !!this.whatsappService.config?.api_token,
        isActive: this.whatsappService.config?.is_active
      };
    } catch (error) {
      return {
        configured: false,
        error: error.message
      };
    }
  }
}

export default WhatsappAgent;
