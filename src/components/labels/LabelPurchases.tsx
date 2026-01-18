import { useState, useMemo, useCallback, memo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LabelPurchase, LabelPurchaseForm, MutationFunction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, ArrowUpDown, Search, X, Download } from "lucide-react";
import { ColumnFilter } from "@/components/ui/column-filter";
import * as XLSX from 'xlsx';

const LabelPurchases = () => {
  const [form, setForm] = useState({
    vendor_id: "",
    client_id: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const [editingPurchase, setEditingPurchase] = useState<LabelPurchase | null>(null);
  const [editForm, setEditForm] = useState({
    vendor_id: "",
    client_id: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: "",
    description: ""
  });

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [columnFilters, setColumnFilters] = useState({
    vendor: "",
    client: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: ""
  });
  const [columnSorts, setColumnSorts] = useState({
    purchase_date: "desc" as "asc" | "desc" | null,
    vendor: "asc" as "asc" | "desc" | null,
    client: "asc" as "asc" | "desc" | null,
    sku: "asc" as "asc" | "desc" | null,
    quantity: "asc" as "asc" | "desc" | null,
    cost_per_label: "asc" as "asc" | "desc" | null,
    total_amount: "asc" as "asc" | "desc" | null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      return data || [];
    },
  });

  // Get available SKUs for the selected client
  const getAvailableSKUs = () => {
    if (!form.client_id) return [];
    
    const selectedCustomer = customers?.find(c => c.id === form.client_id);
    if (!selectedCustomer) return [];
    
    // Filter customers by the selected customer name to get available SKUs
    const customerSKUs = customers?.filter(c => 
      c.client_name === selectedCustomer.client_name &&
      c.sku && 
      c.sku.trim() !== ''
    ) || [];
    
    // Return unique SKUs for this client
    const uniqueSKUs = customerSKUs.map(customer => ({
      sku: customer.sku,
      client_name: customer.client_name,
      branch: customer.branch
    }));
    return uniqueSKUs;
  };

  // Get available SKUs for edit form
  const getAvailableEditSKUs = () => {
    if (!editForm.client_id) return [];
    
    const selectedCustomer = customers?.find(c => c.id === editForm.client_id);
    if (!selectedCustomer) return [];
    
    // Filter customers by the selected customer name to get available SKUs
    const customerSKUs = customers?.filter(c => 
      c.client_name === selectedCustomer.client_name &&
      c.sku && 
      c.sku.trim() !== ''
    ) || [];
    
    // Return unique SKUs for this client
    const uniqueSKUs = customerSKUs.map(customer => ({
      sku: customer.sku,
      client_name: customer.client_name,
      branch: customer.branch
    }));
    
    return uniqueSKUs;
  };

  const { data: vendors } = useQuery({
    queryKey: ["label-vendors"],
    queryFn: async () => {
      const { data } = await supabase.from("label_vendors").select("*").order("vendor_name", { ascending: true });
      return data || [];
    },
  });


  const { data: purchases } = useQuery({
    queryKey: ["label-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LabelPurchaseForm) => {
      // Build insert data object
      const insertData: {
        vendor_id: string;
        client_id: string;
        sku: string;
        quantity: number;
        cost_per_label: number;
        total_amount: number;
        purchase_date: string;
        description?: string;
      } = {
        vendor_id: data.vendor_id, // Store vendor name as text (database expects TEXT)
        client_id: data.client_id,
        sku: data.sku,
        quantity: parseInt(data.quantity),
        cost_per_label: parseFloat(data.cost_per_label),
        total_amount: parseFloat(data.total_amount),
        purchase_date: data.purchase_date
      };
      
      if (data.description && data.description.trim() !== "") {
        insertData.description = data.description.trim();
      }
      
      const { error } = await supabase
        .from("label_purchases")
        .insert(insertData);

      if (error) {
        console.error("Database error:", JSON.stringify(error, null, 2));
        console.error("Insert data:", JSON.stringify(insertData, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label purchase recorded!" });
      setForm({
        vendor_id: "",
        client_id: "",
        sku: "",
        quantity: "",
        cost_per_label: "",
        total_amount: "",
        purchase_date: new Date().toISOString().split('T')[0],
        description: ""
      });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record purchase: " + error.message,
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LabelPurchaseForm & { id: string }) => {
      // Build update data object
      const updateData: {
        vendor_id: string;
        client_id: string;
        sku: string;
        quantity: number;
        cost_per_label: number;
        total_amount: number;
        purchase_date: string;
        description?: string;
      } = {
        vendor_id: data.vendor_id, // Store vendor name as text (database expects TEXT)
        client_id: data.client_id,
        sku: data.sku,
        quantity: parseInt(data.quantity),
        cost_per_label: parseFloat(data.cost_per_label),
        total_amount: parseFloat(data.total_amount),
        purchase_date: data.purchase_date
      };
      
      if (data.description && data.description.trim() !== "") {
        updateData.description = data.description.trim();
      }
      
      const { error } = await supabase
        .from("label_purchases")
        .update(updateData)
        .eq("id", data.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label purchase updated!" });
      setEditingPurchase(null);
      setEditForm({
        client_id: "",
        vendor_id: "",
        sku: "",
        quantity: "",
        cost_per_label: "",
        total_amount: "",
        purchase_date: "",
        description: ""
      });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update purchase: " + error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("label_purchases")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label purchase deleted!" });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete purchase: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.vendor_id || !form.client_id || !form.sku || !form.quantity || !form.cost_per_label) {
      toast({ 
        title: "Error", 
        description: "Vendor, Client, SKU, Quantity, and Cost per Label are required",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(form);
  };

  // Auto-calculate total amount
  const handleQuantityOrCostChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value };
    if (newForm.quantity && newForm.cost_per_label) {
      newForm.total_amount = (parseFloat(newForm.quantity) * parseFloat(newForm.cost_per_label)).toString();
    }
    setForm(newForm);
  };

  // Auto-calculate total amount for edit form
  const handleEditQuantityOrCostChange = (field: string, value: string) => {
    const newForm = { ...editForm, [field]: value };
    if (newForm.quantity && newForm.cost_per_label) {
      newForm.total_amount = (parseFloat(newForm.quantity) * parseFloat(newForm.cost_per_label)).toString();
    }
    setEditForm(newForm);
  };

  // Handle edit click
  const handleEditClick = (purchase: LabelPurchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      vendor_id: purchase.vendor_id || "",
      client_id: purchase.client_id || "",
      sku: purchase.sku || "",
      quantity: purchase.quantity.toString(),
      cost_per_label: purchase.cost_per_label.toString(),
      total_amount: purchase.total_amount.toString(),
      purchase_date: purchase.purchase_date,
      description: purchase.description || ""
    });
  };

  // Handle edit submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.vendor_id || !editForm.client_id || !editForm.sku || !editForm.quantity || !editForm.cost_per_label) {
      toast({ 
        title: "Error", 
        description: "Vendor, Client, SKU, Quantity, and Cost per Label are required",
        variant: "destructive"
      });
      return;
    }
    
    if (editingPurchase) {
      updateMutation.mutate({ ...editForm, id: editingPurchase.id });
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Calculate total purchases - will be updated after filteredAndSortedPurchases is defined

  // Get unique customers (case-insensitive)
  const getUniqueCustomers = () => {
    if (!customers) return [];
    
    const seenCustomers = new Set<string>();
    const uniqueCustomers: typeof customers = [];
    
    customers.forEach(customer => {
      if (customer.client_name && customer.client_name.trim() !== '') {
        const trimmedName = customer.client_name.trim();
        const lowerCaseName = trimmedName.toLowerCase();
        
        // Only add if we haven't seen this customer name (case-insensitive) before
        if (!seenCustomers.has(lowerCaseName)) {
          seenCustomers.add(lowerCaseName);
          uniqueCustomers.push(customer);
        }
      }
    });
    
    const result = uniqueCustomers.sort((a, b) => a.client_name.localeCompare(b.client_name));
    return result;
  };



  // Filter and sort purchases (memoized for performance)
  const filteredAndSortedPurchases = useMemo(() => {
    if (!purchases) return [];

    const filtered = purchases.filter((purchase) => {
      // Global search (using debounced value)
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const clientName = customers?.find(c => c.id === purchase.client_id)?.client_name?.toLowerCase() || '';
        const vendorName = purchase.vendor_id?.toLowerCase() || '';
        const sku = purchase.sku?.toLowerCase() || '';
        const description = purchase.description?.toLowerCase() || '';
        
        if (!clientName.includes(searchLower) && 
            !vendorName.includes(searchLower) && 
            !sku.includes(searchLower) && 
            !description.includes(searchLower)) {
          return false;
        }
      }

      // Column filters

      if (columnFilters.vendor) {
        const vendorName = purchase.vendor_id?.toLowerCase() || '';
        if (!vendorName.includes(columnFilters.vendor.toLowerCase())) return false;
      }

      if (columnFilters.client) {
        const clientName = customers?.find(c => c.id === purchase.client_id)?.client_name?.toLowerCase() || '';
        if (!clientName.includes(columnFilters.client.toLowerCase())) return false;
      }

      if (columnFilters.sku) {
        const sku = purchase.sku?.toLowerCase() || '';
        if (!sku.includes(columnFilters.sku.toLowerCase())) return false;
      }

      if (columnFilters.quantity) {
        if (purchase.quantity.toString() !== columnFilters.quantity) return false;
      }

      if (columnFilters.cost_per_label) {
        if (purchase.cost_per_label.toString() !== columnFilters.cost_per_label) return false;
      }

      if (columnFilters.total_amount) {
        if (purchase.total_amount.toString() !== columnFilters.total_amount) return false;
      }

      if (columnFilters.purchase_date) {
        const purchaseDate = new Date(purchase.purchase_date).toLocaleDateString();
        if (!purchaseDate.includes(columnFilters.purchase_date)) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      for (const [column, direction] of Object.entries(columnSorts)) {
        if (!direction) continue;

        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (column) {
          case 'purchase_date':
            aValue = new Date(a.purchase_date);
            bValue = new Date(b.purchase_date);
            break;
          case 'vendor':
            aValue = a.vendor_id || '';
            bValue = b.vendor_id || '';
            break;
          case 'client':
            aValue = customers?.find(c => c.id === a.client_id)?.client_name || '';
            bValue = customers?.find(c => c.id === b.client_id)?.client_name || '';
            break;
          case 'sku':
            aValue = a.sku || '';
            bValue = b.sku || '';
            break;
          case 'quantity':
            aValue = a.quantity || 0;
            bValue = b.quantity || 0;
            break;
          case 'cost_per_label':
            aValue = a.cost_per_label || 0;
            bValue = b.cost_per_label || 0;
            break;
          case 'total_amount':
            aValue = a.total_amount || 0;
            bValue = b.total_amount || 0;
            break;
          default:
            continue;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [purchases, debouncedSearchTerm, columnFilters, columnSorts, customers]);

  // Calculate total purchases (memoized)
  const totalPurchases = useMemo(() => {
    return filteredAndSortedPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
  }, [filteredAndSortedPurchases]);

  // Handle column filter change (memoized)
  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  // Handle column sort change (memoized)
  const handleColumnSortChange = useCallback((column: string) => {
    setColumnSorts(prev => {
      const currentSort = prev[column as keyof typeof prev];
      let newSort: "asc" | "desc" | null = "asc";
      
      if (currentSort === "asc") {
        newSort = "desc";
      } else if (currentSort === "desc") {
        newSort = null;
      }

      // Reset other sorts
      const newSorts = Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof typeof prev] = key === column ? newSort : null;
        return acc;
      }, {} as typeof prev);

      return newSorts;
    });
  }, []);

  // Clear all filters (memoized)
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setColumnFilters({
      client: "",
      sku: "",
      vendor: "",
      quantity: "",
      cost_per_label: "",
      total_amount: "",
      purchase_date: ""
    });
    setColumnSorts({
      purchase_date: "desc",
      client: null,
      sku: null,
      vendor: null,
      quantity: null,
      cost_per_label: null,
      total_amount: null
    });
  }, []);

  // Export to Excel (memoized)
  const handleExport = useCallback(() => {
    const exportData = filteredAndSortedPurchases.map(purchase => ({
      'Purchase Date': new Date(purchase.purchase_date).toLocaleDateString(),
      'Vendor': purchase.vendor_id || 'N/A',
      'Client': customers?.find(c => c.id === purchase.client_id)?.client_name || 'N/A',
      'SKU': purchase.sku || 'N/A',
      'Quantity': purchase.quantity,
      'Cost per Label': purchase.cost_per_label,
      'Total Amount': purchase.total_amount,
      'Description': purchase.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Label Purchases');
    XLSX.writeFile(wb, `label-purchases-${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredAndSortedPurchases, customers]);

  return (
    <div className="space-y-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Row: Client, SKU, Vendor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={form.client_id} onValueChange={(value) => {
              setForm({ ...form, client_id: value, sku: "" });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueCustomers().map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Select value={form.sku} onValueChange={(value) => setForm({ ...form, sku: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableSKUs().length > 0 ? (
                  getAvailableSKUs().map((skuData) => (
                    <SelectItem key={skuData.sku} value={skuData.sku}>
                      {skuData.sku}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {form.client_id ? "No SKU configured for this client" : "Select a client first"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Input
              id="vendor"
              type="text"
              value={form.vendor_id}
              onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
              placeholder="Enter vendor name"
            />
          </div>
        </div>

        {/* Second Row: Quantity, Cost per Label, Total Amount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => handleQuantityOrCostChange("quantity", e.target.value)}
              placeholder="Number of labels"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost-per-label">Cost per Label (₹) *</Label>
            <Input
              id="cost-per-label"
              type="number"
              step="0.0001"
              value={form.cost_per_label}
              onChange={(e) => handleQuantityOrCostChange("cost_per_label", e.target.value)}
              placeholder="0.0000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount (₹)</Label>
            <Input
              id="total-amount"
              type="number"
              step="0.01"
              value={form.total_amount}
              onChange={(e) => setForm({...form, total_amount: e.target.value})}
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        {/* Third Row: Purchase Date and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="purchase-date">Purchase Date</Label>
            <Input
              id="purchase-date"
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({...form, purchase_date: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Purchase details..."
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending} className="px-8">
            {mutation.isPending ? "Recording..." : "Record Purchase"}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Label Purchases</h3>
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedPurchases.length} of {purchases?.length || 0} purchases
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
        <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('purchase_date')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Date
                    <ColumnFilter
                      columnKey="purchase_date"
                      columnName="Date"
                      filterValue={columnFilters.purchase_date}
                      onFilterChange={(value) => handleColumnFilterChange('purchase_date', value)}
                      dataType="date"
                    />
                  </div>
                </TableHead>
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('vendor')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Vendor
                    <ColumnFilter
                      columnKey="vendor"
                      columnName="Vendor"
                      filterValue={columnFilters.vendor}
                      onFilterChange={(value) => handleColumnFilterChange('vendor', value)}
                      dataType="text"
                    />
                  </div>
                </TableHead>
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('client')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Client
                    <ColumnFilter
                      columnKey="client"
                      columnName="Client"
                      filterValue={columnFilters.client}
                      onFilterChange={(value) => handleColumnFilterChange('client', value)}
                      dataType="text"
                    />
                  </div>
                </TableHead>
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('sku')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    SKU
                    <ColumnFilter
                      columnKey="sku"
                      columnName="SKU"
                      filterValue={columnFilters.sku}
                      onFilterChange={(value) => handleColumnFilterChange('sku', value)}
                      dataType="text"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('quantity')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Quantity
                    <ColumnFilter
                      columnKey="quantity"
                      columnName="Quantity"
                      filterValue={columnFilters.quantity}
                      onFilterChange={(value) => handleColumnFilterChange('quantity', value)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('cost_per_label')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Cost/Label
                    <ColumnFilter
                      columnKey="cost_per_label"
                      columnName="Cost per Label"
                      filterValue={columnFilters.cost_per_label}
                      onFilterChange={(value) => handleColumnFilterChange('cost_per_label', value)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSortChange('total_amount')}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Total
                    <ColumnFilter
                      columnKey="total_amount"
                      columnName="Total Amount"
                      filterValue={columnFilters.total_amount}
                      onFilterChange={(value) => handleColumnFilterChange('total_amount', value)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-center bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  Actions
                </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
              {filteredAndSortedPurchases.length > 0 ? (
                filteredAndSortedPurchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {purchase.vendor_id || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {customers?.find(c => c.id === purchase.client_id)?.client_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {purchase.sku || 'N/A'}
                    </TableCell>
              <TableCell className="text-right">{purchase.quantity?.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{purchase.cost_per_label}</TableCell>
              <TableCell className="text-right font-medium">₹{purchase.total_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(purchase)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Label Purchase</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              {/* First Row: Client, SKU, Vendor */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-client">Client *</Label>
                                  <Select value={editForm.client_id} onValueChange={(value) => setEditForm({ ...editForm, client_id: value, sku: "" })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getUniqueCustomers().map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                          {customer.client_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-sku">SKU *</Label>
                                  <Select value={editForm.sku} onValueChange={(value) => setEditForm({ ...editForm, sku: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select SKU" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAvailableEditSKUs().length > 0 ? (
                                        getAvailableEditSKUs().map((skuData) => (
                                          <SelectItem key={skuData.sku} value={skuData.sku}>
                                            {skuData.sku}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                          {editForm.client_id ? "No SKU configured for this client" : "Select a client first"}
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-vendor">Vendor *</Label>
                                  <Input
                                    id="edit-vendor"
                                    type="text"
                                    value={editForm.vendor_id}
                                    onChange={(e) => setEditForm({ ...editForm, vendor_id: e.target.value })}
                                    placeholder="Enter vendor name"
                                  />
                                </div>
                              </div>

                              {/* Second Row: Quantity, Cost per Label, Total Amount */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-quantity">Quantity *</Label>
                                  <Input
                                    id="edit-quantity"
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => handleEditQuantityOrCostChange("quantity", e.target.value)}
                                    placeholder="Number of labels"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="edit-cost-per-label">Cost per Label (₹) *</Label>
                                  <Input
                                    id="edit-cost-per-label"
                                    type="number"
                                    step="0.0001"
                                    value={editForm.cost_per_label}
                                    onChange={(e) => handleEditQuantityOrCostChange("cost_per_label", e.target.value)}
                                    placeholder="0.0000"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="edit-total-amount">Total Amount (₹)</Label>
                                  <Input
                                    id="edit-total-amount"
                                    type="number"
                                    step="0.01"
                                    value={editForm.total_amount}
                                    onChange={(e) => setEditForm({...editForm, total_amount: e.target.value})}
                                    placeholder="Auto-calculated"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="edit-purchase-date">Purchase Date</Label>
                                  <Input
                                    id="edit-purchase-date"
                                    type="date"
                                    value={editForm.purchase_date}
                                    onChange={(e) => setEditForm({...editForm, purchase_date: e.target.value})}
                                  />
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    placeholder="Purchase details..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditingPurchase(null)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? "Updating..." : "Update Purchase"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the label purchase record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(purchase.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No label purchases found
                  </TableCell>
            </TableRow>
              )}
        </TableBody>
      </Table>
        </div>
      </div>
    </div>
  );
};

export default memo(LabelPurchases);