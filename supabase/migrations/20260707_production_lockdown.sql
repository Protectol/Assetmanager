-- ============================================================
-- PRODUCTION LOCKDOWN MIGRATION
-- Date: 2026-07-07
-- Purpose:
--   1. Clear all test / dummy data
--   2. Restrict DELETE on every table to admin-role only
--   3. Protect asset_history from any deletion (permanent audit log)
--   4. Protect form_submissions from deletion (compliance record)
--   5. Set app_settings to real company values
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1 — WIPE ALL DUMMY / TEST DATA
-- Order matters: children before parents
-- ────────────────────────────────────────────────────────────

-- Submission-level data
DELETE FROM verification_corrections;
DELETE FROM form_submissions;
DELETE FROM form_assets;
DELETE FROM forms;

-- Asset tracking data
DELETE FROM asset_history;
DELETE FROM asset_assignments;
DELETE FROM assets;

-- People data
DELETE FROM employees;

-- ────────────────────────────────────────────────────────────
-- SECTION 2 — DROP OLD BROAD "FOR ALL" POLICIES
-- Replace with granular SELECT / INSERT / UPDATE / DELETE
-- ────────────────────────────────────────────────────────────

-- employees
DROP POLICY IF EXISTS "Internal users full access employees" ON employees;

CREATE POLICY "employees_select" ON employees
  FOR SELECT USING (is_internal_user());

CREATE POLICY "employees_insert" ON employees
  FOR INSERT WITH CHECK (is_internal_user());

CREATE POLICY "employees_update" ON employees
  FOR UPDATE USING (is_internal_user());

CREATE POLICY "employees_delete" ON employees
  FOR DELETE USING (get_user_role() = 'admin');

-- assets
DROP POLICY IF EXISTS "Internal users full access assets" ON assets;

CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (is_internal_user());

CREATE POLICY "assets_insert" ON assets
  FOR INSERT WITH CHECK (is_internal_user());

CREATE POLICY "assets_update" ON assets
  FOR UPDATE USING (is_internal_user());

CREATE POLICY "assets_delete" ON assets
  FOR DELETE USING (get_user_role() = 'admin');

-- asset_assignments
DROP POLICY IF EXISTS "Internal users full access assignments" ON asset_assignments;

CREATE POLICY "assignments_select" ON asset_assignments
  FOR SELECT USING (is_internal_user());

CREATE POLICY "assignments_insert" ON asset_assignments
  FOR INSERT WITH CHECK (is_internal_user());

CREATE POLICY "assignments_update" ON asset_assignments
  FOR UPDATE USING (is_internal_user());

CREATE POLICY "assignments_delete" ON asset_assignments
  FOR DELETE USING (get_user_role() = 'admin');

-- asset_history — NO ONE CAN DELETE (permanent audit log)
DROP POLICY IF EXISTS "Internal users full access history" ON asset_history;

CREATE POLICY "history_select" ON asset_history
  FOR SELECT USING (is_internal_user());

CREATE POLICY "history_insert" ON asset_history
  FOR INSERT WITH CHECK (is_internal_user());

-- Intentionally NO update or delete policy on asset_history
-- This makes the table append-only for all users including admin

-- forms
DROP POLICY IF EXISTS "Internal users full access forms" ON forms;

CREATE POLICY "forms_select" ON forms
  FOR SELECT USING (is_internal_user());

CREATE POLICY "forms_insert" ON forms
  FOR INSERT WITH CHECK (is_internal_user());

CREATE POLICY "forms_update" ON forms
  FOR UPDATE USING (is_internal_user());

CREATE POLICY "forms_delete" ON forms
  FOR DELETE USING (get_user_role() = 'admin');

-- form_assets
DROP POLICY IF EXISTS "Internal users full access form_assets" ON form_assets;

CREATE POLICY "form_assets_select" ON form_assets
  FOR SELECT USING (is_internal_user());

CREATE POLICY "form_assets_insert" ON form_assets
  FOR INSERT WITH CHECK (is_internal_user());

CREATE POLICY "form_assets_update" ON form_assets
  FOR UPDATE USING (is_internal_user());

CREATE POLICY "form_assets_delete" ON form_assets
  FOR DELETE USING (get_user_role() = 'admin');

-- form_submissions — NO ONE CAN DELETE (compliance record)
DROP POLICY IF EXISTS "Internal users full access submissions" ON form_submissions;

CREATE POLICY "submissions_select" ON form_submissions
  FOR SELECT USING (is_internal_user());

CREATE POLICY "submissions_insert" ON form_submissions
  FOR INSERT WITH CHECK (is_internal_user());

-- Intentionally NO update or delete policy on form_submissions
-- Employee declarations must remain immutable once submitted

-- Public insert policy for form submission (unauthenticated users submitting their form)
-- Forms are accessed via token so no auth.uid() is present
DROP POLICY IF EXISTS "Public can submit form" ON form_submissions;
CREATE POLICY "Public can submit form" ON form_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_submissions.form_id
        AND forms.status = 'pending'
        AND forms.expires_at > NOW()
    )
  );

-- Public read for form token lookup (unauthenticated employees viewing their form)
DROP POLICY IF EXISTS "Public can read own form by token" ON forms;
CREATE POLICY "Public can read own form by token" ON forms
  FOR SELECT USING (true); -- filtered by token in application layer

-- verification_corrections
DROP POLICY IF EXISTS "Internal users full access corrections" ON verification_corrections;

CREATE POLICY "corrections_select" ON verification_corrections
  FOR SELECT USING (is_internal_user());

CREATE POLICY "corrections_insert" ON verification_corrections
  FOR INSERT WITH CHECK (is_internal_user());

CREATE POLICY "corrections_update" ON verification_corrections
  FOR UPDATE USING (is_internal_user());

CREATE POLICY "corrections_delete" ON verification_corrections
  FOR DELETE USING (get_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- SECTION 3 — PREVENT UPDATE ON SUBMITTED FORMS
-- Once a form is 'completed' or 'approved', block status rollback
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_form_status_rollback()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent setting status back to 'pending' once advanced
  IF OLD.status IN ('completed', 'approved', 'rejected') AND NEW.status = 'pending' THEN
    RAISE EXCEPTION 'Cannot roll back form status from % to pending', OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_form_status_rollback ON forms;
CREATE TRIGGER trg_prevent_form_status_rollback
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION prevent_form_status_rollback();

-- ────────────────────────────────────────────────────────────
-- SECTION 4 — UPDATE APP SETTINGS TO PRODUCTION VALUES
-- ────────────────────────────────────────────────────────────

-- Remove the placeholder 'Your Company' name — admin must set this in Settings UI
UPDATE app_settings SET value = '' WHERE key = 'company_name' AND value IN ('Your Company', 'Your Company Name');

-- Reset logo URL if still placeholder
UPDATE app_settings SET value = '' WHERE key = 'company_logo_url' AND value = '';

-- ────────────────────────────────────────────────────────────
-- SECTION 5 — PERFORMANCE & INTEGRITY INDEXES (idempotent)
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_forms_action_type ON forms(action_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_action ON asset_history(action);

-- ────────────────────────────────────────────────────────────
-- SECTION 6 — AUDIT LOCK SUMMARY COMMENT
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE asset_history IS
  'Immutable audit log — no DELETE or UPDATE policies defined. Append-only by design.';

COMMENT ON TABLE form_submissions IS
  'Immutable compliance record — no DELETE or UPDATE policies defined. Submissions are permanent once created.';
