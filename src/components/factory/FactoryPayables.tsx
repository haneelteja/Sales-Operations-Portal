import { useState, useMemo, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { ColumnFilter } from '@/components/ui/column-filter';

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
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [editingTransaction, setEditingTransaction] = useState<FactoryPayable | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    quantity: "",
    sku: "",
    description: "",
    transaction_date: ""
  });
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
    date: null,
    client: null,
    branch: null,
    sku: null,
    quantity: null,
    price_per_case: null,
    type: null,
    amount: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch factory pricing data
  const { data: factoryPricing } = useQuery({
    queryKey: ["factory-pricing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("*")
        .order("pricing_date", { ascending: false });
      return data || [];
    },
  });

  // Get unique SKUs for dropdown
  const { data: availableSKUs } = useQuery({
    queryKey: ["available-skus"],
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("sku")
        .order("sku", { ascending: true });
      
      const uniqueSKUs = [...new Set(data?.map(item => item.sku) || [])];
      return uniqueSKUs;
    },
  });

  // Fetch factory transactions
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["factory-transactions"],
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

  // Helper function to get price per case for a SKU
  const getPricePerCase = (sku: string | null): number | null => {
    if (!sku) return null;
    const pricing = factoryPricing?.find(p => p.sku === sku);
    return pricing?.cost_per_case || null;
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
    const branch = transaction.customers?.branch || '';
    const quantity = transaction.quantity?.toString() || '';
    const pricePerCase = getPricePerCase(transaction.sku);
    const pricePerCaseStr = pricePerCase?.toString() || '';
    
    // Global search filter (using debounced value)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesGlobalSearch = (
        sku.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        branch.toLowerCase().includes(searchLower) ||
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
      const branchFilter = Array.isArray(columnFilters.branch) ? columnFilters.branch : [columnFilters.branch];
      if (branchFilter.length > 0 && !branchFilter.some(filter => 
        branch.toLowerCase().includes(filter.toLowerCase())
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
        valueA = getPricePerCase(a.sku) || 0;
        valueB = getPricePerCase(b.sku) || 0;
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
  }, [transactions, debouncedSearchTerm, columnFilters, columnSorts, factoryPricing]);

  // Column filter handlers (memoized)
  const handleColumnFilterChange = useCallback((columnKey: string, value: string | string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleClearColumnFilter = useCallback((columnKey: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: ""
    }));
  }, []);

  // Get unique values for multi-select filters
  const getUniqueClients = useMemo(() => {
    if (!transactions) return [];
    const unique = new Set<string>();
    transactions.forEach(t => {
      const clientName = t.transaction_type === 'payment' 
        ? (t.description || 'Elma Payment')
        : (t.customers?.client_name || '');
      if (clientName) unique.add(clientName);
    });
    return Array.from(unique).sort();
  }, [transactions]);

  const getUniqueBranches = useMemo(() => {
    if (!transactions) return [];
    const unique = new Set<string>();
    transactions.forEach(t => {
      const branch = t.customers?.branch;
      if (branch) unique.add(branch);
    });
    return Array.from(unique).sort();
  }, [transactions]);

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

  // Get unique values for dropdown filters (memoized)
  const getUniqueTypes = useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.map(t => t.transaction_type).filter(Boolean))].sort();
  }, [transactions]);

  const getUniqueSKUs = useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.map(t => t.sku).filter(Boolean))].sort();
  }, [transactions]);

  // Export filtered transactions to Excel (memoized)
  const exportToExcel = useCallback(() => {
    const exportData = filteredAndSortedTransactions.map((transaction) => {
      const clientName = transaction.transaction_type === 'payment' 
        ? (transaction.description || 'Elma Payment')
        : (transaction.customers?.client_name || '');
      const pricePerCase = getPricePerCase(transaction.sku);
      
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

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Factory Transactions');
    
    const fileName = `Factory_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} factory transactions to ${fileName}`,
    });
  }, [filteredAndSortedTransactions, toast, factoryPricing]);

  // Calculate summary with proper amount calculation
  const summary = transactions?.reduce(
    (acc, transaction) => {
      let amount = transaction.amount || 0;
      
      // For production transactions, calculate amount based on factory pricing
      if (transaction.transaction_type === 'production' && transaction.quantity && transaction.sku) {
        const pricing = factoryPricing?.find(p => p.sku === transaction.sku);
        if (pricing && pricing.cost_per_case) {
          amount = transaction.quantity * pricing.cost_per_case;
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
      // Calculate amount based on factory pricing
      const pricing = factoryPricing?.find(p => p.sku === data.sku);
      const calculatedAmount = pricing?.cost_per_case ? 
        parseInt(data.quantity) * pricing.cost_per_case : 0;

      const { error } = await supabase
        .from("factory_payables")
        .insert({
          ...data,
          transaction_type: "production",
          quantity: parseInt(data.quantity),
          amount: calculatedAmount
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Production transaction recorded!" });
      setProductionForm({
        sku: "",
        quantity: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["factory-transactions"] });
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
      queryClient.invalidateQueries({ queryKey: ["factory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["factory-summary"] });
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
      
      // For production transactions, recalculate amount based on factory pricing
      if (data.transaction_type === 'production' && data.quantity && data.sku) {
        const pricing = factoryPricing?.find(p => p.sku === data.sku);
        updateData.amount = pricing?.cost_per_case ? 
          parseInt(data.quantity) * pricing.cost_per_case : data.amount;
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
      queryClient.invalidateQueries({ queryKey: ["factory-transactions"] });
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
      queryClient.invalidateQueries({ queryKey: ["factory-transactions"] });
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
    if (!productionForm.sku || !productionForm.quantity) {
      toast({ 
        title: "Error", 
        description: "Please select SKU and enter quantity",
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
    const pricing = factoryPricing?.find(p => p.sku === productionForm.sku);
    return pricing?.cost_per_case ? 
      parseInt(productionForm.quantity || "0") * pricing.cost_per_case : 0;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900">Total Production</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₹{summary?.totalProduction?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900">Payments Made</h3>
          <p className="text-2xl font-bold text-green-600">
            ₹{summary?.totalPayments?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900">Outstanding</h3>
          <p className="text-2xl font-bold text-red-600">
            ₹{outstanding?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Tabs for Production and Payment Forms */}
      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment">Record Payment to Elma Industries</TabsTrigger>
          <TabsTrigger value="production">Record Production Transaction</TabsTrigger>
        </TabsList>

        <TabsContent value="payment">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Record Payment to Elma Industries</h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentForm.transaction_date}
                    onChange={(e) => setPaymentForm({...paymentForm, transaction_date: e.target.value})}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production-sku">SKU *</Label>
                  <Select 
                    value={productionForm.sku || ""} 
                    onValueChange={(value) => setProductionForm({...productionForm, sku: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SKU" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSKUs?.map((sku) => (
                        <SelectItem key={sku} value={sku}>
                          {sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    value={getCalculatedAmount().toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production-date">Production Date</Label>
                  <Input
                    id="production-date"
                    type="date"
                    value={productionForm.transaction_date}
                    onChange={(e) => setProductionForm({...productionForm, transaction_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="production-description">Description</Label>
                  <Textarea
                    id="production-description"
                    value={productionForm.description}
                    onChange={(e) => setProductionForm({...productionForm, description: e.target.value})}
                    placeholder="Production details..."
                  />
                </div>
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
      </Tabs>

      {/* Transactions Table */}
      <div className="border rounded-lg p-6">
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold">Elma Transaction History</h3>
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedTransactions.length} of {transactions?.length || 0} transactions
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    branch: "",
                    sku: "",
                    quantity: "",
                    price_per_case: "",
                    type: "",
                    amount: ""
                  });
                  setColumnSorts({
                    date: null,
                    client: null,
                    branch: null,
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
        <Table>
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
              filteredAndSortedTransactions.map((transaction) => {
                const clientName = transaction.transaction_type === 'payment' 
                  ? (transaction.description || 'Elma Payment')
                  : (transaction.customers?.client_name || '-');
                const pricePerCase = getPricePerCase(transaction.sku);
                
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
                  {pricePerCase ? `₹${pricePerCase.toLocaleString()}` : '-'}
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
                    
                    // For production transactions, calculate amount based on factory pricing
                    if (transaction.transaction_type === 'production' && transaction.quantity && transaction.sku) {
                      const pricing = factoryPricing?.find(p => p.sku === transaction.sku);
                      if (pricing && pricing.cost_per_case) {
                        amount = transaction.quantity * pricing.cost_per_case;
                      }
                    }
                    
                    return `${transaction.transaction_type === 'production' ? '+' : '-'}₹${amount.toLocaleString()}`;
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
                                  <Select 
                                    value={editForm.sku || ""} 
                                    onValueChange={(value) => setEditForm({...editForm, sku: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select SKU" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableSKUs?.map((sku) => (
                                        <SelectItem key={sku} value={sku}>
                                          {sku}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
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
    </div>
  );
};

export default FactoryPayables;