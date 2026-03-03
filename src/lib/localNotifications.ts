/**
 * Servizio per notifiche push locali (Capacitor): reminder appuntamenti 1 ora prima.
 * Funziona solo in ambiente nativo (iOS/Android); in web non fa nulla.
 */

import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';
import type { Appointment } from '../types';

const CHANNEL_ID = 'appointment-reminders';
const REMINDER_MINUTES_BEFORE = 60;

/** Converte un UUID in un id numerico per le notifiche (Android richiede 32-bit int). */
function appointmentIdToNotificationId(appointmentId: string): number {
  let hash = 0;
  for (let i = 0; i < appointmentId.length; i++) {
    const char = appointmentId.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + char;
    hash = hash & 0x7fffffff; // mantieni positivo e 31 bit
  }
  return hash || 1; // evita 0
}

/** Verifica se siamo in ambiente nativo (iOS/Android). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Restituisce la data/ora del reminder (1 ora prima dell'appuntamento).
 * data: YYYY-MM-DD, ora: opzionale "HH:mm" o "HH:mm:ss" (default 09:00).
 */
function getReminderDate(data: string, ora?: string): Date | null {
  const [y, m, d] = data.split('-').map(Number);
  let hour = 9;
  let minute = 0;
  if (ora) {
    const parts = ora.trim().split(/[:\s]/);
    if (parts.length >= 2) {
      hour = Number.parseInt(parts[0], 10) || 9;
      minute = Number.parseInt(parts[1], 10) || 0;
    }
  }
  const appointmentDate = new Date(y, m - 1, d, hour, minute, 0, 0);
  const reminderDate = new Date(
    appointmentDate.getTime() - REMINDER_MINUTES_BEFORE * 60 * 1000
  );
  // Non schedulare nel passato
  return reminderDate.getTime() > Date.now() ? reminderDate : null;
}

/**
 * Richiede i permessi e crea il canale Android. Chiamare all'avvio dell'app (solo su nativo).
 */
export async function initLocalNotifications(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // Android: crea il canale per le notifiche
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Promemoria appuntamenti',
        description: 'Notifiche un\'ora prima degli appuntamenti',
        importance: 4, // IMPORTANCE_HIGH
        visibility: 1,
        sound: undefined,
      });
    }

    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch (e) {
    console.warn('Local notifications init failed:', e);
  }
}

/**
 * Schedula un reminder locale per un appuntamento (1 ora prima).
 * Solo per appuntamenti di lavoro (kind !== 'personal') e status pending.
 * In web non fa nulla.
 */
export async function scheduleAppointmentReminder(
  appointment: Appointment,
  clientName: string
): Promise<void> {
  if (!isNativePlatform()) return;
  if (appointment.kind === 'personal') return;
  if (appointment.status !== 'pending') return;

  const reminderAt = getReminderDate(appointment.data, appointment.ora);
  if (!reminderAt) return;

  const id = appointmentIdToNotificationId(appointment.id);
  const timeLabel = appointment.ora
    ? appointment.ora.slice(0, 5)
    : '09:00';
  const title = 'Promemoria appuntamento';
  const body = `${clientName} – ${timeLabel} · ${appointment.tipo_trattamento || 'Trattamento'}`;

  const notification: LocalNotificationSchema = {
    id,
    title,
    body,
    schedule: { at: reminderAt, allowWhileIdle: true },
    channelId: CHANNEL_ID,
    extra: { appointmentId: appointment.id },
  };

  try {
    await LocalNotifications.schedule({ notifications: [notification] });
  } catch (e) {
    console.warn('Failed to schedule reminder for appointment', appointment.id, e);
  }
}

/**
 * Rimuove il reminder per un appuntamento (es. cancellato o completato).
 */
export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  if (!isNativePlatform()) return;

  const id = appointmentIdToNotificationId(appointmentId);
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (e) {
    console.warn('Failed to cancel reminder for appointment', appointmentId, e);
  }
}

/**
 * Ri-schedula i reminder per tutti gli appuntamenti pending passati.
 * Utile al login/avvio app per allineare le notifiche al DB.
 */
export async function syncAppointmentReminders(
  appointments: Appointment[],
  getClientName: (clientId: string) => string
): Promise<void> {
  if (!isNativePlatform()) return;

  const pending = appointments.filter(
    (a) => a.status === 'pending' && a.kind !== 'personal'
  );
  for (const apt of pending) {
    await scheduleAppointmentReminder(apt, getClientName(apt.client_id));
  }
}
