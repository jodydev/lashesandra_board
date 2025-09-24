# LashesAndra Board 

Un'applicazione web moderna per la gestione di clienti e appuntamenti per estetisti, costruita con React, Material UI e Supabase. Supporta due applicazioni separate: LashesAndra e Isabelle Nails, ciascuna con il proprio database dedicato.

## 🚀 Funzionalità

### 🏢 Multi-App Support
- **Due Applicazioni Separate**: LashesAndra e Isabelle Nails
- **Database Dedicati**: Ogni app ha le proprie tabelle su Supabase
- **Interfaccia Unificata**: Stessa UI per entrambe le app
- **Selezione App**: Pagina di selezione per scegliere quale app utilizzare

### 📋 Gestione Clienti
- **Aggiunta/Modifica Clienti**: Form completo con validazione per tutti i campi
- **Lista Clienti**: Tabella interattiva con DataGrid per visualizzare e gestire i clienti
- **Campi Cliente**:
  - Nome e Cognome (obbligatori)
  - Telefono e Email
  - Tipo di trattamento preferito
  - Data ultimo appuntamento
  - Spesa totale (calcolata automaticamente)
  - Tipo cliente (Nuovo/Abituale)

### 📅 Calendario Appuntamenti
- **Vista Mensile**: Calendario interattivo per visualizzare tutti gli appuntamenti
- **Gestione Appuntamenti**: Aggiungi, modifica ed elimina appuntamenti
- **Informazioni Dettagliate**: Visualizza clienti, trattamenti e importi per ogni data

### 💰 Calcolo Automatico Fatturato
- **Trigger Database**: Aggiornamento automatico della spesa totale del cliente
- **Sincronizzazione**: I dati vengono aggiornati in tempo reale quando si aggiungono appuntamenti

### 📊 Analisi e Statistiche
- **Dashboard Mensile**: Panoramica completa delle performance
- **Metriche Chiave**:
  - Numero totale clienti
  - Fatturato totale del mese
  - Media per cliente
  - Top clienti per fatturato
- **Grafici Interattivi**:
  - Andamento mensile (fatturato/clienti)
  - Distribuzione trattamenti (grafico a torta)
  - Tabelle dettagliate

### 📱 WhatsApp Business Integration
- **Invio Automatico**: Messaggi di conferma automatici per appuntamenti
- **Template Personalizzabili**: Messaggi personalizzati con placeholder dinamici
- **Modalità Produzione/Sviluppo**: Supporto per ambiente di test e produzione
- **Logging Completo**: Tracciamento di tutti i messaggi inviati
- **Dashboard Admin**: Gestione centralizzata dei messaggi WhatsApp
- **Integrazione Twilio**: Utilizzo di Twilio per l'invio via WhatsApp Business API

## 🛠️ Stack Tecnologico

### Frontend
- **React 19** con TypeScript
- **Material UI 5** per componenti UI
- **Tailwind CSS** per styling aggiuntivo
- **React Router** per navigazione
- **Recharts** per grafici
- **Day.js** per gestione date

### Backend
- **Supabase** come backend-as-a-service
- **PostgreSQL** database
- **Trigger automatici** per calcoli
- **API REST** integrata

### Build & Development
- **Vite** per build veloce
- **ESLint** per linting
- **TypeScript** per type safety

## 🚀 Installazione e Setup

### Prerequisiti
- Node.js 18+ 
- npm o yarn
- Account Supabase

### 1. Clona e Installa Dipendenze
```bash
git clone <repository-url>
cd jira-saas
npm install
```

### 2. Configurazione Supabase
Il progetto è già configurato con un database Supabase esistente. Le tabelle sono state create automaticamente per entrambe le app:

#### Tabelle LashesAndra (originali):
```sql
-- Tabella clienti LashesAndra
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  cognome text NOT NULL,
  telefono text,
  email text,
  tipo_trattamento text,
  data_ultimo_appuntamento date,
  spesa_totale numeric DEFAULT 0,
  importo numeric DEFAULT 0,
  tipo_cliente text CHECK (tipo_cliente IN ('nuovo', 'abituale')),
  created_at timestamp DEFAULT now()
);

-- Tabella appuntamenti LashesAndra
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  data date NOT NULL,
  importo numeric NOT NULL,
  tipo_trattamento text,
  created_at timestamp DEFAULT now()
);
```

