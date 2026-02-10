// Database table types
export interface Customer {
  id: string;
  dealer_name: string;
  area: string | null;
  sku: string | null;
  price_per_case: number | null;
  price_per_bottle: number | null;
  whatsapp_number: string | null;
  gst_number?: string | null;
  pricing_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesTransaction {
  id: string;
  customer_id: string;
  amount: number;
  total_amount?: number; // Added to match database schema
  quantity: number | null;
  sku: string | null;
  description: string | null;
  transaction_date: string;
  transaction_type: string;
  area: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    dealer_name: string;
    area: string | null;
  };
}

export interface FactoryPayable {
  id: string;
  amount: number;
  quantity: number | null;
  sku: string | null;
  description: string | null;
  customer_id?: string | null;
  dealer_name?: string | null;
  area?: string | null;
  transaction_date: string;
  transaction_type: string;
  created_at: string;
  updated_at: string;
  customers?: {
    id: string;
    dealer_name: string;
    area: string;
  };
}

export interface FactoryPricing {
  id: string;
  sku: string;
  price_per_bottle: number;
  cost_per_case: number | null;
  bottles_per_case: number;
  tax: number | null;
  pricing_date: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface SkuConfiguration {
  id: string;
  sku: string;
  cost_per_bottle: number;
  cost_per_case: number | null;
  bottles_per_case: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface TransportExpense {
  id: string;
  amount: number;
  description: string;
  expense_date: string;
  expense_group: string | null;
  client_id?: string | null;
  dealer_name?: string | null;
  area?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabelPurchase {
  id: string;
  vendor_id: string; // Stores vendor name as text
  client_id: string | null;
  sku: string | null;
  quantity: number;
  cost_per_label: number;
  total_amount: number;
  purchase_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabelDesignCost {
  id: string;
  customer_id: string;
  cost: number;
  design_date: string;
  design_description: string;
  created_at: string;
  updated_at: string;
}

export interface LabelVendor {
  id: string;
  vendor_name: string;
  label_type: string | null;
  price_per_label: number | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  transaction_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string | null;
  word_file_id: string | null;
  pdf_file_id: string | null;
  word_file_url: string | null;
  pdf_file_url: string | null;
  storage_provider: 'google_drive' | 'onedrive';
  folder_path: string | null;
  status: 'generated' | 'sent' | 'paid' | 'cancelled';
  last_regenerated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Form types
export interface SaleForm {
  customer_id: string;
  amount: string;
  quantity: string;
  sku: string;
  description: string;
  transaction_date: string;
  area: string;
}

export interface PaymentForm {
  customer_id: string;
  area: string;
  amount: string;
  description: string;
  transaction_date: string;
}

export interface CustomerForm {
  dealer_name: string;
  area: string;
  sku: string;
  price_per_case: string;
  price_per_bottle: string;
}

export interface FactoryProductionForm {
  sku: string;
  quantity: string;
  description: string;
  transaction_date: string;
}

export interface FactoryPaymentForm {
  amount: string;
  description: string;
  transaction_date: string;
}

export interface TransportExpenseForm {
  expense_date: string;
  expense_group: string;
  description: string;
  amount: string;
  client_id: string;
  area: string;
  sku?: string;
  no_of_cases?: string;
}

export interface LabelPurchaseForm {
  vendor_id: string; // This will contain vendor name as text
  client_id: string;
  sku: string;
  quantity: string;
  cost_per_label: string;
  total_amount: string;
  purchase_date: string;
  description: string;
}

// Report types
export interface FinancialSummary {
  totalSales: number;
  totalPayments: number;
  outstanding: number;
}

export interface FactorySummary {
  totalProduction: number;
  totalPayments: number;
  outstanding: number;
}

export interface ReceivableData {
  customer: Customer;
  totalSales: number;
  totalPayments: number;
  outstanding: number;
  transactions: SalesTransaction[];
}

// Mutation function types
export type MutationFunction<T> = (data: T) => Promise<void>;
export type MutationError = Error & { message: string };
