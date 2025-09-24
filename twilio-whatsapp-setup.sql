-- Configurazione Twilio WhatsApp per il sistema
-- Sostituisci i valori con le tue credenziali Twilio reali

-- IMPORTANTE: Prima di eseguire questo script, ottieni le credenziali da:
-- 1. Dashboard Twilio → Account Info
-- 2. Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- 3. Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- 4. WhatsApp Sandbox Number: +14155238886 (per test)

-- Configurazione per LashesAndra (Twilio Sandbox)
INSERT INTO whatsapp_config (
  api_url,
  api_token,
  phone_number_id,
  business_account_id,
  is_active
) VALUES (
  'https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json',
  'YOUR_AUTH_TOKEN',
  'YOUR_ACCOUNT_SID',
  'YOUR_ACCOUNT_SID',
  true
);

-- Configurazione per Isabelle Nails (Twilio Sandbox)
INSERT INTO isabelle_whatsapp_config (
  api_url,
  api_token,
  phone_number_id,
  business_account_id,
  is_active
) VALUES (
  'https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json',
  'YOUR_AUTH_TOKEN',
  'YOUR_ACCOUNT_SID',
  'YOUR_ACCOUNT_SID',
  true
);

-- Verifica configurazione
SELECT 
  'LashesAndra' as app,
  api_url,
  phone_number_id,
  business_account_id,
  is_active,
  created_at
FROM whatsapp_config
WHERE is_active = true;

SELECT 
  'Isabelle Nails' as app,
  api_url,
  phone_number_id,
  business_account_id,
  is_active,
  created_at
FROM isabelle_whatsapp_config
WHERE is_active = true;
