-- Seed data for development/demo
-- Run after 001_initial_schema.sql

-- Sample employees
INSERT INTO employees (employee_name, employee_id, department, designation, location, manager, email, phone_number, status) VALUES
  ('John Smith', 'EMP001', 'Engineering', 'Senior Developer', 'New York', 'Jane Doe', 'john.smith@company.com', '+1-555-0101', 'active'),
  ('Sarah Johnson', 'EMP002', 'Marketing', 'Marketing Manager', 'San Francisco', 'Mike Wilson', 'sarah.j@company.com', '+1-555-0102', 'active'),
  ('Michael Chen', 'EMP003', 'Finance', 'Financial Analyst', 'Chicago', 'Lisa Park', 'michael.c@company.com', '+1-555-0103', 'active'),
  ('Emily Davis', 'EMP004', 'HR', 'HR Specialist', 'Boston', 'Tom Brown', 'emily.d@company.com', '+1-555-0104', 'active'),
  ('David Wilson', 'EMP005', 'Engineering', 'DevOps Engineer', 'Seattle', 'Jane Doe', 'david.w@company.com', '+1-555-0105', 'active');

-- Sample assets
INSERT INTO assets (asset_name, asset_type, asset_tag, serial_number, brand, model, purchase_date, warranty_expiry, condition, status) VALUES
  ('MacBook Pro 16"', 'Laptop', 'LAP-001', 'C02XL0ABCDEF', 'Apple', 'MacBook Pro 16" M3', '2024-01-15', '2027-01-15', 'new', 'available'),
  ('MacBook Pro 14"', 'Laptop', 'LAP-002', 'C02XL0GHIJKL', 'Apple', 'MacBook Pro 14" M3', '2024-02-20', '2027-02-20', 'new', 'available'),
  ('Dell Monitor 27"', 'Monitor', 'MON-001', 'DL-MON-001', 'Dell', 'U2723QE', '2024-01-10', '2027-01-10', 'new', 'available'),
  ('Dell Monitor 27"', 'Monitor', 'MON-002', 'DL-MON-002', 'Dell', 'U2723QE', '2024-01-10', '2027-01-10', 'new', 'available'),
  ('iPhone 15 Pro', 'Phone', 'PHN-001', 'IPH15-001', 'Apple', 'iPhone 15 Pro', '2024-03-01', '2025-03-01', 'new', 'available'),
  ('Logitech MX Keys', 'Keyboard', 'KEY-001', 'LG-KB-001', 'Logitech', 'MX Keys', '2024-01-05', '2026-01-05', 'new', 'available'),
  ('Logitech MX Master 3', 'Mouse', 'MOU-001', 'LG-MS-001', 'Logitech', 'MX Master 3S', '2024-01-05', '2026-01-05', 'new', 'available'),
  ('ThinkPad X1 Carbon', 'Laptop', 'LAP-003', 'TP-X1-001', 'Lenovo', 'X1 Carbon Gen 11', '2023-06-15', '2026-06-15', 'good', 'available'),
  ('HP LaserJet Pro', 'Printer', 'PRT-001', 'HP-LJ-001', 'HP', 'LaserJet Pro M404', '2023-01-01', '2025-01-01', 'good', 'available'),
  ('iPad Pro 12.9"', 'Tablet', 'TAB-001', 'IPD-001', 'Apple', 'iPad Pro 12.9" M2', '2024-04-01', '2026-04-01', 'new', 'available');
