-- Public QR scan support
-- Date: 2026-08-04
--
-- 1. Add missing SIM columns referenced by the app
-- 2. Allow anonymous read access for QR verification (safe fields only via app layer)

ALTER TABLE assets ADD COLUMN IF NOT EXISTS has_sim BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS sim_number TEXT;

-- Public QR scan: allow unauthenticated reads on assets and assigned holders
DROP POLICY IF EXISTS "assets_public_scan" ON assets;
CREATE POLICY "assets_public_scan" ON assets
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "employees_public_scan" ON employees;
CREATE POLICY "employees_public_scan" ON employees
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.current_holder_id = employees.id
    )
  );
