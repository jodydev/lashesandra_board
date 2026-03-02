import type { Appointment } from '../types';

export const PERSONAL_APPOINTMENT_CLIENT_ID = '__personal__';

export function isPersonalAppointment(apt: Appointment): boolean {
  return apt.kind === 'personal' || apt.client_id === PERSONAL_APPOINTMENT_CLIENT_ID;
}

export function getPersonalAppointmentsStorageKey(appType: string) {
  return `lashesandra_board.personal_appointments.v1.${appType}`;
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPersonalAppointments(appType: string): Appointment[] {
  const key = getPersonalAppointmentsStorageKey(appType);
  const parsed = safeParseJson<Appointment[]>(localStorage.getItem(key));
  if (!Array.isArray(parsed)) return [];

  // Minimal sanity check to avoid blowing up the UI on bad data
  return parsed
    .filter((a) => a && typeof a.id === 'string' && typeof a.data === 'string')
    .map((a) => ({
      ...a,
      client_id: PERSONAL_APPOINTMENT_CLIENT_ID,
      importo: 0,
      status: a.status ?? 'pending',
      kind: 'personal',
      created_at: a.created_at ?? new Date().toISOString(),
    }));
}

export function savePersonalAppointments(appType: string, items: Appointment[]) {
  const key = getPersonalAppointmentsStorageKey(appType);
  localStorage.setItem(key, JSON.stringify(items));
}

export function makePersonalAppointment(params: {
  id?: string;
  date: string;
  time?: string;
  title: string;
  createdAt?: string;
}): Appointment {
  const id =
    params.id ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `p_${Date.now()}`);

  return {
    id,
    client_id: PERSONAL_APPOINTMENT_CLIENT_ID,
    data: params.date,
    ora: params.time || undefined,
    importo: 0,
    tipo_trattamento: params.title,
    status: 'pending',
    kind: 'personal',
    created_at: params.createdAt ?? new Date().toISOString(),
  };
}

