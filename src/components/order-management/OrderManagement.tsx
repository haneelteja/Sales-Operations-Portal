import React, { useState } from 'react';
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
      
      if (error) {
        // Fallback to direct table query with SQL ORDER BY if function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select(`
            id,
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
        
        // Apply the exact sorting logic in JavaScript as fallback
        return (fallbackData as Order[]).sort((a, b) => {
          // First priority: pending status (pending = 1, dispatched = 2)
          const statusA = a.status === 'pending' ? 1 : 2;
          const statusB = b.status === 'pending' ? 1 : 2;
          const statusComparison = statusA - statusB;
          
          if (statusComparison !== 0) return statusComparison;
          
          // Second priority: tentative delivery date (most recent first)
          const dateA = new Date(a.tentative_delivery_date);
          const dateB = new Date(b.tentative_delivery_date);
          return dateB.getTime() - dateA.getTime();
        });
      }
      
      return data as Order[];
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
      const { data, error } = await supabase
        .from('orders')
        .insert({
          client: formData.client,
          branch: formData.branch,
          sku: formData.sku,
          number_of_cases: parseInt(formData.number_of_cases),
          tentative_delivery_date: formData.tentative_delivery_time,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('orders')
        .update({
          client: orderData.client,
          branch: orderData.branch,
          sku: orderData.sku,
          number_of_cases: parseInt(orderData.number_of_cases),
          tentative_delivery_date: orderData.tentative_delivery_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      date: new Date(order.created_at).toISOString().split('T')[0],
      client: order.client,
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

  const handleDispatch = (id: string) => {
    updateOrderMutation.mutate({ id, status: 'dispatched' });
  };

  const handleRevertDispatch = (id: string) => {
    updateOrderMutation.mutate({ id, status: 'pending' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrderMutation.mutate(id);
    }
  };

  const exportToExcel = () => {
    if (!orders) return;

    const exportData = orders.map(order => ({
      'Client': order.client,
      'Branch': order.branch,
      'SKU': order.sku,
      'Number of Cases': order.number_of_cases,
      'Tentative Delivery Date': order.tentative_delivery_date,
      'Status': order.status,
      'Created At': new Date(order.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Create Order Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Tentative Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.client}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleDispatch(order.id)}>
                                Dispatch
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRevertDispatch(order.id)}>
                                Revert to Pending
                              </DropdownMenuItem>
                            )}
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

