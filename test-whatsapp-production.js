/**
 * Test script per verificare la configurazione WhatsApp Business in produzione
 * 
 * Questo script testa:
 * 1. Configurazione ambiente (sviluppo vs produzione)
 * 2. Invio messaggio di test via Twilio
 * 3. Verifica delle credenziali
 * 
 * Utilizzo:
 * node test-whatsapp-production.js
 */

// Simula le variabili d'ambiente per il test
const testConfig = {
  // Modalità produzione
  production: {
    VITE_WHATSAPP_MODE: 'production',
    VITE_TWILIO_ACCOUNT_SID: 'AC7c1b8d8823020e99af99f54728dea952',
    VITE_TWILIO_AUTH_TOKEN: '595de72983918890d1e0426d4d33a7eb',
    VITE_TWILIO_PHONE_NUMBER: 'whatsapp:+39XXXXXXXXXX' // Sostituisci con il tuo numero WhatsApp Business
  },
  
  // Modalità sviluppo
  development: {
    VITE_WHATSAPP_MODE: 'development'
  }
};

// Numero di test (sostituisci con il tuo numero)
const TEST_PHONE_NUMBER = '+393336170035';

// Messaggio di test
const TEST_MESSAGE = '🧪 Test messaggio WhatsApp Business - LashesAndra Board\n\nQuesto è un messaggio di test per verificare la configurazione in produzione.\n\nSe ricevi questo messaggio, la configurazione è corretta! ✅';

/**
 * Testa la configurazione ambiente
 */
function testEnvironmentConfig() {
  console.log('🔍 Test configurazione ambiente...\n');
  
  // Test modalità produzione
  console.log('📱 Modalità Produzione:');
  const prodConfig = testConfig.production;
  console.log(`  - Mode: ${prodConfig.VITE_WHATSAPP_MODE}`);
  console.log(`  - Account SID: ${prodConfig.VITE_TWILIO_ACCOUNT_SID}`);
  console.log(`  - Auth Token: ${prodConfig.VITE_TWILIO_AUTH_TOKEN ? '✅ Presente' : '❌ Mancante'}`);
  console.log(`  - Phone Number: ${prodConfig.VITE_TWILIO_PHONE_NUMBER}`);
  
  // Verifica credenziali
  const hasValidCredentials = prodConfig.VITE_TWILIO_ACCOUNT_SID && 
                             prodConfig.VITE_TWILIO_AUTH_TOKEN && 
                             prodConfig.VITE_TWILIO_PHONE_NUMBER;
  
  console.log(`  - Credenziali: ${hasValidCredentials ? '✅ Valide' : '❌ Incomplete'}\n`);
  
  // Test modalità sviluppo
  console.log('🛠️ Modalità Sviluppo:');
  const devConfig = testConfig.development;
  console.log(`  - Mode: ${devConfig.VITE_WHATSAPP_MODE}`);
  console.log(`  - Database Config: ✅ Utilizza configurazione database\n`);
  
  return hasValidCredentials;
}

/**
 * Testa l'invio di un messaggio WhatsApp
 */
async function testWhatsAppMessage() {
  console.log('📤 Test invio messaggio WhatsApp...\n');
  
  const config = testConfig.production;
  
  if (!config.VITE_TWILIO_ACCOUNT_SID || !config.VITE_TWILIO_AUTH_TOKEN) {
    console.log('❌ Credenziali Twilio mancanti per il test');
    return false;
  }
  
  try {
    // Formatta il numero di telefono
    const formattedPhone = `whatsapp:${TEST_PHONE_NUMBER.replace(/\D/g, '')}`;
    const fromNumber = config.VITE_TWILIO_PHONE_NUMBER;
    
    console.log(`📞 Da: ${fromNumber}`);
    console.log(`📞 A: ${formattedPhone}`);
    console.log(`💬 Messaggio: ${TEST_MESSAGE.substring(0, 50)}...\n`);
    
    // Crea Basic Auth header
    const credentials = Buffer.from(`${config.VITE_TWILIO_ACCOUNT_SID}:${config.VITE_TWILIO_AUTH_TOKEN}`).toString('base64');
    
    // Invia richiesta a Twilio
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.VITE_TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'From': fromNumber,
        'To': formattedPhone,
        'Body': TEST_MESSAGE
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Errore nell\'invio del messaggio:');
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Error: ${data.message || 'Errore sconosciuto'}`);
      console.log(`  - Code: ${data.code || 'N/A'}`);
      return false;
    }
    
    console.log('✅ Messaggio inviato con successo!');
    console.log(`  - Message SID: ${data.sid}`);
    console.log(`  - Status: ${data.status}`);
    console.log(`  - Date Created: ${data.date_created}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Errore durante il test:');
    console.log(`  - ${error.message}`);
    return false;
  }
}

/**
 * Testa la configurazione del database
 */
function testDatabaseConfig() {
  console.log('🗄️ Test configurazione database...\n');
  
  console.log('📋 Tabelle richieste:');
  console.log('  - whatsapp_config (configurazione Twilio)');
  console.log('  - message_templates (template messaggi)');
  console.log('  - whatsapp_messages (log messaggi)');
  console.log('  - appointments (appuntamenti)');
  console.log('  - clients (clienti)\n');
  
  console.log('💡 Per testare la configurazione database:');
  console.log('  1. Imposta VITE_WHATSAPP_MODE=development');
  console.log('  2. Configura la tabella whatsapp_config con le credenziali Twilio');
  console.log('  3. Testa l\'invio tramite l\'interfaccia web\n');
}

/**
 * Mostra le istruzioni per la configurazione
 */
function showSetupInstructions() {
  console.log('📚 Istruzioni per la configurazione:\n');
  
  console.log('1️⃣ Configurazione Meta Business Manager:');
  console.log('   - Crea un Business Manager su Meta');
  console.log('   - Verifica il numero WhatsApp Business');
  console.log('   - Collega con Twilio\n');
  
  console.log('2️⃣ Configurazione Twilio:');
  console.log('   - Ottieni Account SID e Auth Token');
  console.log('   - Collega il numero WhatsApp Business');
  console.log('   - Configura il Messaging Service\n');
  
  console.log('3️⃣ Configurazione Ambiente:');
  console.log('   - Copia env.example in .env');
  console.log('   - Imposta le variabili d\'ambiente');
  console.log('   - Testa la configurazione\n');
  
  console.log('📖 Per istruzioni dettagliate, vedi: WHATSAPP_BUSINESS_SETUP.md\n');
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🚀 Test Configurazione WhatsApp Business - LashesAndra Board\n');
  console.log('=' .repeat(60) + '\n');
  
  // Test configurazione ambiente
  const hasValidConfig = testEnvironmentConfig();
  
  // Test configurazione database
  testDatabaseConfig();
  
  // Test invio messaggio (solo se le credenziali sono valide)
  if (hasValidConfig) {
    console.log('⚠️  ATTENZIONE: Questo test invierà un messaggio reale!');
    console.log(`📱 Numero destinatario: ${TEST_PHONE_NUMBER}`);
    console.log('🔄 Per procedere, decommenta la riga seguente nel codice\n');
    
    // Decommenta la riga seguente per eseguire il test reale
    // const messageSent = await testWhatsAppMessage();
  } else {
    console.log('❌ Configurazione incompleta. Impossibile testare l\'invio messaggi.\n');
  }
  
  // Mostra istruzioni
  showSetupInstructions();
  
  console.log('✅ Test completato!');
  console.log('📖 Per maggiori informazioni, consulta la documentazione.');
}

// Esegui il test
main().catch(console.error);
