import { useState, useMemo, useCallback, memo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCacheInvalidation } from "@/hooks/useCacheInvalidation";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import type { Customer } from "@/types";
import { AddDealerDialog } from "./AddDealerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, UserX, UserCheck, Download, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ColumnFilter } from "@/components/ui/column-filter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

const ConfigurationManagement = () => {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isAddDealerOpen, setIsAddDealerOpen] = useState(false);
  
  // Additional state for advanced customer management
  const [editForm, setEditForm] = useState({
    dealer_name: "",
    area: "",
    sku: "",
    price_per_case: "",
    price_per_bottle: "",
    whatsapp_number: ""
  });

  // Filtering and sorting state for customers
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [columnFilters, setColumnFilters] = useState({
    dealer_name: "",
    area: "",
    sku: "",
    pricing_date: "",
    price_per_case: "",
    price_per_bottle: ""
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, "asc" | "desc" | null>>({
    dealer_name: null,
    area: null,
    sku: null,
    pricing_date: null,
    price_per_case: null,
    price_per_bottle: null,
    created_at: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateRelated } = useCacheInvalidation();

  // Customer Management queries and mutations
  const { data: customers, error: customersError } = useQuery({
    queryKey: ["customers-management"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("dealer_name", { ascending: true });
        
        if (error) {
          console.error('Error fetching customers:', error);
          throw new Error(handleSupabaseError(error));
        }
        
        return data || [];
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch customers",
          variant: "destructive"
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Get available SKUs from Application Configurations (sku_configurations) for Edit Customer dropdown
  const { data: availableSKUs = [], isLoading: availableSKUsLoading } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_configurations")
        .select("sku")
        .order("sku", { ascending: true });
      if (error) throw new Error(handleSupabaseError(error));
      const seen = new Set<string>();
      return (data || [])
        .filter((r) => r.sku && !seen.has((r.sku as string).toLowerCase()) && (seen.add((r.sku as string).toLowerCase()), true))
        .map((r) => (r.sku as string).trim())
        .sort();
    },
    retry: 2,
  });

  // Update customer mutation (edit form)
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof editForm) => {
      // First, check if updating dealer_name or area would create a duplicate
      if (data.dealer_name && data.area) {
        const { data: existingCustomers, error: checkError } = await supabase
          .from("customers")
          .select("id")
          .eq("dealer_name", data.dealer_name)
          .eq("area", data.area)
          .neq("id", data.id)
          .limit(1);

        if (checkError) {
          console.error('Error checking for duplicates:', checkError);
        } else if (existingCustomers && existingCustomers.length > 0) {
          throw new Error(`A customer with Dealer Name "${data.dealer_name}" and Area "${data.area}" already exists. Please use different values.`);
        }
      }

      const updateData: Partial<{
        dealer_name: string;
        area: string;
        sku: string | null;
        price_per_case: number | null;
        price_per_bottle: number | null;
        whatsapp_number: string | null;
        pricing_date: string | null;
      }> = {};
      
      // Only include fields that are provided
      if (data.dealer_name) updateData.dealer_name = data.dealer_name;
      if (data.area !== undefined) updateData.area = data.area;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.price_per_case !== undefined) {
        updateData.price_per_case = data.price_per_case ? parseFloat(data.price_per_case) : null;
      }
      if (data.price_per_bottle !== undefined) {
        updateData.price_per_bottle = data.price_per_bottle ? parseFloat(data.price_per_bottle) : null;
      }
      if (data.whatsapp_number !== undefined) {
        updateData.whatsapp_number = data.whatsapp_number || null;
      }
      if (data.pricing_date) updateData.pricing_date = data.pricing_date;

      console.log('Updating customer:', { id: data.id, ...updateData });

      const { data: updatedData, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", data.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Handle 409 conflict (unique constraint violation)
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error(`A customer with Dealer Name "${data.dealer_name}" and Area "${data.area}" already exists. Please use different values.`);
        }
        
        throw error;
      }

      console.log('Successfully updated:', updatedData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer updated successfully!" });
      setIsEditCustomerOpen(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update customer: " + (error as { message?: string }).message,
        variant: "destructive"
      });
    },
  });

  // Deactivate customer mutation
  const deactivateCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer deactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to deactivate customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Delete functionality removed - using soft delete (deactivate) only

  // Reactivate customer mutation
  const reactivateCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer reactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to reactivate customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  const softDeleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer deactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to deactivate customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Filter and sort customers (memoized for performance)
  const filteredAndSortedCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer) => {
    const clientName = customer.dealer_name || '';
    const area = customer.area || '';
    const sku = customer.sku || '';
    const pricingDate = customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '';
    const pricePerCase = customer.price_per_case?.toString() || '';
    const pricePerBottle = customer.price_per_bottle?.toString() || '';
    const createdDate = new Date(customer.created_at).toLocaleDateString();
    
    // Global search filter (using debounced value)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesGlobalSearch = (
        clientName.toLowerCase().includes(searchLower) ||
        area.toLowerCase().includes(searchLower) ||
        sku.toLowerCase().includes(searchLower) ||
        pricingDate.includes(searchLower) ||
        pricePerCase.includes(searchLower) ||
        pricePerBottle.includes(searchLower) ||
        createdDate.includes(searchLower)
      );
      if (!matchesGlobalSearch) return false;
    }
    
    // Column-specific filters
    if (columnFilters.dealer_name && !clientName.toLowerCase().includes(columnFilters.dealer_name.toLowerCase())) return false;
    if (columnFilters.area && !area.toLowerCase().includes(columnFilters.area.toLowerCase())) return false;
    if (columnFilters.sku && !sku.toLowerCase().includes(columnFilters.sku.toLowerCase())) return false;
    if (columnFilters.pricing_date && pricingDate !== columnFilters.pricing_date) return false;
    if (columnFilters.price_per_case && !pricePerCase.includes(columnFilters.price_per_case)) return false;
    if (columnFilters.price_per_bottle && !pricePerBottle.includes(columnFilters.price_per_bottle)) return false;
    
    return true;
  }).sort((a, b) => {
    // Default sorting: Active first, then Dealer Name → Area → SKU → Pricing Date
    const activeSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);
    
    // If no manual sort is applied, use default sorting
    if (!activeSort) {
      // 1. Sort by is_active (active first)
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1; // Active customers first
      }
      
      // 2. Sort by dealer_name
      const clientNameA = (a.dealer_name || '').toLowerCase();
      const clientNameB = (b.dealer_name || '').toLowerCase();
      if (clientNameA !== clientNameB) {
        return clientNameA < clientNameB ? -1 : 1;
      }
      
      // 3. Sort by area
      const areaA = (a.area || '').toLowerCase();
      const areaB = (b.area || '').toLowerCase();
      if (areaA !== areaB) {
        return areaA < areaB ? -1 : 1;
      }
      
      // 4. Sort by SKU
      const skuA = (a.sku || '').toLowerCase();
      const skuB = (b.sku || '').toLowerCase();
      if (skuA !== skuB) {
        return skuA < skuB ? -1 : 1;
      }
      
      // 5. Sort by pricing_date (newest first)
      const dateA = new Date(a.pricing_date || 0).getTime();
      const dateB = new Date(b.pricing_date || 0).getTime();
      return dateB - dateA; // Newest first
    }

    // Manual sorting (when user clicks column headers)
    const [columnKey, direction] = activeSort;
    let valueA: string | number, valueB: string | number;

    switch (columnKey) {
      case 'dealer_name':
        valueA = (a.dealer_name || '').toLowerCase();
        valueB = (b.dealer_name || '').toLowerCase();
        break;
      case 'area':
        valueA = (a.area || '').toLowerCase();
        valueB = (b.area || '').toLowerCase();
        break;
      case 'sku':
        valueA = (a.sku || '').toLowerCase();
        valueB = (b.sku || '').toLowerCase();
        break;
      case 'pricing_date':
        valueA = new Date(a.pricing_date || 0).getTime();
        valueB = new Date(b.pricing_date || 0).getTime();
        break;
      case 'price_per_case':
        valueA = a.price_per_case || 0;
        valueB = b.price_per_case || 0;
        break;
      case 'price_per_bottle':
        valueA = a.price_per_bottle || 0;
        valueB = b.price_per_bottle || 0;
        break;
      case 'created_at':
        valueA = new Date(a.created_at).getTime();
        valueB = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
    });
  }, [customers, debouncedSearchTerm, columnFilters, columnSorts]);

  // Handle column filter changes
  const handleColumnFilterChange = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Handle column sort changes
  const handleColumnSortChange = (columnKey: string, direction: "asc" | "desc" | null) => {
    setColumnSorts(prev => {
      const newSorts = { ...prev };
      // Reset all other columns
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setColumnFilters({
      dealer_name: "",
      area: "",
      sku: "",
      pricing_date: "",
      price_per_case: "",
      price_per_bottle: ""
    });
    setColumnSorts({
      dealer_name: null,
      area: null,
      sku: null,
      pricing_date: null,
      price_per_case: null,
      price_per_bottle: null,
      created_at: null
    });
  };

  // Export filtered data to Excel
  const exportCustomersToExcel = () => {
    const exportData = filteredAndSortedCustomers?.map((customer) => ({
      'Dealer Name': customer.dealer_name || '',
      'Area': customer.area || '',
      'SKU': customer.sku || '',
      'Pricing Date': customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '',
      'Price per Case': customer.price_per_case ? `₹${customer.price_per_case}` : '',
      'Price per Bottle': customer.price_per_bottle ? `₹${customer.price_per_bottle}` : '',
      'Created': new Date(customer.created_at).toLocaleDateString()
    })) || [];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handler functions for advanced customer management
  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      dealer_name: customer.dealer_name || "",
      area: customer.area || "",
      sku: customer.sku || "",
      price_per_case: customer.price_per_case?.toString() || "",
      price_per_bottle: customer.price_per_bottle?.toString() || "",
      whatsapp_number: customer.whatsapp_number || ""
    });
    setIsEditCustomerOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      dealer_name: editForm.dealer_name,
      area: editForm.area,
      sku: editForm.sku,
      price_per_case: editForm.price_per_case,
      price_per_bottle: editForm.price_per_bottle,
      whatsapp_number: editForm.whatsapp_number,
      pricing_date: editingCustomer.pricing_date || customerForm.pricing_date || new Date().toISOString().split('T')[0]
    });
  };

  const handleDeactivate = (id: string) => {
    deactivateCustomerMutation.mutate(id);
  };

  // Delete functionality removed - using soft delete (deactivate) only

  const handleReactivate = (id: string) => {
    reactivateCustomerMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dealer Management</h2>
        <Button onClick={() => setIsAddDealerOpen(true)}>
          Add Dealer
        </Button>
      </div>

      <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customers List</CardTitle>
                  <CardDescription>
                    All registered customers with their pricing
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredAndSortedCustomers?.length || 0} of {customers?.length || 0} customers
                  </span>
                  <Button
                    onClick={exportCustomersToExcel}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search customers by name, area, SKU, pricing date, or amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Dealer Name
                        <ColumnFilter
                          columnKey="dealer_name"
                          columnName="Dealer Name"
                          filterValue={columnFilters.dealer_name}
                          onFilterChange={(value) => handleColumnFilterChange('dealer_name', value)}
                          onSortChange={(direction) => handleColumnSortChange('dealer_name', direction)}
                          dataType="text"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Area
                        <ColumnFilter
                          columnKey="area"
                          columnName="Area"
                          filterValue={columnFilters.area}
                          onFilterChange={(value) => handleColumnFilterChange('area', value)}
                          onSortChange={(direction) => handleColumnSortChange('area', direction)}
                          dataType="text"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          SKU
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={columnFilters.sku}
                          onFilterChange={(value) => handleColumnFilterChange('sku', value)}
                          onSortChange={(direction) => handleColumnSortChange('sku', direction)}
                          dataType="text"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Pricing Date
                        <ColumnFilter
                          columnKey="pricing_date"
                          columnName="Pricing Date"
                          filterValue={columnFilters.pricing_date}
                          onFilterChange={(value) => handleColumnFilterChange('pricing_date', value)}
                          onSortChange={(direction) => handleColumnSortChange('pricing_date', direction)}
                          dataType="date"
                        />
                      </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          Price per Case
                        <ColumnFilter
                          columnKey="price_per_case"
                          columnName="Price per Case"
                          filterValue={columnFilters.price_per_case}
                          onFilterChange={(value) => handleColumnFilterChange('price_per_case', value)}
                          onSortChange={(direction) => handleColumnSortChange('price_per_case', direction)}
                          dataType="number"
                        />
                      </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          Price per Bottle
                        <ColumnFilter
                          columnKey="price_per_bottle"
                          columnName="Price per Bottle"
                          filterValue={columnFilters.price_per_bottle}
                          onFilterChange={(value) => handleColumnFilterChange('price_per_bottle', value)}
                          onSortChange={(direction) => handleColumnSortChange('price_per_bottle', direction)}
                          dataType="number"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Status
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Created
                        <ColumnFilter
                          columnKey="created_at"
                          columnName="Created"
                          filterValue=""
                          onFilterChange={() => {}}
                          onSortChange={(direction) => handleColumnSortChange('created_at', direction)}
                          dataType="date"
                        />
                      </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedCustomers?.length > 0 ? (
                      filteredAndSortedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.dealer_name}</TableCell>
                        <TableCell>{customer.area}</TableCell>
                        <TableCell>{customer.sku || '-'}</TableCell>
                        <TableCell>{customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          {customer.price_per_case ? `₹${customer.price_per_case}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.price_per_bottle ? `₹${customer.price_per_bottle}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.is_active ? "default" : "secondary"}>
                            {customer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {customer.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => handleDeactivate(customer.id)}
                                className="text-orange-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleReactivate(customer.id)}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))
                  ) : (
                    <TableRow key="no-customers">
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm || Object.values(columnFilters).some(filter => filter !== '') 
                          ? "No customers found matching your filters" 
                          : "No customers found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
      {/* Add Dealer dialog */}
      <AddDealerDialog
        open={isAddDealerOpen}
        onOpenChange={setIsAddDealerOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["customers-management"] })}
      />

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Dealer Name *</Label>
                <Input
                  id="edit-client-name"
                  value={editForm.dealer_name}
                  onChange={(e) => setEditForm({...editForm, dealer_name: e.target.value})}
                  placeholder="Customer company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-area">Area</Label>
                <Input
                  id="edit-area"
                  value={editForm.area}
                  onChange={(e) => setEditForm({...editForm, area: e.target.value})}
                  placeholder="Area or location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                  placeholder="Product SKU"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price-per-case">Price per Case (₹)</Label>
                <Input
                  id="edit-price-per-case"
                  type="number"
                  step="0.01"
                  value={editForm.price_per_case}
                  onChange={(e) => setEditForm({...editForm, price_per_case: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price-per-bottle">Price per Bottle (₹)</Label>
                <Input
                  id="edit-price-per-bottle"
                  type="number"
                  step="0.01"
                  value={editForm.price_per_bottle}
                  onChange={(e) => setEditForm({...editForm, price_per_bottle: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp-number">WhatsApp Number</Label>
                <Input
                  id="edit-whatsapp-number"
                  type="tel"
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm({...editForm, whatsapp_number: e.target.value})}
                  placeholder="+919876543210"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCustomerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCustomerMutation.isPending}>
                {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ConfigurationManagement);