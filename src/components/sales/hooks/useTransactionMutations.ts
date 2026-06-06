import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useToast } from '@/hooks/use-toast';
import { isAutoInvoiceEnabled } from '@/services/invoiceConfigService';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { Customer, PaymentForm, SaleForm, SalesTransaction } from '@/types';

type CustomerDirectoryRecord = {
  id: string;
  client_name?: string | null;
  branch?: string | null;
};

type InvoiceGenerationArgs = {
  transactionId: string;
  transaction: SalesTransaction;
  customer: Customer;
};

type UseTransactionMutationsOptions = {
  editingTransaction: SalesTransaction | null;
  findCustomerById: (customerId?: string) => CustomerDirectoryRecord | undefined;
  getCustomerName: (customer?: CustomerDirectoryRecord | null) => string;
  getTransactionBranch: (
    transaction?: Pick<SalesTransaction, 'area' | 'customers'> & { branch?: string | null } | null
  ) => string;
  buildTransportDescription: (
    customer?: CustomerDirectoryRecord | null,
    fallbackBranch?: string
  ) => string;
  resolveCustomerIdForBranch: (customerId?: string, branch?: string) => string | undefined;
  generateInvoice?: { mutate: (args: InvoiceGenerationArgs) => void } | null;
  customers?: Customer[];
  onPaymentSuccess: () => void;
  onUpdateSuccess: () => void;
};

