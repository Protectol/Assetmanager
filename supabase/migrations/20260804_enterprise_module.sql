-- Enterprise Asset Tagging & Employee Import Module Migration
-- Date: 2026-08-04

-- Extend asset_status enum
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'maintenance';
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'disposed';

-- Asset ID sequences tracking
CREATE TABLE IF NOT EXISTS asset_id_sequences (
  prefix TEXT PRIMARY KEY,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Label templates
CREATE TABLE IF NOT EXISTS label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  width_mm NUMERIC NOT NULL DEFAULT 90,
  height_mm NUMERIC NOT NULL DEFAULT 29,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee import history
CREATE TABLE IF NOT EXISTS employee_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  new_count INT DEFAULT 0,
  updated_count INT DEFAULT 0,
  invalid_count INT DEFAULT 0,
  filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universal audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS label_template_id UUID REFERENCES label_templates(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE asset_id_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS if not already existing
CREATE OR REPLACE FUNCTION is_internal_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role FROM users WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for asset_id_sequences
DROP POLICY IF EXISTS "asset_id_sequences_select" ON asset_id_sequences;
CREATE POLICY "asset_id_sequences_select" ON asset_id_sequences FOR SELECT USING (is_internal_user());
DROP POLICY IF EXISTS "asset_id_sequences_all" ON asset_id_sequences;
CREATE POLICY "asset_id_sequences_all" ON asset_id_sequences FOR ALL USING (is_internal_user());

-- RLS Policies for label_templates
DROP POLICY IF EXISTS "label_templates_select" ON label_templates;
CREATE POLICY "label_templates_select" ON label_templates FOR SELECT USING (is_internal_user());
DROP POLICY IF EXISTS "label_templates_write" ON label_templates;
CREATE POLICY "label_templates_write" ON label_templates FOR ALL USING (is_internal_user());

-- RLS Policies for employee_import_history
DROP POLICY IF EXISTS "employee_import_history_select" ON employee_import_history;
CREATE POLICY "employee_import_history_select" ON employee_import_history FOR SELECT USING (is_internal_user());
DROP POLICY IF EXISTS "employee_import_history_insert" ON employee_import_history;
CREATE POLICY "employee_import_history_insert" ON employee_import_history FOR INSERT WITH CHECK (is_internal_user());

-- RLS Policies for audit_logs
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (is_internal_user());

-- Default seed label template
INSERT INTO label_templates (name, is_default, width_mm, height_mm, config)
VALUES (
  'Standard Asset Label (90x29mm)',
  true,
  90,
  29,
  '{
    "elements": [
      { "id": "logo", "type": "logo", "x": 5, "y": 4, "width": 20, "height": 10, "visible": true },
      { "id": "company", "type": "company_name", "x": 28, "y": 5, "fontSize": 10, "fontWeight": "bold", "visible": true },
      { "id": "property_of", "type": "text", "content": "Property of Company", "x": 28, "y": 9, "fontSize": 7, "fontWeight": "normal", "visible": true },
      { "id": "asset_name", "type": "asset_name", "x": 5, "y": 16, "fontSize": 9, "fontWeight": "bold", "visible": true },
      { "id": "asset_id", "type": "asset_id", "x": 5, "y": 21, "fontSize": 11, "fontWeight": "bold", "fontFamily": "monospace", "visible": true },
      { "id": "qr_code", "type": "qr_code", "x": 68, "y": 4, "width": 18, "height": 18, "visible": true },
      { "id": "serial_number", "type": "serial_number", "x": 28, "y": 21, "fontSize": 7, "fontFamily": "monospace", "visible": true }
    ],
    "style": {
      "border": true,
      "borderColor": "#e2e8f0",
      "backgroundColor": "#ffffff",
      "padding": 2
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;
