import React, { useState, useMemo } from 'react';
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
    status: null,
  });

  // Filter and sort states for Orders Dispatch
  const [dispatchSearchTerm, setDispatchSearchTerm] = useState("");
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
  };

  // Fetch orders with SQL-level sorting
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Use raw SQL query for optimal sorting performance
      const { data, error } = await supabase
        .rpc('get_orders_sorted');
      
      let ordersData: any[] = [];
      
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
      const mappedData = ordersData.map((order: any) => {
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
    if (!customers || !clientName || !branch) return [];
    return [...new Set(
      customers
        .filter(c => c.client_name === clientName && c.branch === branch)
        .map(c => c.sku)
        .filter(Boolean)
    )].sort();
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (formData: OrderForm) => {
      // Map form data to database schema
      // The orders table uses 'client_name' column (NOT 'client')
      const orderData: any = {
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
      const updateData: any = {
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
        client: (order as any).client_name || order.client,
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
        client: (order as any).client_name || order.client, // Get client_name from order, fallback to client
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
  const handleOrdersColumnFilterChange = (columnKey: string, value: string) => {
    setOrdersColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  const handleOrdersColumnSortChange = (columnKey: string, direction: 'asc' | 'desc' | null) => {
    setOrdersColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  };

  const clearAllOrdersFilters = () => {
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
  };

  // Filter and sort handlers for Orders Dispatch
  const handleDispatchColumnFilterChange = (columnKey: string, value: string) => {
    setDispatchColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  const handleDispatchColumnSortChange = (columnKey: string, direction: 'asc' | 'desc' | null) => {
    setDispatchColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  };

  const clearAllDispatchFilters = () => {
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
  };

  // Filtered and sorted Current Orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter(order => {
      // Global search
      if (ordersSearchTerm) {
        const searchLower = ordersSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          order.client?.toLowerCase().includes(searchLower) ||
          order.branch?.toLowerCase().includes(searchLower) ||
          order.sku?.toLowerCase().includes(searchLower) ||
          order.number_of_cases?.toString().includes(searchLower) ||
          order.tentative_delivery_date?.includes(searchLower) ||
          order.status?.toLowerCase().includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (ordersColumnFilters.client && !order.client?.toLowerCase().includes(ordersColumnFilters.client.toLowerCase())) return false;
      if (ordersColumnFilters.branch && !order.branch?.toLowerCase().includes(ordersColumnFilters.branch.toLowerCase())) return false;
      if (ordersColumnFilters.sku && !order.sku?.toLowerCase().includes(ordersColumnFilters.sku.toLowerCase())) return false;
      if (ordersColumnFilters.number_of_cases && order.number_of_cases?.toString() !== ordersColumnFilters.number_of_cases) return false;
      if (ordersColumnFilters.tentative_delivery_date && order.tentative_delivery_date !== ordersColumnFilters.tentative_delivery_date) return false;
      if (ordersColumnFilters.status && order.status !== ordersColumnFilters.status) return false;

      return true;
    }).sort((a, b) => {
      const activeSort = Object.entries(ordersColumnSorts).find(([_, direction]) => direction !== null);
      if (!activeSort) return 0;

      const [columnKey, direction] = activeSort;
      let aValue: any = a[columnKey as keyof Order];
      let bValue: any = b[columnKey as keyof Order];

      if (columnKey === 'number_of_cases') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [orders, ordersSearchTerm, ordersColumnFilters, ordersColumnSorts]);

  // Filtered and sorted Orders Dispatch
  const filteredAndSortedDispatch = useMemo(() => {
    if (!ordersDispatch) return [];

    return ordersDispatch.filter((order: any) => {
      // Global search
      if (dispatchSearchTerm) {
        const searchLower = dispatchSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          order.client?.toLowerCase().includes(searchLower) ||
          order.branch?.toLowerCase().includes(searchLower) ||
          order.sku?.toLowerCase().includes(searchLower) ||
          order.cases?.toString().includes(searchLower) ||
          order.delivery_date?.includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (dispatchColumnFilters.client && !order.client?.toLowerCase().includes(dispatchColumnFilters.client.toLowerCase())) return false;
      if (dispatchColumnFilters.branch && !order.branch?.toLowerCase().includes(dispatchColumnFilters.branch.toLowerCase())) return false;
      if (dispatchColumnFilters.sku && !order.sku?.toLowerCase().includes(dispatchColumnFilters.sku.toLowerCase())) return false;
      if (dispatchColumnFilters.cases && order.cases?.toString() !== dispatchColumnFilters.cases) return false;
      if (dispatchColumnFilters.delivery_date && order.delivery_date !== dispatchColumnFilters.delivery_date) return false;

      return true;
    }).sort((a: any, b: any) => {
      const activeSort = Object.entries(dispatchColumnSorts).find(([_, direction]) => direction !== null);
      if (!activeSort) return 0;

      const [columnKey, direction] = activeSort;
      let aValue: any = a[columnKey];
      let bValue: any = b[columnKey];

      if (columnKey === 'cases') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [ordersDispatch, dispatchSearchTerm, dispatchColumnFilters, dispatchColumnSorts]);

  // Export Current Orders to Excel
  const exportCurrentOrdersToExcel = () => {
    if (!filteredAndSortedOrders || filteredAndSortedOrders.length === 0) {
      toast({
        title: "No Data",
        description: "No orders to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredAndSortedOrders.map(order => ({
      'Client': order.client || (order as any).client_name || '',
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
  };

  // Export Orders Dispatch to Excel
  const exportOrdersDispatchToExcel = () => {
    if (!filteredAndSortedDispatch || filteredAndSortedDispatch.length === 0) {
      toast({
        title: "No Data",
        description: "No dispatch data to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredAndSortedDispatch.map((order: any) => ({
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
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrderMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create new order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Order
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={orderForm.date}
                    onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={orderForm.client}
                    onValueChange={(value) => setOrderForm({ 
                      ...orderForm, 
                      client: value, 
                      branch: '', 
                      sku: '' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueClients().map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Select
                    value={orderForm.branch}
                    onValueChange={(value) => setOrderForm({ 
                      ...orderForm, 
                      branch: value, 
                      sku: '' 
                    })}
                    disabled={!orderForm.client}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBranchesForClient(orderForm.client).map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Select
                    value={orderForm.sku}
                    onValueChange={(value) => setOrderForm({ ...orderForm, sku: value })}
                    disabled={!orderForm.branch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SKU" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSKUsForClientBranch(orderForm.client, orderForm.branch).map((sku) => (
                        <SelectItem key={sku} value={sku}>
                          {sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number_of_cases">Number of Cases *</Label>
                  <Input
                    id="number_of_cases"
                    type="number"
                    value={orderForm.number_of_cases}
                    onChange={(e) => setOrderForm({ ...orderForm, number_of_cases: e.target.value })}
                    placeholder="Enter number of cases"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tentative_delivery_time">Tentative Delivery Date *</Label>
                  <Input
                    id="tentative_delivery_time"
                    type="date"
                    value={orderForm.tentative_delivery_time}
                    onChange={(e) => setOrderForm({ ...orderForm, tentative_delivery_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    // Reset form when canceling
                    setOrderForm({
                      date: new Date().toISOString().split('T')[0],
                      client: '',
                      branch: '',
                      sku: '',
                      number_of_cases: '',
                      tentative_delivery_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Current Orders ({filteredAndSortedOrders?.length || 0})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={clearAllOrdersFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
              <Button onClick={exportCurrentOrdersToExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search orders..."
              value={ordersSearchTerm}
              onChange={(e) => setOrdersSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : filteredAndSortedOrders && filteredAndSortedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Client
                        <ColumnFilter
                          columnKey="client"
                          columnName="Client"
                          filterValue={ordersColumnFilters.client}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('client', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('client', '')}
                          sortDirection={ordersColumnSorts.client}
                          onSortChange={(direction) => handleOrdersColumnSortChange('client', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Branch
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={ordersColumnFilters.branch}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('branch', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('branch', '')}
                          sortDirection={ordersColumnSorts.branch}
                          onSortChange={(direction) => handleOrdersColumnSortChange('branch', direction)}
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
                          filterValue={ordersColumnFilters.sku}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('sku', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('sku', '')}
                          sortDirection={ordersColumnSorts.sku}
                          onSortChange={(direction) => handleOrdersColumnSortChange('sku', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Cases
                        <ColumnFilter
                          columnKey="number_of_cases"
                          columnName="Cases"
                          filterValue={ordersColumnFilters.number_of_cases}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('number_of_cases', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('number_of_cases', '')}
                          sortDirection={ordersColumnSorts.number_of_cases}
                          onSortChange={(direction) => handleOrdersColumnSortChange('number_of_cases', direction)}
                          dataType="number"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Tentative Delivery
                        <ColumnFilter
                          columnKey="tentative_delivery_date"
                          columnName="Tentative Delivery"
                          filterValue={ordersColumnFilters.tentative_delivery_date}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('tentative_delivery_date', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('tentative_delivery_date', '')}
                          sortDirection={ordersColumnSorts.tentative_delivery_date}
                          onSortChange={(direction) => handleOrdersColumnSortChange('tentative_delivery_date', direction)}
                          dataType="date"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Status
                        <ColumnFilter
                          columnKey="status"
                          columnName="Status"
                          filterValue={ordersColumnFilters.status}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('status', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('status', '')}
                          sortDirection={ordersColumnSorts.status}
                          onSortChange={(direction) => handleOrdersColumnSortChange('status', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.client || (order as any).client_name || ''}</TableCell>
                      <TableCell>{order.branch}</TableCell>
                      <TableCell>{order.sku}</TableCell>
                      <TableCell>{order.number_of_cases}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${getTentativeDateHighlight(order.tentative_delivery_date)}`}>
                          {order.tentative_delivery_date}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.status === 'dispatched' 
                              ? 'default' 
                              : order.status === 'pending' 
                                ? 'secondary' 
                                : 'outline'
                          }
                          className={
                            order.status === 'dispatched' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : ''
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(order)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {order.status === 'pending' ? (
                              <DropdownMenuItem 
                                onClick={() => handleDispatch(order)}
                                disabled={dispatchOrderMutation.isPending}
                              >
                                Dispatch
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(order.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No orders found. Create your first order above.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Dispatch Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Orders Dispatch ({filteredAndSortedDispatch?.length || 0})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={clearAllDispatchFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
              <Button onClick={exportOrdersDispatchToExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search dispatch orders..."
              value={dispatchSearchTerm}
              onChange={(e) => setDispatchSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredAndSortedDispatch && filteredAndSortedDispatch.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Client
                        <ColumnFilter
                          columnKey="client"
                          columnName="Client"
                          filterValue={dispatchColumnFilters.client}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('client', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('client', '')}
                          sortDirection={dispatchColumnSorts.client}
                          onSortChange={(direction) => handleDispatchColumnSortChange('client', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Branch
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={dispatchColumnFilters.branch}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('branch', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('branch', '')}
                          sortDirection={dispatchColumnSorts.branch}
                          onSortChange={(direction) => handleDispatchColumnSortChange('branch', direction)}
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
                          filterValue={dispatchColumnFilters.sku}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('sku', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('sku', '')}
                          sortDirection={dispatchColumnSorts.sku}
                          onSortChange={(direction) => handleDispatchColumnSortChange('sku', direction)}
                          dataType="text"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        Cases
                        <ColumnFilter
                          columnKey="cases"
                          columnName="Cases"
                          filterValue={dispatchColumnFilters.cases}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('cases', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('cases', '')}
                          sortDirection={dispatchColumnSorts.cases}
                          onSortChange={(direction) => handleDispatchColumnSortChange('cases', direction)}
                          dataType="number"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Delivery Date
                        <ColumnFilter
                          columnKey="delivery_date"
                          columnName="Delivery Date"
                          filterValue={dispatchColumnFilters.delivery_date}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('delivery_date', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('delivery_date', '')}
                          sortDirection={dispatchColumnSorts.delivery_date}
                          onSortChange={(direction) => handleDispatchColumnSortChange('delivery_date', direction)}
                          dataType="date"
                        />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedDispatch.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.client}</TableCell>
                      <TableCell>{order.branch}</TableCell>
                      <TableCell>{order.sku}</TableCell>
                      <TableCell className="text-right">{order.cases}</TableCell>
                      <TableCell>{new Date(order.delivery_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No dispatched orders found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Order Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-tentative-delivery">Tentative Delivery Date *</Label>
                <Input
                  id="edit-tentative-delivery"
                  type="date"
                  value={editForm.tentative_delivery_time}
                  onChange={(e) => setEditForm({ ...editForm, tentative_delivery_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-client">Client *</Label>
              <Select
                value={editForm.client}
                onValueChange={(value) => setEditForm({ ...editForm, client: value, branch: '', sku: '' })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueClients().map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-branch">Branch *</Label>
              <Select
                value={editForm.branch}
                onValueChange={(value) => setEditForm({ ...editForm, branch: value, sku: '' })}
                required
                disabled={!editForm.client}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {getBranchesForClient(editForm.client).map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-sku">SKU *</Label>
              <Select
                value={editForm.sku}
                onValueChange={(value) => setEditForm({ ...editForm, sku: value })}
                required
                disabled={!editForm.branch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {getSKUsForClientBranch(editForm.client, editForm.branch).map((sku) => (
                    <SelectItem key={sku} value={sku}>
                      {sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-cases">Number of Cases *</Label>
              <Input
                id="edit-cases"
                type="number"
                min="1"
                value={editForm.number_of_cases}
                onChange={(e) => setEditForm({ ...editForm, number_of_cases: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;

