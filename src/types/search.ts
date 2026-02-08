// Enhanced Search & Filtering System Types

export type SearchModule = 
  | 'sales_transactions'
  | 'orders'
  | 'customers'
  | 'user_management'
  | 'factory_payables'
  | 'transport_expenses'
  | 'label_purchases'
  | 'label_payments'
  | 'sku_configurations'
  | 'factory_pricing';

export type SearchOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export type FilterLogic = 'AND' | 'OR';

export interface SearchField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  searchable: boolean;
  filterable: boolean;
  operators?: SearchOperator[];
  options?: { label: string; value: string }[];
}

export interface FilterCondition {
  field: string;
  operator: SearchOperator;
  value: string | number | boolean | string[] | null;
  value2?: string | number | null; // For 'between' operator
}

export interface SearchFilter {
  id?: string;
  conditions: FilterCondition[];
  logic: FilterLogic;
  module: SearchModule;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  module: SearchModule;
  filter: SearchFilter;
  is_shared: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface SearchQuery {
  query?: string; // Full-text search query
  filters?: SearchFilter;
  modules?: SearchModule[]; // For cross-module search
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  highlight?: boolean;
}

export interface SearchResult<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  highlights?: Record<string, string[]>; // Field -> highlighted snippets
  facets?: FacetResult[];
}

