export type UserRole = "admin" | "it" | "hr";
export type EmployeeStatus = "active" | "inactive" | "resigned" | "on_leave";
export type AssetCondition = "new" | "good" | "damaged" | "lost";
export type AssetStatus = "available" | "assigned" | "repair" | "lost" | "returned";
export type FormActionType = "onboarding" | "exchange" | "return" | "verification";
export type FormStatus = "pending" | "completed" | "expired";
export type HistoryAction =
  | "onboarding"
  | "exchange"
  | "return"
  | "verification"
  | "assignment"
  | "unassignment"
  | "status_change"
  | "correction";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  employee_name: string;
  employee_id: string;
  department: string;
  designation: string;
  location: string;
  manager?: string;
  email: string;
  phone_number?: string;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  asset_tag: string;
  serial_number?: string;
  brand?: string;
  model?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  condition: AssetCondition;
  status: AssetStatus;
  current_holder_id?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  current_holder?: Employee;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  assigned_by?: string;
  is_active: boolean;
  remarks?: string;
  created_at: string;
  updated_at: string;
  asset?: Asset;
  employee?: Employee;
}

export interface AssetHistory {
  id: string;
  date: string;
  employee_id?: string;
  asset_id?: string;
  action: HistoryAction;
  previous_holder_id?: string;
  current_holder_id?: string;
  performed_by?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  employee?: Employee;
  asset?: Asset;
  previous_holder?: Employee;
  current_holder?: Employee;
  performer?: User;
}

export interface Form {
  id: string;
  token: string;
  employee_id: string;
  action_type: FormActionType;
  status: FormStatus;
  expires_at: string;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  form_assets?: FormAsset[];
  submission?: FormSubmission;
}

export interface FormAsset {
  id: string;
  form_id: string;
  asset_id: string;
  old_asset_id?: string;
  condition?: AssetCondition;
  remarks?: string;
  verified?: boolean;
  created_at: string;
  asset?: Asset;
  old_asset?: Asset;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  employee_signature: string;
  signature_type: "draw" | "type";
  submission_data: Record<string, unknown>;
  pdf_url?: string;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface VerificationCorrection {
  id: string;
  form_id: string;
  asset_id: string;
  employee_reported: boolean;
  reported_condition?: AssetCondition;
  reported_remarks?: string;
  admin_approved?: boolean;
  admin_reviewed_by?: string;
  admin_reviewed_at?: string;
  applied: boolean;
  created_at: string;
  asset?: Asset;
}

export interface DashboardStats {
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  damagedAssets: number;
  lostAssets: number;
  totalEmployees: number;
  pendingForms: number;
  completedForms: number;
}

export interface Notification {
  id: string;
  type: "pending_response" | "expired_link" | "completed_form" | "warranty_expiry";
  title: string;
  message: string;
  link?: string;
  created_at: string;
}
