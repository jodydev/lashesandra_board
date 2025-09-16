# LashesAndra Board 

Un'applicazione web moderna per la gestione di clienti e appuntamenti per estetisti, costruita con React, Material UI e Supabase.

## 🚀 Funzionalità

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
Il progetto è già configurato con un database Supabase esistente. Le tabelle sono state create automaticamente:

```sql
-- Tabella clienti
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

-- Tabella appuntamenti
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  data date NOT NULL,
  importo numeric NOT NULL,
  tipo_trattamento text,
  created_at timestamp DEFAULT now()
);
```

### 3. Avvia l'Applicazione
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📱 Utilizzo

### Navigazione
L'applicazione include una sidebar con le seguenti sezioni:
- **🏠 Home**: Dashboard principale con accesso rapido
- **📋 Lista Clienti**: Gestione completa dei clienti
- **➕ Aggiungi Cliente**: Form per nuovi clienti
- **📅 Calendario Mensile**: Vista calendario appuntamenti
- **📊 Panoramica Mensile**: Statistiche e analisi

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
├── components/          # Componenti riutilizzabili
│   ├── Layout.tsx      # Layout principale con sidebar
│   ├── ClientForm.tsx  # Form per clienti
│   ├── ClientList.tsx  # Lista clienti con DataGrid
│   ├── CalendarView.tsx # Vista calendario
│   ├── MonthlyOverview.tsx # Dashboard statistiche
│   └── AppointmentForm.tsx # Form appuntamenti
├── pages/              # Pagine dell'applicazione
├── lib/                # Servizi e utilities
│   └── supabase.ts     # Client Supabase e API
├── types/              # Definizioni TypeScript
│   └── index.ts        # Interfacce per Client e Appointment
└── App.jsx            # Componente principale
```

### API e Database
- **Supabase Client**: Configurato per operazioni CRUD
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
Le credenziali Supabase sono già configurate nel codice. Per produzione, considera di spostarle in variabili ambiente.

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