# Calendar Zoom Functionality

## Overview
The Calendar component has been enhanced with iOS Apple Calendar-style zoom functionality, allowing users to seamlessly transition between different calendar views using intuitive gestures.

## Features

### 🔍 Zoom Views
- **Month View**: Traditional full calendar month display
- **Week View**: Detailed week view with all appointments
- **Day View**: Single day with hourly appointment layout

### 📱 Gesture Support
- **Mobile**: Pinch-to-zoom gestures (pinch in/out)
- **Desktop**: Ctrl + scroll wheel for zoom transitions
- **Smooth Transitions**: Animated view changes with spring physics

### 🎨 Visual Enhancements
- **View Indicator**: Animated chip showing current view (Month/Week/Day)
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Optimized for all screen sizes
- **Gesture Feedback**: Visual scaling during gesture detection

## Technical Implementation

### Component Structure
```
src/components/
├── CalendarView.tsx (main export)
├── CalendarViewWithZoom.tsx (enhanced calendar)
├── views/
│   ├── MonthView.tsx
│   ├── WeekView.tsx
│   └── DayView.tsx
└── hooks/
    └── useGestureDetection.ts
```

### Key Features

#### Gesture Detection Hook (`useGestureDetection.ts`)
- Handles touch events for mobile pinch gestures
- Manages wheel events for desktop zoom
- Provides smooth view transitions
- Accumulates scroll delta for precise control

#### View Components
- **MonthView**: Traditional calendar grid with appointment previews
- **WeekView**: 7-day layout with detailed appointment cards
- **DayView**: Hourly timeline with full appointment details

#### State Management
- `currentView`: Controls which view is displayed
- `currentDate`: Tracks the selected date across all views
- Gesture state for smooth transitions

## Usage

### Basic Implementation
```tsx
import CalendarView from './components/CalendarView';

function App() {
  return <CalendarView />;
}
```

### Gesture Controls
- **Zoom In**: Pinch out (mobile) or Ctrl + scroll up (desktop)
- **Zoom Out**: Pinch in (mobile) or Ctrl + scroll down (desktop)
- **View Order**: Month → Week → Day (zoom in) / Day → Week → Month (zoom out)

### Customization
The component uses the existing `useAppColors` hook for theming and maintains consistency with the app's design system.

## Browser Support
- **Mobile**: iOS Safari, Chrome Mobile, Firefox Mobile
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Touch Events**: Full support for multi-touch gestures
- **Wheel Events**: Enhanced with Ctrl key detection

## Performance
- Optimized gesture detection with throttling
- Smooth 60fps animations using Framer Motion
- Efficient re-renders with proper state management
- Responsive design with mobile-first approach

## Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast mode compatible
- Focus management for modal dialogs

## Future Enhancements
- Double-tap to zoom functionality
- Customizable zoom levels
- Gesture sensitivity settings
- Animation speed preferences
