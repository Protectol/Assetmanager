-- Add new form action type for current asset verification
ALTER TYPE form_action_type ADD VALUE IF NOT EXISTS 'current_verification';

-- Add new statuses for admin review workflow
ALTER TYPE form_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE form_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add new default app settings for email templates and dynamic categories
INSERT INTO app_settings (key, value) VALUES
  ('email_default_to', 'accounts@company.com'),
  ('email_default_cc', 'hr@company.com, it@company.com'),
  ('email_subject_template', 'Asset Assignment Update - [Employee Name] - [Employee ID]'),
  ('email_body_template', 'Dear Accounts Team,

Please find below the verified company assets currently assigned to the employee mentioned below. Kindly update the same in Odoo asset records.

Employee Details:
Employee Name: [Employee Name]
Employee ID: [Employee ID]
Department: [Department]
Designation: [Designation]
Location: [Location]

Assigned Asset Details:
[Asset Table]

Verified By: [Admin Name]
Verification Date: [Date]

Please update the asset assignment details in Odoo accordingly.

Best regards,
[Admin Name]'),
  ('asset_categories', '["Laptop", "Laptop Charger", "Desktop", "Monitor", "Keyboard", "Mouse", "Tablet", "Mobile Phone", "SIM Card", "Access Card", "Headset", "Printer", "Other Accessories"]'),
  ('asset_rules', '[{"condition": {"category": "Laptop", "value": "Yes"}, "requirement": {"category": "Laptop Charger", "value": "Yes"}}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
