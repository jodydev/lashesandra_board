# Integrazione Capacitor – LashesAndra Board

Questo progetto è configurato per essere buildato come app nativa **iOS** e **Android** tramite **Capacitor**, senza abbandonare React, Vite, Tailwind o Supabase.

---

## Riepilogo modifiche

### File modificati

| File | Modifica |
|------|----------|
| `package.json` | Aggiunti script `build:mobile`, `sync`, `open:ios`, `open:android`; dipendenze Capacitor e TypeScript (dev). |
| `vite.config.js` | `base: './'` quando `mode === 'mobile'` (necessario per caricamento asset in ambiente nativo). |
| `index.html` | `viewport-fit=cover` per safe area iOS. |
| `src/index.css` | Padding su `#root` con `env(safe-area-inset-*)` per notch e home indicator. |
| `src/main.jsx` | Chiamata a `initCapacitorPlugins()` dopo il render. |

### Nuovi file

| File | Descrizione |
|------|-------------|
| `capacitor.config.ts` | Configurazione Capacitor (webDir, appId, plugin SplashScreen/StatusBar). |
| `src/capacitor-init.js` | Inizializzazione StatusBar e SplashScreen solo in contesto nativo. |
| `.env.example` | Esempio variabili d’ambiente (stesse per web e mobile). |
| `ios/` | Progetto Xcode (generato da `npx cap add ios`). |
| `android/` | Progetto Android Studio (generato da `npx cap add android`). |

---

## Script npm

| Script | Uso |
|--------|-----|
| `npm run build` | Build **web** (base `/`), per deploy classico. |
| `npm run build:mobile` | Build per **mobile** (base `./`), output in `dist/`. |
| `npm run sync` | Esegue `build:mobile` e poi `npx cap sync` (copia `dist/` in ios e android). |
| `npm run open:ios` | Apre il progetto in Xcode. |
| `npm run open:android` | Apre il progetto in Android Studio. |
| `npm run icon:ios` | Rigenera l’icona iOS da `public/logo.png` (1024×1024) in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`. |
| `npm run splash` | Rigenera le splash screen iOS e Android da `public/logo.png` (richiede macOS per `sips`). |
| `npm run sync:live` | Come `npx cap sync` (senza build). Usa dopo aver impostato `CAPACITOR_SERVER_URL` per live reload. |

---

## Hot reload su iPhone fisico (live reload)

Per avere **modifiche al codice che si aggiornano subito sull’iPhone** senza rifare build:

1. **Terminale 1** – avvia il dev server Vite:
   ```bash
   npm run dev
   ```
   Tienilo aperto.

2. **Terminale 2** – sincronizza l’app con l’IP del Mac (lo script lo rileva da solo):
   ```bash
   npm run live:sync
   ```
   Lo esegui **una volta** (o quando cambi rete Wi‑Fi).

3. **Apri il progetto iOS** e avvia l’app sull’iPhone fisico:
   ```bash
   npm run open:ios
   ```
   In Xcode seleziona il tuo iPhone come target e premi Run.

4. **iPhone e Mac sulla stessa Wi‑Fi.** L’app caricherà l’interfaccia da Vite: ogni salvataggio del codice si riflette sull’iPhone in automatico (HMR).

**Se l’iPhone non si connette:** controlla che il firewall del Mac consenta connessioni in ingresso sulla porta 5173, o che non blocchi Node/Vite.

**Per tornare alla build in bundle** (senza hot reload): esegui `npm run sync` (senza `CAPACITOR_SERVER_URL`) e riavvia l’app da Xcode.

---

### 2. Remote debugging (DevTools)

Per console, network, breakpoint e ispezione DOM sul WebView:

- **iOS (simulatore o device)**  
  Safari → **Sviluppa** → **[nome device]** → **localhost** o **LashesAndra Board** (o l’IP se in live reload).  
  Se “Sviluppa” non c’è: Safari → Preferenze → Avanzate → “Mostra menu Sviluppa”.

- **Android (emulatore o device)**  
  Chrome su PC → `chrome://inspect` → sotto “Remote Target” seleziona il WebView dell’app → **inspect**.

---

## Workflow consigliato

1. **Prima build mobile**
   ```bash
   npm run sync
   ```
2. **Aprire il progetto nativo**
   - iOS: `npm run open:ios`
   - Android: `npm run open:android`
3. **Dopo modifiche al codice web**
   ```bash
   npm run sync
   ```
   Poi rilanciare l’app da Xcode/Android Studio (o usare live reload se configurato).

