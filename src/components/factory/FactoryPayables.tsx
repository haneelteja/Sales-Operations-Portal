import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Pencil, Trash2 } from "lucide-react";

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

  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    quantity: "",
    sku: "",
    description: "",
    transaction_date: ""
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
        .order("sku");
      
      const uniqueSKUs = [...new Set(data?.map(item => item.sku) || [])];
      return uniqueSKUs;
    },
  });

  // Fetch factory transactions with calculated amounts
  const { data: transactions } = useQuery({
    queryKey: ["factory-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_payables")
        .select(`
          *,
          factory_pricing!inner(cost_per_case, price_per_bottle, bottles_per_case)
        `)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

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
    mutationFn: async (data: any) => {
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
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record production: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
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
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record payment: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      let updateData = { ...data };
      
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
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update transaction: " + error.message,
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
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete transaction: " + error.message,
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

  const handleEditClick = (transaction: any) => {
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
      <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production">Record Production Transaction</TabsTrigger>
          <TabsTrigger value="payment">Record Payment to Elma Industries</TabsTrigger>
        </TabsList>

        <TabsContent value="production">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Record Production Transaction</h3>
            <form onSubmit={handleProductionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production-sku">SKU *</Label>
                  <Select 
                    value={productionForm.sku} 
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
      </Tabs>

      {/* Transactions Table */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.transaction_type === 'production' ? 'default' : 'secondary'}>
                    {transaction.transaction_type === 'production' ? 'Production' : 'Payment'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.sku || '-'}
                </TableCell>
                <TableCell>
                  {transaction.quantity || '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {transaction.description}
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
                                    value={editForm.sku} 
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
                                  <Label htmlFor="edit-quantity">Quantity</Label>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FactoryPayables;