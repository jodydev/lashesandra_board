-- WhatsApp System Tables
-- This migration creates the necessary tables for the WhatsApp automation system

-- WhatsApp Configuration Table
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_url TEXT NOT NULL,
  api_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Messages Log Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Isabelle Nails specific tables (with prefix)
CREATE TABLE IF NOT EXISTS isabelle_whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_url TEXT NOT NULL,
  api_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS isabelle_message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS isabelle_whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES isabelle_clients(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES isabelle_appointments(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default message template for LashesAndra
INSERT INTO message_templates (name, content, is_default) VALUES (
  'default',
  'Ciao {nome}, ti ricordiamo il tuo appuntamento domani alle {ora} per il trattamento {servizio} presso il nostro centro estetico in {location}. Ti aspettiamo 💖',
  true
) ON CONFLICT (name) DO NOTHING;

-- Insert default message template for Isabelle Nails
INSERT INTO isabelle_message_templates (name, content, is_default) VALUES (
  'default',
  'Ciao {nome}, ti ricordiamo il tuo appuntamento domani alle {ora} per il servizio {servizio} presso il nostro centro unghie in {location}. Ti aspettiamo 💅',
  true
) ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client_id ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_appointment_id ON whatsapp_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_isabelle_whatsapp_messages_client_id ON isabelle_whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_isabelle_whatsapp_messages_appointment_id ON isabelle_whatsapp_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_isabelle_whatsapp_messages_status ON isabelle_whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_isabelle_whatsapp_messages_created_at ON isabelle_whatsapp_messages(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON whatsapp_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_isabelle_whatsapp_config_updated_at BEFORE UPDATE ON isabelle_whatsapp_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_isabelle_message_templates_updated_at BEFORE UPDATE ON isabelle_message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_isabelle_whatsapp_messages_updated_at BEFORE UPDATE ON isabelle_whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE isabelle_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE isabelle_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE isabelle_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on whatsapp_config" ON whatsapp_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on message_templates" ON message_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_messages" ON whatsapp_messages FOR ALL USING (true);

CREATE POLICY "Allow all operations on isabelle_whatsapp_config" ON isabelle_whatsapp_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on isabelle_message_templates" ON isabelle_message_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on isabelle_whatsapp_messages" ON isabelle_whatsapp_messages FOR ALL USING (true);
