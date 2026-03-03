import dayjs from 'dayjs';
import type { Client, Appointment, RecallEntry, RecallFilter } from '../types';
import { REFILL_WEEKS } from '../types';

/**
 * Restituisce la data dell'ultimo appuntamento completato del cliente, oppure
 * data_ultimo_appuntamento se presente, altrimenti null.
 */
export function getLastAppointmentDate(
  clientId: string,
  appointments: Appointment[],
  clientFallback?: string | null
): string | null {
  const completed = appointments
    .filter((a) => a.client_id === clientId && a.status === 'completed')
    .sort((a, b) => (b.data > a.data ? 1 : -1));
  const last = completed[0];
  if (last) return last.data;
  if (clientFallback) return clientFallback;
  return null;
}

/**
 * Ultimo appuntamento completato (data + tipo_trattamento).
 */
export function getLastAppointmentInfo(
  clientId: string,
  appointments: Appointment[]
): { data: string; tipo_trattamento?: string } | null {
  const completed = appointments
    .filter((a) => a.client_id === clientId && a.status === 'completed')
    .sort((a, b) => (b.data > a.data ? 1 : -1));
  const last = completed[0];
  if (!last) return null;
  return { data: last.data, tipo_trattamento: last.tipo_trattamento };
}

/**
 * Calcola la data del prossimo refill consigliato (es. 2 settimane dopo l'ultimo trattamento).
 */
export function getSuggestedRefillDate(lastAppointmentDate: string): string {
  return dayjs(lastAppointmentDate).add(REFILL_WEEKS, 'week').format('YYYY-MM-DD');
}

/**
 * Classifica la data di refill in: in ritardo, questa settimana, prossime 2 settimane.
 */
export function getRecallFilter(refillDate: string, today: dayjs.Dayjs): RecallFilter {
  const refill = dayjs(refillDate).startOf('day');
  const startToday = today.startOf('day');
  const endOfWeek = today.endOf('week'); // domenica
  const inTwoWeeks = today.add(14, 'day');

  if (refill.isBefore(startToday)) return 'overdue';
  if (refill.isAfter(inTwoWeeks)) return 'overdue'; // non mostrare oltre 2 settimane come "da richiamare"
  if (!refill.isAfter(endOfWeek)) return 'this_week';
  return 'next_two_weeks';
}

/**
 * Costruisce la lista di clienti da richiamare: solo clienti con almeno un appuntamento
 * completato (o data_ultimo_appuntamento), con prossimo refill consigliato entro 2 settimane
 * o già in ritardo.
 */
export function buildRecallList(
  clients: Client[],
  appointments: Appointment[]
): RecallEntry[] {
  const today = dayjs().startOf('day');
  const inTwoWeeks = today.add(14, 'day');
  const result: RecallEntry[] = [];

  for (const client of clients) {
    const lastInfo = getLastAppointmentInfo(client.id, appointments);
    const fallback = client.data_ultimo_appuntamento || null;
    const lastDate = lastInfo?.data ?? fallback;
    if (!lastDate) continue;

    const suggestedRefill = getSuggestedRefillDate(lastDate);
    const refillDay = dayjs(suggestedRefill).startOf('day');
    // Includi solo se refill è già passato o entro le prossime 2 settimane
    if (refillDay.isAfter(inTwoWeeks)) continue;

    const filter = getRecallFilter(suggestedRefill, today);
    result.push({
      client,
      lastAppointmentDate: lastDate,
      lastAppointmentTreatment: lastInfo?.tipo_trattamento,
      suggestedRefillDate: suggestedRefill,
      filter,
    });
  }

  // Ordina: prima in ritardo, poi questa settimana, poi prossime 2 settimane; dentro ogni gruppo per data refill
  result.sort((a, b) => {
    const order: Record<RecallFilter, number> = {
      overdue: 0,
      this_week: 1,
      next_two_weeks: 2,
    };
    const diff = order[a.filter] - order[b.filter];
    if (diff !== 0) return diff;
    return dayjs(a.suggestedRefillDate).valueOf() - dayjs(b.suggestedRefillDate).valueOf();
  });

  return result;
}
