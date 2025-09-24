# ⚡ Setup Rapido Twilio WhatsApp

## 🚀 Setup in 5 Minuti

### 1. 📱 Crea Account Twilio
1. Vai su [twilio.com](https://www.twilio.com)
2. Clicca **"Sign up"** (gratuito)
3. Verifica email e telefono

### 2. 🔧 Configura WhatsApp Sandbox
1. Dashboard → **"Messaging"** → **"Try it out"** → **"Send a WhatsApp message"**
2. Clicca **"Set up sandbox"**
3. Invia WhatsApp al numero `+14155238886` con il codice mostrato

### 3. 🔑 Ottieni Credenziali
Nel dashboard → **"Account"** → **"Account Info"**:
- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 4. 🗄️ Configura Database
Esegui questo comando sostituendo le credenziali:

```sql
-- Per LashesAndra
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

-- Per Isabelle Nails
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
```

### 5. 🧪 Test
```bash
# Test configurazione
node test-twilio-whatsapp.js

# Test manuale API
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json" \
  -u "YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN" \
  -d "From=whatsapp:+14155238886" \
  -d "To=whatsapp:YOUR_PHONE_NUMBER" \
  -d "Body=Test message from Twilio"
```

## ✅ Verifica Setup

1. **Dashboard Twilio**: Vedi il tuo account attivo
2. **WhatsApp Sandbox**: Ricevi messaggi di test
3. **Database**: Configurazione salvata
4. **Edge Function**: Deploy completato

## 🎯 Pronto per l'Uso!

Ora puoi:
- Testare invii manuali dal pannello admin
- Configurare automazione giornaliera
- Monitorare messaggi e costi

## 💰 Costi
- **Sandbox**: Gratuito per test
- **Messaggi**: $0.005 per messaggio
- **Limite**: 1000 messaggi/mese (sandbox)

---

**Tempo totale setup**: ~5 minuti  
**Costo iniziale**: $0 (sandbox gratuito)
