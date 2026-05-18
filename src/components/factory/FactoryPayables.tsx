import { useState, useMemo, useCallback, lazy, Suspense } from "react";
const FactoryPricingTab = lazy(() => import("./FactoryPricingTab"));
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getQueryConfig } from "@/lib/query-configs";
import { useCacheInvalidation } from "@/hooks/useCacheInvalidation";
import type { 
  FactoryPayable, 
  FactoryPricing, 
  FactoryProductionForm, 
  FactoryPaymentForm
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Download } from "lucide-react";
import { exportJsonToExcel } from '@/services/export/excelExport';
import { ColumnFilter } from '@/components/ui/column-filter';
import { passesMultiFilter } from '@/lib/utils';

const FactoryPayables = () => {
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [productionForm, setProductionForm] = useState({
    sku: "",
    quantity: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0],
    customer_id: "",
    area: "",
  });

  const [editingTransaction, setEditingTransaction] = useState<FactoryPayable | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    quantity: "",
    sku: "",
    description: "",
    transaction_date: ""
  });
  const [activeTab, setActiveTab] = useState("payment");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [columnFilters, setColumnFilters] = useState<{
    date: string | string[];
    client: string | string[];
    branch: string | string[];
    sku: string | string[];
    quantity: string | string[];
    price_per_case: string | string[];
    type: string | string[];
    amount: string | string[];
  }>({
    date: "",
    client: "",
    branch: "",
    sku: "",
    quantity: "",
    price_per_case: "",
    type: "",
    amount: ""
  });
  const [columnSorts, setColumnSorts] = useState<{[key: string]: 'asc' | 'desc' | null}>({
    date: 'desc',
    client: null,
    branch: null,
    sku: null,
    quantity: null,
    price_per_case: null,
    type: null,
    amount: null
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateRelated } = useCacheInvalidation();

  // Fetch factory pricing data
  const { data: factoryPricing } = useQuery({
    queryKey: ["factory-pricing"],
    ...getQueryConfig("factory-pricing"),
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("id, sku, cost_per_case, bottles_per_case, pricing_date")
        .order("pricing_date", { ascending: false });
      return data || [];
    },
  });

  // Get unique SKUs for dropdown (from sku_configurations — the canonical SKU list)
  const { data: availableSKUs } = useQuery({
    queryKey: ["available-skus"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sku_configurations")
        .select("sku")
        .order("sku", { ascending: true });
      return (data || []).map(item => item.sku as string);
    },
  });

  // Fetch customers for client/branch dropdowns in production form
  const { data: customers } = useQuery({
    queryKey: ["customers-factory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      return data || [];
    },
  });

  // Unique client names (deduped)
  const uniqueClientNames = useMemo(() => {
    if (!customers) return [];
    return [...new Set(customers.map(c => c.client_name))].sort();
  }, [customers]);

  // Branches for selected client in production form
  const productionBranches = useMemo(() => {
    if (!customers || !productionForm.customer_id) return [];
    const selected = customers.find(c => c.id === productionForm.customer_id);
    if (!selected) return [];
    return [...new Set(
      customers.filter(c => c.client_name === selected.client_name).map(c => c.branch).filter(Boolean)
    )].sort() as string[];
  }, [customers, productionForm.customer_id]);

  // SKUs filtered by selected client+branch
  const productionSKUs = useMemo(() => {
    if (!customers || !productionForm.customer_id || !productionForm.area) return availableSKUs ?? [];
    const selected = customers.find(c => c.id === productionForm.customer_id);
    if (!selected) return availableSKUs ?? [];
    const skus = [...new Set(
      customers
        .filter(c => c.client_name === selected.client_name && c.branch === productionForm.area && c.sku)
        .map(c => c.sku as string)
    )].sort();
    return skus.length > 0 ? skus : (availableSKUs ?? []);
  }, [customers, productionForm.customer_id, productionForm.area, availableSKUs]);

  // Handle production client change — auto-select branch and SKU when only one option
  const handleProductionClientChange = (clientId: string) => {
    const selected = customers?.find(c => c.id === clientId);
    if (!selected) { setProductionForm(f => ({ ...f, customer_id: "", area: "", sku: "" })); return; }
    const branches = [...new Set(
      customers!.filter(c => c.client_name === selected.client_name).map(c => c.branch).filter(Boolean)
    )] as string[];
    const autoArea = branches.length === 1 ? branches[0] : "";
    let autoSku = "";
    if (autoArea) {
      const skus = [...new Set(
        customers!.filter(c => c.client_name === selected.client_name && c.branch === autoArea && c.sku).map(c => c.sku as string)
      )];
      autoSku = skus.length === 1 ? skus[0] : "";
    }
    setProductionForm(f => ({ ...f, customer_id: clientId, area: autoArea, sku: autoSku }));
  };

  // Handle production branch change — auto-select SKU if only one
  const handleProductionBranchChange = (area: string) => {
    const selected = customers?.find(c => c.id === productionForm.customer_id);
    let autoSku = "";
    if (selected) {
      const skus = [...new Set(
        customers!.filter(c => c.client_name === selected.client_name && c.branch === area && c.sku).map(c => c.sku as string)
      )];
      autoSku = skus.length === 1 ? skus[0] : "";
    }
    setProductionForm(f => ({ ...f, area, sku: autoSku }));
  };

  // Fetch factory transactions
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["factory-transactions"],
    ...getQueryConfig("factory-transactions"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_payables")
        .select(`
          *,
          customers (
            id,
            client_name,
            branch
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching factory transactions:", error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Get price per case for a SKU as of a given date (latest record on or before that date)
  const getPricePerCase = (sku: string | null, transactionDate?: string): number | null => {
    if (!sku) return null;
    // factoryPricing is ordered by pricing_date DESC — find first eligible record
    const eligible = transactionDate
      ? factoryPricing?.filter(p => p.sku === sku && p.pricing_date <= transactionDate)
      : factoryPricing?.filter(p => p.sku === sku);
    return eligible?.[0]?.cost_per_case || null;
  };

  // For display: falls back to amount/quantity when SKU doesn't match factory_pricing
  // (handles non-standard SKU formats like "500 P", "P500ml" stored in older records)
  const getDisplayPricePerCase = (sku: string | null, transactionDate: string, transactionType: string, amount: number | null, quantity: number | null): number | null => {
    const fromPricing = getPricePerCase(sku, transactionDate);
    if (fromPricing) return fromPricing;
    if (transactionType === 'production' && quantity && quantity > 0 && amount) {
      return amount / quantity;
    }
    return null;
  };

  // Filter and sort transactions (memoized for performance)
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter((transaction) => {
    const sku = transaction.sku || '';
    const amount = transaction.amount?.toString() || '';
    const date = new Date(transaction.transaction_date).toLocaleDateString();
    const dateISO = transaction.transaction_date;
    const type = transaction.transaction_type || '';
    const clientName = transaction.transaction_type === 'payment' 
      ? (transaction.description || 'Elma Payment')
      : (transaction.customers?.client_name || '');
    const area = transaction.customers?.branch || '';
    const quantity = transaction.quantity?.toString() || '';
    const pricePerCase = getDisplayPricePerCase(transaction.sku, transaction.transaction_date, transaction.transaction_type, transaction.amount, transaction.quantity);
    const pricePerCaseStr = pricePerCase?.toString() || '';
    
    // Global search filter (using debounced value)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesGlobalSearch = (
        sku.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        area.toLowerCase().includes(searchLower) ||
        quantity.includes(searchLower) ||
        pricePerCaseStr.includes(searchLower) ||
        amount.includes(searchLower) ||
        date.includes(searchLower) ||
        type.toLowerCase().includes(searchLower)
      );
      if (!matchesGlobalSearch) return false;
    }
    
    // Column-specific filters - support both single values and arrays (multi-select)
    // Date filter (single value only)
    if (columnFilters.date) {
      const dateFilter = Array.isArray(columnFilters.date) ? columnFilters.date[0] : columnFilters.date;
      if (dateFilter && dateISO !== dateFilter) return false;
    }
    
    // Client filter (multi-select)
    if (columnFilters.client) {
      const clientFilter = Array.isArray(columnFilters.client) ? columnFilters.client : [columnFilters.client];
      if (clientFilter.length > 0 && !clientFilter.some(filter => 
        clientName.toLowerCase().includes(filter.toLowerCase())
      )) return false;
    }
    
    // Branch filter (multi-select)
    if (columnFilters.branch) {
      const areaFilter = Array.isArray(columnFilters.branch) ? columnFilters.branch : [columnFilters.branch];
      if (areaFilter.length > 0 && !areaFilter.some(filter => 
        area.toLowerCase().includes(filter.toLowerCase())
      )) return false;
    }
    
    // SKU filter (multi-select)
    if (columnFilters.sku) {
      const skuFilter = Array.isArray(columnFilters.sku) ? columnFilters.sku : [columnFilters.sku];
      if (skuFilter.length > 0 && !skuFilter.some(filter => 
        sku.toLowerCase().includes(filter.toLowerCase())
      )) return false;
    }
    
    // Type filter (multi-select)
    if (columnFilters.type) {
      const typeFilter = Array.isArray(columnFilters.type) ? columnFilters.type : [columnFilters.type];
      if (typeFilter.length > 0 && !typeFilter.some(filter => 
        type.toLowerCase().includes(filter.toLowerCase())
      )) return false;
    }
    
    // Quantity filter (single value - text search)
    if (columnFilters.quantity) {
      const quantityFilter = Array.isArray(columnFilters.quantity) ? columnFilters.quantity[0] : columnFilters.quantity;
      if (quantityFilter && !quantity.includes(quantityFilter)) return false;
    }
    
    // Price per case filter (single value - text search)
    if (columnFilters.price_per_case) {
      const priceFilter = Array.isArray(columnFilters.price_per_case) ? columnFilters.price_per_case[0] : columnFilters.price_per_case;
      if (priceFilter && !pricePerCaseStr.includes(priceFilter)) return false;
    }
    
    // Amount filter (single value - text search)
    if (columnFilters.amount) {
      const amountFilter = Array.isArray(columnFilters.amount) ? columnFilters.amount[0] : columnFilters.amount;
      if (amountFilter && !amount.includes(amountFilter)) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    const activeSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);
    if (!activeSort) return 0;

    const [columnKey, direction] = activeSort;

    let valueA: string | number, valueB: string | number;

    switch (columnKey) {
      case 'date':
        valueA = new Date(a.transaction_date).getTime();
        valueB = new Date(b.transaction_date).getTime();
        break;
      case 'client':
        valueA = a.transaction_type === 'payment' 
          ? (a.description || 'Elma Payment')
          : (a.customers?.client_name || '');
        valueB = b.transaction_type === 'payment' 
          ? (b.description || 'Elma Payment')
          : (b.customers?.client_name || '');
        break;
      case 'branch':
        valueA = a.customers?.branch || '';
        valueB = b.customers?.branch || '';
        break;
      case 'sku':
        valueA = a.sku || '';
        valueB = b.sku || '';
        break;
      case 'quantity':
        valueA = a.quantity || 0;
        valueB = b.quantity || 0;
        break;
      case 'price_per_case':
        valueA = getDisplayPricePerCase(a.sku, a.transaction_date, a.transaction_type, a.amount, a.quantity) || 0;
        valueB = getDisplayPricePerCase(b.sku, b.transaction_date, b.transaction_type, b.amount, b.quantity) || 0;
        break;
      case 'type':
        valueA = a.transaction_type || '';
        valueB = b.transaction_type || '';
        break;
      case 'amount':
        valueA = a.amount || 0;
        valueB = b.amount || 0;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, debouncedSearchTerm, columnFilters, columnSorts, factoryPricing]);

  // Paginated slice of filtered+sorted transactions
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTransactions.length / PAGE_SIZE));

  // Reset to page 1 whenever filters/search change
  const handleColumnFilterChange = useCallback((columnKey: string, value: string | string[]) => {
    setCurrentPage(1);
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleClearColumnFilter = useCallback((columnKey: string) => {
    setCurrentPage(1);
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: ""
    }));
  }, []);

  // Get unique values for multi-select filters — cascading: each column reflects the other active filters
  const getUniqueClients = useMemo(() => {
    if (!transactions) return [];
    const unique = new Set<string>();
    transactions.forEach(t => {
      const clientName = t.transaction_type === 'payment'
        ? (t.description || 'Elma Payment')
        : (t.customers?.client_name || '');
      const area = t.customers?.branch || '';
      const sku = t.sku || '';
      const type = t.transaction_type || '';
      if (!passesMultiFilter(area, columnFilters.branch)) return;
      if (!passesMultiFilter(sku, columnFilters.sku)) return;
      if (!passesMultiFilter(type, columnFilters.type)) return;
      if (clientName) unique.add(clientName);
    });
    return Array.from(unique).sort();
  }, [transactions, columnFilters]);

  const getUniqueBranches = useMemo(() => {
    if (!transactions) return [];
    const unique = new Set<string>();
    transactions.forEach(t => {
      const clientName = t.transaction_type === 'payment'
        ? (t.description || 'Elma Payment')
        : (t.customers?.client_name || '');
      const area = t.customers?.branch || '';
      const sku = t.sku || '';
      const type = t.transaction_type || '';
      if (!passesMultiFilter(clientName, columnFilters.client)) return;
      if (!passesMultiFilter(sku, columnFilters.sku)) return;
      if (!passesMultiFilter(type, columnFilters.type)) return;
      if (area) unique.add(area);
    });
    return Array.from(unique).sort();
  }, [transactions, columnFilters]);

  const handleColumnSortChange = useCallback((columnKey: string, direction: 'asc' | 'desc' | null) => {
    setColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  // Get unique values for dropdown filters (memoized, cascading)
  const getUniqueTypes = useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.filter(t => {
      const clientName = t.transaction_type === 'payment'
        ? (t.description || 'Elma Payment')
        : (t.customers?.client_name || '');
      if (!passesMultiFilter(clientName, columnFilters.client)) return false;
      if (!passesMultiFilter(t.customers?.branch || '', columnFilters.branch)) return false;
      if (!passesMultiFilter(t.sku || '', columnFilters.sku)) return false;
      return true;
    }).map(t => t.transaction_type).filter(Boolean))].sort();
  }, [transactions, columnFilters]);

  const getUniqueSKUs = useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.filter(t => {
      const clientName = t.transaction_type === 'payment'
        ? (t.description || 'Elma Payment')
        : (t.customers?.client_name || '');
      if (!passesMultiFilter(clientName, columnFilters.client)) return false;
      if (!passesMultiFilter(t.customers?.branch || '', columnFilters.branch)) return false;
      if (!passesMultiFilter(t.transaction_type || '', columnFilters.type)) return false;
      return true;
    }).map(t => t.sku).filter(Boolean))].sort();
  }, [transactions, columnFilters]);

  // Export filtered transactions to Excel (memoized)
  const exportToExcel = useCallback(async () => {
    const exportData = filteredAndSortedTransactions.map((transaction) => {
      const clientName = transaction.transaction_type === 'payment' 
        ? (transaction.description || 'Elma Payment')
        : (transaction.customers?.client_name || '');
      const pricePerCase = getPricePerCase(transaction.sku, transaction.transaction_date);

      return {
        'Date': new Date(transaction.transaction_date).toLocaleDateString(),
        'Client': clientName,
        'Branch': transaction.customers?.branch || '',
        'SKU': transaction.sku || '',
        'Quantity': transaction.quantity || 0,
        'Price per case': pricePerCase || '',
        'Type': transaction.transaction_type === 'production' ? 'Production' : 'Payment',
        'Amount (₹)': transaction.amount || 0
      };
    });

    const fileName = `Factory_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Factory Transactions', fileName);
    
    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} factory transactions to ${fileName}`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAndSortedTransactions, toast, factoryPricing]);

  // Calculate summary with proper amount calculation
  const summary = transactions?.reduce(
    (acc, transaction) => {
      let amount = transaction.amount || 0;
      
      // For production transactions, calculate amount based on date-aware factory pricing
      if (transaction.transaction_type === 'production' && transaction.quantity && transaction.sku) {
        const pricePerCase = getPricePerCase(transaction.sku, transaction.transaction_date);
        if (pricePerCase) {
          amount = transaction.quantity * pricePerCase;
        }
      }
      
      if (transaction.transaction_type === 'production') {
        acc.totalProduction += amount;
      } else if (transaction.transaction_type === 'payment') {
        acc.totalPayments += amount;
      }
      return acc;
    },
    { totalProduction: 0, totalPayments: 0 }
  );

  const outstanding = (summary?.totalProduction || 0) - (summary?.totalPayments || 0);

  // Production mutation
  const productionMutation = useMutation({
    mutationFn: async (data: FactoryProductionForm) => {
      const pricePerCase = getPricePerCase(data.sku, data.transaction_date);
      const calculatedAmount = pricePerCase ? parseInt(data.quantity) * pricePerCase : 0;

      const { error } = await supabase
        .from("factory_payables")
        .insert({
          sku: data.sku,
          quantity: parseInt(data.quantity),
          description: data.description || null,
          transaction_date: data.transaction_date,
          transaction_type: "production",
          amount: calculatedAmount,
          customer_id: data.customer_id || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Production transaction recorded!" });
      setProductionForm({
        sku: "",
        quantity: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0],
        customer_id: "",
        area: "",
      });
      invalidateRelated('factory_payables');
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to record production: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: FactoryPaymentForm) => {
      const { error } = await supabase
        .from("factory_payables")
        .insert({
          ...data,
          transaction_type: "payment",
          amount: parseFloat(data.amount)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment to Elma Industries recorded!" });
      setPaymentForm({
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0]
      });
      invalidateRelated('factory_payables');
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to record payment: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; transaction_type: string } & Partial<FactoryProductionForm & FactoryPaymentForm>) => {
      const updateData = { ...data };
      
      // For production transactions, recalculate amount based on date-aware factory pricing
      if (data.transaction_type === 'production' && data.quantity && data.sku) {
        const pricePerCase = getPricePerCase(data.sku, data.transaction_date as string | undefined);
        updateData.amount = pricePerCase ? parseInt(data.quantity) * pricePerCase : data.amount;
      }

      const { error } = await supabase
        .from("factory_payables")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction updated successfully!" });
      setEditingTransaction(null);
      invalidateRelated('factory_payables');
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to update transaction: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("factory_payables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction deleted successfully!" });
      invalidateRelated('factory_payables');
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete transaction: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productionForm.customer_id || !productionForm.area || !productionForm.sku || !productionForm.quantity) {
      toast({
        title: "Error",
        description: "Please fill in client, branch, SKU and quantity",
        variant: "destructive"
      });
      return;
    }
    productionMutation.mutate(productionForm);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) {
      toast({ 
        title: "Error", 
        description: "Please enter payment amount",
        variant: "destructive"
      });
      return;
    }
    paymentMutation.mutate(paymentForm);
  };

  const handleEditClick = (transaction: FactoryPayable) => {
    setEditingTransaction(transaction);
    setEditForm({
      amount: transaction.amount?.toString() || "",
      quantity: transaction.quantity?.toString() || "",
      sku: transaction.sku || "",
      description: transaction.description || "",
      transaction_date: transaction.transaction_date || ""
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    updateMutation.mutate({
      id: editingTransaction.id,
      transaction_type: editingTransaction.transaction_type,
      amount: editingTransaction.transaction_type === 'payment' ? parseFloat(editForm.amount) : editForm.amount,
      quantity: editForm.quantity ? parseInt(editForm.quantity) : null,
      sku: editForm.sku || null,
      description: editForm.description,
      transaction_date: editForm.transaction_date
    });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  // Get calculated amount for production form
  const getCalculatedAmount = () => {
    if (!productionForm.sku || !productionForm.quantity) return 0;
    const pricePerCase = getPricePerCase(productionForm.sku, productionForm.transaction_date);
    return pricePerCase ? parseInt(productionForm.quantity || "0") * pricePerCase : 0;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900">Total Production</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₹{summary?.totalProduction?.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900">Payments Made</h3>
          <p className="text-2xl font-bold text-green-600">
            ₹{summary?.totalPayments?.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900">Outstanding</h3>
          <p className="text-2xl font-bold text-red-600">
            ₹{outstanding?.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}
          </p>
        </div>
      </div>

      {/* Tabs for Production and Payment Forms */}
      <Tabs defaultValue="payment" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment">Record Payment to Elma Industries</TabsTrigger>
          <TabsTrigger value="production">Record Production Transaction</TabsTrigger>
          <TabsTrigger value="pricing">Factory Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="payment">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Record Payment to Elma Industries</h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={paymentForm.transaction_date}
                    onChange={(e) => setPaymentForm({...paymentForm, transaction_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount (₹) *</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="payment-description">Description</Label>
                <Textarea
                  id="payment-description"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                  placeholder="Payment details..."
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={paymentMutation.isPending}
              >
                {paymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="production">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Record Production Transaction</h3>
            <form onSubmit={handleProductionSubmit} className="space-y-4">
              {/* Row 1: Production Date, Client, Branch */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production-date">Production Date</Label>
                  <Input
                    id="production-date"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={productionForm.transaction_date}
                    onChange={(e) => setProductionForm({...productionForm, transaction_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production-client">Client *</Label>
                  <SearchableSelect
                    options={uniqueClientNames.flatMap((name) => {
                      const c = customers?.find(c => c.client_name === name);
                      return c ? [{ value: c.id, label: name }] : [];
                    })}
                    value={productionForm.customer_id || ""}
                    onValueChange={handleProductionClientChange}
                    placeholder="Select client"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production-branch">Branch *</Label>
                  <SearchableSelect
                    options={productionBranches.map(b => ({ value: b, label: b }))}
                    value={productionForm.area || ""}
                    onValueChange={handleProductionBranchChange}
                    placeholder={productionForm.customer_id ? "Select branch" : "Select client first"}
                    disabled={!productionForm.customer_id}
                  />
                </div>
              </div>

              {/* Row 2: SKU, Quantity, Calculated Amount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production-sku">SKU *</Label>
                  <SearchableSelect
                    options={productionSKUs.map(sku => ({ value: sku, label: sku }))}
                    value={productionForm.sku || ""}
                    onValueChange={(value) => setProductionForm({...productionForm, sku: value})}
                    placeholder="Select SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production-quantity">Quantity (Cases) *</Label>
                  <Input
                    id="production-quantity"
                    type="number"
                    value={productionForm.quantity}
                    onChange={(e) => setProductionForm({...productionForm, quantity: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production-amount">Calculated Amount (₹)</Label>
                  <Input
                    id="production-amount"
                    type="number"
                    step="0.01"
                    value={getCalculatedAmount().toFixed(4)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="production-description">Description</Label>
                <Textarea
                  id="production-description"
                  value={productionForm.description}
                  onChange={(e) => setProductionForm({...productionForm, description: e.target.value})}
                  placeholder="Production details..."
                />
              </div>

              <Button
                type="submit"
                disabled={productionMutation.isPending}
              >
                {productionMutation.isPending ? "Recording..." : "Record Production"}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
            <FactoryPricingTab />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Transactions Table — hidden on Factory Pricing tab */}
      {activeTab !== 'pricing' &&
      <div className="border rounded-lg p-6">
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold">Elma Transaction History</h3>
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedTransactions.length} of {transactions?.length || 0} transactions
              {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
            </span>
            </div>
            <Button
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
          
          {/* Search Filter */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search transactions by SKU, description, amount, date, or type..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="max-w-md"
            />
            {(searchTerm || Object.values(columnFilters).some(filter => filter) || Object.values(columnSorts).some(sort => sort !== null)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setColumnFilters({
                    date: "",
                    client: "",
                    area: "",
                    sku: "",
                    quantity: "",
                    price_per_case: "",
                    type: "",
                    amount: ""
                  });
                  setColumnSorts({
                    date: null,
                    client: null,
                    area: null,
                    sku: null,
                    quantity: null,
                    price_per_case: null,
                    type: null,
                    amount: null
                  });
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
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
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
                <div className="flex items-center justify-between">
                  <span>Client</span>
                  <ColumnFilter
                    columnKey="client"
                    columnName="Client"
                    filterValue={columnFilters.client}
                    onFilterChange={(value) => handleColumnFilterChange('client', value)}
                    onClearFilter={() => handleClearColumnFilter('client')}
                    sortDirection={columnSorts.client}
                    onSortChange={(direction) => handleColumnSortChange('client', direction)}
                    dataType="multiselect"
                    options={getUniqueClients}
                  />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
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
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
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
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-center border-r border-slate-200/50">
                <div className="flex items-center justify-between">
                  <span>Quantity</span>
                  <ColumnFilter
                    columnKey="quantity"
                    columnName="Quantity"
                    filterValue={columnFilters.quantity}
                    onFilterChange={(value) => handleColumnFilterChange('quantity', value)}
                    onClearFilter={() => handleClearColumnFilter('quantity')}
                    sortDirection={columnSorts.quantity}
                    onSortChange={(direction) => handleColumnSortChange('quantity', direction)}
                    dataType="number"
                  />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-center border-r border-slate-200/50">
                <div className="flex items-center justify-between">
                  <span>Price per case</span>
                  <ColumnFilter
                    columnKey="price_per_case"
                    columnName="Price per case"
                    filterValue={columnFilters.price_per_case}
                    onFilterChange={(value) => handleColumnFilterChange('price_per_case', value)}
                    onClearFilter={() => handleClearColumnFilter('price_per_case')}
                    sortDirection={columnSorts.price_per_case}
                    onSortChange={(direction) => handleColumnSortChange('price_per_case', direction)}
                    dataType="number"
                  />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-center border-r border-slate-200/50">
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
                    dataType="text"
                    options={getUniqueTypes}
                  />
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 border-r border-slate-200/50">
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
              <TableHead className="text-right font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading factory transactions...
                </TableCell>
              </TableRow>
            ) : transactionsError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-red-600">
                  Error loading factory transactions: {transactionsError.message}
                </TableCell>
              </TableRow>
            ) : filteredAndSortedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => {
                const clientName = transaction.transaction_type === 'payment'
                  ? (transaction.description || 'Elma Payment')
                  : (transaction.customers?.client_name || '-');
                const pricePerCase = getDisplayPricePerCase(transaction.sku, transaction.transaction_date, transaction.transaction_type, transaction.amount, transaction.quantity);

                return (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {clientName}
                </TableCell>
                <TableCell>
                  {transaction.customers?.branch || '-'}
                </TableCell>
                <TableCell>
                  {transaction.sku || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {transaction.quantity || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {pricePerCase ? `₹${pricePerCase.toLocaleString('en-IN', { maximumFractionDigits: 4 })}` : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={transaction.transaction_type === 'production' ? 'default' : 'secondary'}>
                    {transaction.transaction_type === 'production' ? 'Production' : 'Payment'}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  transaction.transaction_type === 'production' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {(() => {
                    let amount = transaction.amount || 0;

                    // Use date-aware pricePerCase (already computed above) for production transactions
                    if (transaction.transaction_type === 'production' && transaction.quantity && pricePerCase) {
                      amount = transaction.quantity * pricePerCase;
                    }

                    return `${transaction.transaction_type === 'production' ? '+' : '-'}₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 4 })}`;
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(transaction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Transaction</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-date">Date</Label>
                              <Input
                                id="edit-date"
                                type="date"
                                value={editForm.transaction_date}
                                onChange={(e) => setEditForm({...editForm, transaction_date: e.target.value})}
                              />
                            </div>
                            
                            {editingTransaction?.transaction_type === 'production' && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-sku">SKU</Label>
                                  <SearchableSelect
                                    options={(availableSKUs ?? []).map(sku => ({ value: sku, label: sku }))}
                                    value={editForm.sku || ""}
                                    onValueChange={(value) => setEditForm({...editForm, sku: value})}
                                    placeholder="Select SKU"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="edit-quantity">Quantity (cases)</Label>
                                  <Input
                                    id="edit-quantity"
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                                  />
                                </div>
                              </>
                            )}
                            
                            {editingTransaction?.transaction_type === 'payment' && (
                              <div className="space-y-2">
                                <Label htmlFor="edit-amount">Amount (₹)</Label>
                                <Input
                                  id="edit-amount"
                                  type="number"
                                  step="0.01"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={editForm.description}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? "Updating..." : "Update"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No transactions found matching your search" : `No factory transactions found. Total: ${transactions?.length || 0}, Filtered: ${filteredAndSortedTransactions?.length || 0}`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
            <span className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Prev
              </Button>
              <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>}

    </div>
  );
};

export default FactoryPayables;