// Database table types for Elma Operations Portal

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_management: {
        Row: {
          id: string;
          user_id: string | null;
          username: string;
          email: string;
          associated_clients: string[];
          associated_branches: string[];
          status: string;
          role: 'admin' | 'manager' | 'client';
          created_by: string | null;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          username: string;
          email: string;
          associated_clients?: string[];
          associated_branches?: string[];
          status?: string;
          role: 'admin' | 'manager' | 'client';
          created_by?: string | null;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          username?: string;
          email?: string;
          associated_clients?: string[];
          associated_branches?: string[];
          status?: string;
          role?: 'admin' | 'manager' | 'client';
          created_by?: string | null;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          client_name: string;
          branch: string | null;
          sku: string | null;
          price_per_case: number | null;
          price_per_bottle: number | null;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          branch?: string | null;
          sku?: string | null;
          price_per_case?: number | null;
          price_per_bottle?: number | null;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_name?: string;
          branch?: string | null;
          sku?: string | null;
          price_per_case?: number | null;
          price_per_bottle?: number | null;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sku_configurations: {
        Row: {
          id: string;
          sku: string;
          bottles_per_case: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          bottles_per_case: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          bottles_per_case?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_transactions: {
        Row: {
          id: string;
          customer_id: string;
          transaction_type: 'sale' | 'payment';
          amount: number;
          quantity: number | null;
          sku: string | null;
          description: string | null;
          transaction_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          transaction_type: 'sale' | 'payment';
          amount: number;
          quantity?: number | null;
          sku?: string | null;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          transaction_type?: 'sale' | 'payment';
          amount?: number;
          quantity?: number | null;
          sku?: string | null;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      factory_payables: {
        Row: {
          id: string;
          transaction_type: 'production' | 'payment';
          amount: number;
          quantity: number | null;
          sku: string | null;
          customer_id: string | null;
          description: string | null;
          transaction_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_type: 'production' | 'payment';
          amount: number;
          quantity?: number | null;
          sku?: string | null;
          customer_id?: string | null;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_type?: 'production' | 'payment';
          amount?: number;
          quantity?: number | null;
          sku?: string | null;
          customer_id?: string | null;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transport_expenses: {
        Row: {
          id: string;
          expense_group: string;
          amount: number;
          description: string | null;
          transaction_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          expense_group: string;
          amount: number;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          expense_group?: string;
          amount?: number;
          description?: string | null;
          transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      label_vendors: {
        Row: {
          id: string;
          vendor_name: string;
          label_type: string | null;
          price_per_label: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_name: string;
          label_type?: string | null;
          price_per_label?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_name?: string;
          label_type?: string | null;
          price_per_label?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      label_purchases: {
        Row: {
          id: string;
          vendor_id: string;
          client_id: string | null;
          sku: string | null;
          quantity: number;
          cost_per_label: number;
          total_amount: number;
          purchase_date: string;
          description: string | null;
          payment_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          client_id?: string | null;
          sku?: string | null;
          quantity: number;
          cost_per_label: number;
          total_amount: number;
          purchase_date?: string;
          description?: string | null;
          payment_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          client_id?: string | null;
          sku?: string | null;
          quantity?: number;
          cost_per_label?: number;
          total_amount?: number;
          purchase_date?: string;
          description?: string | null;
          payment_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      label_payments: {
        Row: {
          id: string;
          vendor: string;
          payment_amount: number;
          payment_date: string;
          payment_method: 'Cash' | 'Bank Transfer' | 'UPI';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor: string;
          payment_amount: number;
          payment_date?: string;
          payment_method: 'Cash' | 'Bank Transfer' | 'UPI';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor?: string;
          payment_amount?: number;
          payment_date?: string;
          payment_method?: 'Cash' | 'Bank Transfer' | 'UPI';
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          client: string;
          branch: string;
          sku: string;
          number_of_cases: number;
          tentative_delivery_date: string;
          status: 'pending' | 'dispatched' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client: string;
          branch: string;
          sku: string;
          number_of_cases: number;
          tentative_delivery_date: string;
          status?: 'pending' | 'dispatched' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client?: string;
          branch?: string;
          sku?: string;
          number_of_cases?: number;
          tentative_delivery_date?: string;
          status?: 'pending' | 'dispatched' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      factory_pricing: {
        Row: {
          id: string;
          sku: string;
          price_per_case: number;
          pricing_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          price_per_case: number;
          pricing_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          price_per_case?: number;
          pricing_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Type aliases for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserManagementRecord = Database['public']['Tables']['user_management']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type SKUConfiguration = Database['public']['Tables']['sku_configurations']['Row'];
export type SalesTransaction = Database['public']['Tables']['sales_transactions']['Row'];
export type FactoryPayable = Database['public']['Tables']['factory_payables']['Row'];
export type TransportExpense = Database['public']['Tables']['transport_expenses']['Row'];
export type LabelVendor = Database['public']['Tables']['label_vendors']['Row'];
export type LabelPurchase = Database['public']['Tables']['label_purchases']['Row'];
export type LabelPayment = Database['public']['Tables']['label_payments']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type FactoryPricing = Database['public']['Tables']['factory_pricing']['Row'];

// Form types
export interface SaleForm {
  customer_id: string;
  amount: string;
  quantity: string;
  sku: string;
  description: string;
  transaction_date: string;
  branch: string;
}

export interface PaymentForm {
  customer_id: string;
  branch: string;
  amount: string;
  description: string;
  transaction_date: string;
}

export interface CustomerForm {
  client_name: string;
  branch: string;
  sku: string;
  price_per_case: string;
  price_per_bottle: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}


