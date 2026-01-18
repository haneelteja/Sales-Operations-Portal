<<<<<<< HEAD
import React from 'react';
=======
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Plus, Download, Edit, Trash2 } from 'lucide-react';
import { ColumnFilter } from '@/components/ui/column-filter';
import * as XLSX from 'xlsx';

interface Order {
  id: string;
  client: string;
  branch: string;
  sku: string;
  number_of_cases: number;
  tentative_delivery_date: string;
  status: 'pending' | 'dispatched';
  created_at: string;
  updated_at: string;
}

// Database order type (may have client_name instead of client)
interface DatabaseOrder extends Partial<Order> {
  client_name?: string;
  client?: string;
}

interface OrderForm {
  date: string;
  client: string;
  branch: string;
  sku: string;
  number_of_cases: string;
  tentative_delivery_time: string;
}

const OrderManagement = () => {
  const [orderForm, setOrderForm] = useState<OrderForm>({
    date: new Date().toISOString().split('T')[0],
    client: '',
    branch: '',
    sku: '',
    number_of_cases: '',
    tentative_delivery_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [editForm, setEditForm] = useState<OrderForm>({
    date: '',
    client: '',
    branch: '',
    sku: '',
    number_of_cases: '',
    tentative_delivery_time: ''
  });

  // Filter and sort states for Current Orders
  const [ordersSearchTerm, setOrdersSearchTerm] = useState("");
  const debouncedOrdersSearchTerm = useDebouncedValue(ordersSearchTerm, 300);
  const [ordersColumnFilters, setOrdersColumnFilters] = useState({
    client: "",
    branch: "",
    sku: "",
    number_of_cases: "",
    tentative_delivery_date: "",
    status: "",
  });
  const [ordersColumnSorts, setOrdersColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    branch: null,
    sku: null,
    number_of_cases: null,
    tentative_delivery_date: null,
    created_at: null,
    status: null,
  });

  // Filter and sort states for Orders Dispatch
  const [dispatchSearchTerm, setDispatchSearchTerm] = useState("");
  const debouncedDispatchSearchTerm = useDebouncedValue(dispatchSearchTerm, 300);
  const [dispatchColumnFilters, setDispatchColumnFilters] = useState({
    client: "",
    branch: "",
    sku: "",
    cases: "",
    delivery_date: "",
  });
  const [dispatchColumnSorts, setDispatchColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    branch: null,
    sku: null,
    cases: null,
    delivery_date: null,
    created_at: null,
  });
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to determine highlight color for tentative delivery date
  const getTentativeDateHighlight = (tentativeDate: string) => {
    const today = new Date();
    const deliveryDate = new Date(tentativeDate);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Overdue - red
      return 'bg-red-100 text-red-800 border border-red-200';
    } else if (diffDays < 4) {
      // Less than 4 days - yellow
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
    
    // Normal - no highlight
    return '';
  }, [filteredAndSortedPurchases, customers]);
  
  // Fetch orders with SQL-level sorting
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Use raw SQL query for optimal sorting performance
      const { data, error } = await supabase
        .rpc('get_orders_sorted');
      
      let ordersData: DatabaseOrder[] = [];
      
      if (error) {
        // Fallback to direct table query with SQL ORDER BY if function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select(`
            id,
            client_name,
            client,
            branch,
            sku,
            number_of_cases,
            tentative_delivery_date,
            status,
            created_at,
            updated_at
          `)
          .order('status', { ascending: true }) // pending comes before dispatched alphabetically
          .order('tentative_delivery_date', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        ordersData = fallbackData || [];
      } else {
        ordersData = data || [];
      }
      
      // Always map client_name to client for compatibility with Order interface
      // This ensures the Client column displays correctly regardless of data source
      // The RPC function returns 'client' (mapped from client_name), so prioritize that
      const mappedData = ordersData.map((order: DatabaseOrder): Order => {
        // RPC function returns 'client' field (mapped from client_name)
        // Fallback query returns 'client_name' field
        const clientValue = order.client || order.client_name || '';
        if (!clientValue) {
          console.warn('Order missing client data:', order);
        }
        return {
          ...order,
          client: clientValue
        };
      });
      
      // Apply the exact sorting logic in JavaScript
      return mappedData.sort((a, b) => {
        // First priority: pending status (pending = 1, dispatched = 2)
        const statusA = a.status === 'pending' ? 1 : 2;
        const statusB = b.status === 'pending' ? 1 : 2;
        const statusComparison = statusA - statusB;
        
        if (statusComparison !== 0) return statusComparison;
        
        // Second priority: tentative delivery date (most recent first)
        const dateA = new Date(a.tentative_delivery_date);
        const dateB = new Date(b.tentative_delivery_date);
        return dateB.getTime() - dateA.getTime();
      }) as Order[];
    },
  });

  // Fetch customers for dropdowns
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('client_name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique clients
  const getUniqueClients = () => {
    if (!customers) return [];
    return [...new Set(customers.map(c => c.client_name).filter(Boolean))].sort();
  };

  // Get branches for selected client
  const getBranchesForClient = (clientName: string) => {
    if (!customers || !clientName) return [];
    return [...new Set(
      customers
        .filter(c => c.client_name === clientName)
        .map(c => c.branch)
        .filter(Boolean)
    )].sort();
  };

  // Get SKUs for selected client and branch
  const getSKUsForClientBranch = (clientName: string, branch: string) => {
    if (!customers || !clientName || !branch) {
      console.log('getSKUsForClientBranch: Missing data', { customers: !!customers, clientName, branch });
      return [];
    }
    
    const filtered = customers.filter(c => {
      const clientMatch = c.client_name?.trim() === clientName.trim();
      const branchMatch = c.branch?.trim() === branch.trim();
      return clientMatch && branchMatch;
    });
    
    console.log('getSKUsForClientBranch: Filtered customers', { 
      clientName, 
      branch, 
      filteredCount: filtered.length,
      filtered: filtered.map(c => ({ client_name: c.client_name, branch: c.branch, sku: c.sku }))
    });
    
    const skus = [...new Set(
      filtered
        .map(c => c.sku)
        .filter(sku => sku && sku.trim() !== '')
    )].sort();
    
    console.log('getSKUsForClientBranch: Result SKUs', skus);
    
    return skus;
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (formData: OrderForm) => {
      // Map form data to database schema
      // The orders table uses 'client_name' column (NOT 'client')
      const orderData: Partial<DatabaseOrder> = {
        client_name: formData.client, // Use 'client_name' column as per actual database schema
        branch: formData.branch,
        sku: formData.sku,
        number_of_cases: parseInt(formData.number_of_cases),
        tentative_delivery_date: formData.tentative_delivery_time,
        status: 'pending'
      };
      
      console.log('Inserting order data:', orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Order insert error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setOrderForm({
        date: new Date().toISOString().split('T')[0],
        client: '',
        branch: '',
        sku: '',
        number_of_cases: '',
        tentative_delivery_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setIsCreateDialogOpen(false); // Close dialog on success
      toast({
        title: "Success",
        description: "Order created successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order.",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  // Update order details mutation
  const updateOrderDetailsMutation = useMutation({
    mutationFn: async ({ id, orderData }: { id: string; orderData: OrderForm }) => {
      const updateData: Partial<DatabaseOrder> = {
        client_name: orderData.client, // Use 'client_name' column as per actual database schema
        branch: orderData.branch,
        sku: orderData.sku,
        number_of_cases: parseInt(orderData.number_of_cases),
        tentative_delivery_date: orderData.tentative_delivery_time,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating order data:', updateData);
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Order update error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsEditDialogOpen(false);
      setEditingOrder(null);
      toast({
        title: "Success",
        description: "Order updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Success",
        description: "Order deleted successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete order.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.client || !orderForm.branch || !orderForm.sku || !orderForm.number_of_cases) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrderMutation.mutateAsync(orderForm);
      // Dialog will be closed in onSuccess callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
      setEditForm({
        date: new Date(order.created_at).toISOString().split('T')[0],
        client: (order as DatabaseOrder).client_name || order.client,
        branch: order.branch,
        sku: order.sku,
        number_of_cases: order.number_of_cases.toString(),
        tentative_delivery_time: order.tentative_delivery_date
      });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.client || !editForm.branch || !editForm.sku || !editForm.number_of_cases) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (editingOrder) {
      setIsSubmitting(true);
      try {
        await updateOrderDetailsMutation.mutateAsync({ id: editingOrder.id, orderData: editForm });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Dispatch order mutation - moves order from orders to orders_dispatch
  const dispatchOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      // First, insert into orders_dispatch with current date as delivery_date
      // orders_dispatch uses 'client' column, orders uses 'client_name'
      const dispatchData = {
        client: (order as DatabaseOrder).client_name || order.client, // Get client_name from order, fallback to client
        branch: order.branch,
        sku: order.sku,
        cases: order.number_of_cases,
        delivery_date: new Date().toISOString().split('T')[0], // Current date
        order_id: order.id
      };
      
      const { error: dispatchError } = await supabase
        .from('orders_dispatch')
        .insert(dispatchData);
      
      if (dispatchError) {
        console.error('Error inserting into orders_dispatch:', dispatchError);
        throw dispatchError;
      }
      
      // Then, delete from orders table
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      if (deleteError) {
        console.error('Error deleting from orders:', deleteError);
        throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-dispatch'] });
      toast({
        title: "Success",
        description: "Order dispatched successfully and moved to dispatch report.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dispatch order.",
        variant: "destructive",
      });
    },
  });

  const handleDispatch = (order: Order) => {
    dispatchOrderMutation.mutate(order);
  };

  // Fetch Orders Dispatch
  const { data: ordersDispatch } = useQuery({
    queryKey: ["orders-dispatch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders_dispatch")
        .select("*")
        .order("delivery_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching orders dispatch:", error);
        return [];
      }
      
      return data || [];
    },
  });

  // Filter and sort handlers for Current Orders
  const handleOrdersColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setOrdersColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleOrdersColumnSortChange = useCallback((columnKey: string, direction: 'asc' | 'desc' | null) => {
    setOrdersColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  const clearAllOrdersFilters = useCallback(() => {
    setOrdersSearchTerm("");
    setOrdersColumnFilters({
      client: "",
      branch: "",
      sku: "",
      number_of_cases: "",
      tentative_delivery_date: "",
      status: "",
    });
    setOrdersColumnSorts({
      client: null,
      branch: null,
      sku: null,
      number_of_cases: null,
      tentative_delivery_date: null,
      status: null,
    });
  }, []);

  // Filter and sort handlers for Orders Dispatch
  const handleDispatchColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setDispatchColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleDispatchColumnSortChange = useCallback((columnKey: string, direction: 'asc' | 'desc' | null) => {
    setDispatchColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  const clearAllDispatchFilters = useCallback(() => {
    setDispatchSearchTerm("");
    setDispatchColumnFilters({
      client: "",
      branch: "",
      sku: "",
      cases: "",
      delivery_date: "",
    });
    setDispatchColumnSorts({
      client: null,
      branch: null,
      sku: null,
      cases: null,
      delivery_date: null,
    });
  }, []);

  // Filtered and sorted Current Orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter(order => {
      // Safety check: skip if order is null/undefined
      if (!order) return false;
      
      // Global search (using debounced value)
      if (debouncedOrdersSearchTerm) {
        const searchLower = debouncedOrdersSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          (order.client || '').toLowerCase().includes(searchLower) ||
          (order.branch || '').toLowerCase().includes(searchLower) ||
          (order.sku || '').toLowerCase().includes(searchLower) ||
          (order.number_of_cases?.toString() || '').includes(searchLower) ||
          (order.tentative_delivery_date || '').includes(searchLower) ||
          (order.status || '').toLowerCase().includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (ordersColumnFilters.client && !(order.client || '').toLowerCase().includes(ordersColumnFilters.client.toLowerCase())) return false;
      if (ordersColumnFilters.branch && !(order.branch || '').toLowerCase().includes(ordersColumnFilters.branch.toLowerCase())) return false;
      if (ordersColumnFilters.sku && !(order.sku || '').toLowerCase().includes(ordersColumnFilters.sku.toLowerCase())) return false;
      if (ordersColumnFilters.number_of_cases && order.number_of_cases?.toString() !== ordersColumnFilters.number_of_cases) return false;
      if (ordersColumnFilters.tentative_delivery_date && order.tentative_delivery_date !== ordersColumnFilters.tentative_delivery_date) return false;
      if (ordersColumnFilters.status && order.status !== ordersColumnFilters.status) return false;

      return true;
    }).sort((a, b) => {
      // Safety check: handle null/undefined values
      if (!a || !b) return 0;
      
      const activeSort = Object.entries(ordersColumnSorts).find(([_, direction]) => direction !== null);
      if (!activeSort) return 0;

      const [columnKey, direction] = activeSort;
      let aValue: string | number | undefined = a[columnKey as keyof Order] as string | number | undefined;
      let bValue: string | number | undefined = b[columnKey as keyof Order] as string | number | undefined;

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle number columns
      if (columnKey === 'number_of_cases') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } 
      // Handle string columns (case-insensitive comparison)
      else if (typeof aValue === 'string' || typeof bValue === 'string') {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [orders, debouncedOrdersSearchTerm, ordersColumnFilters, ordersColumnSorts]);

  // Filtered and sorted Orders Dispatch
  const filteredAndSortedDispatch = useMemo(() => {
    if (!ordersDispatch) return [];

    return ordersDispatch.filter((order: Order) => {
      // Safety check: skip if order is null/undefined
      if (!order) return false;
      
      // Global search (using debounced value)
      if (debouncedDispatchSearchTerm) {
        const searchLower = debouncedDispatchSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          (order.client || '').toLowerCase().includes(searchLower) ||
          (order.branch || '').toLowerCase().includes(searchLower) ||
          (order.sku || '').toLowerCase().includes(searchLower) ||
          (order.cases?.toString() || '').includes(searchLower) ||
          (order.delivery_date || '').includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (dispatchColumnFilters.client && !(order.client || '').toLowerCase().includes(dispatchColumnFilters.client.toLowerCase())) return false;
      if (dispatchColumnFilters.branch && !(order.branch || '').toLowerCase().includes(dispatchColumnFilters.branch.toLowerCase())) return false;
      if (dispatchColumnFilters.sku && !(order.sku || '').toLowerCase().includes(dispatchColumnFilters.sku.toLowerCase())) return false;
      if (dispatchColumnFilters.cases && order.cases?.toString() !== dispatchColumnFilters.cases) return false;
      if (dispatchColumnFilters.delivery_date && order.delivery_date !== dispatchColumnFilters.delivery_date) return false;

      return true;
    }).sort((a: Order, b: Order) => {
      // Safety check: handle null/undefined values
      if (!a || !b) return 0;
      
      const activeSort = Object.entries(dispatchColumnSorts).find(([_, direction]) => direction !== null);
      if (!activeSort) return 0;

      const [columnKey, direction] = activeSort;
      let aValue: string | number | undefined = a[columnKey as keyof Order] as string | number | undefined;
      let bValue: string | number | undefined = b[columnKey as keyof Order] as string | number | undefined;

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle number columns
      if (columnKey === 'cases') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      // Handle string columns (case-insensitive comparison)
      else if (typeof aValue === 'string' || typeof bValue === 'string') {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [ordersDispatch, debouncedDispatchSearchTerm, dispatchColumnFilters, dispatchColumnSorts]);

  // Export Current Orders to Excel (memoized)
  const exportCurrentOrdersToExcel = useCallback(() => {
    if (!filteredAndSortedOrders || filteredAndSortedOrders.length === 0) {
      toast({
        title: "No Data",
        description: "No orders to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredAndSortedOrders.map(order => ({
      'Client': order.client || (order as DatabaseOrder).client_name || '',
      'Branch': order.branch,
      'SKU': order.sku,
      'Number of Cases': order.number_of_cases,
      'Tentative Delivery Date': order.tentative_delivery_date,
      'Status': order.status,
      'Created At': new Date(order.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Current Orders');
    
    const fileName = `Current_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} orders to ${fileName}`,
    });
  }, [filteredAndSortedOrders, toast]);

  // Export Orders Dispatch to Excel (memoized)
  const exportOrdersDispatchToExcel = useCallback(() => {
    if (!filteredAndSortedDispatch || filteredAndSortedDispatch.length === 0) {
      toast({
        title: "No Data",
        description: "No dispatch data to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredAndSortedDispatch.map((order: Order) => ({
      'Client': order.client,
      'Branch': order.branch,
      'SKU': order.sku,
      'Cases': order.cases,
      'Delivery Date': order.delivery_date,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders Dispatch');
    
    const fileName = `Orders_Dispatch_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} dispatch records to ${fileName}`,
    });
  }, [filteredAndSortedDispatch, toast]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrderMutation.mutate(id);
    }
  }, [deleteOrderMutation]);
>>>>>>> origin/copilot/fix-vercel-revert-2026-01-17

const OrderManagement: React.FC = () => {
  return (
    <div>
      <h2>Order Management</h2>
      {/* TODO: Reimplement business logic here */}
    </div>
  );
};

export default OrderManagement;

