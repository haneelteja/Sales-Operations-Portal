import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Send } from "lucide-react";
import * as XLSX from "xlsx";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface OrderRow {
  id: string;
  client: string;
  branch: string;
  sku: string;
  number_of_cases: number;
  tentative_delivery_date: string;
  status: "pending" | "dispatched";
  created_at: string;
  updated_at: string;
  client_name?: string;
}

interface DispatchRow {
  id: string;
  client: string;
  branch: string;
  sku: string;
  cases: number;
  delivery_date: string;
}

const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for order registration
  const [orderForm, setOrderForm] = useState({
    expense_date: new Date().toISOString().split("T")[0],
    client_id: "",
    branch: "",
    sku: "",
    number_of_cases: "",
    tentative_delivery_date: "",
  });

  // Filter and sort states for Current Orders table
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
    status: null,
  });

  // Filter and sort states for Orders Dispatched table
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
  });

  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_orders_sorted");
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("orders")
          .select(
            `id, client_name, client, branch, sku, number_of_cases, tentative_delivery_date, status, created_at, updated_at`
          )
          .order("status", { ascending: true })
          .order("tentative_delivery_date", { ascending: false });

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      return data || [];
    },
  });

  // Fetch customers for dropdown (including SKU)
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku")
        .eq("is_active", true)
        .order("client_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (newOrder: any) => {
      const { data, error } = await supabase
        .from("orders")
        .insert([newOrder])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Reset form
      const today = new Date().toISOString().split("T")[0];
      const defaultDeliveryDate = new Date();
      defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 5);
      
      setOrderForm({
        expense_date: today,
        client_id: "",
        branch: "",
        sku: "",
        number_of_cases: "",
        tentative_delivery_date: defaultDeliveryDate.toISOString().split("T")[0],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  // Dispatch order mutation
  const dispatchOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Get the order details first
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!orderData) throw new Error("Order not found");

      // Insert into dispatch table
      const { error: dispatchError } = await supabase
        .from("orders_dispatch")
        .insert([{
          client: orderData.client || orderData.client_name,
          branch: orderData.branch,
          sku: orderData.sku,
          cases: orderData.number_of_cases,
          delivery_date: orderData.tentative_delivery_date,
        }]);

      if (dispatchError) throw dispatchError;

      // Delete from orders table
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order dispatched successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-dispatch"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dispatch order",
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const { data: dispatchData, isLoading: dispatchLoading, error: dispatchError } = useQuery({
    queryKey: ["orders-dispatch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders_dispatch")
        .select("id, client, branch, sku, cases, delivery_date")
        .order("delivery_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const normalizedOrders = useMemo(() => {
    if (!ordersData) return [] as OrderRow[];

    return (ordersData as OrderRow[])
      .map((order) => ({
        ...order,
        client: order.client || order.client_name || "",
      }))
      .sort((a, b) => {
        const statusA = a.status === "pending" ? 1 : 2;
        const statusB = b.status === "pending" ? 1 : 2;
        if (statusA !== statusB) return statusA - statusB;

        const dateA = new Date(a.tentative_delivery_date).getTime();
        const dateB = new Date(b.tentative_delivery_date).getTime();
        return dateB - dateA;
      });
  }, [ordersData]);

  const exportOrdersToExcel = useCallback(() => {
    if (!filteredAndSortedOrders.length) return;

    const exportData = filteredAndSortedOrders.map((order) => ({
      Client: order.client,
      Branch: order.branch,
      SKU: order.sku,
      "Number of Cases": order.number_of_cases,
      "Tentative Delivery Date": order.tentative_delivery_date,
      Status: order.status,
      "Created At": new Date(order.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Current Orders");
    const fileName = `Current_Orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredAndSortedOrders]);

  const exportDispatchToExcel = useCallback(() => {
    if (!filteredAndSortedDispatch.length) return;

    const exportData = filteredAndSortedDispatch.map((row) => ({
      Client: row.client,
      Branch: row.branch,
      SKU: row.sku,
      Cases: row.cases,
      "Delivery Date": row.delivery_date,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders Dispatch");
    const fileName = `Orders_Dispatch_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredAndSortedDispatch]);

  const renderStatus = (status: string) => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "dispatched") return <Badge variant="outline">Dispatched</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  // Get unique branches for selected customer
  const getAvailableBranches = useCallback((clientId: string) => {
    if (!customers || !clientId) return [];
    const selectedCustomer = customers.find(c => c.id === clientId);
    if (!selectedCustomer) return [];
    
    const branches = customers
      .filter(c => c.client_name === selectedCustomer.client_name)
      .map(c => c.branch)
      .filter((branch, index, self) => self.indexOf(branch) === index)
      .sort();
    
    return branches;
  }, [customers]);

  // Get available SKUs for selected customer and branch
  const getAvailableSKUs = useCallback(() => {
    if (!customers || !orderForm.client_id || !orderForm.branch) return [];
    
    const selectedCustomer = customers.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) return [];
    
    const skus = customers
      .filter(c => 
        c.client_name === selectedCustomer.client_name && 
        c.branch === orderForm.branch &&
        c.sku && 
        c.sku.trim() !== ''
      )
      .map(c => c.sku)
      .filter((sku, index, self) => self.indexOf(sku) === index)
      .sort();
    
    return skus;
  }, [customers, orderForm.client_id, orderForm.branch]);

  // Handle order form submission
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check required fields
    if (!orderForm.client_id || !orderForm.branch || !orderForm.number_of_cases || !orderForm.tentative_delivery_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validation: Tentative delivery date must be greater than order date
    const orderDate = new Date(orderForm.expense_date);
    const deliveryDate = new Date(orderForm.tentative_delivery_date);
    
    if (deliveryDate <= orderDate) {
      toast({
        title: "Validation Error",
        description: "Tentative delivery date must be greater than order date",
        variant: "destructive",
      });
      return;
    }

    const selectedCustomer = customers?.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Selected customer not found",
        variant: "destructive",
      });
      return;
    }

    const newOrder = {
      client: selectedCustomer.client_name,
      client_name: selectedCustomer.client_name,
      branch: orderForm.branch,
      sku: orderForm.sku || "",
      number_of_cases: parseInt(orderForm.number_of_cases),
      tentative_delivery_date: orderForm.tentative_delivery_date,
      status: "pending",
    };

    createOrderMutation.mutate(newOrder);
  };

  // Handle client change - auto-populate branch if single, reset SKU
  const handleClientChange = (clientId: string) => {
    const availableBranches = getAvailableBranches(clientId);
    const autoBranch = availableBranches.length === 1 ? availableBranches[0] : "";
    
    setOrderForm({
      ...orderForm,
      client_id: clientId,
      branch: autoBranch,
      sku: "", // Reset SKU when client changes
    });
  };

  // Handle branch change - auto-populate SKU if single
  const handleBranchChange = (branch: string) => {
    const selectedCustomer = customers?.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) {
      setOrderForm({
        ...orderForm,
        branch: branch,
        sku: "",
      });
      return;
    }

    const availableSKUs = customers
      ?.filter(c => 
        c.client_name === selectedCustomer.client_name && 
        c.branch === branch &&
        c.sku && 
        c.sku.trim() !== ''
      )
      .map(c => c.sku)
      .filter((sku, index, self) => self.indexOf(sku) === index) || [];
    
    const autoSKU = availableSKUs.length === 1 ? availableSKUs[0] : "";
    
    setOrderForm({
      ...orderForm,
      branch: branch,
      sku: autoSKU,
    });
  };

  // Handle date change and auto-calculate delivery
  const handleDateChange = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Validation: Cannot select future date
    if (selectedDate > today) {
      toast({
        title: "Validation Error",
        description: "Cannot select a future date",
        variant: "destructive",
      });
      return;
    }

    const deliveryDate = new Date(selectedDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    
    // Ensure delivery date is always set
    const newDeliveryDate = orderForm.tentative_delivery_date || deliveryDate.toISOString().split("T")[0];
    
    // If current delivery date is before or equal to new order date, update it
    const currentDeliveryDate = new Date(newDeliveryDate);
    if (currentDeliveryDate <= selectedDate) {
      setOrderForm({
        ...orderForm,
        expense_date: date,
        tentative_delivery_date: deliveryDate.toISOString().split("T")[0],
      });
    } else {
      setOrderForm({
        ...orderForm,
        expense_date: date,
        tentative_delivery_date: newDeliveryDate,
      });
    }
  };

  // Initialize tentative delivery date on component mount
  useEffect(() => {
    if (!orderForm.tentative_delivery_date) {
      const defaultDeliveryDate = new Date(orderForm.expense_date);
      defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 5);
      setOrderForm(prev => ({
        ...prev,
        tentative_delivery_date: defaultDeliveryDate.toISOString().split("T")[0],
      }));
    }
  }, []);

  // Get unique customers for form dropdown (by client_name, not by id)
  const getUniqueCustomers = useCallback(() => {
    if (!customers) return [];
    const seenNames = new Set<string>();
    const unique = [];
    
    for (const customer of customers) {
      if (!seenNames.has(customer.client_name)) {
        seenNames.add(customer.client_name);
        unique.push(customer);
      }
    }
    
    return unique.sort((a, b) => a.client_name.localeCompare(b.client_name));
  }, [customers]);

  // Filtered and sorted Current Orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!normalizedOrders) return [];

    return normalizedOrders.filter(order => {
      // Global search
      if (debouncedOrdersSearchTerm) {
        const searchLower = debouncedOrdersSearchTerm.toLowerCase();
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
      if (ordersColumnFilters.tentative_delivery_date && !order.tentative_delivery_date?.includes(ordersColumnFilters.tentative_delivery_date)) return false;
      if (ordersColumnFilters.status && order.status !== ordersColumnFilters.status) return false;

      return true;
    }).sort((a, b) => {
      // Apply sorting
      const sortKey = Object.keys(ordersColumnSorts).find(key => ordersColumnSorts[key] !== null);
      if (!sortKey) {
        // Default sort: status first, then date
        const statusA = a.status === "pending" ? 1 : 2;
        const statusB = b.status === "pending" ? 1 : 2;
        if (statusA !== statusB) return statusA - statusB;
        const dateA = new Date(a.tentative_delivery_date).getTime();
        const dateB = new Date(b.tentative_delivery_date).getTime();
        return dateB - dateA;
      }

      const direction = ordersColumnSorts[sortKey];
      if (!direction) return 0;

      let aValue: any;
      let bValue: any;

      switch (sortKey) {
        case 'client':
          aValue = (a.client || '').toLowerCase();
          bValue = (b.client || '').toLowerCase();
          break;
        case 'branch':
          aValue = (a.branch || '').toLowerCase();
          bValue = (b.branch || '').toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'number_of_cases':
          aValue = a.number_of_cases || 0;
          bValue = b.number_of_cases || 0;
          break;
        case 'tentative_delivery_date':
          aValue = new Date(a.tentative_delivery_date).getTime();
          bValue = new Date(b.tentative_delivery_date).getTime();
          break;
        case 'status':
          aValue = a.status === "pending" ? 1 : 2;
          bValue = b.status === "pending" ? 1 : 2;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [normalizedOrders, debouncedOrdersSearchTerm, ordersColumnFilters, ordersColumnSorts]);

  // Filtered and sorted Orders Dispatched
  const filteredAndSortedDispatch = useMemo(() => {
    if (!dispatchData) return [];

    return (dispatchData as DispatchRow[]).filter(order => {
      // Global search
      if (debouncedDispatchSearchTerm) {
        const searchLower = debouncedDispatchSearchTerm.toLowerCase();
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
      if (dispatchColumnFilters.delivery_date && !order.delivery_date?.includes(dispatchColumnFilters.delivery_date)) return false;

      return true;
    }).sort((a, b) => {
      // Apply sorting
      const sortKey = Object.keys(dispatchColumnSorts).find(key => dispatchColumnSorts[key] !== null);
      if (!sortKey) {
        // Default sort: by delivery date descending
        const dateA = new Date(a.delivery_date).getTime();
        const dateB = new Date(b.delivery_date).getTime();
        return dateB - dateA;
      }

      const direction = dispatchColumnSorts[sortKey];
      if (!direction) return 0;

      let aValue: any;
      let bValue: any;

      switch (sortKey) {
        case 'client':
          aValue = (a.client || '').toLowerCase();
          bValue = (b.client || '').toLowerCase();
          break;
        case 'branch':
          aValue = (a.branch || '').toLowerCase();
          bValue = (b.branch || '').toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'cases':
          aValue = a.cases || 0;
          bValue = b.cases || 0;
          break;
        case 'delivery_date':
          aValue = new Date(a.delivery_date).getTime();
          bValue = new Date(b.delivery_date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [dispatchData, debouncedDispatchSearchTerm, dispatchColumnFilters, dispatchColumnSorts]);

  // Handle column filter changes for Current Orders
  const handleOrdersColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setOrdersColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleOrdersColumnSortChange = useCallback((columnKey: string, direction: "asc" | "desc" | null) => {
    setOrdersColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  // Handle column filter changes for Orders Dispatched
  const handleDispatchColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setDispatchColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleDispatchColumnSortChange = useCallback((columnKey: string, direction: "asc" | "desc" | null) => {
    setDispatchColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  // Get unique values for filter options
  const getUniqueOrderValues = useCallback((key: keyof OrderRow) => {
    if (!normalizedOrders) return [];
    const values = normalizedOrders.map(order => order[key]).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [normalizedOrders]);

  const getUniqueDispatchValues = useCallback((key: keyof DispatchRow) => {
    if (!dispatchData) return [];
    const values = (dispatchData as DispatchRow[]).map(order => order[key]).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [dispatchData]);

  // Get max date (today) for date input
  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Order Management</h2>
          <p className="text-sm text-muted-foreground">Create, manage, and dispatch customer orders.</p>
        </div>
      </div>

      {/* Order Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            {/* First Row: Date, Client, Branch, Tentative Delivery Date */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order-date">Date *</Label>
                <Input
                  id="order-date"
                  type="date"
                  max={maxDate}
                  value={orderForm.expense_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-client">Client *</Label>
                <Select value={orderForm.client_id} onValueChange={handleClientChange}>
                  <SelectTrigger id="order-client">
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
                <Label htmlFor="order-branch">Branch *</Label>
                <Select 
                  value={orderForm.branch} 
                  onValueChange={handleBranchChange} 
                  disabled={!orderForm.client_id}
                >
                  <SelectTrigger id="order-branch">
                    <SelectValue placeholder={getAvailableBranches(orderForm.client_id).length === 0 ? "Select branch" : "Select branch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBranches(orderForm.client_id).map((branch, index) => (
                      <SelectItem key={index} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-delivery">Tentative Delivery Date *</Label>
                <Input
                  id="order-delivery"
                  type="date"
                  min={orderForm.expense_date ? new Date(new Date(orderForm.expense_date).getTime() + 86400000).toISOString().split("T")[0] : undefined}
                  value={orderForm.tentative_delivery_date}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const orderDate = new Date(orderForm.expense_date);
                    
                    if (selectedDate <= orderDate) {
                      toast({
                        title: "Validation Error",
                        description: "Tentative delivery date must be greater than order date",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    setOrderForm({ ...orderForm, tentative_delivery_date: e.target.value });
                  }}
                  required
                />
              </div>
            </div>

            {/* Second Row: SKU and Number of Cases (right side) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2"></div> {/* Empty space for alignment */}
              
              <div className="space-y-2">
                <Label htmlFor="order-sku">SKU</Label>
                <Select 
                  value={orderForm.sku} 
                  onValueChange={(value) => setOrderForm({ ...orderForm, sku: value })} 
                  disabled={!orderForm.client_id || !orderForm.branch}
                >
                  <SelectTrigger id="order-sku">
                    <SelectValue placeholder="Select SKU" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSKUs().map((sku, index) => (
                      <SelectItem key={index} value={sku}>
                        {sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-cases">No. of Cases *</Label>
                <Input
                  id="order-cases"
                  type="number"
                  min="1"
                  value={orderForm.number_of_cases}
                  onChange={(e) => setOrderForm({ ...orderForm, number_of_cases: e.target.value })}
                  placeholder="Number of cases"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-800">Current Orders</CardTitle>
            <Button 
              variant="outline" 
              onClick={exportOrdersToExcel} 
              disabled={!filteredAndSortedOrders.length}
              size="sm"
            >
              Export Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersError && <p className="text-sm text-red-500">Failed to load orders.</p>}
          {ordersLoading ? (
            <p className="text-sm text-gray-600">Loading orders...</p>
          ) : (
            <>
              {/* Global Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search orders..."
                  value={ordersSearchTerm}
                  onChange={(e) => setOrdersSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table className="table-auto w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Client</span>
                        <ColumnFilter
                          columnKey="client"
                          columnName="Client"
                          filterValue={ordersColumnFilters.client}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('client', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('client', '')}
                          sortDirection={ordersColumnSorts.client}
                          onSortChange={(direction) => handleOrdersColumnSortChange('client', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('client') as string[]}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Branch</span>
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={ordersColumnFilters.branch}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('branch', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('branch', '')}
                          sortDirection={ordersColumnSorts.branch}
                          onSortChange={(direction) => handleOrdersColumnSortChange('branch', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('branch') as string[]}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>SKU</span>
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={ordersColumnFilters.sku}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('sku', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('sku', '')}
                          sortDirection={ordersColumnSorts.sku}
                          onSortChange={(direction) => handleOrdersColumnSortChange('sku', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('sku') as string[]}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>Cases</span>
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
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Delivery</span>
                        <ColumnFilter
                          columnKey="tentative_delivery_date"
                          columnName="Delivery Date"
                          filterValue={ordersColumnFilters.tentative_delivery_date}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('tentative_delivery_date', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('tentative_delivery_date', '')}
                          sortDirection={ordersColumnSorts.tentative_delivery_date}
                          onSortChange={(direction) => handleOrdersColumnSortChange('tentative_delivery_date', direction)}
                          dataType="date"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <ColumnFilter
                          columnKey="status"
                          columnName="Status"
                          filterValue={ordersColumnFilters.status}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('status', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('status', '')}
                          sortDirection={ordersColumnSorts.status}
                          onSortChange={(direction) => handleOrdersColumnSortChange('status', direction)}
                          dataType="text"
                          options={['pending', 'dispatched']}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>{order.client || "-"}</TableCell>
                      <TableCell>{order.branch || "-"}</TableCell>
                      <TableCell>{order.sku || "-"}</TableCell>
                      <TableCell className="text-right">{order.number_of_cases ?? "-"}</TableCell>
                      <TableCell>{order.tentative_delivery_date || "-"}</TableCell>
                      <TableCell>{renderStatus(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatchOrderMutation.mutate(order.id)}
                            disabled={dispatchOrderMutation.isPending}
                            title="Dispatch this order"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this order?")) {
                                deleteOrderMutation.mutate(order.id);
                              }
                            }}
                            disabled={deleteOrderMutation.isPending}
                            title="Delete this order"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredAndSortedOrders.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-600 py-8">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-800">Orders Dispatched</CardTitle>
            <Button 
              variant="outline" 
              onClick={exportDispatchToExcel} 
              disabled={!filteredAndSortedDispatch.length}
              size="sm"
            >
              Export Dispatch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dispatchError && <p className="text-sm text-red-500">Failed to load dispatch data.</p>}
          {dispatchLoading ? (
            <p className="text-sm text-gray-600">Loading dispatch data...</p>
          ) : (
            <>
              {/* Global Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search dispatch records..."
                  value={dispatchSearchTerm}
                  onChange={(e) => setDispatchSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table className="table-auto w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Client</span>
                        <ColumnFilter
                          columnKey="client"
                          columnName="Client"
                          filterValue={dispatchColumnFilters.client}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('client', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('client', '')}
                          sortDirection={dispatchColumnSorts.client}
                          onSortChange={(direction) => handleDispatchColumnSortChange('client', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('client') as string[]}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Branch</span>
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={dispatchColumnFilters.branch}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('branch', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('branch', '')}
                          sortDirection={dispatchColumnSorts.branch}
                          onSortChange={(direction) => handleDispatchColumnSortChange('branch', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('branch') as string[]}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>SKU</span>
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={dispatchColumnFilters.sku}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('sku', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('sku', '')}
                          sortDirection={dispatchColumnSorts.sku}
                          onSortChange={(direction) => handleDispatchColumnSortChange('sku', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('sku') as string[]}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>Cases</span>
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
                    <TableHead className="border-b">
                      <div className="flex items-center gap-2">
                        <span>Delivery Date</span>
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
                  {filteredAndSortedDispatch.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>{order.client || "-"}</TableCell>
                      <TableCell>{order.branch || "-"}</TableCell>
                      <TableCell>{order.sku || "-"}</TableCell>
                      <TableCell className="text-right">{order.cases ?? "-"}</TableCell>
                      <TableCell>{order.delivery_date || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!filteredAndSortedDispatch.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-gray-600 py-8">
                        No dispatch records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
