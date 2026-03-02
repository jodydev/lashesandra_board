/**
 * Haptic feedback via Capacitor. Safe to call on web (no-op).
 */

import { Capacitor } from '@capacitor/core';

export async function hapticSelection(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.impact({ style: 'Light' });
  } catch {
    // ignore if plugin unavailable
  }
}
