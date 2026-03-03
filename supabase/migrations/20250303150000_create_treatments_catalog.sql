-- Listino tipi di trattamento: nome, prezzo base, durata stimata.
-- Una sola tabella con app_type per supportare LashesAndra e Isabelle Nails.

CREATE TABLE IF NOT EXISTS treatments_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type TEXT NOT NULL CHECK (app_type IN ('lashesandra', 'isabellenails')),
  name TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (app_type, name)
);

CREATE INDEX IF NOT EXISTS idx_treatments_catalog_app_type ON treatments_catalog (app_type);
CREATE INDEX IF NOT EXISTS idx_treatments_catalog_sort ON treatments_catalog (app_type, sort_order);

COMMENT ON TABLE treatments_catalog IS 'Listino tipi di trattamento: prezzo base e durata stimata per appuntamenti e profilo cliente.';

-- Collegamento da appointments (LashesAndra)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS treatment_catalog_id UUID REFERENCES treatments_catalog(id) ON DELETE SET NULL;

COMMENT ON COLUMN appointments.treatment_catalog_id IS 'Riferimento al listino; se valorizzato, tipo_trattamento/importo/duration possono essere coerenti con il listino.';

-- Collegamento da isabelle_appointments (Isabelle Nails)
ALTER TABLE isabelle_appointments
  ADD COLUMN IF NOT EXISTS treatment_catalog_id UUID REFERENCES treatments_catalog(id) ON DELETE SET NULL;

COMMENT ON COLUMN isabelle_appointments.treatment_catalog_id IS 'Riferimento al listino; se valorizzato, tipo_trattamento/importo/duration coerenti con il listino.';

-- Seed: LashesAndra (nomi e durate da listino esistente, prezzi base indicativi)
INSERT INTO treatments_catalog (app_type, name, base_price, duration_minutes, sort_order) VALUES
  ('lashesandra', 'Extension One to One (Classiche)', 60, 90, 10),
  ('lashesandra', 'Refill One to One', 45, 60, 20),
  ('lashesandra', 'Volume Russo 2D-6D', 80, 120, 30),
  ('lashesandra', 'Refill Volume Russo', 55, 75, 40),
  ('lashesandra', 'Volume Egiziano 3D', 80, 120, 50),
  ('lashesandra', 'Refill Volume 3D', 55, 75, 60),
  ('lashesandra', 'Mega Volume 7D+', 90, 150, 70),
  ('lashesandra', 'Refill Mega Volume', 60, 90, 80),
  ('lashesandra', 'Extension Effetto Wet', 65, 90, 90),
  ('lashesandra', 'Extension Effetto Eyeliner', 65, 90, 100),
  ('lashesandra', 'Extension Effetto Foxy Eye', 65, 90, 110),
  ('lashesandra', 'Extension Effetto Cat Eye', 65, 90, 120),
  ('lashesandra', 'Extension Effetto Doll Eye', 65, 90, 130),
  ('lashesandra', 'Extension Effetto Kim Kardashian (Wispy)', 65, 90, 140),
  ('lashesandra', 'Extension Effetto Manga', 65, 90, 150),
  ('lashesandra', 'Extension Effetto Hollywood', 65, 90, 160),
  ('lashesandra', 'Laminazione Ciglia', 40, 45, 170),
  ('lashesandra', 'Laminazione Ciglia con Colore', 50, 60, 180),
  ('lashesandra', 'Laminazione Sopracciglia', 25, 30, 190),
  ('lashesandra', 'Laminazione Sopracciglia con Tintura', 35, 45, 200),
  ('lashesandra', 'Brow Lift & Styling', 40, 45, 210),
  ('lashesandra', 'Rimozione Extension Ciglia', 20, 30, 220),
  ('lashesandra', 'Trattamento Rinforzante Ciglia', 25, 30, 230),
  ('lashesandra', 'Trattamento Idratante Ciglia', 25, 30, 240),
  ('lashesandra', 'Trattamento Nutriente Ciglia con Cheratina', 35, 45, 250),
  ('lashesandra', 'Trattamento Crescita Ciglia', 25, 30, 260),
  ('lashesandra', 'Trattamento Styling Sopracciglia', 25, 30, 270)
ON CONFLICT (app_type, name) DO NOTHING;

-- Seed: Isabelle Nails
INSERT INTO treatments_catalog (app_type, name, base_price, duration_minutes, sort_order) VALUES
  ('isabellenails', 'Manicure Classica', 25, 45, 10),
  ('isabellenails', 'Manicure Spa', 35, 60, 20),
  ('isabellenails', 'Manicure con Parafina', 35, 60, 30),
  ('isabellenails', 'French Manicure', 35, 60, 40),
  ('isabellenails', 'Manicure Giapponese (P-Shine)', 40, 60, 50),
  ('isabellenails', 'Pedicure Estetica', 35, 60, 60),
  ('isabellenails', 'Pedicure Curativa', 45, 75, 70),
  ('isabellenails', 'Pedicure Spa', 50, 90, 80),
  ('isabellenails', 'Pedicure con Scrub e Maschera', 45, 75, 90),
  ('isabellenails', 'Smalto Classico', 15, 30, 100),
  ('isabellenails', 'Smalto Semipermanente', 25, 45, 110),
  ('isabellenails', 'Rimozione Smalto', 5, 15, 120),
  ('isabellenails', 'Rimozione Semipermanente', 8, 20, 130),
  ('isabellenails', 'Ricostruzione in Gel', 45, 90, 140),
  ('isabellenails', 'Ricostruzione in Acrilico', 45, 90, 150),
  ('isabellenails', 'Copertura in Gel', 35, 60, 160),
  ('isabellenails', 'Allungamento con Cartina', 45, 90, 170),
  ('isabellenails', 'Refill Gel/Acrilico', 35, 60, 180),
  ('isabellenails', 'French Gel', 35, 60, 190),
  ('isabellenails', 'Babyboomer', 35, 60, 200),
  ('isabellenails', 'Nail Art Base', 30, 45, 210),
  ('isabellenails', 'Nail Art Avanzata', 50, 75, 220),
  ('isabellenails', 'Applicazione Strass/Decorazioni', 20, 30, 230),
  ('isabellenails', 'Pulizia Profonda Unghie', 20, 30, 240),
  ('isabellenails', 'Trattamento Rinforzante', 20, 30, 250),
  ('isabellenails', 'Trattamento Idratante Mani', 20, 30, 260),
  ('isabellenails', 'Trattamento Calli e Duroni', 30, 45, 270),
  ('isabellenails', 'Scrub Mani e Piedi', 30, 45, 280)
ON CONFLICT (app_type, name) DO NOTHING;
