/**
 * Inizializzazione Capacitor: StatusBar, SplashScreen.
 * Esegue solo in contesto nativo (iOS/Android); nessun effetto su web.
 */
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const isCapacitorNative = () => isNative;

/**
 * Inizializza StatusBar e nasconde SplashScreen quando l'app è pronta.
 * Chiamare dopo il mount dell'app (es. in main.jsx o App.jsx).
 */
export async function initCapacitorPlugins() {
  if (!isNative) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  } catch (e) {
    console.warn('[Capacitor] StatusBar:', e?.message || e);
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('[Capacitor] SplashScreen:', e?.message || e);
  }
}
