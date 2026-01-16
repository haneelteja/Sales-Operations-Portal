import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  Customer, 
  SalesTransaction, 
  FactoryPayable, 
  TransportExpense,
  LabelPurchase,
  LabelPayment,
  Order,
  UserManagementRecord
} from "@/types/database";

// Generic error handler
const handleError = (error: Error, toast: { toast: (options: { title: string; description: string; variant?: string }) => void }, operation: string) => {
  console.error(`Error ${operation}:`, error);
  toast.toast({
    title: "Error",
    description: error.message || `Failed to ${operation}`,
    variant: "destructive",
  });
};

// Generic success handler
const handleSuccess = (toast: { toast: (options: { title: string; description: string }) => void }, operation: string) => {
  toast.toast({
    title: "Success",
    description: `${operation} completed successfully`,
  });
};

// Customers hook
export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku, price_per_case, price_per_bottle, contact_person, phone, email, address, is_active, created_at, updated_at")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      
      if (error) throw error;
      return data as Customer[];
    },
    staleTime: 60000,
    cacheTime: 600000,
  });
};

// Sales transactions hook
export const useSalesTransactions = () => {
  return useQuery({
    queryKey: ["sales-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(`
          id,
          customer_id,
          transaction_type,
          amount,
          quantity,
          sku,
          description,
          transaction_date,
          branch,
          total_amount,
          created_at,
          updated_at,
          customers (
            id,
            client_name,
            branch
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (SalesTransaction & { customers: Customer })[];
    },
    staleTime: 30000,
  });
};

// Factory payables hook
export const useFactoryPayables = () => {
  return useQuery({
    queryKey: ["factory-payables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_payables")
        .select("id, customer_id, transaction_type, amount, transaction_date, description, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FactoryPayable[];
    },
    staleTime: 30000,
  });
};

// Transport expenses hook
export const useTransportExpenses = () => {
  return useQuery({
    queryKey: ["transport-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_expenses")
        .select("id, client_id, branch, expense_date, amount, expense_group, description, sku, cases, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TransportExpense[];
    },
    staleTime: 30000,
  });
};

// Label purchases hook
export const useLabelPurchases = () => {
  return useQuery({
    queryKey: ["label-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_purchases")
        .select("id, client_name, sku, quantity, unit_price, total_amount, purchase_date, vendor_id, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LabelPurchase[];
    },
    staleTime: 30000,
  });
};

// Label payments hook
export const useLabelPayments = () => {
  return useQuery({
    queryKey: ["label-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_payments")
        .select("id, vendor_id, amount, payment_date, description, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LabelPayment[];
    },
    staleTime: 30000,
  });
};

// Orders hook
export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, client_name, branch, sku, quantity, status, tentative_delivery_date, tentative_delivery_time, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    staleTime: 30000,
  });
};

// User management hook
export const useUserManagement = () => {
  return useQuery({
    queryKey: ["user-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_management")
        .select("id, user_id, username, email, associated_clients, associated_branches, status, role, created_by, last_login, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "user_management" does not exist')) {
          return []; // Return empty array if table doesn't exist
        }
        throw error;
      }
      return data as UserManagementRecord[];
    },
    staleTime: 60000,
  });
};

// Mutation hooks
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      handleSuccess(toast, "Customer created");
    },
    onError: (error) => handleError(error, toast, "create customer"),
  });
};

export const useCreateSalesTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transactionData: Partial<SalesTransaction>) => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .insert(transactionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      handleSuccess(toast, "Transaction recorded");
    },
    onError: (error) => handleError(error, toast, "record transaction"),
  });
};

export const useCreateFactoryPayable = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payableData: Partial<FactoryPayable>) => {
      const { data, error } = await supabase
        .from("factory_payables")
        .insert(payableData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factory-payables"] });
      handleSuccess(toast, "Factory payable recorded");
    },
    onError: (error) => handleError(error, toast, "record factory payable"),
  });
};

export const useCreateTransportExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseData: Partial<TransportExpense>) => {
      const { data, error } = await supabase
        .from("transport_expenses")
        .insert(expenseData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-expenses"] });
      handleSuccess(toast, "Transport expense recorded");
    },
    onError: (error) => handleError(error, toast, "record transport expense"),
  });
};

export const useCreateLabelPurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (purchaseData: Partial<LabelPurchase>) => {
      const { data, error } = await supabase
        .from("label_purchases")
        .insert(purchaseData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      handleSuccess(toast, "Label purchase recorded");
    },
    onError: (error) => handleError(error, toast, "record label purchase"),
  });
};

export const useCreateLabelPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentData: Partial<LabelPayment>) => {
      const { data, error } = await supabase
        .from("label_payments")
        .insert(paymentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
      handleSuccess(toast, "Label payment recorded");
    },
    onError: (error) => handleError(error, toast, "record label payment"),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      const { data, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      handleSuccess(toast, "Order created");
    },
    onError: (error) => handleError(error, toast, "create order"),
  });
};

// Update mutations
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      handleSuccess(toast, "Customer updated");
    },
    onError: (error) => handleError(error, toast, "update customer"),
  });
};

// Delete mutations
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      handleSuccess(toast, "Customer deleted");
    },
    onError: (error) => handleError(error, toast, "delete customer"),
  });
};