export interface FacetResult {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

export interface BulkOperation {
  id: string;
  type: 'update' | 'delete' | 'archive' | 'export' | 'assign';
  module: SearchModule;
  recordIds: string[];
  payload?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  errors?: Array<{ recordId: string; error: string }>;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface SearchConfig {
  module: SearchModule;
  fields: SearchField[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  defaultFilters?: SearchFilter;
  enableFullTextSearch?: boolean;
  enableFacets?: boolean;
  maxResults?: number;
}

// Field configurations for each module
export const SEARCH_CONFIGS: Record<SearchModule, SearchConfig> = {
  sales_transactions: {
    module: 'sales_transactions',
    fields: [
      { name: 'customer_id', label: 'Customer', type: 'select', searchable: true, filterable: true },
      { name: 'sku', label: 'SKU', type: 'text', searchable: true, filterable: true },
      { name: 'transaction_type', label: 'Type', type: 'select', searchable: false, filterable: true, 
        options: [{ label: 'Sale', value: 'sale' }, { label: 'Payment', value: 'payment' }] },
      { name: 'amount', label: 'Amount', type: 'number', searchable: false, filterable: true },
      { name: 'transaction_date', label: 'Date', type: 'date', searchable: false, filterable: true },
      { name: 'description', label: 'Description', type: 'text', searchable: true, filterable: true },
    ],
    defaultSort: { field: 'transaction_date', order: 'desc' },
    enableFullTextSearch: true,
    enableFacets: true,
  },
  orders: {
    module: 'orders',
    fields: [
      { name: 'client', label: 'Client', type: 'text', searchable: true, filterable: true },
      { name: 'branch', label: 'Branch', type: 'text', searchable: true, filterable: true },
      { name: 'sku', label: 'SKU', type: 'text', searchable: true, filterable: true },
      { name: 'status', label: 'Status', type: 'select', searchable: false, filterable: true,
        options: [{ label: 'Pending', value: 'pending' }, { label: 'Dispatched', value: 'dispatched' }] },
      { name: 'tentative_delivery_date', label: 'Delivery Date', type: 'date', searchable: false, filterable: true },
      { name: 'quantity', label: 'Quantity', type: 'number', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'created_at', order: 'desc' },
    enableFullTextSearch: true,
  },
  customers: {
    module: 'customers',
    fields: [
      { name: 'client_name', label: 'Client Name', type: 'text', searchable: true, filterable: true },
      { name: 'branch', label: 'Branch', type: 'text', searchable: true, filterable: true },
      { name: 'contact_person', label: 'Contact Person', type: 'text', searchable: true, filterable: true },
      { name: 'email', label: 'Email', type: 'text', searchable: true, filterable: true },
      { name: 'phone', label: 'Phone', type: 'text', searchable: true, filterable: true },
      { name: 'is_active', label: 'Active', type: 'boolean', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'client_name', order: 'asc' },
    enableFullTextSearch: true,
  },
  user_management: {
    module: 'user_management',
    fields: [
      { name: 'username', label: 'Username', type: 'text', searchable: true, filterable: true },
      { name: 'email', label: 'Email', type: 'text', searchable: true, filterable: true },
      { name: 'role', label: 'Role', type: 'select', searchable: false, filterable: true,
        options: [{ label: 'Admin', value: 'admin' }, { label: 'Manager', value: 'manager' }, { label: 'Client', value: 'client' }] },
      { name: 'status', label: 'Status', type: 'select', searchable: false, filterable: true,
        options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Pending', value: 'pending' }] },
    ],
    defaultSort: { field: 'created_at', order: 'desc' },
    enableFullTextSearch: true,
  },
  factory_payables: {
    module: 'factory_payables',
    fields: [
      { name: 'description', label: 'Description', type: 'text', searchable: true, filterable: true },
      { name: 'transaction_type', label: 'Type', type: 'select', searchable: false, filterable: true,
        options: [{ label: 'Production', value: 'production' }, { label: 'Payment', value: 'payment' }] },
      { name: 'amount', label: 'Amount', type: 'number', searchable: false, filterable: true },
      { name: 'transaction_date', label: 'Date', type: 'date', searchable: false, filterable: true },
      { name: 'sku', label: 'SKU', type: 'text', searchable: true, filterable: true },
    ],
    defaultSort: { field: 'transaction_date', order: 'desc' },
    enableFullTextSearch: true,
  },
  transport_expenses: {
    module: 'transport_expenses',
    fields: [
      { name: 'expense_group', label: 'Expense Group', type: 'text', searchable: true, filterable: true },
      { name: 'description', label: 'Description', type: 'text', searchable: true, filterable: true },
      { name: 'amount', label: 'Amount', type: 'number', searchable: false, filterable: true },
      { name: 'expense_date', label: 'Date', type: 'date', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'expense_date', order: 'desc' },
    enableFullTextSearch: true,
  },
  label_purchases: {
    module: 'label_purchases',
    fields: [
      { name: 'vendor_id', label: 'Vendor', type: 'text', searchable: true, filterable: true },
      { name: 'sku', label: 'SKU', type: 'text', searchable: true, filterable: true },
      { name: 'quantity', label: 'Quantity', type: 'number', searchable: false, filterable: true },
      { name: 'total_amount', label: 'Amount', type: 'number', searchable: false, filterable: true },
      { name: 'purchase_date', label: 'Purchase Date', type: 'date', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'purchase_date', order: 'desc' },
    enableFullTextSearch: true,
  },
  label_payments: {
    module: 'label_payments',
    fields: [
      { name: 'vendor', label: 'Vendor', type: 'text', searchable: true, filterable: true },
      { name: 'payment_amount', label: 'Amount', type: 'number', searchable: false, filterable: true },
      { name: 'payment_method', label: 'Payment Method', type: 'text', searchable: true, filterable: true },
      { name: 'payment_date', label: 'Payment Date', type: 'date', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'payment_date', order: 'desc' },
    enableFullTextSearch: true,
  },
  sku_configurations: {
    module: 'sku_configurations',
    fields: [
      { name: 'sku', label: 'SKU', type: 'text', searchable: true, filterable: true },
      { name: 'bottles_per_case', label: 'Bottles per Case', type: 'number', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'sku', order: 'asc' },
    enableFullTextSearch: true,
  },
  factory_pricing: {
    module: 'factory_pricing',
    fields: [
      { name: 'sku', label: 'SKU', type: 'text', searchable: true, filterable: true },
      { name: 'price_per_case', label: 'Price per Case', type: 'number', searchable: false, filterable: true },
      { name: 'price_per_bottle', label: 'Price per Bottle', type: 'number', searchable: false, filterable: true },
      { name: 'pricing_date', label: 'Pricing Date', type: 'date', searchable: false, filterable: true },
    ],
    defaultSort: { field: 'pricing_date', order: 'desc' },
    enableFullTextSearch: true,
  },
};
