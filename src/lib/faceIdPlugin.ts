/**
 * Wrapper per Face ID / Touch ID usando il plugin ufficiale @capgo/capacitor-native-biometric.
 * Compatibile con Capacitor 8 e SPM (iOS).
 */

import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[faceIdPlugin]', ...args);

/**
 * Verifica se la biometria (Face ID / Touch ID) è disponibile.
 * Restituisce false su web o se non disponibile.
 */
export async function isFaceIdAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    log('isFaceIdAvailable: not native');
    return false;
  }
  try {
    const result = await NativeBiometric.isAvailable();
    log('isAvailable result', result);
    return result.isAvailable === true;
  } catch (e) {
    log('isAvailable error', e);
    return false;
  }
}

/**
 * Mostra il prompt nativo Face ID / Touch ID e risolve se l’utente si autentica.
 * Reject se annulla o errore.
 */
export async function performFaceIdAuth(reason: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Biometria non disponibile');
  }
  await NativeBiometric.verifyIdentity({
    reason,
    title: 'Accedi a LashesAndra Board',
    subtitle: 'Verifica la tua identità',
  });
}
