/**
 * Listino durate trattamenti (minuti) per LashesAndra e Isabelle Nails.
 * Usato per: blocco slot in calendario, suggerimento in form appuntamento.
 */

export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;

/** Durata in minuti per tipo trattamento - LashesAndra (extension ciglia, laminazioni, ecc.) */
export const treatmentDurationsLashesAndra: Record<string, number> = {
  'Extension One to One (Classiche)': 90,
  'Refill One to One': 60,
  'Volume Russo 2D-6D': 120,
  'Refill Volume Russo': 75,
  'Volume Egiziano 3D': 120,
  'Refill Volume 3D': 75,
  'Mega Volume 7D+': 150,
  'Refill Mega Volume': 90,
  'Extension Effetto Wet': 90,
  'Extension Effetto Eyeliner': 90,
  'Extension Effetto Foxy Eye': 90,
  'Extension Effetto Cat Eye': 90,
  'Extension Effetto Doll Eye': 90,
  'Extension Effetto Kim Kardashian (Wispy)': 90,
  'Extension Effetto Manga': 90,
  'Extension Effetto Hollywood': 90,
  'Laminazione Ciglia': 45,
  'Laminazione Ciglia con Colore': 60,
  'Laminazione Sopracciglia': 30,
  'Laminazione Sopracciglia con Tintura': 45,
  'Brow Lift & Styling': 45,
  'Rimozione Extension Ciglia': 30,
  'Trattamento Rinforzante Ciglia': 30,
  'Trattamento Idratante Ciglia': 30,
  'Trattamento Nutriente Ciglia con Cheratina': 45,
  'Trattamento Crescita Ciglia': 30,
  'Trattamento Styling Sopracciglia': 30,
};

/** Durata in minuti per tipo trattamento - Isabelle Nails */
export const treatmentDurationsIsabelle: Record<string, number> = {
  'Manicure Classica': 45,
  'Manicure Spa': 60,
  'Manicure con Parafina': 60,
  'French Manicure': 60,
  'Manicure Giapponese (P-Shine)': 60,
  'Pedicure Estetica': 60,
  'Pedicure Curativa': 75,
  'Pedicure Spa': 90,
  'Pedicure con Scrub e Maschera': 75,
  'Smalto Classico': 30,
  'Smalto Semipermanente': 45,
  'Rimozione Smalto': 15,
  'Rimozione Semipermanente': 20,
  'Ricostruzione in Gel': 90,
  'Ricostruzione in Acrilico': 90,
  'Copertura in Gel': 60,
  'Allungamento con Cartina': 90,
  'Refill Gel/Acrilico': 60,
  'French Gel': 60,
  'Babyboomer': 60,
  'Nail Art Base': 45,
  'Nail Art Avanzata': 75,
  'Applicazione Strass/Decorazioni': 30,
  'Pulizia Profonda Unghie': 30,
  'Trattamento Rinforzante': 30,
  'Trattamento Idratante Mani': 30,
  'Trattamento Calli e Duroni': 45,
  'Scrub Mani e Piedi': 45,
};

export type AppType = 'lashesandra' | 'isabellenails';

export function getTreatmentDurationMinutes(
  appType: AppType,
  tipoTrattamento: string | undefined
): number {
  if (!tipoTrattamento?.trim()) return DEFAULT_APPOINTMENT_DURATION_MINUTES;
  const map = appType === 'isabellenails' ? treatmentDurationsIsabelle : treatmentDurationsLashesAndra;
  return map[tipoTrattamento.trim()] ?? DEFAULT_APPOINTMENT_DURATION_MINUTES;
}
