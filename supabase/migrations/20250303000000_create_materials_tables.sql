-- Materials / Inventario tables (LashesAndra + Isabelle Nails)
-- nome, quantità/soglia, note; alert quando sotto soglia

-- LashesAndra: materials
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER,
  threshold INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Isabelle Nails: isabelle_materials
CREATE TABLE IF NOT EXISTS isabelle_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER,
  threshold INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_threshold ON materials(threshold);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);
CREATE INDEX IF NOT EXISTS idx_isabelle_materials_threshold ON isabelle_materials(threshold);
CREATE INDEX IF NOT EXISTS idx_isabelle_materials_created_at ON isabelle_materials(created_at);

-- updated_at trigger (function may already exist from previous migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_isabelle_materials_updated_at
  BEFORE UPDATE ON isabelle_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE isabelle_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on materials" ON materials FOR ALL USING (true);
CREATE POLICY "Allow all operations on isabelle_materials" ON isabelle_materials FOR ALL USING (true);
