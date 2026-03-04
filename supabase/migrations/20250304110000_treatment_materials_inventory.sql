-- Collegamento trattamenti ↔ materiali + log consumo per appuntamento
-- LashesAndra: treatment_materials / appointment_materials_usage
-- Isabelle Nails: isabelle_treatment_materials / isabelle_appointment_materials_usage

-- ────────────────────────────────────────────────────────────────────────────────
-- LashesAndra
-- ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS treatment_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_catalog_id UUID NOT NULL REFERENCES treatments_catalog(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  -- Quantità consumata per singola seduta, nella stessa unità di materials.quantity
  quantity_per_session INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_materials_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_materials_treatment
  ON treatment_materials (treatment_catalog_id);

CREATE INDEX IF NOT EXISTS idx_treatment_materials_material
  ON treatment_materials (material_id);

CREATE INDEX IF NOT EXISTS idx_appointment_materials_usage_appointment
  ON appointment_materials_usage (appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_materials_usage_material
  ON appointment_materials_usage (material_id);

-- RLS aperta (come per altre tabelle di configurazione dell'app)
ALTER TABLE treatment_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_materials_usage ENABLE ROW LEVEL SECURITY;

-- Le policy non supportano "IF NOT EXISTS": prima si droppano, poi si ricreano.
DROP POLICY IF EXISTS "Allow all on treatment_materials" ON treatment_materials;
DROP POLICY IF EXISTS "Allow all on appointment_materials_usage" ON appointment_materials_usage;

CREATE POLICY "Allow all on treatment_materials"
  ON treatment_materials
  FOR ALL
  USING (true);

CREATE POLICY "Allow all on appointment_materials_usage"
  ON appointment_materials_usage
  FOR ALL
  USING (true);


-- ────────────────────────────────────────────────────────────────────────────────
-- Isabelle Nails
-- ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS isabelle_treatment_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_catalog_id UUID NOT NULL REFERENCES treatments_catalog(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES isabelle_materials(id) ON DELETE CASCADE,
  quantity_per_session INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS isabelle_appointment_materials_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES isabelle_appointments(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES isabelle_materials(id) ON DELETE CASCADE,
  quantity_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_isabelle_treatment_materials_treatment
  ON isabelle_treatment_materials (treatment_catalog_id);

CREATE INDEX IF NOT EXISTS idx_isabelle_treatment_materials_material
  ON isabelle_treatment_materials (material_id);

CREATE INDEX IF NOT EXISTS idx_isabelle_appointment_materials_usage_appointment
  ON isabelle_appointment_materials_usage (appointment_id);

CREATE INDEX IF NOT EXISTS idx_isabelle_appointment_materials_usage_material
  ON isabelle_appointment_materials_usage (material_id);

ALTER TABLE isabelle_treatment_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE isabelle_appointment_materials_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on isabelle_treatment_materials" ON isabelle_treatment_materials;
DROP POLICY IF EXISTS "Allow all on isabelle_appointment_materials_usage" ON isabelle_appointment_materials_usage;

CREATE POLICY "Allow all on isabelle_treatment_materials"
  ON isabelle_treatment_materials
  FOR ALL
  USING (true);

CREATE POLICY "Allow all on isabelle_appointment_materials_usage"
  ON isabelle_appointment_materials_usage
  FOR ALL
  USING (true);

