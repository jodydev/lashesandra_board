-- Note rapide e checklist "da fare" per appuntamento.
-- note: testo libero (es. "refill, ricordarsi bigodino 0.15")
-- checklist: JSON array opzionale di { id, label, done } per "da fare" (es. pulizia, patch test, schema da seguire).

-- LashesAndra: appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN appointments.note IS 'Note rapide per la seduta (es. refill, bigodino 0.15).';
COMMENT ON COLUMN appointments.checklist IS 'Checklist "da fare" opzionale: array di { id, label, done } (es. pulizia, patch test).';

-- Isabelle Nails: isabelle_appointments
ALTER TABLE isabelle_appointments
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN isabelle_appointments.note IS 'Note rapide per la seduta.';
COMMENT ON COLUMN isabelle_appointments.checklist IS 'Checklist "da fare" opzionale: array di { id, label, done }.';
