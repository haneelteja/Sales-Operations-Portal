/**
 * Database and API types (re-exports and DB-specific shapes)
 */

export type {
  Customer,
  SalesTransaction,
  FactoryPayable,
  TransportExpense,
  LabelPurchase,
} from "./index";

export interface LabelPayment {
  id: string;
  vendor_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  client: string;
  customer_id: string | null;
  branch: string | null;
  order_date: string | null;
  sku: string;
  number_of_cases: number;
  tentative_delivery_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserManagementRecord {
  id: string;
  user_id: string;
  username: string;
  email: string;
  associated_clients: string[];
  associated_branches: string[];
  status: "active" | "inactive" | "pending";
  role: "admin" | "manager" | "client";
  created_by: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}
