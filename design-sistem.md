# Design System - LashesAndra Board

## 🎨 Panoramica

Il design system è basato su Material Design 3, Apple HIG e Fluent Design, con una palette di colori elegante e moderna ispirata al mondo dell'estetica di fascia alta.

## 🎨 Palette Colori

### Colori Primari

**LashesAndra (Pink Theme):**
- Primary: `#E91E63` (Pink 500)
- Primary Light: `#F8BBD9` (Pink 200)
- Primary Dark: `#C2185B` (Pink 700)
- Gradient: `linear-gradient(135deg, #E91E63 0%, #C2185B 100%)`

**Isabelle Nails (Purple Theme):**
- Primary: `#9C27B0` (Purple 500)
- Primary Light: `#CE93D8` (Purple 200)
- Primary Dark: `#7B1FA2` (Purple 700)
- Gradient: `linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)`

### Colori Neutri

- White: `#FFFFFF`
- Gray 50: `#FAFAFA`
- Gray 100: `#F5F5F5`
- Gray 200: `#EEEEEE`
- Gray 300: `#E0E0E0`
- Gray 400: `#BDBDBD`
- Gray 500: `#9E9E9E`
- Gray 600: `#757575`
- Gray 700: `#616161`
- Gray 800: `#424242`
- Gray 900: `#212121`
- Black: `#000000`

### Colori di Stato

- Success: `#4CAF50` (Green 500)
- Warning: `#FF9800` (Orange 500)
- Error: `#F44336` (Red 500)
- Info: `#2196F3` (Blue 500)

## 📐 Tipografia

### Font Family
- Primary: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`
- Fallback: System fonts

### Scale Tipografica

```css
/* Headings */
h1: 2.5rem (40px) - font-weight: 700
h2: 2rem (32px) - font-weight: 600
h3: 1.5rem (24px) - font-weight: 600
h4: 1.25rem (20px) - font-weight: 600
h5: 1.125rem (18px) - font-weight: 600
h6: 1rem (16px) - font-weight: 600

/* Body */
body1: 1rem (16px) - line-height: 1.6
body2: 0.875rem (14px) - line-height: 1.6

/* Caption */
caption: 0.75rem (12px) - line-height: 1.4
```

## 📏 Spacing System

### Base Unit: 4px

```css
/* Spacing Scale */
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
4xl: 64px
5xl: 96px
```

## 🔲 Border Radius

```css
/* Border Radius Scale */
sm: 4px
md: 8px
lg: 12px
xl: 16px
2xl: 20px
3xl: 24px
full: 9999px
```

## 🌟 Shadows

```css
/* Shadow Scale */
sm: 0px 1px 2px rgba(0, 0, 0, 0.05)
md: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)
lg: 0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)
xl: 0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)
2xl: 0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)
```

## 🧩 Componenti

### Button

#### Varianti
- **Primary**: Gradiente con colore primario
- **Secondary**: Bordo con colore primario
- **Ghost**: Solo testo
- **Danger**: Rosso per azioni distruttive

#### Stati
- Default
- Hover: Scale 1.05, shadow aumentata
- Active: Scale 0.95
- Disabled: Opacity 50%

#### Dimensioni
- Small: `px-3 py-1.5 text-sm`
- Medium: `px-4 py-2 text-base`
- Large: `px-6 py-3 text-lg`

### Card

#### Struttura
```jsx
<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

#### Varianti
- **Default**: Bordo sottile, shadow leggera
- **Elevated**: Shadow più pronunciata
- **Outlined**: Solo bordo, no shadow

### Input

#### Stile Base
```jsx
<input className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-200 text-gray-900 dark:text-white" />
```

#### Stati
- Default: Bordo grigio
- Focus: Ring colorato, bordo primario
- Error: Bordo rosso, ring rosso
- Disabled: Opacity 50%

### Badge

#### Varianti
```jsx
// Status Badge
<div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
  <CheckCircle className="w-4 h-4" />
  Inviato
</div>

// Notification Badge
<div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
  3
</div>
```

## 🎭 Animazioni

### Transizioni Base
```css
/* Standard Transition */
transition: all 0.2s ease-in-out

/* Fast Transition */
transition: all 0.15s ease-out

/* Slow Transition */
transition: all 0.3s ease-in-out
```

### Framer Motion Presets

```jsx
// Fade In
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }}

// Slide Up
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: "easeOut" }}

// Scale In
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.3, type: "spring", stiffness: 300 }}

// Stagger Children
transition={{ delay: index * 0.1 }}
```

## 🌙 Dark Mode

### Implementazione
- Supporto nativo con classi `dark:`
- Toggle automatico basato su preferenze sistema
- Persistenza preferenze utente

### Colori Dark Mode
```css
/* Backgrounds */
bg-white → bg-gray-900
bg-gray-50 → bg-gray-800
bg-gray-100 → bg-gray-700

/* Text */
text-gray-900 → text-white
text-gray-700 → text-gray-300
text-gray-500 → text-gray-400

/* Borders */
border-gray-200 → border-gray-700
border-gray-300 → border-gray-600
```

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile First
- Design ottimizzato per mobile
- Progressive enhancement per desktop
- Touch-friendly interactions (min 44px)

## 🎨 Nuovi Componenti WhatsApp

### AdminPanel
- **Layout**: Full-screen con tabs laterali
- **Header**: Titolo + azioni rapide
- **Content**: Scrollable con padding consistente
- **Tabs**: Icone + testo, stato attivo evidenziato

### MessageTemplateEditor
- **Layout**: Centrato, max-width 4xl
- **Editor**: Textarea con syntax highlighting
- **Placeholders**: Grid di bottoni cliccabili
- **Preview**: Modal con anteprima realistica

### MessageLogTable
- **Layout**: Tabella responsive con overflow-x
- **Filters**: Barra filtri sopra tabella
- **Status**: Badge colorati per stati
- **Actions**: Bottoni inline per azioni

### Status Badge
```jsx
// Componente riutilizzabile per stati
const StatusBadge = ({ status, children }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {children}
    </div>
  );
};
```

## 🎯 Best Practices

### Accessibilità
- Contrast ratio minimo 4.5:1
- Focus indicators visibili
- Screen reader friendly
- Keyboard navigation

### Performance
- Lazy loading per componenti pesanti
- Memoization per calcoli costosi
- Ottimizzazione immagini
- Bundle splitting

### Consistenza
- Uso sistematico del design system
- Naming conventions uniformi
- Spacing consistente
- Colori standardizzati

## 🔧 Utilities

### Tailwind Classes Personalizzate
```css
/* Gradients */
.bg-gradient-primary {
  background: linear-gradient(135deg, #E91E63 0%, #C2185B 100%);
}

.bg-gradient-primary-light {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(194, 24, 91, 0.1) 100%);
}

/* Shadows */
.shadow-primary {
  box-shadow: 0px 4px 12px rgba(233, 30, 99, 0.3);
}

/* Focus Rings */
.focus-ring-primary {
  box-shadow: 0 0 0 4px rgba(233, 30, 99, 0.2);
}
```

---

**Versione:** 1.0.0  
**Ultimo aggiornamento:** Gennaio 2024  
**Compatibilità:** Tailwind CSS 3.x, Framer Motion 10.x
