import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import type { 
  Customer, 
  FactoryPricing, 
  SkuConfiguration
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [customerForm, setCustomerForm] = useState({
    client_name: "",
    branch: "",
    sku: "",
    price_per_case: "",
    price_per_bottle: "",
    pricing_date: new Date().toISOString().split('T')[0]
  });

  const [pricingForm, setPricingForm] = useState({
    pricing_date: new Date().toISOString().split('T')[0],
    sku: "",
    bottles_per_case: "",
    price_per_bottle: "",
    tax: ""
  });

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingPricing, setEditingPricing] = useState<FactoryPricing | null>(null);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isEditPricingOpen, setIsEditPricingOpen] = useState(false);
  
  // Additional state for advanced customer management
  const [editForm, setEditForm] = useState({
    client_name: "",
    branch: "",
    sku: "",
    price_per_case: "",
    price_per_bottle: ""
  });

  // Filtering and sorting state for customers
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({
    client_name: "",
    branch: "",
    sku: "",
    pricing_date: "",
    price_per_case: "",
    price_per_bottle: ""
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, "asc" | "desc" | null>>({
    client_name: null,
    branch: null,
    sku: null,
    pricing_date: null,
    price_per_case: null,
    price_per_bottle: null,
    created_at: null
  });

  // Filtering and sorting state for factory pricing
  const [pricingSearchTerm, setPricingSearchTerm] = useState("");
  const [pricingColumnFilters, setPricingColumnFilters] = useState({
    sku: "",
    pricing_date: "",
    bottles_per_case: "",
    price_per_bottle: "",
    cost_per_case: "",
    tax: ""
  });
  const [pricingColumnSorts, setPricingColumnSorts] = useState<Record<string, "asc" | "desc" | null>>({
    pricing_date: null,
    sku: null,
    bottles_per_case: null,
    price_per_bottle: null,
    cost_per_case: null,
    tax: null,
    created_at: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Customer Management queries and mutations
  const { data: customers, error: customersError } = useQuery({
    queryKey: ["customers-management"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("client_name", { ascending: true });
        
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

  // Get available SKUs from factory pricing with bottles per case info
  const { data: factoryPricingData, error: factoryPricingDataError, isLoading: factoryPricingDataLoading } = useQuery({
    queryKey: ["factory-pricing-data"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("factory_pricing")
          .select("sku, bottles_per_case")
          .order("sku", { ascending: true });
        
        if (error) {
          console.error('Error fetching factory pricing data:', error);
          throw new Error(handleSupabaseError(error));
        }
        
        return data || [];
      } catch (error) {
        console.error('Error while configuring the SKU in the portal:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error while configuring the SKU in the portal",
          variant: "destructive"
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Get available SKUs from factory pricing (unique, case-insensitive)
  const { data: availableSKUs, error: availableSKUsError, isLoading: availableSKUsLoading } = useQuery({
    queryKey: ["available-skus"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("factory_pricing")
          .select("sku")
          .order("sku", { ascending: true });
        
        if (error) {
          console.error('Error fetching available SKUs:', error);
          throw new Error(handleSupabaseError(error));
        }
        
        // Get unique SKUs (case-insensitive)
        const seenSKUs = new Set<string>();
        const uniqueSKUs: string[] = [];
        
        data?.forEach(item => {
          if (item.sku && item.sku.trim() !== '') {
            const trimmedSKU = item.sku.trim();
            const lowerCaseSKU = trimmedSKU.toLowerCase();
            
            // Only add if we haven't seen this SKU (case-insensitive) before
            if (!seenSKUs.has(lowerCaseSKU)) {
              seenSKUs.add(lowerCaseSKU);
              uniqueSKUs.push(trimmedSKU);
            }
          }
        });
        
        return uniqueSKUs.sort();
      } catch (error) {
        console.error('Error while configuring the SKU in the portal:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error while configuring the SKU in the portal",
          variant: "destructive"
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const customerMutation = useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { pricing_date: string }) => {
      // Check for duplicate (client_name, branch, sku) combination
      if (data.client_name && data.branch && data.sku) {
        const { data: existingCustomers, error: checkError } = await supabase
          .from("customers")
          .select("id")
          .eq("client_name", data.client_name)
          .eq("branch", data.branch)
          .eq("sku", data.sku)
          .eq("is_active", true) // Only check active customers
          .limit(1);

        if (checkError) {
          console.error('Error checking for duplicates:', checkError);
        } else if (existingCustomers && existingCustomers.length > 0) {
          throw new Error(`A customer with Client Name "${data.client_name}", Branch "${data.branch}", and SKU "${data.sku}" already exists. Please use different values.`);
        }
      }

      const { error } = await supabase
        .from("customers")
        .insert({
          ...data,
          price_per_case: data.price_per_case ? parseFloat(data.price_per_case) : null,
          price_per_bottle: data.price_per_bottle ? parseFloat(data.price_per_bottle) : null,
          pricing_date: data.pricing_date
        });

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error(`A customer with Client Name "${data.client_name}", Branch "${data.branch}", and SKU "${data.sku}" already exists.`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer added successfully!" });
      setCustomerForm({
        client_name: "",
        branch: "",
        sku: "",
        price_per_case: "",
        price_per_bottle: "",
        pricing_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof customerForm) => {
      // First, check if updating client_name or branch would create a duplicate
      if (data.client_name && data.branch) {
        const { data: existingCustomers, error: checkError } = await supabase
          .from("customers")
          .select("id")
          .eq("client_name", data.client_name)
          .eq("branch", data.branch)
          .neq("id", data.id)
          .limit(1);

        if (checkError) {
          console.error('Error checking for duplicates:', checkError);
        } else if (existingCustomers && existingCustomers.length > 0) {
          throw new Error(`A customer with Client Name "${data.client_name}" and Branch "${data.branch}" already exists. Please use different values.`);
        }
      }

      const updateData: Partial<{
        client_name: string;
        branch: string;
        sku: string | null;
        price_per_case: number | null;
        price_per_bottle: number | null;
        pricing_date: string | null;
      }> = {};
      
      // Only include fields that are provided
      if (data.client_name) updateData.client_name = data.client_name;
      if (data.branch !== undefined) updateData.branch = data.branch;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.price_per_case !== undefined) {
        updateData.price_per_case = data.price_per_case ? parseFloat(data.price_per_case) : null;
      }
      if (data.price_per_bottle !== undefined) {
        updateData.price_per_bottle = data.price_per_bottle ? parseFloat(data.price_per_bottle) : null;
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
          throw new Error(`A customer with Client Name "${data.client_name}" and Branch "${data.branch}" already exists. Please use different values.`);
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

  // Factory Pricing queries and mutations
  const { data: factoryPricing, error: factoryPricingError, isLoading: factoryPricingLoading } = useQuery({
    queryKey: ["factory-pricing"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("factory_pricing")
          .select("*")
          .order("pricing_date", { ascending: false });
        
        if (error) {
          console.error('Error fetching factory pricing:', error);
          const errorMessage = handleSupabaseError(error);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
          throw new Error(errorMessage);
        }
        
        return data || [];
      } catch (error) {
        console.error('Error fetching factory pricing:', error);
        // Don't throw error here to prevent breaking the component
        // Return empty array instead
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const pricingMutation = useMutation({
    mutationFn: async (data: Omit<FactoryPricing, 'id' | 'created_at' | 'updated_at'>) => {
      const bottlesPerCase = data.bottles_per_case ? parseInt(String(data.bottles_per_case)) : 1;
      const pricePerBottle = parseFloat(String(data.price_per_bottle));
      
      if (isNaN(pricePerBottle) || pricePerBottle <= 0) {
        throw new Error("Price per bottle must be a valid positive number");
      }
      
      if (isNaN(bottlesPerCase) || bottlesPerCase <= 0) {
        throw new Error("Bottles per case must be a valid positive number");
      }

      const insertData = {
          pricing_date: data.pricing_date || new Date().toISOString().split('T')[0],
          sku: data.sku,
          bottles_per_case: bottlesPerCase,
          price_per_bottle: pricePerBottle,
          tax: data.tax ? parseFloat(String(data.tax)) : null
          // cost_per_case is a generated column, so we don't insert it
        };

      console.log('Inserting factory pricing data:', insertData);
      
      const { data: insertedData, error } = await supabase
        .from("factory_pricing")
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Successfully inserted:', insertedData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Factory pricing added successfully!" });
      setPricingForm({
        pricing_date: new Date().toISOString().split('T')[0],
        sku: "",
        bottles_per_case: "",
        price_per_bottle: "",
        tax: ""
      });
      queryClient.invalidateQueries({ queryKey: ["factory-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["available-skus"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add pricing: " + error.message,
        variant: "destructive"
      });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("factory_pricing")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Factory pricing deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["factory-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["available-skus"] });
      queryClient.invalidateQueries({ queryKey: ["factory-pricing-data"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete pricing: " + error.message,
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

  const updatePricingMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<FactoryPricing>) => {
      const updateData: Partial<{
        pricing_date: string | null;
        sku: string;
        bottles_per_case: number;
        price_per_bottle: number;
      }> = {};
      
      if (data.pricing_date) updateData.pricing_date = data.pricing_date;
      if (data.sku) updateData.sku = data.sku;
      if (data.bottles_per_case !== undefined) {
        const bottlesPerCase = parseInt(String(data.bottles_per_case));
        if (isNaN(bottlesPerCase) || bottlesPerCase <= 0) {
          throw new Error("Bottles per case must be a valid positive number");
        }
        updateData.bottles_per_case = bottlesPerCase;
      }
      if (data.price_per_bottle !== undefined) {
        const pricePerBottle = parseFloat(String(data.price_per_bottle));
        if (isNaN(pricePerBottle) || pricePerBottle <= 0) {
          throw new Error("Price per bottle must be a valid positive number");
        }
        updateData.price_per_bottle = pricePerBottle;
      }
      // cost_per_case is a generated column, so we don't update it
      if (data.tax !== undefined) {
        updateData.tax = data.tax ? parseFloat(String(data.tax)) : null;
      }

      const { error } = await supabase
        .from("factory_pricing")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Factory pricing updated successfully!" });
      setIsEditPricingOpen(false);
      setEditingPricing(null);
      queryClient.invalidateQueries({ queryKey: ["factory-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["available-skus"] });
      queryClient.invalidateQueries({ queryKey: ["factory-pricing-data"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update pricing: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Filter and sort customers
  const filteredAndSortedCustomers = customers?.filter((customer) => {
    const clientName = customer.client_name || '';
    const branch = customer.branch || '';
    const sku = customer.sku || '';
    const pricingDate = customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '';
    const pricePerCase = customer.price_per_case?.toString() || '';
    const pricePerBottle = customer.price_per_bottle?.toString() || '';
    const createdDate = new Date(customer.created_at).toLocaleDateString();
    
    // Global search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesGlobalSearch = (
        clientName.toLowerCase().includes(searchLower) ||
        branch.toLowerCase().includes(searchLower) ||
        sku.toLowerCase().includes(searchLower) ||
        pricingDate.includes(searchLower) ||
        pricePerCase.includes(searchLower) ||
        pricePerBottle.includes(searchLower) ||
        createdDate.includes(searchLower)
      );
      if (!matchesGlobalSearch) return false;
    }
    
    // Column-specific filters
    if (columnFilters.client_name && !clientName.toLowerCase().includes(columnFilters.client_name.toLowerCase())) return false;
    if (columnFilters.branch && !branch.toLowerCase().includes(columnFilters.branch.toLowerCase())) return false;
    if (columnFilters.sku && !sku.toLowerCase().includes(columnFilters.sku.toLowerCase())) return false;
    if (columnFilters.pricing_date && pricingDate !== columnFilters.pricing_date) return false;
    if (columnFilters.price_per_case && !pricePerCase.includes(columnFilters.price_per_case)) return false;
    if (columnFilters.price_per_bottle && !pricePerBottle.includes(columnFilters.price_per_bottle)) return false;
    
    return true;
  }).sort((a, b) => {
    // Default sorting: Active first, then Client Name → Branch → SKU → Pricing Date
    const activeSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);
    
    // If no manual sort is applied, use default sorting
    if (!activeSort) {
      // 1. Sort by is_active (active first)
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1; // Active customers first
      }
      
      // 2. Sort by client_name
      const clientNameA = (a.client_name || '').toLowerCase();
      const clientNameB = (b.client_name || '').toLowerCase();
      if (clientNameA !== clientNameB) {
        return clientNameA < clientNameB ? -1 : 1;
      }
      
      // 3. Sort by branch
      const branchA = (a.branch || '').toLowerCase();
      const branchB = (b.branch || '').toLowerCase();
      if (branchA !== branchB) {
        return branchA < branchB ? -1 : 1;
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
      case 'client_name':
        valueA = (a.client_name || '').toLowerCase();
        valueB = (b.client_name || '').toLowerCase();
        break;
      case 'branch':
        valueA = (a.branch || '').toLowerCase();
        valueB = (b.branch || '').toLowerCase();
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
      client_name: "",
      branch: "",
      sku: "",
      pricing_date: "",
      price_per_case: "",
      price_per_bottle: ""
    });
    setColumnSorts({
      client_name: null,
      branch: null,
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
      'Client Name': customer.client_name || '',
      'Branch': customer.branch || '',
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

  // Filter and sort factory pricing
  const filteredAndSortedFactoryPricing = factoryPricing?.filter((pricing) => {
    // Safety check: skip if pricing is null/undefined
    if (!pricing) return false;
    
    const sku = (pricing.sku || '').toString();
    const pricingDate = pricing.pricing_date ? new Date(pricing.pricing_date).toLocaleDateString() : '';
    const bottlesPerCase = pricing.bottles_per_case?.toString() || '';
    const pricePerBottle = pricing.price_per_bottle?.toString() || '';
    const costPerCase = pricing.cost_per_case?.toString() || '';
    const tax = pricing.tax?.toString() || '';
    const createdDate = pricing.created_at ? new Date(pricing.created_at).toLocaleDateString() : '';
    
    // Global search filter
    if (pricingSearchTerm) {
      const searchLower = pricingSearchTerm.toLowerCase();
      const matchesGlobalSearch = (
        sku.toLowerCase().includes(searchLower) ||
        pricingDate.includes(searchLower) ||
        bottlesPerCase.includes(searchLower) ||
        pricePerBottle.includes(searchLower) ||
        costPerCase.includes(searchLower) ||
        tax.includes(searchLower) ||
        createdDate.includes(searchLower)
      );
      if (!matchesGlobalSearch) return false;
    }
    
    // Column-specific filters
    if (pricingColumnFilters.sku && !sku.toLowerCase().includes(pricingColumnFilters.sku.toLowerCase())) return false;
    if (pricingColumnFilters.pricing_date && pricingDate !== pricingColumnFilters.pricing_date) return false;
    if (pricingColumnFilters.bottles_per_case && !bottlesPerCase.includes(pricingColumnFilters.bottles_per_case)) return false;
    if (pricingColumnFilters.price_per_bottle && !pricePerBottle.includes(pricingColumnFilters.price_per_bottle)) return false;
    if (pricingColumnFilters.cost_per_case && !costPerCase.includes(pricingColumnFilters.cost_per_case)) return false;
    if (pricingColumnFilters.tax && !tax.includes(pricingColumnFilters.tax)) return false;
    
    return true;
  }).sort((a, b) => {
    // Safety check: handle null/undefined values
    if (!a || !b) return 0;
    
    const activeSort = Object.entries(pricingColumnSorts).find(([_, direction]) => direction !== null);
    
    if (!activeSort) {
      // Default: Sort by pricing_date (newest first)
      const dateA = new Date(a.pricing_date || 0).getTime();
      const dateB = new Date(b.pricing_date || 0).getTime();
      return dateB - dateA;
    }

    const [columnKey, direction] = activeSort;
    let valueA: string | number, valueB: string | number;

    switch (columnKey) {
      case 'pricing_date':
        valueA = new Date(a.pricing_date || 0).getTime();
        valueB = new Date(b.pricing_date || 0).getTime();
        break;
      case 'sku':
        valueA = String(a.sku || '').toLowerCase();
        valueB = String(b.sku || '').toLowerCase();
        break;
      case 'bottles_per_case':
        valueA = a.bottles_per_case || 0;
        valueB = b.bottles_per_case || 0;
        break;
      case 'price_per_bottle':
        valueA = a.price_per_bottle || 0;
        valueB = b.price_per_bottle || 0;
        break;
      case 'cost_per_case':
        valueA = a.cost_per_case || 0;
        valueB = b.cost_per_case || 0;
        break;
      case 'tax':
        valueA = a.tax || 0;
        valueB = b.tax || 0;
        break;
      case 'created_at':
        valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
        valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle factory pricing column filter changes
  const handlePricingColumnFilterChange = (columnKey: string, value: string) => {
    setPricingColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Handle factory pricing column sort changes
  const handlePricingColumnSortChange = (columnKey: string, direction: "asc" | "desc" | null) => {
    setPricingColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  };

  // Clear all factory pricing filters
  const clearAllPricingFilters = () => {
    setPricingSearchTerm("");
    setPricingColumnFilters({
      sku: "",
      pricing_date: "",
      bottles_per_case: "",
      price_per_bottle: "",
      cost_per_case: "",
      tax: ""
    });
    setPricingColumnSorts({
      pricing_date: null,
      sku: null,
      bottles_per_case: null,
      price_per_bottle: null,
      cost_per_case: null,
      tax: null,
      created_at: null
    });
  };

  // Export factory pricing to Excel
  const exportFactoryPricingToExcel = () => {
    const exportData = filteredAndSortedFactoryPricing?.map((pricing) => ({
      'Date': pricing.pricing_date ? new Date(pricing.pricing_date).toLocaleDateString() : '',
      'SKU': pricing.sku || '',
      'Bottles/Case': pricing.bottles_per_case || '',
      'Price per Bottle': pricing.price_per_bottle ? `₹${pricing.price_per_bottle}` : '',
      'Cost per Case': pricing.cost_per_case ? `₹${pricing.cost_per_case}` : '',
      'Tax (%)': pricing.tax ? `${pricing.tax}%` : '',
      'Created': new Date(pricing.created_at).toLocaleDateString()
    })) || [];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Factory Pricing");
    XLSX.writeFile(wb, `factory_pricing_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calculate price per case based on selected SKU and price per bottle
  const calculatePricePerCase = () => {
    if (!customerForm.sku || !customerForm.price_per_bottle) return "";
    
    const selectedSKUData = factoryPricingData?.find(item => item.sku === customerForm.sku);
    if (!selectedSKUData || !selectedSKUData.bottles_per_case) {
      return "";
    }
    
    const pricePerBottle = parseFloat(customerForm.price_per_bottle);
    const bottlesPerCase = selectedSKUData.bottles_per_case;
    
    if (isNaN(pricePerBottle) || pricePerBottle <= 0) {
      return "";
    }
    
    const calculatedPrice = pricePerBottle * bottlesPerCase;
    return calculatedPrice.toFixed(2);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.client_name || !customerForm.branch || !customerForm.pricing_date) {
      toast({ 
        title: "Error", 
        description: "Client Name, Branch, and Pricing Date are required",
        variant: "destructive"
      });
      return;
    }
    
    // Auto-calculate price per case before submitting
    const calculatedPricePerCase = calculatePricePerCase();
    if (customerForm.sku && customerForm.price_per_bottle && !calculatedPricePerCase) {
      toast({ 
        title: "Error", 
        description: "Unable to calculate price per case. Please check SKU and price per bottle values.",
        variant: "destructive"
      });
      return;
    }
    
    const formDataWithCalculatedPrice = {
      ...customerForm,
      price_per_case: calculatedPricePerCase || customerForm.price_per_case
    };
    
    customerMutation.mutate(formDataWithCalculatedPrice);
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingForm.sku || !pricingForm.bottles_per_case || !pricingForm.price_per_bottle) {
      toast({ 
        title: "Error", 
        description: "SKU, Bottles per Case, and Price per Bottle are required",
        variant: "destructive"
      });
      return;
    }
    pricingMutation.mutate(pricingForm);
  };

  // Calculate cost per case for factory pricing
  // Formula: (bottles_per_case * price_per_bottle) * (1 + tax/100)
  const calculateCostPerCase = () => {
    const bottles = parseFloat(pricingForm.bottles_per_case) || 0;
    const pricePerBottle = parseFloat(pricingForm.price_per_bottle) || 0;
    const tax = parseFloat(pricingForm.tax) || 0;
    
    // Base cost without tax
    const baseCost = bottles * pricePerBottle;
    
    // Apply tax if provided
    if (tax > 0) {
      return baseCost * (1 + tax / 100);
    }
    
    return baseCost;
  };

  // Handler functions for advanced customer management
  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      client_name: customer.client_name || "",
      branch: customer.branch || "",
      sku: customer.sku || "",
      price_per_case: customer.price_per_case?.toString() || "",
      price_per_bottle: customer.price_per_bottle?.toString() || ""
    });
    setIsEditCustomerOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      client_name: editForm.client_name,
      branch: editForm.branch,
      sku: editForm.sku,
      price_per_case: editForm.price_per_case,
      price_per_bottle: editForm.price_per_bottle,
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
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="factory-pricing">Factory Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCustomerSubmit} className="flex items-end gap-2">
                <div className="flex-1 grid grid-cols-5 gap-2">
                  <div>
                    <Label htmlFor="pricing-date" className="text-xs mb-1 block">Date *</Label>
                    <Input
                      id="pricing-date"
                      type="date"
                      value={customerForm.pricing_date}
                      onChange={(e) => setCustomerForm({...customerForm, pricing_date: e.target.value})}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-name" className="text-xs mb-1 block">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={customerForm.client_name}
                      onChange={(e) => setCustomerForm({...customerForm, client_name: e.target.value})}
                      placeholder="Client Name"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch" className="text-xs mb-1 block">Branch *</Label>
                    <Input
                      id="branch"
                      value={customerForm.branch}
                      onChange={(e) => setCustomerForm({...customerForm, branch: e.target.value})}
                      placeholder="Branch"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-sku" className="text-xs mb-1 block">SKU</Label>
                    <Select 
                      value={customerForm.sku} 
                      onValueChange={(value) => setCustomerForm({...customerForm, sku: value})}
                      disabled={availableSKUsLoading || !!availableSKUsError}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={availableSKUsLoading ? "Loading..." : availableSKUsError ? "Error" : "Select SKU"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSKUs && availableSKUs.length > 0 ? (
                          availableSKUs.map((sku) => (
                            <SelectItem key={sku} value={sku}>
                              {sku}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-skus" disabled>
                            No SKUs available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customer-price-per-bottle" className="text-xs mb-1 block">Price/Bottle (₹)</Label>
                    <Input
                      id="customer-price-per-bottle"
                      type="number"
                      step="0.01"
                      value={customerForm.price_per_bottle}
                      onChange={(e) => setCustomerForm({...customerForm, price_per_bottle: e.target.value})}
                      placeholder="12.50"
                      className="h-9"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={customerMutation.isPending} className="h-9">
                  {customerMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>

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
                      placeholder="Search customers by name, branch, SKU, pricing date, or amount..."
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">
                      <div className="flex items-center gap-2">
                        Client Name
                        <ColumnFilter
                          columnKey="client_name"
                          columnName="Client Name"
                          filterValue={columnFilters.client_name}
                          onFilterChange={(value) => handleColumnFilterChange('client_name', value)}
                          onSortChange={(direction) => handleColumnSortChange('client_name', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[15%]">
                      <div className="flex items-center gap-2">
                        Branch
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={columnFilters.branch}
                          onFilterChange={(value) => handleColumnFilterChange('branch', value)}
                          onSortChange={(direction) => handleColumnSortChange('branch', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[12%]">
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
                    <TableHead className="w-[12%]">
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
                    <TableHead className="text-right w-[12%]">
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
                    <TableHead className="text-right w-[12%]">
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
                    <TableHead className="w-[10%]">
                      <div className="flex items-center gap-2">
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="w-[10%]">
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
                    <TableHead className="text-right w-[8%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCustomers?.length > 0 ? (
                    filteredAndSortedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium w-[20%]">{customer.client_name}</TableCell>
                      <TableCell className="w-[15%]">{customer.branch}</TableCell>
                      <TableCell className="w-[12%]">{customer.sku || '-'}</TableCell>
                      <TableCell className="w-[12%]">{customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right w-[12%]">
                        {customer.price_per_case ? `₹${customer.price_per_case}` : '-'}
                      </TableCell>
                      <TableCell className="text-right w-[12%]">
                        {customer.price_per_bottle ? `₹${customer.price_per_bottle}` : '-'}
                      </TableCell>
                      <TableCell className="w-[10%]">
                        <Badge variant={customer.is_active ? "default" : "secondary"}>
                          {customer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[10%]">{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right w-[8%]">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factory-pricing" className="space-y-6">
          {factoryPricingError && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p className="font-semibold">Error loading factory pricing</p>
                  <p className="text-sm mt-2">
                    {factoryPricingError instanceof Error ? factoryPricingError.message : "An unexpected error occurred. Please try refreshing the page."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {factoryPricingLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <p>Loading factory pricing data...</p>
                </div>
              </CardContent>
            </Card>
          )}
          {!factoryPricingLoading && (
            <>
          <Card>
            <CardHeader>
              <CardTitle>Add Factory Pricing</CardTitle>
              <CardDescription>
                Enter price information from the factory side for calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePricingSubmit} className="flex items-end gap-2">
                <div className="flex-1 grid grid-cols-6 gap-2">
                  <div>
                    <Label htmlFor="pricing-date" className="text-xs">Date *</Label>
                    <Input
                      id="pricing-date"
                      type="date"
                      value={pricingForm.pricing_date}
                      onChange={(e) => setPricingForm({...pricingForm, pricing_date: e.target.value})}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricing-sku" className="text-xs">SKU *</Label>
                    <Input
                      id="pricing-sku"
                      value={pricingForm.sku}
                      onChange={(e) => setPricingForm({...pricingForm, sku: e.target.value})}
                      placeholder="SKU"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bottles-per-case-pricing" className="text-xs">Bottles/Case *</Label>
                    <Input
                      id="bottles-per-case-pricing"
                      type="number"
                      value={pricingForm.bottles_per_case}
                      onChange={(e) => setPricingForm({...pricingForm, bottles_per_case: e.target.value})}
                      placeholder="12"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price-per-bottle" className="text-xs">Price/Bottle (₹) *</Label>
                    <Input
                      id="price-per-bottle"
                      type="number"
                      step="0.01"
                      value={pricingForm.price_per_bottle}
                      onChange={(e) => setPricingForm({...pricingForm, price_per_bottle: e.target.value})}
                      placeholder="12.50"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax" className="text-xs">TAX (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={pricingForm.tax}
                      onChange={(e) => setPricingForm({...pricingForm, tax: e.target.value})}
                      placeholder="18.00"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost-per-case" className="text-xs">Cost/Case (₹)</Label>
                    <Input
                      id="cost-per-case"
                      type="number"
                      step="0.01"
                      value={calculateCostPerCase().toFixed(2)}
                      disabled
                      className="bg-muted h-9"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={pricingMutation.isPending} className="h-9">
                  {pricingMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Factory Pricing History</CardTitle>
                  <CardDescription>
                    Historical pricing data from the factory
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredAndSortedFactoryPricing?.length || 0} of {factoryPricing?.length || 0} records
                  </span>
                  <Button
                    onClick={exportFactoryPricingToExcel}
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
                      placeholder="Search by SKU, date, price, tax..."
                      value={pricingSearchTerm}
                      onChange={(e) => setPricingSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Button
                    onClick={clearAllPricingFilters}
                    variant="outline"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <ColumnFilter
                        columnKey="pricing_date"
                        label="Date"
                        value={pricingColumnFilters.pricing_date}
                        sortDirection={pricingColumnSorts.pricing_date}
                        onFilterChange={(value) => handlePricingColumnFilterChange('pricing_date', value)}
                        onSortChange={(direction) => handlePricingColumnSortChange('pricing_date', direction)}
                      />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter
                        columnKey="sku"
                        label="SKU"
                        value={pricingColumnFilters.sku}
                        sortDirection={pricingColumnSorts.sku}
                        onFilterChange={(value) => handlePricingColumnFilterChange('sku', value)}
                        onSortChange={(direction) => handlePricingColumnSortChange('sku', direction)}
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <ColumnFilter
                        columnKey="bottles_per_case"
                        label="Bottles/Case"
                        value={pricingColumnFilters.bottles_per_case}
                        sortDirection={pricingColumnSorts.bottles_per_case}
                        onFilterChange={(value) => handlePricingColumnFilterChange('bottles_per_case', value)}
                        onSortChange={(direction) => handlePricingColumnSortChange('bottles_per_case', direction)}
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <ColumnFilter
                        columnKey="price_per_bottle"
                        label="Price/Bottle"
                        value={pricingColumnFilters.price_per_bottle}
                        sortDirection={pricingColumnSorts.price_per_bottle}
                        onFilterChange={(value) => handlePricingColumnFilterChange('price_per_bottle', value)}
                        onSortChange={(direction) => handlePricingColumnSortChange('price_per_bottle', direction)}
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <ColumnFilter
                        columnKey="cost_per_case"
                        label="Cost/Case"
                        value={pricingColumnFilters.cost_per_case}
                        sortDirection={pricingColumnSorts.cost_per_case}
                        onFilterChange={(value) => handlePricingColumnFilterChange('cost_per_case', value)}
                        onSortChange={(direction) => handlePricingColumnSortChange('cost_per_case', direction)}
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <ColumnFilter
                        columnKey="tax"
                        label="Tax (%)"
                        value={pricingColumnFilters.tax}
                        sortDirection={pricingColumnSorts.tax}
                        onFilterChange={(value) => handlePricingColumnFilterChange('tax', value)}
                        onSortChange={(direction) => handlePricingColumnSortChange('tax', direction)}
                      />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedFactoryPricing && filteredAndSortedFactoryPricing.length > 0 ? (
                    filteredAndSortedFactoryPricing.map((pricing) => (
                      <TableRow key={pricing.id}>
                        <TableCell className="text-xs">{new Date(pricing.pricing_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-xs">{pricing.sku}</TableCell>
                        <TableCell className="text-right text-xs">{pricing.bottles_per_case || '-'}</TableCell>
                        <TableCell className="text-right text-xs">₹{pricing.price_per_bottle}</TableCell>
                        <TableCell className="text-right text-xs">{pricing.cost_per_case ? `₹${pricing.cost_per_case}` : '-'}</TableCell>
                        <TableCell className="text-right text-xs">{pricing.tax ? `${pricing.tax}%` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPricing(pricing);
                                setIsEditPricingOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePricingMutation.mutate(pricing.id)}
                              disabled={deletePricingMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {factoryPricing && factoryPricing.length === 0 
                          ? "No factory pricing data found. Start by adding factory pricing."
                          : "No results found matching your search criteria."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-client-name">Client Name *</Label>
              <Input
                id="edit-client-name"
                value={editingCustomer?.client_name || ""}
                onChange={(e) => setEditingCustomer({...editingCustomer, client_name: e.target.value})}
                placeholder="Customer company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Input
                id="edit-branch"
                value={editingCustomer?.branch || ""}
                onChange={(e) => setEditingCustomer({...editingCustomer, branch: e.target.value})}
                placeholder="Branch or location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pricing-date">Pricing Date *</Label>
              <Input
                id="edit-pricing-date"
                type="date"
                value={editingCustomer?.pricing_date ? new Date(editingCustomer.pricing_date).toISOString().split('T')[0] : ""}
                onChange={(e) => setEditingCustomer({...editingCustomer, pricing_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={editingCustomer?.sku || ""}
                onChange={(e) => setEditingCustomer({...editingCustomer, sku: e.target.value})}
                placeholder="Product SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price-per-case">Price per Case (₹)</Label>
              <Input
                id="edit-price-per-case"
                type="number"
                step="0.01"
                value={editingCustomer?.price_per_case || ""}
                onChange={(e) => setEditingCustomer({...editingCustomer, price_per_case: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price-per-bottle">Price per Bottle (₹)</Label>
              <Input
                id="edit-price-per-bottle"
                type="number"
                step="0.01"
                value={editingCustomer?.price_per_bottle || ""}
                onChange={(e) => setEditingCustomer({...editingCustomer, price_per_bottle: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateCustomerMutation.mutate(editingCustomer)}
              disabled={updateCustomerMutation.isPending}
            >
              {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Factory Pricing Dialog */}
      <Dialog open={isEditPricingOpen} onOpenChange={setIsEditPricingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Factory Pricing</DialogTitle>
            <DialogDescription>
              Update factory pricing information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pricing-date">Date *</Label>
                <Input
                  id="edit-pricing-date"
                  type="date"
                  value={editingPricing?.pricing_date || ""}
                  onChange={(e) => setEditingPricing({...editingPricing, pricing_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pricing-sku">SKU *</Label>
                <Input
                  id="edit-pricing-sku"
                  value={editingPricing?.sku || ""}
                  onChange={(e) => setEditingPricing({...editingPricing, sku: e.target.value})}
                  placeholder="e.g., SKU001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bottles-per-case">Bottles/Case *</Label>
                <Input
                  id="edit-bottles-per-case"
                  type="number"
                  value={editingPricing?.bottles_per_case || ""}
                  onChange={(e) => setEditingPricing({...editingPricing, bottles_per_case: e.target.value})}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price-per-bottle">Price per Bottle (₹) *</Label>
                <Input
                  id="edit-price-per-bottle"
                  type="number"
                  step="0.01"
                  value={editingPricing?.price_per_bottle || ""}
                  onChange={(e) => setEditingPricing({...editingPricing, price_per_bottle: e.target.value})}
                  placeholder="12.50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tax">TAX (%)</Label>
              <Input
                id="edit-tax"
                type="number"
                step="0.01"
                value={editingPricing?.tax || ""}
                onChange={(e) => setEditingPricing({...editingPricing, tax: e.target.value})}
                placeholder="18.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPricingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updatePricingMutation.mutate(editingPricing)}
              disabled={updatePricingMutation.isPending}
            >
              {updatePricingMutation.isPending ? "Updating..." : "Update Pricing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Client Name *</Label>
                <Input
                  id="edit-client-name"
                  value={editForm.client_name}
                  onChange={(e) => setEditForm({...editForm, client_name: e.target.value})}
                  placeholder="Customer company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-branch">Branch</Label>
                <Input
                  id="edit-branch"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                  placeholder="Branch or location"
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

export default ConfigurationManagement;