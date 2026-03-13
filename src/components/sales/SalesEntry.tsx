import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ColumnFilter } from '@/components/ui/column-filter';
import { useAutoSave } from "@/hooks/useAutoSave";
import { saleFormSchema, paymentFormSchema } from "@/lib/validation/schemas";
import { safeValidate } from "@/lib/validation/utils";
import { logger } from "@/lib/logger";
import { EditTransactionDialog } from "@/components/sales/EditTransactionDialog";
import { InvoiceActions, InvoiceNumberCell } from "@/components/sales/InvoiceActions";
import { useInvoiceGeneration, useInvoiceDownload } from "@/hooks/useInvoiceGeneration";
import { isAutoInvoiceEnabled } from "@/services/invoiceConfigService";
import ProductionInventory from "@/components/sales/ProductionInventory";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { useCustomerDirectory } from "@/components/sales/hooks/useCustomerDirectory";
import { useSaleSubmission } from "@/components/sales/hooks/useSaleSubmission";
import { useSalesItemsManager } from "@/components/sales/hooks/useSalesItemsManager";
import { useMultiSaleSubmission } from "@/components/sales/hooks/useMultiSaleSubmission";
import { useSalesFormController } from "@/components/sales/hooks/useSalesFormController";
import { useTransactionMutations } from "@/components/sales/hooks/useTransactionMutations";

