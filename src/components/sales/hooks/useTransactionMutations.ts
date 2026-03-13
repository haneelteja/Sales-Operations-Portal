import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useToast } from '@/hooks/use-toast';
import type { PaymentForm, SaleForm, SalesTransaction } from '@/types';

type CustomerDirectoryRecord = {
  id: string;
  dealer_name?: string | null;
  client_name?: string | null;
  area?: string | null;
  branch?: string | null;
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
  onPaymentSuccess,
  onUpdateSuccess,
}: UseTransactionMutationsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateRelated } = useCacheInvalidation();

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
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payment recorded successfully!' });
      onPaymentSuccess();
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['label-purchases-summary'] });
      queryClient.invalidateQueries({ queryKey: ['customers-for-availability'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions-for-availability'] });
      queryClient.invalidateQueries({ queryKey: ['sku-configurations-for-availability'] });
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

      const { error: salesError } = await supabase
        .from('sales_transactions')
        .update({
          customer_id: data.customer_id,
          amount: parseFloat(data.amount ?? '0'),
          total_amount: parseFloat(data.amount ?? '0'),
          quantity: data.quantity ? parseInt(data.quantity) : null,
          sku: data.sku,
          description: data.description,
          transaction_date: data.transaction_date,
          branch: data.area || null,
        })
        .eq('id', data.id);

      if (salesError) throw salesError;

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
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Transaction updated successfully!' });
      onUpdateSuccess();
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
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
    onSuccess: () => {
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