export function useTransactionMutations({
  editingTransaction,
  findCustomerById,
  getCustomerName,
  getTransactionBranch,
  buildTransportDescription,
  resolveCustomerIdForBranch,
  generateInvoice,
  customers,
  onPaymentSuccess,
  onUpdateSuccess,
}: UseTransactionMutationsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateRelated } = useCacheInvalidation();
  const log = useAuditLog();

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      if (!data.customer_id || !data.area || !data.amount) {
        throw new Error('Missing required fields: client, branch, or amount');
      }

      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount: must be a positive number');
      }

      const paymentCustomerId = resolveCustomerIdForBranch(data.customer_id, data.area);

      const insertPayload = {
        customer_id: paymentCustomerId,
        transaction_type: 'payment',
        amount,
        total_amount: amount,
        transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
        description: data.description || null,
        sku: 'Payment',
        quantity: 0,
        branch: data.area || null,
      };

      const { data: paymentData, error } = await supabase
        .from('sales_transactions')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payment transaction: ${error.message}`);
      }

      return paymentData;
    },
    onSuccess: (result, variables) => {
      log({ action: 'CREATE', entityType: 'client_payment', entityId: result?.id, description: `Payment recorded: ₹${variables.amount} on ${variables.transaction_date}`, newValues: { amount: variables.amount, date: variables.transaction_date, description: variables.description } });
      toast({ title: 'Success', description: 'Payment recorded successfully!' });
      onPaymentSuccess();
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['label-purchases-summary'] });
      queryClient.invalidateQueries({ queryKey: ['customers-for-availability'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions-for-availability'] });
      queryClient.invalidateQueries({ queryKey: ['sku-configurations-for-availability'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-management'] });
      queryClient.invalidateQueries({ queryKey: ['customer-receivables'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to record payment: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<SaleForm>) => {
      const originalTransactionDate = editingTransaction?.transaction_date || '';
      const originalCustomerId = editingTransaction?.customer_id || '';

      const { data: updatedRows, error: salesError } = await supabase
        .from('sales_transactions')
        .update({
          customer_id: data.customer_id,
          amount: parseFloat(data.amount ?? '0'),
          total_amount: parseFloat(data.amount ?? '0'),
          quantity: data.quantity ? parseInt(data.quantity) : null,
          sku: data.sku,
          description: data.description,
          transaction_date: data.transaction_date,
          branch: data.area || editingTransaction?.branch || null,
        })
        .eq('id', data.id)
        .select(`id, customer_id, transaction_date, transaction_type, amount, quantity, sku, description, branch, invoice_id, created_at, updated_at`);

      if (salesError) throw salesError;
      const updatedTransaction = (updatedRows?.[0] ?? null) as SalesTransaction | null;

      const selectedCustomer = findCustomerById(data.customer_id);

      if (data.sku && data.quantity && originalCustomerId) {
        const { data: factoryPricing } = await supabase
          .from('factory_pricing')
          .select('cost_per_case')
          .eq('sku', data.sku)
          .order('pricing_date', { ascending: false })
          .limit(1);

        const factoryCostPerCase = factoryPricing?.[0]?.cost_per_case || 0;
        const quantity = parseInt(data.quantity);
        const factoryAmount = quantity * factoryCostPerCase;
        const newDescription = getCustomerName(selectedCustomer) || 'Unknown Client';

        const { error: factoryError } = await supabase
          .from('factory_payables')
          .update({
            sku: data.sku,
            amount: factoryAmount,
            quantity,
            description: newDescription,
            transaction_date: data.transaction_date,
            customer_id: data.customer_id,
          })
          .eq('customer_id', originalCustomerId)
          .eq('transaction_date', originalTransactionDate)
          .eq('sku', editingTransaction?.sku || '')
          .eq('transaction_type', 'production');

        if (factoryError) {
          console.error('Failed to update factory transaction:', factoryError);
        }
      }

      if (selectedCustomer) {
        const originalCustomer = findCustomerById(originalCustomerId);
        const originalDescription = buildTransportDescription(
          originalCustomer,
          getTransactionBranch(editingTransaction)
        );
        const newDescription = buildTransportDescription(selectedCustomer, data.area);

        const { error: transportError } = await supabase
          .from('transport_expenses')
          .update({
            expense_date: data.transaction_date,
            description: newDescription,
          })
          .eq('expense_group', 'Client Sale Transport')
          .eq('description', originalDescription)
          .eq('expense_date', originalTransactionDate);

        if (transportError) {
          console.warn('Failed to update transport transaction:', transportError);
        }
      }

      return { updatedTransaction, customerId: data.customer_id };
    },
    onSuccess: async ({ updatedTransaction, customerId }, variables) => {
      log({ action: 'UPDATE', entityType: 'sales_transaction', entityId: variables.id, description: `Transaction updated: ${variables.sku ?? 'payment'} on ${variables.transaction_date}`, newValues: { amount: variables.amount, sku: variables.sku, quantity: variables.quantity, date: variables.transaction_date } });
      toast({ title: 'Success', description: 'Transaction updated successfully!' });
      onUpdateSuccess();
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');

      // Regenerate invoice if auto-invoice is enabled and the transaction was a sale
      if (generateInvoice && updatedTransaction?.transaction_type === 'sale') {
        const autoEnabled = await isAutoInvoiceEnabled();
        if (autoEnabled) {
          let customer = customers?.find(c => c.id === customerId) as Customer | undefined;
          if (!customer) {
            const { data: fresh } = await supabase.from('customers').select('*').eq('id', customerId).single();
            if (fresh) customer = fresh as Customer;
          }
          if (customer) {
            // For multi-SKU invoices, fetch all sibling transactions so the
            // regenerated invoice still contains every SKU line item.
            let allTransactions: SalesTransaction[] | undefined;
            const invoiceId = updatedTransaction.invoice_id;
            if (invoiceId) {
              const { data: siblings } = await supabase
                .from('sales_transactions')
                .select('id, customer_id, transaction_date, transaction_type, amount, quantity, sku, description, branch, invoice_id, created_at, updated_at')
                .eq('invoice_id', invoiceId)
                .eq('transaction_type', 'sale');
              if (siblings && siblings.length > 1) {
                // Replace the stale copy of the edited transaction with the fresh one
                allTransactions = siblings.map((t) =>
                  t.id === updatedTransaction.id ? updatedTransaction : t
                ) as SalesTransaction[];
              }
            }
            generateInvoice.mutate({
              transactionId: updatedTransaction.id,
              transaction: updatedTransaction,
              customer,
              allTransactions,
            });
          }
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update transaction: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: transaction } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (transaction) {
        if (transaction.transaction_type === 'sale' && transaction.sku && transaction.customer_id) {
          const { error: factoryError } = await supabase
            .from('factory_payables')
            .delete()
            .eq('customer_id', transaction.customer_id)
            .eq('transaction_date', transaction.transaction_date)
            .eq('sku', transaction.sku)
            .eq('transaction_type', 'production');

          if (factoryError) {
            console.warn('Failed to delete factory transaction:', factoryError);
          }
        }

        const { error: transportError } = await supabase
          .from('transport_expenses')
          .delete()
          .eq('client_id', transaction.customer_id)
          .eq('expense_date', transaction.transaction_date)
          .eq('expense_group', 'Client Sale Transport');

        if (transportError) {
          console.warn('Failed to delete transport transaction:', transportError);
        }
      }

      const { error } = await supabase
        .from('sales_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'DELETE', entityType: 'sales_transaction', entityId: variables, description: `Transaction deleted (ID: ${variables})` });
      toast({ title: 'Success', description: 'Transaction deleted successfully!' });
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    paymentMutation,
    updateMutation,
    deleteMutation,
  };
}