// Safe display for number inputs (prevents "NaN" which causes browser warnings)
const safeNumValue = (v: string | number | undefined | null): string => {
  if (v == null || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? "" : String(v);
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
    area: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    customer_id: "",
    area: "",
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
    area: ""
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
  // Invoice generation hooks
  const generateInvoice = useInvoiceGeneration();
  const downloadInvoice = useInvoiceDownload();
  const {
    currentItem,
    setCurrentItem,
    salesItems,
    setSalesItems,
    isSingleSKUMode,
    setIsSingleSKUMode,
    singleSKUData,
    setSingleSKUData,
    resetItemsState,
    addItemToSales,
    removeItemFromSales,
    editItemFromSales,
    calculateTotalAmount,
    handleCurrentItemSKUChange,
    handleCurrentItemQuantityChange,
    syncSingleSkuMode,
  } = useSalesItemsManager({
    onValidationError: (message) => {
      logger.error('Sales item validation failed:', message);
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive"
      });
    },
    onItemAdded: (sku) => {
      toast({
        title: "Item Added",
        description: `${sku} added to sale items`,
      });
    },
    onItemLoadedForEdit: (sku) => {
      toast({
        title: "Item Loaded for Editing",
        description: `${sku} loaded for editing`,
      });
    },
  });

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
      area: ""
    });
    resetItemsState();
    clearSaleFormData();
    clearSalesItemsData();
  }, [clearSaleFormData, clearSalesItemsData, resetItemsState]);

  // Function to reset payment form to default state
  const resetPaymentForm = useCallback(() => {
    setPaymentForm({
      customer_id: "",
      area: "",
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
          .select("id, dealer_name, client_name, area, branch, sku, price_per_case, created_at, whatsapp_number")
          .eq("is_active", true)
          .order("dealer_name", { ascending: true });
        
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
    gcTime: 600000, // 10 minutes
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
  const {
    buildTransportDescription,
    findCustomerById,
    findCustomerRecord,
    getAvailableBranches,
    getAvailableSkus,
    getCustomerBranch,
    getCustomerName,
    getTransactionBranch,
    getUniqueCustomerNames,
    normalizeLookupValue,
    resolveCustomerIdForBranch,
  } = useCustomerDirectory(customers);
  const getInvoiceFailureDescription = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const normalized = message.toLowerCase();

    if (
      normalized.includes("google drive authentication failed") ||
      normalized.includes("failed to get access token") ||
      normalized.includes("token refresh failed") ||
      normalized.includes("unauthorized")
    ) {
      return "Sale recorded successfully, but Google Drive authentication failed during invoice upload. Please reconnect or refresh the Google Drive token, then generate the invoice manually.";
    }

    return "Sale recorded successfully, but invoice generation failed. You can generate it manually.";
  }, []);
  const {
    availableAreas,
    availableAreasForEdit,
    availableSkus,
    uniqueCustomersForForm,
    getBranchesForCustomer,
    getPricePerCaseForCurrentItem,
    getPricePerCaseForEdit,
    handleAreaChange,
    handleCustomerChange,
    handleEditCustomerChange,
  } = useSalesFormController({
    customers,
    saleForm,
    editForm,
    currentItem,
    setSaleForm,
    setEditForm,
    setCurrentItem,
    setSalesItems,
    getAvailableBranches,
    getAvailableSkus,
    getCustomerName,
    getCustomerBranch,
    getUniqueCustomerNames,
    normalizeLookupValue,
    findCustomerById,
    findCustomerRecord,
  });

  const getAvailableSKUs = useCallback(() => availableSkus, [availableSkus]);
  const getAvailableAreas = useCallback(() => availableAreas, [availableAreas]);
  const getAvailableAreasForEdit = useCallback(() => availableAreasForEdit, [availableAreasForEdit]);

  const multiSaleMutation = useMultiSaleSubmission({
    saleForm,
    salesItems,
    findCustomerById,
    getCustomerBranch,
    buildTransportDescription,
    calculateTotalAmount,
    onSuccessReset: resetItemsState,
  });

  const handleMultipleSalesSubmit = useCallback(() => {
    multiSaleMutation.mutate();
  }, [multiSaleMutation]);

  // Function to handle SKU selection
  const handleSKUChange = (sku: string) => {
    // Auto-populate price per case when SKU is selected
    let pricePerCase = "";

    if (saleForm.customer_id && saleForm.area) {
      const customerSKURecord = findCustomerRecord({
        customerId: saleForm.customer_id,
        branch: saleForm.area,
        sku,
      });
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

    // Find the specific customer-SKU combination for pricing
    const customerSKURecord = findCustomerRecord({
      customerId: saleForm.customer_id,
      branch: saleForm.area,
      sku: saleForm.sku,
    });

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
    gcTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const getUniqueCustomersForForm = useCallback(() => uniqueCustomersForForm, [uniqueCustomersForForm]);

  const handleSaleSuccess = useCallback(() => {
    resetSaleForm();
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
  }, [clearSaleFormData, clearSalesItemsData, resetSaleForm]);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentForm({
      customer_id: "",
      area: "",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split('T')[0]
    });
    clearPaymentFormData();
  }, [clearPaymentFormData]);

  const handleUpdateSuccess = useCallback(() => {
    setEditingTransaction(null);
  }, []);

  const saleMutation = useSaleSubmission({
    customers,
    findCustomerById,
    getCustomerBranch,
    getCustomerName,
    buildTransportDescription,
    generateInvoice,
    getInvoiceFailureDescription,
    onSaleSuccess: handleSaleSuccess,
  });

  const {
    paymentMutation,
    updateMutation,
    deleteMutation,
  } = useTransactionMutations({
    editingTransaction,
    findCustomerById,
    getCustomerName,
    getTransactionBranch,
    buildTransportDescription,
    resolveCustomerIdForBranch,
    onPaymentSuccess: handlePaymentSuccess,
    onUpdateSuccess: handleUpdateSuccess,
  });

  // Check if only one SKU is available for the selected customer-area combination
  const checkSingleSKUMode = useCallback(() => {
    if (!saleForm.customer_id || !saleForm.area) {
      setIsSingleSKUMode(false);
      setSingleSKUData(null);
      return;
    }

    const availableSKUs = availableSkus;
    
    syncSingleSkuMode(availableSKUs);
  }, [availableSkus, saleForm.area, saleForm.customer_id, syncSingleSkuMode]);

  // Check for single SKU mode when customer or area changes
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
            branch,
            created_at,
            customers (dealer_name, client_name, area, branch)
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
          const customerName = transaction.customers?.dealer_name || '';
          const area = getTransactionBranch(transaction);
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
              area.toLowerCase().includes(searchLower) ||
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
          if (columnFilters.area) {
            const areaFilter = Array.isArray(columnFilters.area) ? columnFilters.area : [columnFilters.area];
            if (areaFilter.length > 0 && !areaFilter.some(filter => 
              area.toLowerCase().includes(filter.toLowerCase())
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
              valueA = a.customers?.dealer_name || '';
              valueB = b.customers?.dealer_name || '';
              break;
            case 'area':
              valueA = getTransactionBranch(a);
              valueB = getTransactionBranch(b);
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
      const name = t.customers?.dealer_name;
      if (name) unique.add(name);
    });
    return Array.from(unique).sort();
  }, [recentTransactions]);

  const getUniqueBranches = useMemo(() => {
    const unique = new Set<string>();
    recentTransactions?.forEach(t => {
      const area = getTransactionBranch(t);
      if (area) unique.add(area);
    });
    return Array.from(unique).sort();
  }, [getTransactionBranch, recentTransactions]);

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
  const exportRecentTransactionsToExcel = async () => {
    const exportData = filteredAndSortedRecentTransactions.map((transaction) => {
      const customer = customers?.find(c => c.id === transaction.customer_id);
      return {
        'Date': new Date(transaction.transaction_date).toLocaleDateString(),
        'Client': transaction.customers?.dealer_name || 'N/A',
        'Branch': getTransactionBranch(transaction) || 'N/A',
        'Type': transaction.transaction_type || '',
        'SKU': transaction.sku || '',
        'Quantity (cases)': transaction.quantity || 0,
        'Amount (₹)': transaction.amount || 0,
        'Customer Outstanding (₹)': Number((transaction as unknown as { outstanding?: number }).outstanding) || 0,
        'Description': transaction.description || ''
      };
    });

    const fileName = `Recent_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Recent Transactions', fileName);
    
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
      area: getTransactionBranch(transaction),
      price_per_case: ""
    });
  }, [getTransactionBranch]); // Stable function - no dependencies

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
      transaction_date: editForm.transaction_date,
      area: editForm.area,
    });
  };

  const handleDeleteClick = useCallback((id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]); // Only recreate if deleteMutation changes

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Production Inventory (Production − Sales) - top of Dealer Transactions */}
      <ProductionInventory />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sale">Record Sale</TabsTrigger>
          <TabsTrigger value="payment">Record Client Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="mb-0">Record Sale</CardTitle>
                <CardDescription className="mb-0">Record sales for a single client and branch</CardDescription>
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
                    <Label htmlFor="sale-customer">Client *</Label>
                    <Select 
                      value={saleForm.customer_id ? getCustomerName(findCustomerById(saleForm.customer_id) as any) : ""}
                      onValueChange={handleCustomerChange}
                      disabled={customersLoading}
                    >
                      <SelectTrigger id="sale-customer">
                        <SelectValue placeholder={customersLoading ? "Loading clients..." : "Select client"} />
                      </SelectTrigger>
                      <SelectContent>
                        {customersLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          uniqueCustomersForForm.map((customerName) => (
                            <SelectItem key={customerName} value={customerName}>
                              {customerName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale-area">Branch *</Label>
                    <Select 
                      value={saleForm.area ?? ""}
                      onValueChange={handleAreaChange}
                      disabled={!saleForm.customer_id}
                    >
                      <SelectTrigger id="sale-area">
                        <SelectValue placeholder={saleForm.customer_id ? "Select branch" : "Select client first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional Rendering based on SKU availability */}
                {saleForm.customer_id && saleForm.area && (
                  <>
                    {/* No SKUs Available */}
                    {availableSkus.length === 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base text-amber-600">No SKUs Available</CardTitle>
                          <CardDescription className="text-sm">
                            No SKUs are configured for this client-branch combination. Please configure SKUs in the Configuration Management section first.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <div className="text-4xl mb-4">📦</div>
                            <p className="text-muted-foreground">
                              Add SKU configurations for <strong>{getCustomerName(findCustomerById(saleForm.customer_id) as any)}</strong> - <strong>{saleForm.area}</strong> in Configuration Management for this client branch.
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
                                  value={safeNumValue(currentItem.quantity)}
                                  onChange={(e) => handleCurrentItemQuantityChange(e.target.value, (sku) => {
                                    const customerPricing = findCustomerRecord({
                                      customerId: saleForm.customer_id,
                                      branch: saleForm.area,
                                      sku,
                                    });

                                    return customerPricing?.price_per_case?.toString() || "";
                                  })}
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
                                  value={safeNumValue(currentItem.amount)}
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
                                    value={currentItem.sku ?? ""} 
                                    onValueChange={(sku) => handleCurrentItemSKUChange(sku, (nextSku) => {
                                      const customerPricing = findCustomerRecord({
                                        customerId: saleForm.customer_id,
                                        branch: saleForm.area,
                                        sku: nextSku,
                                      });

                                      return customerPricing?.price_per_case?.toString() || "";
                                    })}
                                  >
                                    <SelectTrigger id="item-sku">
                                      <SelectValue placeholder="Select SKU" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableSkus.map((customer) => (
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
                                    value={safeNumValue(currentItem.quantity)}
                                    onChange={(e) => handleCurrentItemQuantityChange(e.target.value, (sku) => {
                                      const customerPricing = findCustomerRecord({
                                        customerId: saleForm.customer_id,
                                        branch: saleForm.area,
                                        sku,
                                      });

                                      return customerPricing?.price_per_case?.toString() || "";
                                    })}
                                    placeholder="Number of cases"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="item-price-per-case">Price per Case (₹)</Label>
                                  <Input
                                    id="item-price-per-case"
                                    type="number"
                                    step="0.01"
                                    value={safeNumValue(getPricePerCaseForCurrentItem())}
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
                                    value={safeNumValue(currentItem.amount)}
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
                                  disabled={multiSaleMutation.isPending}
                                  className="w-full h-12 text-lg"
                                  size="lg"
                                >
                                  {multiSaleMutation.isPending ? "Recording Sales..." : `Record ${salesItems.length} Sale${salesItems.length > 1 ? 's' : ''}`}
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
                <CardTitle className="mb-0">Record Client Payment</CardTitle>
                <CardDescription className="mb-0">Record a payment received from client</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* First Row: Dealer, Area, Amount */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-customer">Client *</Label>
                    <Select 
                      value={paymentForm.customer_id ? getCustomerName(findCustomerById(paymentForm.customer_id) as any) : ""}
                      onValueChange={(customerName) => {
                        const selectedCustomer = findCustomerRecord({ customerName });
                        setPaymentForm({...paymentForm, customer_id: selectedCustomer?.id || "", area: ""});
                      }}
                    >
                      <SelectTrigger id="payment-customer">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueCustomersForForm.map((customerName) => (
                          <SelectItem key={customerName} value={customerName}>
                            {customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-area">Branch *</Label>
                    <Select 
                      value={paymentForm.area ?? ""}
                      onValueChange={(area) => setPaymentForm({...paymentForm, area})}
                      disabled={!paymentForm.customer_id}
                    >
                      <SelectTrigger id="payment-area">
                        <SelectValue placeholder={paymentForm.customer_id ? "Select branch" : "Select client first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentForm.customer_id && getBranchesForCustomer(paymentForm.customer_id).map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
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
                      value={safeNumValue(paymentForm.amount)}
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
              placeholder="Search transactions by client, branch, SKU, description, amount, date, or type..."
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
        <CardContent className="p-0 sm:p-4">
          <div className="w-full overflow-x-auto overflow-y-visible">
            <Table className="min-w-[900px] w-full">
              <TableHeader>
              <TableRow className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-b-2 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:via-green-100 hover:to-emerald-100 transition-all duration-200">
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-left border-r border-emerald-200/50">
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
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-left border-r border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <span>Client</span>
                    <ColumnFilter
                      columnKey="customer"
                      columnName="Client"
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
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-left border-r border-emerald-200/50 w-[100px]">
                  <div className="flex items-center justify-between">
                <span>Branch</span>
                <ColumnFilter
                  columnKey="area"
                  columnName="Branch"
                      filterValue={columnFilters.area}
                      onFilterChange={(value) => handleColumnFilterChange('area', value)}
                      onClearFilter={() => handleClearColumnFilter('area')}
                      sortDirection={columnSorts.area}
                      onSortChange={(direction) => handleColumnSortChange('area', direction)}
                      dataType="multiselect"
                      options={getUniqueBranches}
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-center border-r border-emerald-200/50">
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
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-left border-r border-emerald-200/50">
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
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 border-r border-emerald-200/50">
                  Qty
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 border-r border-emerald-200/50">
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
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-left border-r border-emerald-200/50">
                  Invoice #
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 border-r border-emerald-200/50">
                  Outstanding
                </TableHead>
                <TableHead className="font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2 text-left border-r border-emerald-200/50">
                  Description
                </TableHead>
                <TableHead className="text-right font-semibold text-emerald-800 text-xs uppercase tracking-widest py-3 px-2">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-muted-foreground">Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactionsError ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
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
                    <TableCell className="whitespace-nowrap">{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell className="truncate max-w-[100px]">
                      {transaction.customers?.dealer_name}
                    </TableCell>
                    <TableCell className="truncate max-w-[80px]">
                      {getTransactionBranch(transaction) || '-'}
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
                    <TableCell className="truncate max-w-[80px]">{transaction.sku || '-'}</TableCell>
                    <TableCell className="text-right">{transaction.quantity || '-'}</TableCell>
                    <TableCell className="text-right">₹{transaction.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <InvoiceNumberCell transactionId={transaction.id} transactionType={transaction.transaction_type} />
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(Number((transaction as unknown as { outstanding?: number }).outstanding) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px]" title={transaction.description || undefined}>
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
                          getAvailableAreasForEdit={getAvailableAreasForEdit}
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
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
