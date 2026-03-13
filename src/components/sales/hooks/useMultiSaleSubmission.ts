import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { SaleForm } from '@/types';
import type { SalesItem } from '@/components/sales/hooks/useSalesItemsManager';

type CustomerDirectoryRecord = {
  id: string;
};

type UseMultiSaleSubmissionOptions = {
  saleForm: Pick<SaleForm, 'customer_id' | 'area' | 'transaction_date'>;
  salesItems: SalesItem[];
  findCustomerById: (customerId?: string) => CustomerDirectoryRecord | undefined;
  getCustomerBranch: (customer?: CustomerDirectoryRecord | null) => string;
  buildTransportDescription: (
    customer?: CustomerDirectoryRecord | null,
    fallbackBranch?: string
  ) => string;
  calculateTotalAmount: () => number;
  onSuccessReset: () => void;
};

export function useMultiSaleSubmission({
  saleForm,
  salesItems,
  findCustomerById,
  getCustomerBranch,
  buildTransportDescription,
  calculateTotalAmount,
  onSuccessReset,
}: UseMultiSaleSubmissionOptions) {
  const { toast } = useToast();
  const { invalidateRelated } = useCacheInvalidation();

  return useMutation({
    mutationFn: async () => {
      if (!saleForm.customer_id || !saleForm.area || salesItems.length === 0) {
        throw new Error('Please select client, branch, and add at least one item');
      }

      const { data: customerData } = await supabase
        .from('customers')
        .select('dealer_name, area')
        .eq('id', saleForm.customer_id)
        .single();

      for (const item of salesItems) {
        const saleData = {
          customer_id: saleForm.customer_id,
          transaction_type: 'sale',
          amount: parseFloat(item.amount),
          total_amount: parseFloat(item.amount),
          quantity: parseInt(item.quantity),
          sku: item.sku,
          description: item.description,
          transaction_date: saleForm.transaction_date,
        };

        const { error: saleError } = await supabase.from('sales_transactions').insert(saleData);
        if (saleError) {
          logger.error('Multiple sales transaction error:', saleError);
          throw saleError;
        }

        const { data: factoryPricing, error: pricingError } = await supabase
          .from('factory_pricing')
          .select('cost_per_case')
          .eq('sku', item.sku)
          .order('pricing_date', { ascending: false })
          .limit(1);

        if (pricingError) {
          logger.warn(`Error fetching factory pricing for SKU ${item.sku}:`, pricingError);
        }

        const factoryCostPerCase = factoryPricing?.[0]?.cost_per_case || 0;
        const quantity = parseInt(item.quantity);
        const factoryAmount = quantity * factoryCostPerCase;
        const customerAmount = parseFloat(item.amount) || 0;
        const defaultCostPerCase = quantity > 0 ? (customerAmount / quantity) * 0.5 : 0;
        const finalFactoryAmount =
          factoryCostPerCase > 0 ? factoryAmount : quantity * defaultCostPerCase;

        if (!saleForm.transaction_date) {
          throw new Error('Transaction date is required for factory production entry');
        }

        if (isNaN(finalFactoryAmount)) {
          throw new Error('Invalid factory amount calculated');
        }

        const factoryPayableData = {
          transaction_type: 'production',
          sku: item.sku || null,
          amount: Math.max(0, finalFactoryAmount),
          quantity: quantity || null,
          description: customerData?.dealer_name || 'Unknown Client',
          transaction_date: saleForm.transaction_date,
          customer_id: saleForm.customer_id,
        };

        const { error: factoryError } = await supabase
          .from('factory_payables')
          .insert(factoryPayableData);

        if (factoryError) {
          logger.error('Factory production entry error for multiple sales:', factoryError);
          throw new Error(`Factory production entry failed for multiple sales: ${factoryError.message}`);
        }

        const selectedCustomer = findCustomerById(saleForm.customer_id);
        const transportBranch = selectedCustomer ? getCustomerBranch(selectedCustomer) : saleForm.area;
        const transportData = {
          amount: 0,
          description: buildTransportDescription(selectedCustomer, saleForm.area),
          expense_date: saleForm.transaction_date,
          expense_group: 'Client Sale Transport',
          client_id: saleForm.customer_id || null,
          branch: transportBranch || null,
        };

        const { error: transportError } = await supabase
          .from('transport_expenses')
          .insert(transportData);

        if (transportError) {
          logger.error('Transport transaction creation error (multiple sales):', transportError);
          throw new Error(`Transport transaction creation failed: ${transportError.message}`);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Successfully recorded ${salesItems.length} sale${salesItems.length > 1 ? 's' : ''} with total amount ₹${calculateTotalAmount().toFixed(2)} and corresponding factory transactions!`,
      });
      onSuccessReset();
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record sales: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