#### Tabelle Isabelle Nails (duplicate):
```sql
-- Tabella clienti Isabelle Nails
CREATE TABLE isabelle_clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  cognome text NOT NULL,
  telefono text,
  email text,
  tipo_trattamento text,
  data_ultimo_appuntamento date,
  spesa_totale numeric DEFAULT 0,
  importo numeric DEFAULT 0,
  tipo_cliente text CHECK (tipo_cliente IN ('nuovo', 'abituale')),
  created_at timestamp DEFAULT now()
);

-- Tabella appuntamenti Isabelle Nails
CREATE TABLE isabelle_appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES isabelle_clients(id) ON DELETE CASCADE,
  data date NOT NULL,
  ora text,
  importo numeric NOT NULL,
  tipo_trattamento text,
  status text CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);
```

### 3. Configurazione WhatsApp Business (Opzionale)
Per abilitare l'invio automatico di messaggi WhatsApp:

1. **Copia il file di esempio**:
   ```bash
   cp env.example .env
   ```

2. **Configura le variabili d'ambiente**:
   ```env
   # Modalità sviluppo (usa database)
   VITE_WHATSAPP_MODE=development
   
   # Modalità produzione (usa variabili ambiente)
   VITE_WHATSAPP_MODE=production
   VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
   VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
   VITE_TWILIO_PHONE_NUMBER=whatsapp:+39XXXXXXXXXX
   ```

3. **Segui la guida completa**: Vedi `WHATSAPP_BUSINESS_SETUP.md` per istruzioni dettagliate

### 4. Avvia l'Applicazione
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📱 Utilizzo

### Selezione App
All'avvio dell'applicazione, verrai presentato con una pagina di selezione dove puoi scegliere tra:
- **LashesAndra**: App originale con database dedicato
- **Isabelle Nails**: App duplicata con database separato

### Navigazione
Una volta selezionata un'app, l'applicazione include una sidebar con le seguenti sezioni:
- **🏠 Home**: Dashboard principale con accesso rapido
- **📋 Lista Clienti**: Gestione completa dei clienti
- **➕ Aggiungi Cliente**: Form per nuovi clienti
- **📅 Calendario Mensile**: Vista calendario appuntamenti
- **📊 Panoramica Mensile**: Statistiche e analisi
- **🔄 Cambia App**: Pulsante per tornare alla selezione delle app

### Aggiungere un Cliente
1. Vai su "Aggiungi Cliente"
2. Compila i campi obbligatori (Nome, Cognome)
3. Aggiungi informazioni opzionali (telefono, email, trattamento, importo)
4. Seleziona il tipo cliente (Nuovo/Abituale)
5. Salva

### Gestire Appuntamenti
1. Vai su "Calendario Mensile"
2. Clicca su una data per visualizzare gli appuntamenti
3. Usa il pulsante "+" per aggiungere un nuovo appuntamento
4. Seleziona cliente, data, importo e tipo trattamento
5. Salva

### Visualizzare Statistiche
1. Vai su "Panoramica Mensile"
2. Naviga tra i mesi usando le frecce
3. Visualizza metriche, grafici e top clienti
4. Cambia tipo di grafico (fatturato/clienti)

### Gestire WhatsApp Business
1. Vai su "WhatsApp Admin" nella sidebar
2. **Panoramica**: Visualizza statistiche dei messaggi inviati
3. **Appuntamenti**: Gestisci appuntamenti e invia conferme manuali
4. **Template**: Personalizza i messaggi di conferma
5. **Log Messaggi**: Visualizza storico completo degli invii
6. **Impostazioni**: Configura credenziali Twilio (sviluppo)

