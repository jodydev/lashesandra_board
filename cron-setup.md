# Setup Cron Job per WhatsApp Automazione

## 🕐 Configurazione Cron Job

### Opzione 1: Cron Job Locale (Sviluppo)

```bash
# Aggiungi al crontab
crontab -e

# Esegui ogni giorno alle 18:00
0 18 * * * curl -X POST "https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix="

# Per Isabelle Nails (con prefisso)
0 18 * * * curl -X POST "https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix=isabelle_"
```

### Opzione 2: GitHub Actions (Produzione)

Crea il file `.github/workflows/whatsapp-daily.yml`:

```yaml
name: WhatsApp Daily Confirmations

on:
  schedule:
    # Esegui ogni giorno alle 18:00 UTC
    - cron: '0 18 * * *'
  workflow_dispatch: # Permette esecuzione manuale

jobs:
  send-confirmations:
    runs-on: ubuntu-latest
    
    steps:
      - name: Send LashesAndra Confirmations
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            "https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix="
      
      - name: Send Isabelle Nails Confirmations
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            "https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix=isabelle_"
```

### Opzione 3: Vercel Cron Jobs

Crea il file `api/cron/whatsapp-daily.js`:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // LashesAndra
    await fetch('https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix=', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });

    // Isabelle Nails
    await fetch('https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix=isabelle_', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

E configura in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/whatsapp-daily",
      "schedule": "0 18 * * *"
    }
  ]
}
```

## 🔧 Configurazione Variabili Ambiente

### Supabase
```bash
SUPABASE_URL=https://ufondjehytekkbrgrjgd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### WhatsApp Business API
```bash
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

## 📊 Monitoraggio

### Log Cron Job
```bash
# Visualizza log cron
tail -f /var/log/cron

# Test manuale
curl -X POST "https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix="
```

### Supabase Dashboard
- Monitora Edge Function logs
- Controlla database per nuovi record
- Verifica errori e performance

## 🚨 Troubleshooting

### Problemi Comuni

1. **Cron non esegue**
   - Verifica sintassi cron
   - Controlla permessi file
   - Testa comando manualmente

2. **Edge Function fallisce**
   - Controlla logs Supabase
   - Verifica configurazione database
   - Testa connessione API

3. **Messaggi non inviati**
   - Verifica credenziali WhatsApp
   - Controlla rate limits
   - Validare numeri telefono

### Comandi di Test

```bash
# Test connessione Supabase
curl -H "apikey: YOUR_ANON_KEY" "https://ufondjehytekkbrgrjgd.supabase.co/rest/v1/whatsapp_config"

# Test Edge Function
curl -X POST "https://ufondjehytekkbrgrjgd.supabase.co/functions/v1/whatsapp-daily-confirmations?table_prefix="

# Test WhatsApp API
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "393401234567", "type": "text", "text": {"body": "Test message"}}'
```

## 📅 Orari Consigliati

### Fusi Orari
- **Italia**: 18:00 (6 PM)
- **UTC**: 17:00 (5 PM)
- **Estate**: 16:00 UTC (6 PM CEST)

### Considerazioni
- Evitare ore notturne (22:00 - 8:00)
- Preferire fine giornata lavorativa
- Considerare fuso orario clienti

---

**Nota**: Sostituisci `ufondjehytekkbrgrjgd` con il tuo project ID Supabase e configura le variabili ambiente appropriate.
