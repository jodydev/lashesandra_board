-- Migration: Update WhatsApp configuration for production mode
-- This migration updates the existing WhatsApp configuration to support production mode

-- Update existing WhatsApp config to use production credentials
-- Replace the sandbox configuration with production-ready setup

-- Example: Update existing config (uncomment and modify as needed)
/*
UPDATE whatsapp_config 
SET 
  api_url = 'your_production_auth_token_here',
  api_token = 'your_production_account_sid_here', 
  phone_number_id = 'whatsapp:+39XXXXXXXXXX',
  business_account_id = 'your_production_account_sid_here',
  is_active = true,
  updated_at = now()
WHERE is_active = true;
*/

-- Add new columns for better configuration management
ALTER TABLE whatsapp_config 
ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'development' CHECK (environment IN ('development', 'production')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_environment ON whatsapp_config(environment);
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_active ON whatsapp_config(is_active);

-- Insert production configuration template (uncomment and modify as needed)
/*
INSERT INTO whatsapp_config (
  api_url,
  api_token,
  phone_number_id,
  business_account_id,
  is_active,
  environment,
  description
) VALUES (
  'your_production_auth_token_here',
  'your_production_account_sid_here',
  'whatsapp:+39XXXXXXXXXX',
  'your_production_account_sid_here',
  false, -- Set to true when ready for production
  'production',
  'Production WhatsApp Business configuration'
) ON CONFLICT (environment) DO UPDATE SET
  api_url = EXCLUDED.api_url,
  api_token = EXCLUDED.api_token,
  phone_number_id = EXCLUDED.phone_number_id,
  business_account_id = EXCLUDED.business_account_id,
  description = EXCLUDED.description,
  updated_at = now();
*/

-- Update RLS policies for new columns
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
DROP POLICY IF EXISTS "Users can view whatsapp config" ON whatsapp_config;
CREATE POLICY "Users can view whatsapp config" ON whatsapp_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role (Edge Functions)
DROP POLICY IF EXISTS "Service role can manage whatsapp config" ON whatsapp_config;
CREATE POLICY "Service role can manage whatsapp config" ON whatsapp_config
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON COLUMN whatsapp_config.environment IS 'Environment type: development or production';
COMMENT ON COLUMN whatsapp_config.description IS 'Description of the configuration';
COMMENT ON COLUMN whatsapp_config.last_used_at IS 'Timestamp of last usage';

-- Create a view for easy configuration management
CREATE OR REPLACE VIEW whatsapp_config_summary AS
SELECT 
  id,
  environment,
  is_active,
  description,
  phone_number_id,
  business_account_id,
  created_at,
  updated_at,
  last_used_at
FROM whatsapp_config
ORDER BY environment, is_active DESC, created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON whatsapp_config_summary TO authenticated;
GRANT SELECT ON whatsapp_config_summary TO service_role;
