import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCacheInvalidation } from "@/hooks/useCacheInvalidation";
import { getQueryConfig } from "@/lib/query-configs";
import { useTransactionFilters } from "@/components/sales/hooks/useTransactionFilters";
import type { 
  Customer, 
  SalesTransaction, 
  SaleForm, 
  PaymentForm
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MobileTable } from "@/components/ui/mobile-table";
import { useMobileDetection, MOBILE_CLASSES } from "@/lib/mobile-utils";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Edit, Download, ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { ColumnFilter } from '@/components/ui/column-filter';
import { useAutoSave } from "@/hooks/useAutoSave";
import { saleFormSchema, paymentFormSchema, salesItemSchema } from "@/lib/validation/schemas";
import { safeValidate } from "@/lib/validation/utils";
import { logger } from "@/lib/logger";
import { EditTransactionDialog } from "@/components/sales/EditTransactionDialog";
import { useInvoiceGeneration, useInvoice, useInvoiceDownload } from "@/hooks/useInvoiceGeneration";
import { isAutoInvoiceEnabled } from "@/services/invoiceConfigService";

// Invoice Actions Component
const InvoiceActions = ({ 
  transaction, 
  customer, 
  onGenerate, 
  onDownload,
  isGenerating 
}: { 
  transaction: SalesTransaction;
  customer?: Customer;
  onGenerate: (transaction: SalesTransaction) => void;
  onDownload: (invoice: any, format: 'word' | 'pdf') => void;
  isGenerating: boolean;
}) => {
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(transaction.id);
  
  if (transaction.transaction_type !== 'sale') return null;
  
  if (invoiceLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }
  
  if (invoice) {
    return (
      <>
        {invoice.word_file_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(invoice, 'word')}
            title="Download Word Invoice"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {invoice.pdf_file_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(invoice, 'pdf')}
            title="Download PDF Invoice"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </>
    );
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onGenerate(transaction)}
      disabled={isGenerating}
      title="Generate Invoice"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </Button>
  );
};

