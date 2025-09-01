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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      adjustments: {
        Row: {
          adjustment_date: string
          adjustment_type: string
          amount: number
          created_at: string
          description: string
          id: string
          updated_at: string
        }
        Insert: {
          adjustment_date?: string
          adjustment_type: string
          amount: number
          created_at?: string
          description: string
          id?: string
          updated_at?: string
        }
        Update: {
          adjustment_date?: string
          adjustment_type?: string
          amount?: number
          created_at?: string
          description?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          branch: string | null
          client_name: string
          created_at: string
          id: string
          price_per_bottle: number | null
          price_per_case: number | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          branch?: string | null
          client_name: string
          created_at?: string
          id?: string
          price_per_bottle?: number | null
          price_per_case?: number | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          branch?: string | null
          client_name?: string
          created_at?: string
          id?: string
          price_per_bottle?: number | null
          price_per_case?: number | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      factory_payables: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          quantity: number | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          quantity?: number | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          quantity?: number | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      factory_pricing: {
        Row: {
          bottles_per_case: number
          cost_per_case: number | null
          created_at: string | null
          id: string
          price_per_bottle: number
          pricing_date: string
          sku: string
          tax: number | null
          updated_at: string | null
        }
        Insert: {
          bottles_per_case?: number
          cost_per_case?: number | null
          created_at?: string | null
          id?: string
          price_per_bottle: number
          pricing_date?: string
          sku: string
          tax?: number | null
          updated_at?: string | null
        }
        Update: {
          bottles_per_case?: number
          cost_per_case?: number | null
          created_at?: string | null
          id?: string
          price_per_bottle?: number
          pricing_date?: string
          sku?: string
          tax?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      label_design_costs: {
        Row: {
          cost: number
          created_at: string
          customer_id: string
          design_date: string
          design_description: string
          id: string
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          customer_id: string
          design_date?: string
          design_description: string
          id?: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          customer_id?: string
          design_date?: string
          design_description?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_design_costs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      label_purchases: {
        Row: {
          client_id: string | null
          cost_per_label: number
          created_at: string
          description: string | null
          id: string
          payment_amount: number | null
          purchase_date: string
          quantity: number
          sku: string | null
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          client_id?: string | null
          cost_per_label: number
          created_at?: string
          description?: string | null
          id?: string
          payment_amount?: number | null
          purchase_date?: string
          quantity: number
          sku?: string | null
          total_amount: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          client_id?: string | null
          cost_per_label?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_amount?: number | null
          purchase_date?: string
          quantity?: number
          sku?: string | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_purchases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "label_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      label_vendors: {
        Row: {
          created_at: string
          id: string
          label_type: string | null
          price_per_label: number | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_type?: string | null
          price_per_label?: number | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          id?: string
          label_type?: string | null
          price_per_label?: number | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          amount: number
          branch: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          quantity: number | null
          sku: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          quantity?: number | null
          sku?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          quantity?: number | null
          sku?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_configurations: {
        Row: {
          bottles_per_case: number
          cost_per_bottle: number
          cost_per_case: number | null
          created_at: string | null
          id: string
          sku: string
          updated_at: string | null
        }
        Insert: {
          bottles_per_case: number
          cost_per_bottle: number
          cost_per_case?: number | null
          created_at?: string | null
          id?: string
          sku: string
          updated_at?: string | null
        }
        Update: {
          bottles_per_case?: number
          cost_per_bottle?: number
          cost_per_case?: number | null
          created_at?: string | null
          id?: string
          sku?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transport_expenses: {
        Row: {
          amount: number
          branch: string | null
          client_id: string | null
          created_at: string
          description: string
          expense_date: string
          expense_group: string | null
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch?: string | null
          client_id?: string | null
          created_at?: string
          description: string
          expense_date?: string
          expense_group?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch?: string | null
          client_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          expense_group?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role_or_higher: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee" | "viewer"
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
      app_role: ["admin", "manager", "employee", "viewer"],
    },
  },
} as const
