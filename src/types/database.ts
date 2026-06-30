export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_by: string | null
          assigned_date: string
          created_at: string
          employee_id: string
          id: string
          is_active: boolean
          remarks: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          assigned_by?: string | null
          assigned_date?: string
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          assigned_by?: string | null
          assigned_date?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_history: {
        Row: {
          action: Database["public"]["Enums"]["history_action"]
          asset_id: string | null
          created_at: string
          current_holder_id: string | null
          date: string
          employee_id: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          previous_holder_id: string | null
          remarks: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["history_action"]
          asset_id?: string | null
          created_at?: string
          current_holder_id?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          previous_holder_id?: string | null
          remarks?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["history_action"]
          asset_id?: string | null
          created_at?: string
          current_holder_id?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          previous_holder_id?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_current_holder_id_fkey"
            columns: ["current_holder_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_previous_holder_id_fkey"
            columns: ["previous_holder_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_name: string
          asset_tag: string
          asset_type: string
          brand: string | null
          condition: Database["public"]["Enums"]["asset_condition"]
          created_at: string
          current_holder_id: string | null
          id: string
          model: string | null
          purchase_date: string | null
          remarks: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_name: string
          asset_tag: string
          asset_type: string
          brand?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          current_holder_id?: string | null
          id?: string
          model?: string | null
          purchase_date?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_name?: string
          asset_tag?: string
          asset_type?: string
          brand?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          current_holder_id?: string | null
          id?: string
          model?: string | null
          purchase_date?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_current_holder_id_fkey"
            columns: ["current_holder_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          designation: string
          email: string
          employee_id: string
          employee_name: string
          id: string
          location: string
          manager: string | null
          phone_number: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          designation: string
          email: string
          employee_id: string
          employee_name: string
          id?: string
          location: string
          manager?: string | null
          phone_number?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          designation?: string
          email?: string
          employee_id?: string
          employee_name?: string
          id?: string
          location?: string
          manager?: string | null
          phone_number?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Relationships: []
      }
      form_assets: {
        Row: {
          asset_id: string
          condition: Database["public"]["Enums"]["asset_condition"] | null
          created_at: string
          form_id: string
          id: string
          old_asset_id: string | null
          remarks: string | null
          verified: boolean | null
        }
        Insert: {
          asset_id: string
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string
          form_id: string
          id?: string
          old_asset_id?: string | null
          remarks?: string | null
          verified?: boolean | null
        }
        Update: {
          asset_id?: string
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string
          form_id?: string
          id?: string
          old_asset_id?: string | null
          remarks?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "form_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_assets_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_assets_old_asset_id_fkey"
            columns: ["old_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          employee_signature: string
          form_id: string
          id: string
          ip_address: string | null
          pdf_url: string | null
          signature_type: string
          submission_data: Json
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          employee_signature: string
          form_id: string
          id?: string
          ip_address?: string | null
          pdf_url?: string | null
          signature_type?: string
          submission_data?: Json
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          employee_signature?: string
          form_id?: string
          id?: string
          ip_address?: string | null
          pdf_url?: string | null
          signature_type?: string
          submission_data?: Json
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: true
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          action_type: Database["public"]["Enums"]["form_action_type"]
          created_at: string
          created_by: string | null
          employee_id: string
          expires_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["form_status"]
          token: string
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["form_action_type"]
          created_at?: string
          created_by?: string | null
          employee_id: string
          expires_at: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["form_status"]
          token: string
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["form_action_type"]
          created_at?: string
          created_by?: string | null
          employee_id?: string
          expires_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["form_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      verification_corrections: {
        Row: {
          admin_approved: boolean | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          applied: boolean
          asset_id: string
          created_at: string
          employee_reported: boolean
          form_id: string
          id: string
          reported_condition:
            | Database["public"]["Enums"]["asset_condition"]
            | null
          reported_remarks: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          applied?: boolean
          asset_id: string
          created_at?: string
          employee_reported: boolean
          form_id: string
          id?: string
          reported_condition?:
            | Database["public"]["Enums"]["asset_condition"]
            | null
          reported_remarks?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          applied?: boolean
          asset_id?: string
          created_at?: string
          employee_reported?: boolean
          form_id?: string
          id?: string
          reported_condition?:
            | Database["public"]["Enums"]["asset_condition"]
            | null
          reported_remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_corrections_admin_reviewed_by_fkey"
            columns: ["admin_reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_corrections_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_corrections_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_pending_forms: { Args: never; Returns: undefined }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_internal_user: { Args: never; Returns: boolean }
    }
    Enums: {
      asset_condition: "new" | "good" | "damaged" | "lost"
      asset_status: "available" | "assigned" | "repair" | "lost" | "returned"
      employee_status: "active" | "inactive" | "resigned" | "on_leave"
      form_action_type:
        | "onboarding"
        | "exchange"
        | "return"
        | "verification"
        | "current_verification"
      form_status: "pending" | "completed" | "expired" | "approved" | "rejected"
      history_action:
        | "onboarding"
        | "exchange"
        | "return"
        | "verification"
        | "assignment"
        | "unassignment"
        | "status_change"
        | "correction"
      user_role: "admin" | "it" | "hr"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_condition: ["new", "good", "damaged", "lost"],
      asset_status: ["available", "assigned", "repair", "lost", "returned"],
      employee_status: ["active", "inactive", "resigned", "on_leave"],
      form_action_type: [
        "onboarding",
        "exchange",
        "return",
        "verification",
        "current_verification",
      ],
      form_status: ["pending", "completed", "expired", "approved", "rejected"],
      history_action: [
        "onboarding",
        "exchange",
        "return",
        "verification",
        "assignment",
        "unassignment",
        "status_change",
        "correction",
      ],
      user_role: ["admin", "it", "hr"],
    },
  },
} as const