---

## Variabili d’ambiente (mobile)

Le stesse variabili usate dal build web vengono usate dal build mobile; sono incluse nel bundle al build time.

- Crea `.env` (o `.env.mobile` se vuoi valori diversi solo per mobile) con le stesse chiavi usate in produzione (vedi `.env.example`).
- Per il build mobile viene usato `vite build --mode mobile`: Vite carica `.env`, `.env.production` e `.env.mobile` (se esiste). Puoi quindi avere un `.env.mobile` con valori specifici per l’app nativa.

---

## Routing (React Router)

- È usato **BrowserRouter** con **history mode**.
- Con `base: './'` nel build mobile, il routing funziona correttamente nel WebView Capacitor.
- **Deep link**: per gestire link esterni (es. `myapp://path`) si può aggiungere il plugin `@capacitor/app` e ascoltare `appUrlOpen`; in quel caso si può fare un `navigate()` alla route desiderata. Non è incluso di default per non toccare l’architettura attuale.

---

## Plugin Capacitor usati

- **StatusBar**: stile e colore barra di stato (es. bianco con testo scuro).
- **SplashScreen**: nascosta al primo render tramite `src/capacitor-init.js`.
- **Face ID (login)**: plugin Face ID / Touch ID per accesso senza password. Vedi sotto.

Inizializzazione solo se `Capacitor.isNativePlatform()` è vero, quindi nessun effetto su web.

### Face ID (login)

Il login usa **Face ID / Touch ID** su iOS tramite il plugin **@capgo/capacitor-native-biometric** (compatibile con Capacitor 8 e SPM).

- **Pacchetto**: `@capgo/capacitor-native-biometric` – incluso automaticamente con `npx cap sync ios`.
- **API usate**: `NativeBiometric.isAvailable()` e `NativeBiometric.verifyIdentity()`; wrapper in `src/lib/faceIdPlugin.ts` (`isFaceIdAvailable`, `performFaceIdAuth`).
- **Info.plist**: in `ios/App/App/Info.plist` è presente la chiave `NSFaceIDUsageDescription` (testo mostrato quando si usa Face ID).

---

## Safe area (iOS)

- In `index.html`: `viewport-fit=cover`.
- In `src/index.css`: su `#root` sono impostati `padding-top/left/right/bottom` con `env(safe-area-inset-*)`. Su web questi valori sono 0; su iOS rispettano notch e home indicator.

---

## Distinguere build web e mobile

- **Web**: `npm run build` → `base: '/'` → deploy di `dist/` su qualsiasi host.
- **Mobile**: `npm run build:mobile` → `base: './'` → stesso codice, stesso `dist/`, poi `npx cap sync` copia in `ios/` e `android/`.

Nel codice puoi rilevare l’ambiente nativo con:

```js
import { isCapacitorNative } from './capacitor-init';
if (isCapacitorNative()) {
  // comportamento solo app nativa
}
```

---

## Requisiti di sistema

- **iOS**: macOS, Xcode (e strumenti da riga di comando), CocoaPods.
- **Android**: Android Studio, SDK Android, variabile d’ambiente `ANDROID_HOME` (o `ANDROID_SDK_ROOT`).

---

## Checklist test su device fisico

- [ ] `.env` (o `.env.mobile`) compilato con `VITE_SUPABASE_*` (e eventualmente Twilio se usi WhatsApp).
- [ ] `npm run sync` eseguito senza errori.
- [ ] **iOS**: dispositivo o simulatore selezionato in Xcode; app installata e avviata; login e navigazione funzionanti; safe area corretta (notch / home indicator).
- [ ] **Android**: dispositivo o emulatore; app installata e avviata; login e navigazione funzionanti.
- [ ] Supabase: stessi dati e stessi comportamenti che in web (stesso progetto Supabase).
- [ ] Build web: `npm run build` e `npm run preview` ancora funzionanti e senza regressioni.

---

## Breaking changes

- **Nessuno** per l’uso solo web: `npm run build` e `npm run dev` restano invariati.
- Se in futuro deployi il **build web** da una **subdirectory** (es. `https://site.com/app/`), dovrai impostare in Vite `base: '/app/'` per quel deploy; il build mobile continua a usare `base: './'` con `--mode mobile`.

---

## Riferimenti

- [Capacitor – Getting started](https://capacitorjs.com/docs/getting-started)
- [Capacitor – Configuration](https://capacitorjs.com/docs/config)
- [Capacitor – Workflow](https://capacitorjs.com/docs/basics/workflow)
