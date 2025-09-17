import { useState, useEffect, useRef, useCallback } from 'react';
import type { CalendarView } from '../types';

interface GestureState {
  isGesturing: boolean;
  startDistance: number;
  startScale: number;
  currentScale: number;
}

export function useGestureDetection(
  onViewChange: (view: CalendarView) => void,
  currentView: CalendarView
) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isGesturing: false,
    startDistance: 0,
    startScale: 1,
    currentScale: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number>(0);
  const lastWheelTime = useRef<number>(0);
  const wheelAccumulator = useRef<number>(0);

  // Calculate distance between two touches
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

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
      onViewChange(viewOrder[newIndex]);
    }
  }, [currentView, onViewChange]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      
      setGestureState({
        isGesturing: true,
        startDistance: distance,
        startScale: 1,
        currentScale: 1,
      });
      
      lastTouchDistance.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && gestureState.isGesturing) {
      e.preventDefault();
      
      const distance = getTouchDistance(e.touches);
      const scale = distance / gestureState.startDistance;
      
      setGestureState(prev => ({
        ...prev,
        currentScale: scale,
      }));
      
      lastTouchDistance.current = distance;
    }
  }, [gestureState.isGesturing, gestureState.startDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gestureState.isGesturing) {
      const scaleChange = gestureState.currentScale - gestureState.startScale;
      const threshold = 0.3; // Minimum scale change to trigger view change
      
      if (Math.abs(scaleChange) > threshold) {
        if (scaleChange > 0) {
          // Pinch out (zoom in)
          transitionToView('in');
        } else {
          // Pinch in (zoom out)
          transitionToView('out');
        }
      }
      
      setGestureState({
        isGesturing: false,
        startDistance: 0,
        startScale: 1,
        currentScale: 1,
      });
    }
  }, [gestureState, transitionToView]);

  // Wheel event handler for desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    // Only handle wheel events with Ctrl key (zoom gesture)
    if (!e.ctrlKey) return;
    
    e.preventDefault();
    
    const now = Date.now();
    const timeDiff = now - lastWheelTime.current;
    
    // Reset accumulator if too much time has passed
    if (timeDiff > 100) {
      wheelAccumulator.current = 0;
    }
    
    lastWheelTime.current = now;
    wheelAccumulator.current += e.deltaY;
    
    const threshold = 100; // Accumulated wheel delta to trigger view change
    
    if (Math.abs(wheelAccumulator.current) > threshold) {
      if (wheelAccumulator.current < 0) {
        // Scroll up (zoom in)
        transitionToView('in');
      } else {
        // Scroll down (zoom out)
        transitionToView('out');
      }
      
      wheelAccumulator.current = 0; // Reset accumulator
    }
  }, [transitionToView]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Wheel events
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  return {
    containerRef,
    isGesturing: gestureState.isGesturing,
    currentScale: gestureState.currentScale,
  };
}
