#!/usr/bin/env node

/**
 * Test script per inviare un messaggio WhatsApp di conferma
 * Numero di test: +393336170035
 */

import https from 'https';

// Configurazione Twilio
const accountSid = 'AC7c1b8d8823020e99af99f54728dea952';
const authToken = 'a72ed944839f3378682ae209c68236a2';
const fromNumber = 'whatsapp:+14155238886'; // Twilio WhatsApp Sandbox
const toNumber = 'whatsapp:+393336170035'; // Numero di test

// Messaggio di test personalizzato
const testMessage = `Ciao Jody, ti ricordiamo il tuo appuntamento domani alle 16:00 per il trattamento Extension Volume Russo presso il nostro centro estetico in Via Monsignor Enrico Montalbetti 5, Reggio Calabria. Ti aspettiamo 💖

Questo è un messaggio di test per verificare la corretta ricezione.`;

console.log('🚀 Inviando messaggio WhatsApp di test...');
console.log(`📱 Da: ${fromNumber}`);
console.log(`📱 A: ${toNumber}`);
console.log(`💬 Messaggio: ${testMessage}`);
console.log('');

// Funzione per inviare il messaggio
function sendWhatsAppMessage() {
  const postData = new URLSearchParams({
    'From': fromNumber,
    'To': toNumber,
    'Body': testMessage
  });

  const postDataString = postData.toString();

  const options = {
    hostname: 'api.twilio.com',
    port: 443,
    path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postDataString)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 201) {
          console.log('✅ Messaggio inviato con successo!');
          console.log(`📋 Message SID: ${response.sid}`);
          console.log(`📊 Status: ${response.status}`);
          console.log(`📱 To: ${response.to}`);
          console.log(`📱 From: ${response.from}`);
          console.log(`💬 Body: ${response.body}`);
          console.log('');
          console.log('🎯 Controlla il tuo WhatsApp per il messaggio di conferma!');
        } else {
          console.log('❌ Errore nell\'invio del messaggio:');
          console.log(`📊 Status Code: ${res.statusCode}`);
          console.log(`📋 Response: ${JSON.stringify(response, null, 2)}`);
        }
      } catch (error) {
        console.log('❌ Errore nel parsing della risposta:');
        console.log(`📋 Raw Response: ${data}`);
        console.log(`🔍 Error: ${error.message}`);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Errore di rete:');
    console.log(`🔍 Error: ${error.message}`);
  });

  req.write(postDataString);
  req.end();
}

// Esegui il test
sendWhatsAppMessage();
