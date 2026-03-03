-- Durata seduta (minuti) per blocco slot in calendario.
-- Ogni appuntamento può avere una durata; default 60 min per retrocompatibilità.

-- LashesAndra: appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

COMMENT ON COLUMN appointments.duration_minutes IS 'Durata della seduta in minuti; usata per visualizzare lo slot in calendario (WeekView/DayView).';

-- Isabelle Nails: isabelle_appointments
ALTER TABLE isabelle_appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

COMMENT ON COLUMN isabelle_appointments.duration_minutes IS 'Durata della seduta in minuti; usata per visualizzare lo slot in calendario (WeekView/DayView).';
