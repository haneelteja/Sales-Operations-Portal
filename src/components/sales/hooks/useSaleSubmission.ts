import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { isAutoInvoiceEnabled } from '@/services/invoiceConfigService';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { Customer, SalesTransaction, SaleForm } from '@/types';

type CustomerDirectoryRecord = Customer & {
  client_name?: string | null;
  branch?: string | null;
};

type InvoiceGenerationArgs = {
  transactionId: string;
  transaction: SalesTransaction;
  customer: Customer;
};

type UseSaleSubmissionOptions = {
  customers?: CustomerDirectoryRecord[];
  findCustomerById: (customerId?: string) => CustomerDirectoryRecord | undefined;
  getCustomerBranch: (customer?: CustomerDirectoryRecord | null) => string;
  getCustomerName: (customer?: CustomerDirectoryRecord | null) => string;
  buildTransportDescription: (
    customer?: CustomerDirectoryRecord | null,
    fallbackBranch?: string
  ) => string;
  generateInvoice: {
    mutate: (args: InvoiceGenerationArgs) => void;
  };
  getInvoiceFailureDescription: (error: unknown) => string;
  onSaleSuccess: () => void;
};

export function useSaleSubmission({
  customers,
  findCustomerById,
  getCustomerBranch,
  getCustomerName,
  buildTransportDescription,
  generateInvoice,
  getInvoiceFailureDescription,
  onSaleSuccess,
}: UseSaleSubmissionOptions) {
  const { toast } = useToast();
  const { invalidateRelated } = useCacheInvalidation();
  const log = useAuditLog();

  return useMutation({
    mutationFn: async (data: SaleForm) => {
      const amountValue = parseFloat(data.amount);

      const saleData: {
        customer_id: string;
        transaction_type: string;
        amount: number;
        total_amount: number;
        quantity: number | null;
        sku: string | null;
        description?: string | null;
        transaction_date?: string;
        branch?: string | null;
      } = {
        customer_id: data.customer_id,
        transaction_type: 'sale',
        amount: amountValue,
        total_amount: amountValue,
        quantity: data.quantity ? parseInt(data.quantity) : null,
        sku: data.sku || null,
        description: data.description || null,
        transaction_date: data.transaction_date,
        branch: data.area || null,
      };

      const { data: insertedTransactions, error: saleError } = await supabase
        .from('sales_transactions')
        .insert(saleData)
        .select();

      if (saleError) {
        logger.error('Sales transaction error:', saleError);

        if (
          saleError.code === 'PGRST204' ||
          saleError.message?.includes('schema cache') ||
          saleError.message?.includes('Could not find')
        ) {
          throw new Error(
            'Database schema cache issue detected. The column exists but Supabase cache needs refresh. Please try again in a few moments or contact support.'
          );
        }

        throw saleError;
      }

      if (!insertedTransactions || insertedTransactions.length === 0) {
        throw new Error('Failed to retrieve inserted transaction');
      }

      const quantity = data.quantity ? parseInt(data.quantity) : 0;

      if (!data.transaction_date) {
        throw new Error('Transaction date is required');
      }

      // --- Inventory-aware factory entry ---
      // Current inventory = manually-recorded production qty - previous sales qty (pre-this-sale)
      let currentInventory = 0;
      if (quantity > 0 && data.customer_id && data.sku) {
        const [{ data: prodRows }, { data: prevSalesRows }] = await Promise.all([
          supabase
            .from('factory_payables')
            .select('quantity')
            .eq('transaction_type', 'production')
            .eq('customer_id', data.customer_id)
            .eq('sku', data.sku),
          supabase
            .from('sales_transactions')
            .select('quantity')
            .eq('transaction_type', 'sale')
            .eq('customer_id', data.customer_id)
            .eq('sku', data.sku),
        ]);
        const prodQty = (prodRows ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0);
        // Exclude the just-inserted sale from the previous sales total (it was inserted above)
        const prevSalesQty = (prevSalesRows ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0) - quantity;
        currentInventory = prodQty - prevSalesQty;
      }

      // Shortfall = cases that aren't covered by existing inventory
      const shortfall = Math.max(0, quantity - Math.max(0, currentInventory));

      if (shortfall > 0) {
        const { data: factoryPricing } = await supabase
          .from('factory_pricing')
          .select('cost_per_case')
          .eq('sku', data.sku)
          .order('pricing_date', { ascending: false })
          .limit(1);

        const { data: customerData } = await supabase
          .from('customers')
          .select('client_name')
          .eq('id', data.customer_id)
          .single();

        const costPerCase = factoryPricing?.[0]?.cost_per_case ?? 0;
        const shortfallAmount = shortfall * costPerCase;

        const { error: factoryError } = await supabase
          .from('factory_payables')
          .insert({
            transaction_type: 'production',
            sku: data.sku || null,
            quantity: shortfall,
            amount: Math.max(0, shortfallAmount),
            description: `Shortfall from sale — ${customerData?.client_name ?? 'Unknown Client'}`,
            transaction_date: data.transaction_date,
            customer_id: data.customer_id,
          });

        if (factoryError) {
          logger.error('Factory shortfall entry error:', factoryError);
          // Non-fatal: sale was already recorded; log and continue
          logger.warn('Sale recorded but factory shortfall entry failed:', factoryError.message);
        }
      }

      const selectedCustomer = findCustomerById(data.customer_id);
      const transportBranch = selectedCustomer ? getCustomerBranch(selectedCustomer) : data.area;
      const transportData = {
        amount: 0,
        description: buildTransportDescription(selectedCustomer, data.area),
        expense_date: data.transaction_date,
        expense_group: 'Client Sale Transport',
        client_id: data.customer_id || null,
        branch: transportBranch || null,
      };

      const { error: transportError } = await supabase
        .from('transport_expenses')
        .insert(transportData);

      if (transportError) {
        logger.error('Transport transaction creation error:', transportError);
        throw new Error(`Transport transaction creation failed: ${transportError.message}`);
      }

      return insertedTransactions as SalesTransaction[];
    },
    onSuccess: async (insertedTransactions, variables) => {
      const t = insertedTransactions[0];
      log({ action: 'CREATE', entityType: 'sale', entityId: t?.id, description: `Sale recorded: ${variables.quantity ?? '?'} cases of ${variables.sku ?? '?'} for ₹${variables.amount} on ${variables.transaction_date}`, newValues: { sku: variables.sku, quantity: variables.quantity, amount: variables.amount, date: variables.transaction_date } });
      toast({ title: 'Success', description: 'Sale recorded successfully!' });

      const autoEnabled = await isAutoInvoiceEnabled();

      if (autoEnabled && insertedTransactions.length > 0) {
        const transaction = insertedTransactions[0];

        if (transaction.transaction_type === 'sale' && transaction.customer_id) {
          try {
            let customer = customers?.find((entry) => entry.id === transaction.customer_id);

            if (!customer) {
              const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', transaction.customer_id)
                .single();

              if (customerError || !customerData) {
                throw new Error(
                  `Customer not found: ${customerError?.message || 'Unknown error'}`
                );
              }

              customer = customerData as CustomerDirectoryRecord;
            }

            generateInvoice.mutate({
              transactionId: transaction.id,
              transaction,
              customer,
            });
          } catch (error) {
            logger.error('Auto-invoice generation failed:', error);
            toast({
              title: 'Invoice Generation Warning',
              description: getInvoiceFailureDescription(error),
              variant: 'destructive',
            });
          }
        }
      }

      onSaleSuccess();
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
      invalidateRelated('invoices');
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: `Failed to record sale: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });
}