#### Invio Automatico
- I messaggi vengono inviati automaticamente per gli appuntamenti del giorno successivo
- Utilizza il pulsante "Invia Conferme" per invio manuale
- Monitora lo stato dei messaggi nel dashboard

## 🎨 Design e UX

### Material Design 3
- Componenti moderni e accessibili
- Tema coerente con colori primari e secondari
- Responsive design per desktop e tablet

### Caratteristiche UX
- **Navigazione Intuitiva**: Sidebar sempre visibile
- **Feedback Visivo**: Loading states e notifiche
- **Validazione Form**: Errori chiari e immediati
- **Ricerca e Filtri**: DataGrid con funzionalità avanzate
- **Grafici Interattivi**: Tooltip e zoom per analisi dettagliate

## 🔧 Sviluppo

### Struttura Progetto
```
src/
├── apps/               # Applicazioni separate
│   ├── LashesAndraApp.tsx    # App LashesAndra
│   └── IsabelleNailsApp.tsx  # App Isabelle Nails
├── components/         # Componenti riutilizzabili
│   ├── Layout.tsx      # Layout principale con sidebar
│   ├── ClientForm.tsx  # Form per clienti
│   ├── ClientList.tsx  # Lista clienti con DataGrid
│   ├── CalendarView.tsx # Vista calendario
│   ├── MonthlyOverview.tsx # Dashboard statistiche
│   └── AppointmentForm.tsx # Form appuntamenti
├── contexts/           # Context providers
│   └── AppContext.tsx  # Context per gestione app attiva
├── pages/              # Pagine dell'applicazione
│   └── AppSelector.tsx # Pagina di selezione app
├── lib/                # Servizi e utilities
│   ├── supabase.ts     # Client Supabase originale
│   └── supabaseService.ts # Servizio dinamico per tabelle
├── types/              # Definizioni TypeScript
│   └── index.ts        # Interfacce per Client e Appointment
└── App.jsx            # Componente principale
```

### API e Database
- **Supabase Client**: Configurato per operazioni CRUD
- **Database Separati**: Tabelle dedicate per ogni app
- **Context Provider**: Gestione dinamica delle tabelle
- **Trigger Automatici**: Calcolo spesa totale clienti
- **Type Safety**: Interfacce TypeScript per tutti i dati
- **Error Handling**: Gestione errori centralizzata

## 📈 Performance

### Ottimizzazioni
- **Lazy Loading**: Componenti caricati on-demand
- **Memoization**: React.memo per componenti pesanti
- **Efficient Queries**: Query Supabase ottimizzate
- **Bundle Splitting**: Vite per build ottimizzato

### Scalabilità
- **Modular Architecture**: Componenti riutilizzabili
- **Type Safety**: TypeScript per manutenibilità
- **Error Boundaries**: Gestione errori robusta
- **Responsive Design**: Adattabile a tutti i dispositivi

## 🚀 Deploy

### Build per Produzione
```bash
npm run build
```

### Deploy su Vercel/Netlify
1. Connetti il repository
2. Configura build command: `npm run build`
3. Deploy automatico su push

### Variabili Ambiente
Per la produzione, configura le seguenti variabili ambiente:

#### Supabase (già configurate)
- `VITE_SUPABASE_URL`: URL del progetto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chiave anonima Supabase

#### WhatsApp Business (opzionale)
- `VITE_WHATSAPP_MODE`: `production` o `development`
- `VITE_TWILIO_ACCOUNT_SID`: Account SID Twilio
- `VITE_TWILIO_AUTH_TOKEN`: Auth Token Twilio
- `VITE_TWILIO_PHONE_NUMBER`: Numero WhatsApp Business (formato: `whatsapp:+39XXXXXXXXXX`)

#### Esempio per Vercel/Netlify
```env
VITE_WHATSAPP_MODE=production
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=whatsapp:+39XXXXXXXXXX
```

## 🤝 Contributi

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 📞 Supporto

Per domande o supporto, contatta il team di sviluppo o apri una issue su GitHub.

---

**LashesAndra Board ** - Gestisci il tuo business estetico con stile! 💅✨