-- Employee Asset Management System Schema
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'it', 'hr');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'resigned', 'on_leave');
CREATE TYPE asset_condition AS ENUM ('new', 'good', 'damaged', 'lost');
CREATE TYPE asset_status AS ENUM ('available', 'assigned', 'repair', 'lost', 'returned');
CREATE TYPE form_action_type AS ENUM ('onboarding', 'exchange', 'return', 'verification');
CREATE TYPE form_status AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE history_action AS ENUM ('onboarding', 'exchange', 'return', 'verification', 'assignment', 'unassignment', 'status_change', 'correction');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'it',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  location TEXT NOT NULL,
  manager TEXT,
  email TEXT NOT NULL,
  phone_number TEXT,
  status employee_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_tag TEXT NOT NULL UNIQUE,
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  condition asset_condition NOT NULL DEFAULT 'new',
  status asset_status NOT NULL DEFAULT 'available',
  current_holder_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset assignments (current live register)
CREATE TABLE asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id) -- Only one active assignment per asset
);

-- Asset history (never delete)
CREATE TABLE asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  action history_action NOT NULL,
  previous_holder_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  current_holder_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forms (secure one-time links)
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action_type form_action_type NOT NULL,
  status form_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Form assets (assets included in a form)
CREATE TABLE form_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  old_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- For exchange
  condition asset_condition,
  remarks TEXT,
  verified BOOLEAN, -- For verification forms
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Form submissions
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL UNIQUE REFERENCES forms(id) ON DELETE CASCADE,
  employee_signature TEXT NOT NULL, -- Base64 or typed text
  signature_type TEXT NOT NULL DEFAULT 'draw', -- 'draw' or 'type'
  submission_data JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Verification corrections (admin review before applying)
CREATE TABLE verification_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_reported BOOLEAN NOT NULL,
  reported_condition asset_condition,
  reported_remarks TEXT,
  admin_approved BOOLEAN,
  admin_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_reviewed_at TIMESTAMPTZ,
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App settings
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('form_link_expiry_days', '7'),
  ('company_name', 'Your Company'),
  ('company_logo_url', '');

-- Indexes for performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_assets_asset_tag ON assets(asset_tag);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_current_holder ON assets(current_holder_id);
CREATE INDEX idx_asset_assignments_employee ON asset_assignments(employee_id);
CREATE INDEX idx_asset_assignments_active ON asset_assignments(is_active);
CREATE INDEX idx_asset_history_employee ON asset_history(employee_id);
CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX idx_asset_history_date ON asset_history(date DESC);
CREATE INDEX idx_forms_token ON forms(token);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_employee ON forms(employee_id);
CREATE INDEX idx_forms_expires ON forms(expires_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_assignments_updated_at BEFORE UPDATE ON asset_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-expire forms function
CREATE OR REPLACE FUNCTION expire_pending_forms()
RETURNS void AS $$
BEGIN
  UPDATE forms
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_internal_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies for internal users
CREATE POLICY "Internal users can view all users" ON users
  FOR SELECT USING (is_internal_user());
CREATE POLICY "Admin can manage users" ON users
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Internal users full access employees" ON employees
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access assets" ON assets
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access assignments" ON asset_assignments
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access history" ON asset_history
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access forms" ON forms
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access form_assets" ON form_assets
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access submissions" ON form_submissions
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users full access corrections" ON verification_corrections
  FOR ALL USING (is_internal_user());

CREATE POLICY "Internal users can view settings" ON app_settings
  FOR SELECT USING (is_internal_user());
CREATE POLICY "Admin can manage settings" ON app_settings
  FOR ALL USING (get_user_role() = 'admin');

-- Function to handle new user signup (create profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'it')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
