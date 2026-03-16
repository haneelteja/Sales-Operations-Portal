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
          area: string | null
          dealer_name: string
          created_at: string
          gst_number: string | null
          id: string
          is_active: boolean
          price_per_bottle: number | null
          price_per_case: number | null
          pricing_date: string | null
          sku: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          area?: string | null
          dealer_name: string
          created_at?: string
          gst_number?: string | null
          id?: string
          is_active?: boolean
          price_per_bottle?: number | null
          price_per_case?: number | null
          pricing_date?: string | null
          sku?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          area?: string | null
          dealer_name?: string
          created_at?: string
          gst_number?: string | null
          id?: string
          is_active?: boolean
          price_per_bottle?: number | null
          price_per_case?: number | null
          pricing_date?: string | null
          sku?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      factory_payables: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
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
          created_at?: string
          customer_id?: string | null
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
          created_at?: string
          customer_id?: string | null
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
            foreignKeyName: "factory_payables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      production: {
        Row: {
          id: string
          production_date: string
          sku: string
          no_of_cases: number
          created_at: string | null
        }
        Insert: {
          id?: string
          production_date: string
          sku: string
          no_of_cases: number
          created_at?: string | null
        }
        Update: {
          id?: string
          production_date?: string
          sku?: string
          no_of_cases?: number
          created_at?: string | null
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
          area: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          quantity: number | null
          sku: string | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          area?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          quantity?: number | null
          sku?: string | null
          total_amount: number
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          area?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          quantity?: number | null
          sku?: string | null
          total_amount?: number
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
          area: string | null
          client_id: string | null
          created_at: string
          description: string
          expense_date: string
          expense_group: string | null
          id: string
          transport_vendor: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          area?: string | null
          client_id?: string | null
          created_at?: string
          description: string
          expense_date?: string
          expense_group?: string | null
          id?: string
          transport_vendor?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          area?: string | null
          client_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          expense_group?: string | null
          id?: string
          transport_vendor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      material_purchases: {
        Row: {
          id: string
          item: string
          quantity: number
          cost_per_unit: number
          total_amount: number
          vendor: string | null
          description: string | null
          purchase_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item: string
          quantity: number
          cost_per_unit: number
          total_amount: number
          vendor?: string | null
          description?: string | null
          purchase_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item?: string
          quantity?: number
          cost_per_unit?: number
          total_amount?: number
          vendor?: string | null
          description?: string | null
          purchase_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          execution_duration_ms: number | null
          failure_reason: string | null
          file_name: string
          file_size_bytes: number | null
          google_drive_file_id: string | null
          google_drive_path: string | null
          id: string
          started_at: string
          status: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          execution_duration_ms?: number | null
          failure_reason?: string | null
          file_name: string
          file_size_bytes?: number | null
          google_drive_file_id?: string | null
          google_drive_path?: string | null
          id?: string
          started_at?: string
          status: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          execution_duration_ms?: number | null
          failure_reason?: string | null
          file_name?: string
          file_size_bytes?: number | null
          google_drive_file_id?: string | null
          google_drive_path?: string | null
          id?: string
          started_at?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_configurations: {
        Row: {
          config_key: string
          config_type: string
          config_value: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_type: string
          config_value: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_type?: string
          config_value?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string
          due_date: string | null
          folder_path: string | null
          id: string
          invoice_date: string
          invoice_number: string
          last_regenerated_at: string | null
          pdf_file_id: string | null
          pdf_file_url: string | null
          status: string
          storage_provider: string | null
          transaction_id: string
          updated_at: string
          word_file_id: string | null
          word_file_url: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          due_date?: string | null
          folder_path?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          last_regenerated_at?: string | null
          pdf_file_id?: string | null
          pdf_file_url?: string | null
          status?: string
          storage_provider?: string | null
          transaction_id: string
          updated_at?: string
          word_file_id?: string | null
          word_file_url?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          due_date?: string | null
          folder_path?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          last_regenerated_at?: string | null
          pdf_file_id?: string | null
          pdf_file_url?: string | null
          status?: string
          storage_provider?: string | null
          transaction_id?: string
          updated_at?: string
          word_file_id?: string | null
          word_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      label_availabilities: {
        Row: {
          available_quantity: number
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          last_updated: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_updated?: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_updated?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_availabilities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      label_payments: {
        Row: {
          created_at: string
          id: string
          payment_amount: number
          payment_date: string
          payment_method: string
          updated_at: string
          vendor: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_amount: number
          payment_date?: string
          payment_method: string
          updated_at?: string
          vendor: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          area: string | null
          client: string
          created_at: string
          date: string | null
          id: string
          number_of_cases: number
          sku: string
          status: string
          tentative_delivery_date: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          client: string
          created_at?: string
          date?: string | null
          id?: string
          number_of_cases: number
          sku: string
          status?: string
          tentative_delivery_date?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          client?: string
          created_at?: string
          date?: string | null
          id?: string
          number_of_cases?: number
          sku?: string
          status?: string
          tentative_delivery_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders_dispatch: {
        Row: {
          area: string | null
          cases: number
          client: string
          created_at: string
          delivery_date: string | null
          id: string
          sku: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          cases: number
          client: string
          created_at?: string
          delivery_date?: string | null
          id?: string
          sku: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          cases?: number
          client?: string
          created_at?: string
          delivery_date?: string | null
          id?: string
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          filter: Json
          id: string
          is_default: boolean
          is_shared: boolean
          module: string
          name: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          module: string
          name: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          module?: string
          name?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_management: {
        Row: {
          associated_areas: string[] | null
          associated_dealers: string[] | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_login: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          associated_areas?: string[] | null
          associated_dealers?: string[] | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          last_login?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          associated_areas?: string[] | null
          associated_dealers?: string[] | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_login?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      whatsapp_message_logs: {
        Row: {
          api_response: Json | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_name: string
          failure_reason: string | null
          id: string
          max_retries: number
          message_content: string | null
          message_type: string
          retry_count: number
          scheduled_for: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          trigger_type: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          api_response?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_name: string
          failure_reason?: string | null
          id?: string
          max_retries?: number
          message_content?: string | null
          message_type: string
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          trigger_type: string
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          api_response?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_name?: string
          failure_reason?: string | null
          id?: string
          max_retries?: number
          message_content?: string | null
          message_type?: string
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          trigger_type?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          message_type: string
          placeholders: string[] | null
          template_content: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          message_type: string
          placeholders?: string[] | null
          template_content: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          message_type?: string
          placeholders?: string[] | null
          template_content?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_customer_receivables: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_id: string
          customer_name: string
          area: string
          total_sales: number
          total_payments: number
          outstanding: number
          transaction_count: number
        }[]
      }
      get_orders_sorted: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          date: string
          client: string
          area: string
          sku: string
          number_of_cases: number
          tentative_delivery_date: string
          status: string
          created_at: string
          updated_at: string
        }[]
      }
      ping: {
        Args: Record<string, never>
        Returns: number
      }
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
      user_has_data_access: {
        Args: {
          table_name: string
          dealer_name?: string
          area_name?: string
        }
        Returns: boolean
      }
      user_has_access_to_dealer_area: {
        Args: {
          dealer_name: string
          area_name: string
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