const SalesEntry = () => {
  const { isMobileDevice } = useMobileDetection();
  const [activeTab, setActiveTab] = useState<string>("sale");
  const [saleForm, setSaleForm] = useState({
    customer_id: "",
    amount: "",
    quantity: "",
    sku: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0],
    branch: ""
  });

  // State for multiple sales items
  const [salesItems, setSalesItems] = useState<Array<{
    id: string;
    sku: string;
    quantity: string;
    price_per_case: string;
    amount: string;
    description: string;
  }>>([]);

  const [currentItem, setCurrentItem] = useState({
    sku: "",
    quantity: "",
    price_per_case: "",
    amount: "",
    description: ""
  });

  // State for single SKU mode
  const [isSingleSKUMode, setIsSingleSKUMode] = useState(false);
  const [singleSKUData, setSingleSKUData] = useState<{
    sku: string;
    price_per_case: number;
  } | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    customer_id: "",
    branch: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [editingTransaction, setEditingTransaction] = useState<SalesTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    customer_id: "",
    amount: "",
    quantity: "",
    sku: "",
    description: "",
    transaction_date: "",
    branch: ""
  });
  // Use centralized filter state hook
  const {
    searchTerm,
    columnFilters,
    columnSorts,
    currentPage,
    pageSize,
    setSearchTerm,
    setColumnFilter,
    clearColumnFilter,
    setColumnSort,
    setPage,
    resetFilters,
  } = useTransactionFilters(50);
  
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateRelated } = useCacheInvalidation();
  
  // Invoice generation hooks
  const generateInvoice = useInvoiceGeneration();
  const downloadInvoice = useInvoiceDownload();

  // Auto-save form data to prevent data loss from session timeouts
  
  // Memoized load handlers to prevent infinite loops in useAutoSave
  const handleSaleFormLoad = useCallback((savedData: typeof saleForm) => {
    if (savedData && Object.values(savedData).some(v => v !== '')) {
      setSaleForm(savedData);
      toast({
        title: "Form data restored",
        description: "Your previous sale form data has been restored.",
      });
    }
  }, [toast]);

  const handlePaymentFormLoad = useCallback((savedData: typeof paymentForm) => {
    if (savedData && Object.values(savedData).some(v => v !== '')) {
      setPaymentForm(savedData);
      toast({
        title: "Form data restored",
        description: "Your previous payment form data has been restored.",
      });
    }
  }, [toast]);

  const handleSalesItemsLoad = useCallback((savedData: { items: typeof salesItems, currentItem: typeof currentItem, isSingleSKUMode: boolean }) => {
    if (savedData?.items && savedData.items.length > 0) {
      setSalesItems(savedData.items);
      if (savedData.currentItem) {
        setCurrentItem(savedData.currentItem);
      }
      if (savedData.isSingleSKUMode !== undefined) {
        setIsSingleSKUMode(savedData.isSingleSKUMode);
      }
      toast({
        title: "Sales items restored",
        description: "Your previous sales items have been restored.",
      });
    }
  }, [toast]);

  // Auto-save form data to prevent data loss from session timeouts
  const { loadData: loadSaleFormData, clearSavedData: clearSaleFormData } = useAutoSave({
    storageKey: 'sales_entry_sale_form_autosave',
    data: saleForm,
    enabled: true,
    debounceDelay: 2000,
    onLoad: handleSaleFormLoad,
  });

  const { loadData: loadPaymentFormData, clearSavedData: clearPaymentFormData } = useAutoSave({
    storageKey: 'sales_entry_payment_form_autosave',
    data: paymentForm,
    enabled: true,
    debounceDelay: 2000,
    onLoad: handlePaymentFormLoad,
  });

  const { loadData: loadSalesItemsData, clearSavedData: clearSalesItemsData } = useAutoSave({
    storageKey: 'sales_entry_items_autosave',
    data: { items: salesItems, currentItem, isSingleSKUMode },
    enabled: true,
    debounceDelay: 2000,
    onLoad: handleSalesItemsLoad,
  });

  // Function to reset sale form to default state
  const resetSaleForm = useCallback(() => {
    setSaleForm({
      customer_id: "",
      amount: "",
      quantity: "",
      sku: "",
      description: "",
      transaction_date: new Date().toISOString().split('T')[0],
      branch: ""
    });
    setCurrentItem({
      sku: "",
      quantity: "",
      price_per_case: "",
      amount: "",
      description: ""
    });
    setSalesItems([]);
    setIsSingleSKUMode(false);
    setSingleSKUData(null);
    clearSaleFormData();
    clearSalesItemsData();
  }, [clearSaleFormData, clearSalesItemsData]);

  // Function to reset payment form to default state
  const resetPaymentForm = useCallback(() => {
    setPaymentForm({
      customer_id: "",
      branch: "",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split('T')[0]
    });
    clearPaymentFormData();
  }, [clearPaymentFormData]);

  // Handle tab change - reset forms when switching tabs
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Reset forms when switching tabs
    if (value === "sale") {
      resetSaleForm();
    } else if (value === "payment") {
      resetPaymentForm();
    }
  }, [resetSaleForm, resetPaymentForm]);

  // Fetch customers for dropdown (must be before functions that use it)
  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ["customers"],
    ...getQueryConfig("customers"),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, client_name, branch, sku, price_per_case, created_at")
          .eq("is_active", true)
          .order("client_name", { ascending: true });
        
        if (error) {
          console.error('Error fetching customers:', error);
          throw new Error(`Failed to fetch customers: ${error.message}`);
        }
        
        // Customers loaded successfully
        return data || [];
      } catch (error) {
        console.error('Critical error in customers query:', error);
        throw error;
      }
    },
    staleTime: 60000, // 1 minute
    cacheTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle invoice generation (must be after customers query)
  const handleGenerateInvoice = useCallback(async (transaction: SalesTransaction) => {
    if (!transaction.customer_id || transaction.transaction_type !== 'sale') {
      toast({
        title: "Error",
        description: "Invoice can only be generated for sale transactions",
        variant: "destructive",
      });
      return;
    }
    
    const customer = customers?.find(c => c.id === transaction.customer_id);
    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await generateInvoice.mutateAsync({
        transactionId: transaction.id,
        transaction,
        customer,
      });
    } catch (error) {
      // Error is already handled by the hook's onError callback
      logger.error('Invoice generation failed:', error);
    }
  }, [customers, generateInvoice, toast]);
  
  // Handle invoice download
  const handleDownloadInvoice = useCallback(async (invoice: any, format: 'word' | 'pdf') => {
    try {
      await downloadInvoice.mutateAsync({ invoice, format });
    } catch (error) {
      logger.error('Invoice download failed:', error);
    }
  }, [downloadInvoice]);

  // Function to handle customer selection and auto-populate SKU options
  const handleCustomerChange = (customerName: string) => {
    // Find the first customer with this name to get the customer_id
    const selectedCustomer = customers?.find(c => c.client_name === customerName);
    
    setSaleForm({
      ...saleForm, 
      customer_id: selectedCustomer?.id || "",
      branch: "", // Reset branch when customer changes
    });
    
    // Reset current item and sales items when customer changes
    setCurrentItem({
      sku: "",
      quantity: "",
      price_per_case: "",
      amount: "",
      description: ""
    });
    setSalesItems([]);
  };

  // Function to add item to sales list
  const addItemToSales = () => {
    // Validate current item using Zod schema
    const validationResult = safeValidate(salesItemSchema, currentItem);
    if (!validationResult.success) {
      logger.error('Sales item validation failed:', validationResult.error);
      toast({
        title: "Validation Error",
        description: validationResult.error,
        variant: "destructive"
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      ...currentItem
    };

    setSalesItems([...salesItems, newItem]);
    
    // Keep current values for easy re-entry of same SKU
    // Only reset quantity and amount, keep SKU and description
    setCurrentItem({
      ...currentItem,
      quantity: "",
      amount: "",
      price_per_case: ""
    });

    toast({
      title: "Item Added",
      description: `${currentItem.sku} added to sale items`,
    });
  };

  // Function to remove item from sales list
  const removeItemFromSales = (itemId: string) => {
    setSalesItems(salesItems.filter(item => item.id !== itemId));
  };

  // Function to edit existing item
  const editItemFromSales = (itemId: string) => {
    const itemToEdit = salesItems.find(item => item.id === itemId);
    if (itemToEdit) {
      setCurrentItem({
        sku: itemToEdit.sku,
        quantity: itemToEdit.quantity,
        price_per_case: itemToEdit.price_per_case,
        amount: itemToEdit.amount,
        description: itemToEdit.description
      });
      // Remove the item from the list (it will be re-added when user clicks "Add Item")
      setSalesItems(salesItems.filter(item => item.id !== itemId));
      toast({
        title: "Item Loaded for Editing",
        description: `${itemToEdit.sku} loaded for editing`,
      });
    }
  };

  // Function to calculate total amount
  const calculateTotalAmount = () => {
    return salesItems.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  // Function to handle multiple sales submission
  const handleMultipleSalesSubmit = async () => {
    if (!saleForm.customer_id || !saleForm.branch || salesItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select customer, branch, and add at least one item",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get customer details once for all items
      const { data: customerData } = await supabase
        .from("customers")
        .select("client_name, branch")
        .eq("id", saleForm.customer_id)
        .single();

      // Create multiple sales transactions and corresponding factory transactions
      for (const item of salesItems) {
        // Create sale transaction for Aamodha
        const saleData = {
          customer_id: saleForm.customer_id,
          transaction_type: "sale",
          amount: parseFloat(item.amount),
          total_amount: parseFloat(item.amount), // Add total_amount field
          quantity: parseInt(item.quantity),
          sku: item.sku,
          description: item.description,
          transaction_date: saleForm.transaction_date
        };
        
        const { error: saleError } = await supabase.from("sales_transactions").insert(saleData);

        if (saleError) {
          console.error("Multiple sales - Sales transaction error:", saleError);
          throw saleError;
        }

        // Get factory pricing for amount calculation
        const { data: factoryPricing, error: pricingError } = await supabase
          .from("factory_pricing")
          .select("cost_per_case")
          .eq("sku", item.sku)
          .order("pricing_date", { ascending: false })
          .limit(1);

        if (pricingError) {
          console.warn(`Error fetching factory pricing for SKU ${item.sku}:`, pricingError);
        }

        const factoryCostPerCase = factoryPricing?.[0]?.cost_per_case || 0;
        const quantity = parseInt(item.quantity);
        const factoryAmount = quantity * factoryCostPerCase;

        // If no factory pricing found, use a default cost per case (e.g., 50% of customer amount)
        const customerAmount = parseFloat(item.amount) || 0;
        const defaultCostPerCase = customerAmount / quantity * 0.5; // 50% of customer price
        const finalFactoryAmount = factoryCostPerCase > 0 ? factoryAmount : quantity * defaultCostPerCase;

        // Calculate factory pricing for multiple sales

        // Warn if no factory pricing found
        if (!factoryPricing || factoryPricing.length === 0) {
          console.warn(`No factory pricing found for SKU: ${item.sku}. Factory amount will be 0.`);
        }

        // Validate required fields before creating factory entry
        if (!saleForm.transaction_date) {
          console.error("Missing transaction_date for factory entry (multiple sales)");
          throw new Error("Transaction date is required for factory production entry");
        }

        if (isNaN(finalFactoryAmount)) {
          console.error("Invalid factory amount calculated (multiple sales):", finalFactoryAmount);
          throw new Error("Invalid factory amount calculated");
        }

        // Create corresponding factory production entry for Elma
        const factoryPayableData = {
          transaction_type: "production",
          sku: item.sku || null,
          amount: Math.max(0, finalFactoryAmount), // Ensure amount is never negative
          quantity: quantity || null,
          description: customerData?.client_name || "Unknown Client", // Use client name as description
          transaction_date: saleForm.transaction_date,
          customer_id: saleForm.customer_id
        };

        // Insert factory payable data for multiple sales

        const { error: factoryError } = await supabase
          .from("factory_payables")
          .insert(factoryPayableData);

        if (factoryError) {
          console.error("Factory production entry error for multiple sales:", factoryError);
          console.error("Error details for multiple sales:", {
            message: factoryError.message,
            details: factoryError.details,
            hint: factoryError.hint,
            code: factoryError.code
          });
          throw new Error(`Factory production entry failed for multiple sales: ${factoryError.message}`);
        }

        // Factory production entry created successfully for multiple sales

        // Create corresponding transport transaction
        const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
        
        // Transport transaction data prepared
        
        const transportData = {
          amount: 0,
          description: selectedCustomer ? `${selectedCustomer.client_name}-${selectedCustomer.branch} Transport` : 'Client-Branch Transport',
          expense_date: saleForm.transaction_date,
          expense_group: "Client Sale Transport",
          client_id: saleForm.customer_id,
          client_name: selectedCustomer?.client_name || 'N/A',
          branch: selectedCustomer?.branch || 'N/A'
        };
        
        // Transport transaction data prepared

        const { error: transportError } = await supabase
          .from("transport_expenses")
          .insert(transportData);

        if (transportError) {
          console.error("Transport transaction creation error (multiple sales):", transportError);
          console.error("Transport data attempted:", transportData);
          console.error("Error details:", {
            message: transportError.message,
            details: transportError.details,
            hint: transportError.hint,
            code: transportError.code
          });
          throw new Error(`Transport transaction creation failed: ${transportError.message}`);
        }
      }

      toast({
        title: "Success",
        description: `Successfully recorded ${salesItems.length} sale${salesItems.length > 1 ? 's' : ''} with total amount ₹${calculateTotalAmount().toFixed(2)} and corresponding factory transactions!`
      });

      // Reset form
      setSalesItems([]);
      setCurrentItem({
        sku: "",
        quantity: "",
        price_per_case: "",
        amount: "",
        description: ""
      });

      // Invalidate queries to refresh data using centralized hook
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record sales: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  // Function to handle SKU selection for current item
  const handleCurrentItemSKUChange = (sku: string) => {
    setCurrentItem({...currentItem, sku, amount: "", price_per_case: ""});
    
    // Auto-calculate amount if quantity is already set
    if (currentItem.quantity) {
      const pricePerCase = getPricePerCaseForCurrentItem();
      if (pricePerCase) {
        const calculatedAmount = (parseFloat(currentItem.quantity) * parseFloat(pricePerCase)).toFixed(2);
        setCurrentItem({...currentItem, sku, amount: calculatedAmount, price_per_case: pricePerCase});
      }
    }
  };

  // Function to handle quantity change for current item
  const handleCurrentItemQuantityChange = (quantity: string) => {
    setCurrentItem({...currentItem, quantity});
    
    // Auto-calculate amount if SKU is already set
    if (currentItem.sku) {
      const pricePerCase = getPricePerCaseForCurrentItem();
      if (pricePerCase) {
        const calculatedAmount = (parseFloat(quantity) * parseFloat(pricePerCase)).toFixed(2);
        setCurrentItem({...currentItem, quantity, amount: calculatedAmount, price_per_case: pricePerCase});
      }
    }
  };

  // Get price per case for current item
  const getPricePerCaseForCurrentItem = () => {
    if (!saleForm.customer_id || !saleForm.branch || !currentItem.sku) return "";
    
    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    if (!selectedCustomer) return "";
    
    const customerPricing = customers?.find(c => 
      c.client_name === selectedCustomer.client_name && 
      c.branch === saleForm.branch &&
      c.sku === currentItem.sku
    );
    
    return customerPricing?.price_per_case?.toString() || "";
  };

  // Function to handle customer selection in edit form
  const handleEditCustomerChange = (customerName: string) => {
    // Find the first customer with this name to get the customer_id
    const selectedCustomer = customers?.find(c => c.client_name === customerName);
    
    setEditForm({
      ...editForm, 
      customer_id: selectedCustomer?.id || "",
      branch: "", // Reset branch when customer changes
      sku: "", // Reset SKU when customer changes
      amount: "", // Reset amount when customer changes
      price_per_case: "" // Reset price per case when customer changes
    });
  };

  // Get available SKUs for the selected customer and branch
  const getAvailableSKUs = useCallback(() => {
    if (!saleForm.customer_id || !saleForm.branch) return [];
    
    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    if (!selectedCustomer) return [];
    
    // Filter customers by the selected customer name and branch to get available SKUs
    const customerSKUs = customers?.filter(c => 
      c.client_name === selectedCustomer.client_name && 
      c.branch === saleForm.branch &&
      c.sku && 
      c.sku.trim() !== ''
    ) || [];
    
    // Return unique SKUs for this customer-branch combination
    const uniqueSKUs = customerSKUs.map(customer => ({
      id: `sku-${customer.sku}`,
      sku: customer.sku,
      client_name: customer.client_name,
      branch: customer.branch,
      price_per_case: customer.price_per_case || 0
    }));
    
    // Return filtered SKUs for the selected customer-branch combination
    
    return uniqueSKUs;
  }, [saleForm.customer_id, saleForm.branch, customers]);

  // Get available branches for selected customer
  const getAvailableBranches = () => {
    if (!saleForm.customer_id) return [];
    
    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    if (!selectedCustomer) return [];
    
    // Get all unique branches for the selected customer's client_name (case-insensitive)
    const branchSet = new Set<string>();
    const seenBranches = new Set<string>();
    
    customers?.forEach(customer => {
      if (customer.client_name === selectedCustomer.client_name && customer.branch && customer.branch.trim() !== '') {
        const trimmedBranch = customer.branch.trim();
        const lowerCaseBranch = trimmedBranch.toLowerCase();
        
        // Only add if we haven't seen this branch (case-insensitive) before
        if (!seenBranches.has(lowerCaseBranch)) {
          branchSet.add(trimmedBranch);
          seenBranches.add(lowerCaseBranch);
        }
      }
    });
    
    const uniqueBranches = Array.from(branchSet).sort();
    // Return available branches for selected customer
    return uniqueBranches;
  };

  // Get available branches for edit form
  const getAvailableBranchesForEdit = () => {
    if (!editForm.customer_id) return [];
    
    const selectedCustomer = customers?.find(c => c.id === editForm.customer_id);
    if (!selectedCustomer) return [];
    
    // Get all unique branches for the selected customer's client_name (case-insensitive)
    const branchSet = new Set<string>();
    const seenBranches = new Set<string>();
    
    customers?.forEach(customer => {
      if (customer.client_name === selectedCustomer.client_name && customer.branch && customer.branch.trim() !== '') {
        const trimmedBranch = customer.branch.trim();
        const lowerCaseBranch = trimmedBranch.toLowerCase();
        
        // Only add if we haven't seen this branch (case-insensitive) before
        if (!seenBranches.has(lowerCaseBranch)) {
          branchSet.add(trimmedBranch);
          seenBranches.add(lowerCaseBranch);
        }
      }
    });
    
    const uniqueBranches = Array.from(branchSet).sort();
    // Return available branches for edit form
    return uniqueBranches;
  };

  // Get price per case for selected customer and branch
  const getPricePerCase = () => {
    if (!saleForm.customer_id || !saleForm.branch) return "";
    
    const customer = customers?.find(c => 
      c.id === saleForm.customer_id && 
      c.branch === saleForm.branch
    );
    
    return customer?.price_per_case?.toString() || "";
  };

  // Get price per case for edit form
  const getPricePerCaseForEdit = () => {
    if (!editForm.customer_id || !editForm.branch) return "";
    
    const customer = customers?.find(c => 
      c.id === editForm.customer_id && 
      c.branch === editForm.branch
    );
    
    return customer?.price_per_case?.toString() || "";
  };

  // Function to handle SKU selection
  const handleSKUChange = (sku: string) => {
    // Auto-populate price per case when SKU is selected
    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    let pricePerCase = "";
    
    if (selectedCustomer && saleForm.branch) {
      const customerSKURecord = customers?.find(c => 
        c.client_name === selectedCustomer.client_name && 
        c.branch === saleForm.branch &&
        c.sku === sku
      );
      pricePerCase = customerSKURecord?.price_per_case?.toString() || "";
    }
    
    setSaleForm({
      ...saleForm,
      sku,
      amount: "", // Reset amount when SKU changes
      price_per_case: pricePerCase // Auto-populate price per case
    });
  };

  // Function to handle quantity change and auto-calculate amount
  const handleQuantityChange = (quantity: string) => {
    if (!saleForm.customer_id || !saleForm.sku) {
      setSaleForm({
        ...saleForm,
        quantity,
        amount: ""
      });
      return;
    }

    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    if (!selectedCustomer) return;

    // Find the specific customer-SKU combination for pricing
    const customerSKURecord = customers?.find(c => 
      c.client_name === selectedCustomer.client_name && 
      c.branch === selectedCustomer.branch &&
      c.sku === saleForm.sku
    );

    let calculatedAmount = "";
    if (customerSKURecord && quantity) {
      const qty = parseInt(quantity);
      if (qty && customerSKURecord.price_per_case) {
        calculatedAmount = (qty * customerSKURecord.price_per_case).toString();
      }
    }
    
    setSaleForm({
      ...saleForm,
      quantity,
      amount: calculatedAmount
    });
  };


  // Fetch SKU configurations
  const { data: skuConfigurations, isLoading: skuConfigurationsLoading, error: skuConfigurationsError } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("sku_configurations")
          .select("sku, bottles_per_case")
          .order("sku", { ascending: true });
        
        if (error) {
          console.error('Error fetching SKU configurations:', error);
          throw new Error(`Failed to fetch SKU configurations: ${error.message}`);
        }
        
        return data || [];
      } catch (error) {
        console.error('Critical error in SKU configurations query:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get unique customer names (no duplicates, case-insensitive) - for form dropdowns
  const getUniqueCustomersForForm = () => {
    if (!customers) return [];
    
    const seenNames = new Set<string>();
    const uniqueCustomerNames: string[] = [];
    
    customers.forEach(customer => {
      const lowerCaseName = customer.client_name.toLowerCase();
      if (!seenNames.has(lowerCaseName)) {
        seenNames.add(lowerCaseName);
        uniqueCustomerNames.push(customer.client_name);
      }
    });
    
    return uniqueCustomerNames.sort();
  };

  // Get branches for a specific customer
  const getBranchesForCustomer = (customerId: string) => {
    if (!customers || !customerId) return [];
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    
    return customers
      .filter(c => c.client_name === customer.client_name)
      .map(c => c.branch)
      .filter((branch, index, self) => self.indexOf(branch) === index)
      .sort();
  };

  // Check if only one SKU is available for the selected customer-branch combination
  const checkSingleSKUMode = useCallback(() => {
    if (!saleForm.customer_id || !saleForm.branch) {
      setIsSingleSKUMode(false);
      setSingleSKUData(null);
      return;
    }

    const availableSKUs = getAvailableSKUs();
    
    if (availableSKUs.length === 1) {
      setIsSingleSKUMode(true);
      setSingleSKUData({
        sku: availableSKUs[0].sku,
        price_per_case: availableSKUs[0].price_per_case
      });
      // Auto-populate the current item
      setCurrentItem({
        sku: availableSKUs[0].sku,
        quantity: "",
        price_per_case: availableSKUs[0].price_per_case.toString(),
        amount: "",
        description: ""
      });
    } else {
      setIsSingleSKUMode(false);
      setSingleSKUData(null);
      // Reset current item
      setCurrentItem({
        sku: "",
        quantity: "",
        price_per_case: "",
        amount: "",
        description: ""
      });
    }
  }, [saleForm.customer_id, saleForm.branch, getAvailableSKUs]);

  // Check for single SKU mode when customer or branch changes
  useEffect(() => {
    checkSingleSKUMode();
  }, [checkSingleSKUMode]);

  // Fetch transactions (limited for performance, paginated client-side after filtering)
  const { data: allTransactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["recent-transactions"],
    ...getQueryConfig("recent-transactions"),
    queryFn: async () => {
      try {
        // Limit to last 90 days or max 2000 records for performance
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const { data, error, count } = await supabase
          .from("sales_transactions")
          .select(`
            id,
            customer_id,
            transaction_date,
            transaction_type,
            amount,
            quantity,
            sku,
            description,
            created_at,
            customers (client_name, branch)
          `, { count: 'exact' })
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(2000); // Safety limit
        
        if (error) {
          console.error('Error fetching transactions:', error);
          throw new Error(`Failed to fetch transactions: ${error.message}`);
        }
        
        return {
          data: data || [],
          total: count || 0
        };
      } catch (error) {
        console.error('Critical error in transactions query:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const recentTransactions = allTransactions?.data || [];
  const totalTransactions = allTransactions?.total || 0;

  // Calculate cumulative outstanding for a specific customer up to a given transaction
  const calculateCumulativeOutstanding = useCallback((customerId: string, transactionDate: string, transactionId: string) => {
    try {
      // Input validation
      if (!recentTransactions?.length) {
        console.warn('No recent transactions available for outstanding calculation');
        return 0;
      }
      
      if (!customerId || !transactionDate || !transactionId) {
        console.warn('Missing required parameters for outstanding calculation:', { customerId, transactionDate, transactionId });
        return 0;
      }

      // Validate date format
      const currentDate = new Date(transactionDate);
      if (isNaN(currentDate.getTime())) {
        console.error('Invalid transaction date format:', transactionDate);
        return 0;
      }

      // Get all transactions for this customer, sorted chronologically
      const customerTransactions = recentTransactions
        .filter(t => t?.customer_id === customerId)
        .sort((a, b) => {
          try {
            const dateA = new Date(a.transaction_date).getTime();
            const dateB = new Date(b.transaction_date).getTime();
            
            if (isNaN(dateA) || isNaN(dateB)) {
              console.warn('Invalid date in transaction sorting:', { dateA, dateB });
              return 0;
            }
            
            if (dateA === dateB) {
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return dateA - dateB;
          } catch (error) {
            console.error('Error sorting transactions:', error);
            return 0;
          }
        });
      
      if (!customerTransactions.length) {
        console.warn(`No transactions found for customer: ${customerId}`);
        return 0;
      }
      
      let cumulativeOutstanding = 0;
      const currentDateMs = currentDate.getTime();
      
      // Process transactions chronologically up to and including the current transaction
      for (const transaction of customerTransactions) {
        try {
          const txDate = new Date(transaction.transaction_date);
          if (isNaN(txDate.getTime())) {
            console.warn('Invalid transaction date, skipping:', transaction.transaction_date);
            continue;
          }
          
          const txDateMs = txDate.getTime();
          
          // Stop if we've passed the current transaction
          if (txDateMs > currentDateMs) break;
          
          // Include transaction if it's before current date or same date with ID <= current ID
          if (txDateMs < currentDateMs || 
              (txDateMs === currentDateMs && transaction.id <= transactionId)) {
            
            const amount = Number(transaction.amount);
            if (isNaN(amount)) {
              console.warn('Invalid amount in transaction, skipping:', transaction.amount);
              continue;
            }
            
            if (transaction.transaction_type === 'sale') {
              cumulativeOutstanding += amount;
            } else if (transaction.transaction_type === 'payment') {
              cumulativeOutstanding -= amount;
            } else {
              console.warn('Unknown transaction type, skipping:', transaction.transaction_type);
            }
          }
        } catch (error) {
          console.error('Error processing individual transaction:', error, transaction);
          continue; // Skip this transaction and continue with others
        }
      }

      return Math.round(cumulativeOutstanding * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Critical error calculating cumulative outstanding:', error);
      return 0;
    }
  }, [recentTransactions]);

  // Filter and sort recent transactions with pre-calculated outstanding amounts
  const filteredAndSortedRecentTransactions = useMemo(() => {
    try {
      if (!recentTransactions?.length) {
        // Return empty array gracefully when no transactions are available
        return [];
      }
      
      // Pre-calculate outstanding amounts for all transactions with error handling
      const transactionsWithOutstanding = recentTransactions.map((transaction, index) => {
        try {
          if (!transaction?.customer_id || !transaction?.transaction_date || !transaction?.id) {
            console.warn(`Invalid transaction data at index ${index}:`, transaction);
            return { ...transaction, outstanding: 0 };
          }
          
          const outstanding = calculateCumulativeOutstanding(
            transaction.customer_id, 
            transaction.transaction_date, 
            transaction.id
          );
          return { ...transaction, outstanding };
        } catch (error) {
          console.error(`Error calculating outstanding for transaction at index ${index}:`, error);
          return { ...transaction, outstanding: 0 };
        }
      });
      
      return transactionsWithOutstanding.filter((transaction) => {
        try {
          const customerName = transaction.customers?.client_name || '';
          const branch = transaction.customers?.branch || '';
          const sku = transaction.sku || '';
          const description = transaction.description || '';
          const amount = transaction.amount?.toString() || '';
          const date = new Date(transaction.transaction_date).toLocaleDateString();
          const dateISO = transaction.transaction_date;
          // Normalize date to YYYY-MM-DD format for comparison
          // Handle both ISO strings and date-only strings
          const transactionDateObj = new Date(transaction.transaction_date);
          const transactionDateOnly = transactionDateObj.getFullYear() + '-' + 
            String(transactionDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
            String(transactionDateObj.getDate()).padStart(2, '0');
          const type = transaction.transaction_type || '';
          const outstanding = transaction.outstanding?.toString() || '';
          
          // Global search filter (using debounced value)
          if (debouncedSearchTerm) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            const matchesGlobalSearch = (
              customerName.toLowerCase().includes(searchLower) ||
              branch.toLowerCase().includes(searchLower) ||
              sku.toLowerCase().includes(searchLower) ||
              description.toLowerCase().includes(searchLower) ||
              amount.includes(searchLower) ||
              date.includes(searchLower) ||
              type.toLowerCase().includes(searchLower) ||
              outstanding.includes(searchLower)
            );
            if (!matchesGlobalSearch) return false;
          }
          
          // Column-specific filters - support both single values and arrays (multi-select)
          // Date filter (single value only)
          if (columnFilters.date) {
            const dateFilter = Array.isArray(columnFilters.date) ? columnFilters.date[0] : columnFilters.date;
            if (dateFilter && transactionDateOnly !== dateFilter) return false;
          }
          
          // Customer filter (multi-select)
          if (columnFilters.customer) {
            const customerFilter = Array.isArray(columnFilters.customer) ? columnFilters.customer : [columnFilters.customer];
            if (customerFilter.length > 0 && !customerFilter.some(filter => 
              customerName.toLowerCase().includes(filter.toLowerCase())
            )) return false;
          }
          
          // Branch filter (multi-select)
          if (columnFilters.branch) {
            const branchFilter = Array.isArray(columnFilters.branch) ? columnFilters.branch : [columnFilters.branch];
            if (branchFilter.length > 0 && !branchFilter.some(filter => 
              branch.toLowerCase().includes(filter.toLowerCase())
            )) return false;
          }
          
          // Type filter (multi-select)
          if (columnFilters.type) {
            const typeFilter = Array.isArray(columnFilters.type) ? columnFilters.type : [columnFilters.type];
            if (typeFilter.length > 0 && !typeFilter.some(filter => 
              type.toLowerCase().includes(filter.toLowerCase())
            )) return false;
          }
          
          // SKU filter (multi-select)
          if (columnFilters.sku) {
            const skuFilter = Array.isArray(columnFilters.sku) ? columnFilters.sku : [columnFilters.sku];
            if (skuFilter.length > 0 && !skuFilter.some(filter => 
              sku.toLowerCase().includes(filter.toLowerCase())
            )) return false;
          }
          
          // Amount filter (single value - text search)
          if (columnFilters.amount) {
            const amountFilter = Array.isArray(columnFilters.amount) ? columnFilters.amount[0] : columnFilters.amount;
            if (amountFilter && !amount.includes(amountFilter)) return false;
          }
          
          return true;
        } catch (error) {
          console.error('Error filtering transaction:', error, transaction);
          return false; // Exclude problematic transactions
        }
      }).sort((a, b) => {
        try {
          // Apply sorting
          const activeSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);
          // Default to reverse chronological order (latest first) if no sort is active
          if (!activeSort) {
            const dateA = new Date(a.transaction_date).getTime();
            const dateB = new Date(b.transaction_date).getTime();
            if (isNaN(dateA) || isNaN(dateB)) return 0;
            // Latest first (descending)
            return dateB - dateA;
          }

          const [columnKey, direction] = activeSort;

          let valueA: string | number, valueB: string | number;

          switch (columnKey) {
            case 'date':
              valueA = new Date(a.transaction_date).getTime();
              valueB = new Date(b.transaction_date).getTime();
              if (isNaN(valueA) || isNaN(valueB)) return 0;
              break;
            case 'customer':
              valueA = a.customers?.client_name || '';
              valueB = b.customers?.client_name || '';
              break;
            case 'branch':
              valueA = a.customers?.branch || '';
              valueB = b.customers?.branch || '';
              break;
            case 'type':
              valueA = a.transaction_type || '';
              valueB = b.transaction_type || '';
              break;
            case 'sku':
              valueA = a.sku || '';
              valueB = b.sku || '';
              break;
            case 'amount':
              valueA = Number(a.amount) || 0;
              valueB = Number(b.amount) || 0;
              break;
            case 'outstanding':
              valueA = Number(a.outstanding) || 0;
              valueB = Number(b.outstanding) || 0;
              break;
            default:
              return 0;
          }

          if (valueA < valueB) return direction === 'asc' ? -1 : 1;
          if (valueA > valueB) return direction === 'asc' ? 1 : -1;
          return 0;
        } catch (error) {
          console.error('Error sorting transactions:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('Critical error filtering and sorting transactions:', error);
      return [];
    }
  }, [recentTransactions, debouncedSearchTerm, columnFilters, columnSorts, calculateCumulativeOutstanding]);

  // Paginate the filtered results
  const totalFilteredTransactions = filteredAndSortedRecentTransactions.length;
  const totalPages = Math.ceil(totalFilteredTransactions / pageSize);
  const paginatedTransactions = filteredAndSortedRecentTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Column filter handlers - now using hook methods
  const handleColumnFilterChange = useCallback((columnKey: string, value: string | string[]) => {
    setColumnFilter(columnKey, value);
    // Page reset is handled by the hook automatically
  }, [setColumnFilter]);

  const handleClearColumnFilter = useCallback((columnKey: string) => {
    clearColumnFilter(columnKey);
    // Page reset is handled by the hook automatically
  }, [clearColumnFilter]);

  // Get unique values for multi-select filters
  const getUniqueCustomers = useMemo(() => {
    const unique = new Set<string>();
    recentTransactions?.forEach(t => {
      const name = t.customers?.client_name;
      if (name) unique.add(name);
    });
    return Array.from(unique).sort();
  }, [recentTransactions]);

  const getUniqueBranches = useMemo(() => {
    const unique = new Set<string>();
    recentTransactions?.forEach(t => {
      const branch = t.customers?.branch;
      if (branch) unique.add(branch);
    });
    return Array.from(unique).sort();
  }, [recentTransactions]);

  const getUniqueSKUs = useMemo(() => {
    const unique = new Set<string>();
    recentTransactions?.forEach(t => {
      if (t.sku) unique.add(t.sku);
    });
    return Array.from(unique).sort();
  }, [recentTransactions]);

  const getUniqueTypes = useMemo(() => {
    const unique = new Set<string>();
    recentTransactions?.forEach(t => {
      if (t.transaction_type) unique.add(t.transaction_type);
    });
    return Array.from(unique).sort();
  }, [recentTransactions]);

  const handleColumnSortChange = useCallback((columnKey: string, direction: 'asc' | 'desc' | null) => {
    setColumnSort(columnKey, direction);
  }, [setColumnSort]);


  // Export filtered recent transactions to Excel
  const exportRecentTransactionsToExcel = () => {
    const exportData = filteredAndSortedRecentTransactions.map((transaction) => {
      const customer = customers?.find(c => c.id === transaction.customer_id);
      return {
        'Date': new Date(transaction.transaction_date).toLocaleDateString(),
        'Customer': transaction.customers?.client_name || 'N/A',
        'Branch': transaction.customers?.branch || 'N/A',
        'Type': transaction.transaction_type || '',
        'SKU': transaction.sku || '',
        'Quantity (cases)': transaction.quantity || 0,
        'Amount (₹)': transaction.amount || 0,
        'Customer Outstanding (₹)': Number((transaction as unknown as { outstanding?: number }).outstanding) || 0,
        'Description': transaction.description || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recent Transactions');
    
    const fileName = `Recent_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} recent transactions to ${fileName}`,
    });
  };

  // Calculate financial metrics for each transaction
  const calculateFinancials = async (transaction: SalesTransaction) => {
    // Get customer pricing for outstanding calculation
    const customerPricing = customers?.find(c => c.id === transaction.customer_id);
    
    // Get factory pricing for payables calculation
    const { data: factoryPricing } = await supabase
      .from("factory_pricing")
      .select("price_per_bottle")
      .eq("sku", transaction.sku)
      .order("pricing_date", { ascending: false })
      .limit(1);
    
    // Get transport expenses for this customer
    const { data: transport } = await supabase
      .from("transport_expenses")
      .select("amount")
      .eq("client_id", transaction.customer_id);
    
    const factoryPrice = factoryPricing?.[0]?.price_per_bottle || 0;
    const customerPrice = customerPricing?.price_per_bottle || 0;
    const quantity = transaction.quantity || 0;
    
    const customerOutstanding = quantity * customerPrice;
    const factoryPayable = quantity * factoryPrice;
    const transportTotal = transport?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    return {
      customerOutstanding,
      factoryPayable,
      transportTotal
    };
  };

  // Sale entry mutation
  const saleMutation = useMutation({
    mutationFn: async (data: SaleForm) => {
      // Create sale transaction for Aamodha
      const amountValue = parseFloat(data.amount);
      
      const saleData: {
        customer_id: string;
        transaction_type: string;
        amount: number;
        total_amount: number;
        quantity: number | null;
        sku: string;
        description?: string;
        transaction_date?: string;
      } = {
        customer_id: data.customer_id,
        transaction_type: "sale",
        amount: amountValue,
        total_amount: amountValue, // Set total_amount equal to amount
        quantity: data.quantity ? parseInt(data.quantity) : null,
        sku: data.sku || null,
        description: data.description || null,
        transaction_date: data.transaction_date,
        branch: data.branch || null
      };
      
      console.log('Inserting sales transaction:', saleData);
      
      const { data: insertedTransactions, error: saleError } = await supabase
        .from("sales_transactions")
        .insert(saleData)
        .select();

      if (saleError) {
        console.error("Sales transaction error:", saleError);
        console.error("Error details:", JSON.stringify(saleError, null, 2));
        
        // Handle schema cache error - column exists but cache is stale
        if (saleError.code === 'PGRST204' || saleError.message?.includes('schema cache') || saleError.message?.includes('Could not find')) {
          throw new Error("Database schema cache issue detected. The column exists but Supabase cache needs refresh. Please try again in a few moments or contact support.");
        }
        
        throw saleError;
      }

      // Return the inserted transaction for auto-invoice generation
      if (!insertedTransactions || insertedTransactions.length === 0) {
        throw new Error("Failed to retrieve inserted transaction");
      }

      // Get factory pricing for amount calculation
      const { data: factoryPricing, error: pricingError } = await supabase
        .from("factory_pricing")
        .select("cost_per_case")
        .eq("sku", data.sku)
        .order("pricing_date", { ascending: false })
        .limit(1);

      if (pricingError) {
        console.warn(`Error fetching factory pricing for SKU ${data.sku}:`, pricingError);
      }

      const factoryCostPerCase = factoryPricing?.[0]?.cost_per_case || 0;
      const quantity = data.quantity ? parseInt(data.quantity) : 0;
      const factoryAmount = quantity * factoryCostPerCase;

      // If no factory pricing found, use a default cost per case (e.g., 50% of customer amount)
      const customerAmount = parseFloat(data.amount) || 0;
      const defaultCostPerCase = customerAmount / quantity * 0.5; // 50% of customer price
      const finalFactoryAmount = factoryCostPerCase > 0 ? factoryAmount : quantity * defaultCostPerCase;

      // Calculate factory pricing

      // Warn if no factory pricing found
      if (!factoryPricing || factoryPricing.length === 0) {
        console.warn(`No factory pricing found for SKU: ${data.sku}. Factory amount will be 0.`);
      }

      // Validate required fields before creating factory entry
      if (!data.transaction_date) {
        console.error("Missing transaction_date for factory entry");
        throw new Error("Transaction date is required for factory production entry");
      }

      if (isNaN(finalFactoryAmount)) {
        console.error("Invalid factory amount calculated:", finalFactoryAmount);
        throw new Error("Invalid factory amount calculated");
      }

      // Get customer details for factory payables
      const { data: customerData } = await supabase
        .from("customers")
        .select("client_name, branch")
        .eq("id", data.customer_id)
        .single();

      // Create corresponding factory production entry for Elma
      const factoryPayableData: {
        transaction_type: "production";
        sku: string | null;
        amount: number;
        quantity?: number | null;
        description: string | null;
        transaction_date: string;
        customer_id: string | null;
      } = {
        transaction_type: "production",
        sku: data.sku || null,
        amount: Math.max(0, finalFactoryAmount), // Ensure amount is never negative
        description: customerData?.client_name || "Unknown Client", // Use client name as description
        transaction_date: data.transaction_date,
        customer_id: data.customer_id
      };

      // Only include quantity if it's a valid number
      if (quantity && quantity > 0) {
        factoryPayableData.quantity = quantity;
      }

      // Insert factory payable data

      const { error: factoryError } = await supabase
        .from("factory_payables")
        .insert(factoryPayableData);

      if (factoryError) {
        console.error("Factory production entry error:", factoryError);
        console.error("Error details:", {
          message: factoryError.message,
          details: factoryError.details,
          hint: factoryError.hint,
          code: factoryError.code
        });
        throw new Error(`Factory production entry failed: ${factoryError.message}`);
      }

      // Factory production entry created successfully

      // Create corresponding transport transaction
      
      const selectedCustomer = customers?.find(c => c.id === data.customer_id);
      
      // Transport transaction data prepared
      
      const transportData = {
        amount: 0,
        description: selectedCustomer ? `${selectedCustomer.client_name}-${selectedCustomer.branch} Transport` : 'Client-Branch Transport',
        expense_date: data.transaction_date,
        expense_group: "Client Sale Transport",
        client_id: data.customer_id,
        client_name: selectedCustomer?.client_name || 'N/A',
        branch: selectedCustomer?.branch || 'N/A'
      };
      
      // Transport transaction data prepared

      const { error: transportError } = await supabase
        .from("transport_expenses")
        .insert(transportData);

      if (transportError) {
        console.error("Transport transaction creation error:", transportError);
        console.error("Transport data attempted:", transportData);
        console.error("Error details:", {
          message: transportError.message,
          details: transportError.details,
          hint: transportError.hint,
          code: transportError.code
        });
        throw new Error(`Transport transaction creation failed: ${transportError.message}`);
      }

      // Return the inserted transaction for auto-invoice generation
      return insertedTransactions;
    },
    onSuccess: async (insertedTransactions, variables) => {
      toast({ title: "Success", description: "Sale recorded successfully!" });
      
      // Check if auto invoice generation is enabled
      const autoEnabled = await isAutoInvoiceEnabled();
      
      // Auto-generate invoice for the sale transaction (only if enabled)
      if (autoEnabled && insertedTransactions && insertedTransactions.length > 0) {
        const transaction = insertedTransactions[0] as SalesTransaction;
        
        // Only generate invoice for sale transactions
        if (transaction.transaction_type === 'sale' && transaction.customer_id) {
          try {
            // Get customer details (try from cache first, then fetch if needed)
            let customer = customers?.find(c => c.id === transaction.customer_id);
            
            // If customer not in cache, fetch it
            if (!customer) {
              const { data: customerData, error: customerError } = await supabase
                .from("customers")
                .select("*")
                .eq("id", transaction.customer_id)
                .single();
              
              if (customerError || !customerData) {
                throw new Error(`Customer not found: ${customerError?.message || 'Unknown error'}`);
              }
              customer = customerData as Customer;
            }
            
            // Generate invoice automatically (both DOCX and PDF)
            await generateInvoice.mutateAsync({
              transactionId: transaction.id,
              transaction,
              customer,
            });
            
            toast({ 
              title: "Invoice Generated", 
              description: "Invoice (DOCX & PDF) generated and saved to Google Drive!" 
            });
          } catch (error) {
            // Log error but don't block the success flow
            logger.error('Auto-invoice generation failed:', error);
            toast({
              title: "Invoice Generation Warning",
              description: "Sale recorded successfully, but invoice generation failed. You can generate it manually.",
              variant: "destructive"
            });
          }
        }
      }
      
      // Reset form completely, including customer_id
      resetSaleForm();
      // Clear auto-saved data after successful submission
      clearSaleFormData();
      clearSalesItemsData();
      setSalesItems([]);
      setCurrentItem({
        sku: "",
        quantity: "",
        price_per_case: "",
        amount: "",
        description: ""
      });
      // Invalidate related queries using centralized hook
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
      invalidateRelated('invoices');
    },
    onError: (error) => {
      console.error('Sale mutation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({ 
        title: "Error", 
        description: `Failed to record sale: ${errorMessage}`,
        variant: "destructive"
      });
    },
  });

  // Payment entry mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      try {
        // Validate input data
        if (!data.customer_id || !data.branch || !data.amount) {
          throw new Error('Missing required fields: customer, branch, or amount');
        }

        const amount = parseFloat(data.amount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid amount: must be a positive number');
        }

        const { data: paymentData, error } = await supabase
          .from("sales_transactions")
          .insert({
            ...data,
            transaction_type: "payment",
            amount: amount
          })
          .select()
          .single();

        if (error) {
          console.error('Payment transaction error:', error);
          throw new Error(`Failed to create payment transaction: ${error.message}`);
        }

        return paymentData;
      } catch (error) {
        console.error('Critical error in payment mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Payment recorded successfully:', data);
      toast({ title: "Success", description: "Payment recorded successfully!" });
      setPaymentForm({
        customer_id: "",
        branch: "",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0]
      });
      // Clear auto-saved data after successful submission
      clearPaymentFormData();
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transport-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      console.error('Payment mutation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({ 
        title: "Error", 
        description: `Failed to record payment: ${errorMessage}`,
        variant: "destructive"
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<SaleForm>) => {
      // Store original transaction values before update for finding related records
      const originalDescription = editingTransaction?.description || '';
      const originalTransactionDate = editingTransaction?.transaction_date || '';
      const originalCustomerId = editingTransaction?.customer_id || '';

      // Update sales transaction
      const { error: salesError } = await supabase
        .from("sales_transactions")
        .update({
          customer_id: data.customer_id,
          amount: parseFloat(data.amount),
          total_amount: parseFloat(data.amount), // Add total_amount field
          quantity: data.quantity ? parseInt(data.quantity) : null,
          sku: data.sku,
          description: data.description,
          transaction_date: data.transaction_date
        })
        .eq("id", data.id);

      if (salesError) throw salesError;

      // Get customer info for transport update
      const selectedCustomer = customers?.find(c => c.id === data.customer_id);

      // Update corresponding factory transaction if it's a sale transaction
      if (data.sku && data.quantity && originalCustomerId) {
        // Get factory pricing for amount calculation
        const { data: factoryPricing } = await supabase
          .from("factory_pricing")
          .select("cost_per_case")
          .eq("sku", data.sku)
          .order("pricing_date", { ascending: false })
          .limit(1);

        const factoryCostPerCase = factoryPricing?.[0]?.cost_per_case || 0;
        const quantity = parseInt(data.quantity);
        const factoryAmount = quantity * factoryCostPerCase;

        // Get customer name for description update
        const selectedCustomer = customers?.find(c => c.id === data.customer_id);
        const newDescription = selectedCustomer?.client_name || "Unknown Client";

        // Find and update factory payables transaction using reliable identifiers:
        // customer_id, transaction_date, sku, and transaction_type
        // This is more reliable than matching by description which can vary
        const { error: factoryError } = await supabase
          .from("factory_payables")
          .update({
            sku: data.sku,
            amount: factoryAmount,
            quantity: quantity,
            description: newDescription,
            transaction_date: data.transaction_date,
            customer_id: data.customer_id
          })
          .eq("customer_id", originalCustomerId)
          .eq("transaction_date", originalTransactionDate)
          .eq("sku", editingTransaction?.sku || '')
          .eq("transaction_type", "production");

        if (factoryError) {
          console.error("Failed to update factory transaction:", factoryError);
          console.error("Update attempt details:", {
            originalCustomerId,
            originalTransactionDate,
            originalSku: editingTransaction?.sku,
            newCustomerId: data.customer_id,
            newTransactionDate: data.transaction_date,
            newSku: data.sku
          });
        } else {
          console.log("Factory transaction updated successfully");
        }
      }

      // Update corresponding transport transaction
      if (selectedCustomer && originalCustomerId) {
        const { error: transportError } = await supabase
          .from("transport_expenses")
          .update({
            expense_date: data.transaction_date,
            description: selectedCustomer ? `${selectedCustomer.client_name}-${selectedCustomer.branch} Transport` : 'Client-Branch Transport',
            client_id: data.customer_id,
            client_name: selectedCustomer?.client_name || 'N/A',
            branch: selectedCustomer?.branch || 'N/A'
          })
          .eq("expense_group", "Client Sale Transport")
          .eq("client_id", originalCustomerId)
          .eq("expense_date", originalTransactionDate);

        if (transportError) {
          console.warn("Failed to update transport transaction:", transportError);
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction updated successfully!" });
      setEditingTransaction(null);
      // Use centralized cache invalidation
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update transaction: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the transaction details to find related factory transactions
      const { data: transaction } = await supabase
        .from("sales_transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (transaction) {
        // Delete corresponding factory transaction if it's a sale transaction
        // Match by customer_id, transaction_date, sku, and transaction_type since description may vary
        if (transaction.transaction_type === "sale" && transaction.sku && transaction.customer_id) {
          const { error: factoryError } = await supabase
            .from("factory_payables")
            .delete()
            .eq("customer_id", transaction.customer_id)
            .eq("transaction_date", transaction.transaction_date)
            .eq("sku", transaction.sku)
            .eq("transaction_type", "production");

          if (factoryError) {
            console.warn("Failed to delete factory transaction:", factoryError);
          }
        }

        // Delete corresponding transport transaction
        // Match by client_id, expense_date, and expense_group since description format may vary
        const { error: transportError } = await supabase
          .from("transport_expenses")
          .delete()
          .eq("client_id", transaction.customer_id)
          .eq("expense_date", transaction.transaction_date)
          .eq("expense_group", "Client Sale Transport");

        if (transportError) {
          console.warn("Failed to delete transport transaction:", transportError);
        }
      }

      // Delete the sales transaction
      const { error } = await supabase
        .from("sales_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction deleted successfully!" });
      // Invalidate related queries using centralized hook
      invalidateRelated('sales_transactions');
      invalidateRelated('factory_payables');
      invalidateRelated('transport_expenses');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete transaction: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data using Zod schema
    const validationResult = safeValidate(saleFormSchema, saleForm);
    if (!validationResult.success) {
      logger.error('Sale form validation failed:', validationResult.error);
      toast({ 
        title: "Validation Error", 
        description: validationResult.error,
        variant: "destructive"
      });
      return;
    }
    
    saleMutation.mutate(saleForm);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data using Zod schema
    const validationResult = safeValidate(paymentFormSchema, paymentForm);
    if (!validationResult.success) {
      logger.error('Payment form validation failed:', validationResult.error);
      toast({ 
        title: "Validation Error", 
        description: validationResult.error,
        variant: "destructive"
      });
      return;
    }
    
    paymentMutation.mutate(paymentForm);
  };

  // Handle direct sale submission for single SKU mode
  const handleDirectSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.quantity || !currentItem.amount) {
      toast({ 
        title: "Error", 
        description: "Please fill in Quantity (cases) and Amount",
        variant: "destructive"
      });
      return;
    }
    
    // Create a single item sale
    const singleItemSale = {
      ...saleForm,
      sku: currentItem.sku,
      quantity: currentItem.quantity,
      amount: currentItem.amount,
      description: currentItem.description
    };
    
    saleMutation.mutate(singleItemSale);
  };

  const handleEditClick = useCallback((transaction: SalesTransaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      customer_id: transaction.customer_id || "",
      amount: transaction.amount?.toString() || "",
      quantity: transaction.quantity?.toString() || "",
      sku: transaction.sku || "",
      description: transaction.description || "",
      transaction_date: transaction.transaction_date || "",
      branch: transaction.branch || "",
      price_per_case: ""
    });
  }, []); // Stable function - no dependencies

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    updateMutation.mutate({
      id: editingTransaction.id,
      customer_id: editForm.customer_id,
      amount: editForm.amount,
      quantity: editForm.quantity,
      sku: editForm.sku,
      description: editForm.description,
      transaction_date: editForm.transaction_date
    });
  };

  const handleDeleteClick = useCallback((id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]); // Only recreate if deleteMutation changes

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sale">Record Sale</TabsTrigger>
          <TabsTrigger value="payment">Record Customer Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="mb-0">Record Sale</CardTitle>
                <CardDescription className="mb-0">Record sales for a single customer and branch</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Customer and Branch Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale-date">Date *</Label>
                    <Input
                      id="sale-date"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={saleForm.transaction_date}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        if (selectedDate > today) {
                          toast({
                            title: "Validation Error",
                            description: "Cannot select a future date",
                            variant: "destructive",
                          });
                          return;
                        }
                        setSaleForm({...saleForm, transaction_date: selectedDate});
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sale-customer">Customer *</Label>
                    <Select 
                      value={saleForm.customer_id ? (customers?.find(c => c.id === saleForm.customer_id)?.client_name || undefined) : undefined}
                      onValueChange={handleCustomerChange}
                      disabled={customersLoading}
                    >
                      <SelectTrigger id="sale-customer">
                        <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select customer"} />
                      </SelectTrigger>
                      <SelectContent>
                        {customersLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          getUniqueCustomersForForm().map((customerName) => (
                            <SelectItem key={customerName} value={customerName}>
                              {customerName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale-branch">Branch *</Label>
                    <Select 
                      value={saleForm.branch || undefined}
                      onValueChange={(value) => setSaleForm({...saleForm, branch: value})}
                      disabled={!saleForm.customer_id}
                    >
                      <SelectTrigger id="sale-branch">
                        <SelectValue placeholder={saleForm.customer_id ? "Select branch" : "Select customer first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableBranches().map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional Rendering based on SKU availability */}
                {saleForm.customer_id && saleForm.branch && (
                  <>
                    {/* No SKUs Available */}
                    {getAvailableSKUs().length === 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base text-amber-600">No SKUs Available</CardTitle>
                          <CardDescription className="text-sm">
                            No SKUs are configured for this customer-branch combination. Please configure SKUs in the Configuration Management section first.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <div className="text-4xl mb-4">📦</div>
                            <p className="text-muted-foreground">
                              Add SKU configurations for <strong>{customers?.find(c => c.id === saleForm.customer_id)?.client_name}</strong> - <strong>{saleForm.branch}</strong> in Configuration Management.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : isSingleSKUMode ? (
                      <Card>
                        <CardHeader>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleDirectSaleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="single-sku">SKU</Label>
                                <Input
                                  id="single-sku"
                                  value={singleSKUData?.sku || ''}
                                  readOnly
                                  className="bg-gray-50"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="single-quantity">Quantity (cases) *</Label>
                                <Input
                                  id="single-quantity"
                                  type="number"
                                  value={currentItem.quantity}
                                  onChange={(e) => handleCurrentItemQuantityChange(e.target.value)}
                                  placeholder="Number of cases"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="single-price">Price per Case (₹)</Label>
                                <Input
                                  id="single-price"
                                  type="number"
                                  step="0.01"
                                  value={singleSKUData?.price_per_case || ''}
                                  readOnly
                                  className="bg-gray-50"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="single-amount">Amount (₹) *</Label>
                                <Input
                                  id="single-amount"
                                  type="number"
                                  step="0.01"
                                  value={currentItem.amount}
                                  onChange={(e) => setCurrentItem({...currentItem, amount: e.target.value})}
                                  placeholder="Auto-calculated"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="single-description">Description</Label>
                              <Input
                                id="single-description"
                                value={currentItem.description}
                                onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                                placeholder="Sale description..."
                              />
                            </div>

                            <Button 
                              type="submit"
                              disabled={saleMutation.isPending || !currentItem.quantity || !currentItem.amount}
                              className="w-full h-12 text-lg"
                              size="lg"
                            >
                              {saleMutation.isPending ? "Recording Sale..." : "Record Sale"}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Multiple SKUs Mode - Add Items to Cart */}
                        <Card>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Single Row with All Fields */}
                              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="item-sku">SKU *</Label>
                                  <Select 
                                    value={currentItem.sku} 
                                    onValueChange={handleCurrentItemSKUChange}
                                  >
                                    <SelectTrigger id="item-sku">
                                      <SelectValue placeholder="Select SKU" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAvailableSKUs().map((customer) => (
                                        <SelectItem key={`${customer.id}-${customer.sku}`} value={customer.sku || ""}>
                                          {customer.sku}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="item-quantity">Quantity (cases) *</Label>
                                  <Input
                                    id="item-quantity"
                                    type="number"
                                    value={currentItem.quantity}
                                    onChange={(e) => handleCurrentItemQuantityChange(e.target.value)}
                                    placeholder="Number of cases"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="item-price-per-case">Price per Case (₹)</Label>
                                  <Input
                                    id="item-price-per-case"
                                    type="number"
                                    step="0.01"
                                    value={getPricePerCaseForCurrentItem()}
                                    readOnly
                                    className="bg-gray-50"
                                    placeholder="Auto-calculated"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="item-amount">Amount (₹) *</Label>
                                  <Input
                                    id="item-amount"
                                    type="number"
                                    step="0.01"
                                    value={currentItem.amount}
                                    onChange={(e) => setCurrentItem({...currentItem, amount: e.target.value})}
                                    placeholder="Auto-calculated"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="item-description">Description</Label>
                                  <Input
                                    id="item-description"
                                    value={currentItem.description}
                                    onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                                    placeholder="Item description..."
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>&nbsp;</Label>
                                  <Button 
                                    type="button"
                                    onClick={addItemToSales}
                                    className="w-full h-10"
                                    size="sm"
                                    disabled={!currentItem.sku || !currentItem.quantity || !currentItem.amount}
                                  >
                                    + Add Item
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Sales Items List and Total */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Sale Items {salesItems.length > 0 && `(${salesItems.length})`}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {salesItems.length > 0 ? "Review and manage items in this sale" : "Add items to your sale"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Items Table - Only show if there are items */}
                              {salesItems.length > 0 && (
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b border-slate-200 hover:bg-gradient-to-r hover:from-slate-100 hover:via-gray-100 hover:to-slate-100 transition-all duration-200">
                                      <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-slate-200/50">SKU</TableHead>
                                      <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-slate-200/50">Quantity (cases)</TableHead>
                                      <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-slate-200/50">Price per Case</TableHead>
                                      <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-slate-200/50">Amount</TableHead>
                                      <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-slate-200/50">Description</TableHead>
                                      <TableHead className="text-right font-semibold text-slate-700 text-xs uppercase tracking-widest py-6 px-6">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {salesItems.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.sku}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>₹{item.price_per_case}</TableCell>
                                        <TableCell>₹{item.amount}</TableCell>
                                        <TableCell>{item.description || '-'}</TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => editItemFromSales(item.id)}
                                              title="Edit item"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => removeItemFromSales(item.id)}
                                              title="Remove item"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}

                              {/* Total Amount Display - Always show */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-medium">Total Amount:</span>
                                  <span className="text-2xl font-bold text-green-600">
                                    ₹{calculateTotalAmount().toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Submit Button - Only show if there are items */}
                              {salesItems.length > 0 && (
                                <Button 
                                  type="button"
                                  onClick={handleMultipleSalesSubmit}
                                  disabled={saleMutation.isPending}
                                  className="w-full h-12 text-lg"
                                  size="lg"
                                >
                                  {saleMutation.isPending ? "Recording Sales..." : `Record ${salesItems.length} Sale${salesItems.length > 1 ? 's' : ''}`}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="mb-0">Record Customer Payment</CardTitle>
                <CardDescription className="mb-0">Record a payment received from customer</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* First Row: Customer, Branch, Amount */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-customer">Customer *</Label>
                    <Select 
                      value={paymentForm.customer_id ? (customers?.find(c => c.id === paymentForm.customer_id)?.client_name || undefined) : undefined}
                      onValueChange={(customerName) => {
                        const selectedCustomer = customers?.find(c => c.client_name === customerName);
                        setPaymentForm({...paymentForm, customer_id: selectedCustomer?.id || "", branch: ""});
                      }}
                    >
                      <SelectTrigger id="payment-customer">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueCustomers.map((customerName) => (
                          <SelectItem key={customerName} value={customerName}>
                            {customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-branch">Branch *</Label>
                    <Select 
                      value={paymentForm.branch || undefined}
                      onValueChange={(branch) => setPaymentForm({...paymentForm, branch})}
                      disabled={!paymentForm.customer_id}
                    >
                      <SelectTrigger id="payment-branch">
                        <SelectValue placeholder={paymentForm.customer_id ? "Select branch" : "Select customer first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentForm.customer_id && getBranchesForCustomer(paymentForm.customer_id).map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Amount (₹) *</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {/* Second Row: Date and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-date">Date</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={paymentForm.transaction_date}
                      onChange={(e) => setPaymentForm({...paymentForm, transaction_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-description">Description</Label>
                    <Input
                      id="payment-description"
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                      placeholder="Payment details..."
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={paymentMutation.isPending}
                  className="w-full"
                >
                  {paymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <CardTitle className="mb-0">Client Transactions</CardTitle>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {paginatedTransactions.length} of {totalFilteredTransactions} filtered transactions
              {totalTransactions !== totalFilteredTransactions && ` (${totalTransactions} total)`}
              {totalPages > 1 && ` - Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex-1"></div>
            <Button
              onClick={exportRecentTransactionsToExcel}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search transactions by customer, branch, SKU, description, amount, date, or type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Page reset is handled by the hook automatically
              }}
              className="flex-1 min-w-[200px]"
            />
            {(searchTerm || Object.values(columnFilters).some(filter => {
              if (Array.isArray(filter)) return filter.length > 0;
              return filter && filter !== "";
            }) || Object.values(columnSorts).some(sort => sort !== null)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetFilters();
                }}
                className="whitespace-nowrap"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
              <TableRow className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-b-2 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:via-green-100 hover:to-emerald-100 transition-all duration-200">
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <span>Date</span>
                    <ColumnFilter
                      columnKey="date"
                      columnName="Date"
                      filterValue={columnFilters.date}
                      onFilterChange={(value) => handleColumnFilterChange('date', value)}
                      onClearFilter={() => handleClearColumnFilter('date')}
                      sortDirection={columnSorts.date}
                      onSortChange={(direction) => handleColumnSortChange('date', direction)}
                      dataType="date"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <span>Customer</span>
                    <ColumnFilter
                      columnKey="customer"
                      columnName="Customer"
                      filterValue={columnFilters.customer}
                      onFilterChange={(value) => handleColumnFilterChange('customer', value)}
                      onClearFilter={() => handleClearColumnFilter('customer')}
                      sortDirection={columnSorts.customer}
                      onSortChange={(direction) => handleColumnSortChange('customer', direction)}
                      dataType="multiselect"
                      options={getUniqueCustomers}
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <span>Branch</span>
                    <ColumnFilter
                      columnKey="branch"
                      columnName="Branch"
                      filterValue={columnFilters.branch}
                      onFilterChange={(value) => handleColumnFilterChange('branch', value)}
                      onClearFilter={() => handleClearColumnFilter('branch')}
                      sortDirection={columnSorts.branch}
                      onSortChange={(direction) => handleColumnSortChange('branch', direction)}
                      dataType="multiselect"
                      options={getUniqueBranches}
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <span>Type</span>
                    <ColumnFilter
                      columnKey="type"
                      columnName="Type"
                      filterValue={columnFilters.type}
                      onFilterChange={(value) => handleColumnFilterChange('type', value)}
                      onClearFilter={() => handleClearColumnFilter('type')}
                      sortDirection={columnSorts.type}
                      onSortChange={(direction) => handleColumnSortChange('type', direction)}
                      dataType="multiselect"
                      options={getUniqueTypes}
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <span>SKU</span>
                    <ColumnFilter
                      columnKey="sku"
                      columnName="SKU"
                      filterValue={columnFilters.sku}
                      onFilterChange={(value) => handleColumnFilterChange('sku', value)}
                      onClearFilter={() => handleClearColumnFilter('sku')}
                      sortDirection={columnSorts.sku}
                      onSortChange={(direction) => handleColumnSortChange('sku', direction)}
                      dataType="multiselect"
                      options={getUniqueSKUs}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-emerald-200/50">
                  Quantity (cases)
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-emerald-200/50">
                  <div className="flex items-center justify-end">
                    <span>Amount</span>
                    <ColumnFilter
                      columnKey="amount"
                      columnName="Amount"
                      filterValue={columnFilters.amount}
                      onFilterChange={(value) => handleColumnFilterChange('amount', value)}
                      onClearFilter={() => handleClearColumnFilter('amount')}
                      sortDirection={columnSorts.amount}
                      onSortChange={(direction) => handleColumnSortChange('amount', direction)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-emerald-200/50">
                  Customer Outstanding
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-emerald-200/50">
                  Description
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-6 px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-muted-foreground">Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactionsError ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-red-500 text-sm">
                        ⚠️ Error loading transactions
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transactionsError instanceof Error ? transactionsError.message : 'Unknown error occurred'}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.reload()}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => {
                const customer = customers?.find(c => c.id === transaction.customer_id);
                const customerPrice = customer?.price_per_bottle || 0;
                const quantity = transaction.quantity || 0;
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {transaction.customers?.client_name}
                    </TableCell>
                    <TableCell>
                      {transaction.customers?.branch || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.transaction_type === 'sale' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.sku || '-'}</TableCell>
                    <TableCell className="text-right">{transaction.quantity || '-'}</TableCell>
                    <TableCell className="text-right">₹{transaction.amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      ₹{(Number((transaction as unknown as { outstanding?: number }).outstanding) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="truncate max-w-[150px]">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <InvoiceActions
                          transaction={transaction}
                          customer={customer}
                          onGenerate={handleGenerateInvoice}
                          onDownload={handleDownloadInvoice}
                          isGenerating={generateInvoice.isPending}
                        />
                        <EditTransactionDialog
                          transaction={transaction}
                          editForm={editForm}
                          customers={customers}
                          getUniqueCustomers={getUniqueCustomers}
                          getAvailableBranchesForEdit={getAvailableBranchesForEdit}
                          getPricePerCaseForEdit={getPricePerCaseForEdit}
                          isOpen={!!editingTransaction && editingTransaction.id === transaction.id}
                          isUpdating={updateMutation.isPending}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingTransaction(null);
                            }
                          }}
                          onEditClick={handleEditClick}
                          onEditSubmit={handleEditSubmit}
                          onFormChange={(updates) => setEditForm({...editForm, ...updates})}
                          onCustomerChange={handleEditCustomerChange}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(transaction.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No transactions found matching your search" : "No recent transactions found"}
                </TableCell>
              </TableRow>
            )}
            </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || transactionsLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        disabled={transactionsLoading}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || transactionsLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesEntry;