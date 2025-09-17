import { useEffect, useRef, useCallback } from 'react';
import type { CalendarView } from '../types';

export function useHammerGestures(
  onViewChange: (view: CalendarView) => void,
  currentView: CalendarView
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hammerRef = useRef<HammerManager | null>(null);

  // Handle view transitions
  const transitionToView = useCallback((direction: 'in' | 'out') => {
    const viewOrder: CalendarView[] = ['month', 'week', 'day'];
    const currentIndex = viewOrder.indexOf(currentView);
    
    let newIndex: number;
    
    if (direction === 'in') {
      // Zoom in: month -> week -> day
      newIndex = Math.min(currentIndex + 1, viewOrder.length - 1);
    } else {
      // Zoom out: day -> week -> month
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    if (newIndex !== currentIndex) {
      console.log(`Transitioning from ${currentView} to ${viewOrder[newIndex]} (${direction})`);
      onViewChange(viewOrder[newIndex]);
    }
  }, [currentView, onViewChange]);

  // Set up hammer.js gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      console.log('No container found for Hammer.js');
      return;
    }

    // Dynamically import Hammer.js
    import('hammerjs').then((Hammer) => {
      let hammer: any;
      try {
        // Create hammer manager
        hammer = new Hammer.default(container);
        hammerRef.current = hammer;
        console.log('✅ Hammer.js initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Hammer.js:', error);
        return;
      }

    // Configure pinch gesture
    hammer.get('pinch').set({ 
      enable: true,
      threshold: 0.1,
      pointers: 2 
    });

    console.log('✅ Pinch gesture configured');

    // Handle pinch events
    hammer.on('pinchstart', (e) => {
      console.log('👆 Pinch started:', e.scale);
      e.preventDefault();
    });

    hammer.on('pinchmove', (e) => {
      e.preventDefault();
    });

    hammer.on('pinchend', (e) => {
      console.log('👆 Pinch ended:', e.scale);
      e.preventDefault();
      
      const scaleChange = e.scale - 1;
      const threshold = 0.3; // Minimum scale change to trigger view change
      
      if (Math.abs(scaleChange) > threshold) {
        if (scaleChange > 0) {
          // Pinch out (zoom in)
          console.log('🔍 Zooming IN - transitioning to next view');
          transitionToView('in');
        } else {
          // Pinch in (zoom out)
          console.log('🔍 Zooming OUT - transitioning to previous view');
          transitionToView('out');
        }
      } else {
        console.log('⚠️ Scale change too small, no view transition');
      }
    });

    // Also handle wheel events for desktop (Cmd/Ctrl + scroll)
    const handleWheel = (e: WheelEvent) => {
      // Only handle wheel events with Cmd key (Mac) or Ctrl key (Windows/Linux)
      if (!e.metaKey && !e.ctrlKey) return;
      
      console.log('🖱️ Desktop wheel event with modifier key');
      e.preventDefault();
      
      const threshold = 100; // Accumulated wheel delta to trigger view change
      
      if (Math.abs(e.deltaY) > threshold) {
        if (e.deltaY < 0) {
          // Scroll up (zoom in)
          console.log('🔍 Desktop zoom IN');
          transitionToView('in');
        } else {
          // Scroll down (zoom out)
          console.log('🔍 Desktop zoom OUT');
          transitionToView('out');
        }
      }
    };

      container.addEventListener('wheel', handleWheel, { passive: false });

      // Cleanup function
      return () => {
        if (hammerRef.current) {
          hammerRef.current.destroy();
          hammerRef.current = null;
        }
        container.removeEventListener('wheel', handleWheel);
      };
    }).catch((error) => {
      console.error('Failed to load Hammer.js:', error);
    });

    // Cleanup
    return () => {
      if (hammerRef.current) {
        hammerRef.current.destroy();
        hammerRef.current = null;
      }
    };
  }, [transitionToView]);

  return {
    containerRef,
  };
}
