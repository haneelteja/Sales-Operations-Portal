import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const SalesEntry = () => {
  const [saleForm, setSaleForm] = useState({
    customer_id: "",
    amount: "",
    quantity: "",
    sku: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [paymentForm, setPaymentForm] = useState({
    customer_id: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to handle customer selection and auto-populate SKU options
  const handleCustomerChange = (customerId: string) => {
    // Find the selected customer record
    const selectedCustomer = customers?.find(c => c.id === customerId);
    
    setSaleForm({
      ...saleForm, 
      customer_id: customerId,
      sku: "", // Reset SKU when customer changes
      amount: "" // Reset amount when customer changes
    });
  };

  // Get available SKUs for selected customer
  const getAvailableSKUs = () => {
    if (!saleForm.customer_id) return [];
    
    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    if (!selectedCustomer) return [];
    
    // Get all customer records with the same client_name and branch
    return customers?.filter(c => 
      c.client_name === selectedCustomer.client_name && 
      c.branch === selectedCustomer.branch
    ) || [];
  };

  // Function to handle SKU selection
  const handleSKUChange = (sku: string) => {
    setSaleForm({
      ...saleForm,
      sku,
      amount: "" // Reset amount when SKU changes
    });
  };

  // Function to handle quantity change and auto-calculate amount
  const handleQuantityChange = (quantity: string) => {
    if (!saleForm.customer_id || !saleForm.sku) {
      setSaleForm({
        ...saleForm,
        quantity,
        amount: ""
      });
      return;
    }

    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);
    if (!selectedCustomer) return;

    // Find the specific customer-SKU combination for pricing
    const customerSKURecord = customers?.find(c => 
      c.client_name === selectedCustomer.client_name && 
      c.branch === selectedCustomer.branch &&
      c.sku === saleForm.sku
    );

    let calculatedAmount = "";
    if (customerSKURecord && quantity) {
      const qty = parseInt(quantity);
      if (qty && customerSKURecord.price_per_case) {
        calculatedAmount = (qty * customerSKURecord.price_per_case).toString();
      }
    }
    
    setSaleForm({
      ...saleForm,
      quantity,
      amount: calculatedAmount
    });
  };

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("*").order("client_name");
      return data || [];
    },
  });

  // Get unique customers (no duplicates based on client_name and branch)
  const getUniqueCustomers = () => {
    if (!customers) return [];
    
    const uniqueCustomers = customers.reduce((acc, customer) => {
      const key = `${customer.client_name}-${customer.branch}`;
      if (!acc.some(c => `${c.client_name}-${c.branch}` === key)) {
        acc.push(customer);
      }
      return acc;
    }, [] as typeof customers);
    
    return uniqueCustomers;
  };

  // Fetch recent transactions for display
  const { data: recentTransactions } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select(`
          *,
          customers (client_name, branch)
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Calculate financial metrics for each transaction
  const calculateFinancials = async (transaction: any) => {
    // Get customer pricing for outstanding calculation
    const customerPricing = customers?.find(c => c.id === transaction.customer_id);
    
    // Get factory pricing for payables calculation
    const { data: factoryPricing } = await supabase
      .from("factory_pricing")
      .select("price_per_bottle")
      .eq("sku", transaction.sku)
      .order("pricing_date", { ascending: false })
      .limit(1);
    
    // Get transport expenses for this customer
    const { data: transport } = await supabase
      .from("transport_expenses")
      .select("amount")
      .eq("client_id", transaction.customer_id);
    
    const factoryPrice = factoryPricing?.[0]?.price_per_bottle || 0;
    const customerPrice = customerPricing?.price_per_bottle || 0;
    const quantity = transaction.quantity || 0;
    
    const customerOutstanding = quantity * customerPrice;
    const factoryPayable = quantity * factoryPrice;
    const transportTotal = transport?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    return {
      customerOutstanding,
      factoryPayable,
      transportTotal
    };
  };

  // Sale entry mutation
  const saleMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create sale transaction for Aamodha
      const { error: saleError } = await supabase
        .from("sales_transactions")
        .insert({
          ...data,
          transaction_type: "sale",
          amount: parseFloat(data.amount)
        });

      if (saleError) throw saleError;

      // Get factory pricing for amount calculation
      const { data: factoryPricing } = await supabase
        .from("factory_pricing")
        .select("cost_per_case")
        .eq("sku", data.sku)
        .order("pricing_date", { ascending: false })
        .limit(1);

      const factoryCostPerCase = factoryPricing?.[0]?.cost_per_case || 0;
      const quantity = data.quantity ? parseInt(data.quantity) : 0;
      const factoryAmount = quantity * factoryCostPerCase;

      // Create corresponding factory production entry for Elma
      const { error: factoryError } = await supabase
        .from("factory_payables")
        .insert({
          transaction_type: "production",
          sku: data.sku,
          amount: factoryAmount,
          quantity: quantity,
          description: `Production for ${data.description}`,
          transaction_date: data.transaction_date
        });

      if (factoryError) throw factoryError;

      // Create corresponding transport transaction
      const { error: transportError } = await supabase
        .from("transport_expenses")
        .insert({
          client_id: data.customer_id,
          amount: 0, // Start with 0, can be edited later
          description: `Transport for sale: ${data.description}`,
          expense_date: data.transaction_date,
          expense_group: "Client Sale Transport"
        });

      if (transportError) throw transportError;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Sale recorded successfully!" });
      setSaleForm({
        customer_id: "",
        amount: "",
        quantity: "",
        sku: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record sale: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Payment entry mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("sales_transactions")
        .insert({
          ...data,
          transaction_type: "payment",
          amount: parseFloat(data.amount)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment recorded successfully!" });
      setPaymentForm({
        customer_id: "",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record payment: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.customer_id || !saleForm.amount || !saleForm.sku) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    saleMutation.mutate(saleForm);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customer_id || !paymentForm.amount) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    paymentMutation.mutate(paymentForm);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sale" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sale">Record Sale</TabsTrigger>
          <TabsTrigger value="payment">Record Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Sale</CardTitle>
              <CardDescription>Record a new sale transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale-customer">Customer *</Label>
                    <Select 
                      value={saleForm.customer_id} 
                      onValueChange={handleCustomerChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueCustomers().map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.client_name} - {customer.branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sale-sku">SKU *</Label>
                    <Select 
                      value={saleForm.sku} 
                      onValueChange={handleSKUChange}
                      disabled={!saleForm.customer_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={saleForm.customer_id ? "Select SKU" : "Select customer first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableSKUs().map((customer) => (
                          <SelectItem key={`${customer.id}-${customer.sku}`} value={customer.sku || ""}>
                            {customer.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sale-quantity">Quantity (Cases)</Label>
                    <Input
                      id="sale-quantity"
                      type="number"
                      value={saleForm.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      placeholder="Number of cases"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sale-amount">Amount (₹) *</Label>
                    <Input
                      id="sale-amount"
                      type="number"
                      step="0.01"
                      value={saleForm.amount}
                      onChange={(e) => setSaleForm({...saleForm, amount: e.target.value})}
                      placeholder="Auto-calculated (cases × price per case)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sale-date">Date</Label>
                    <Input
                      id="sale-date"
                      type="date"
                      value={saleForm.transaction_date}
                      onChange={(e) => setSaleForm({...saleForm, transaction_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sale-description">Description</Label>
                  <Textarea
                    id="sale-description"
                    value={saleForm.description}
                    onChange={(e) => setSaleForm({...saleForm, description: e.target.value})}
                    placeholder="Sale details..."
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={saleMutation.isPending}
                  className="w-full"
                >
                  {saleMutation.isPending ? "Recording..." : "Record Sale"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
              <CardDescription>Record a payment received from customer</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-customer">Customer *</Label>
                    <Select 
                      value={paymentForm.customer_id} 
                      onValueChange={(value) => setPaymentForm({...paymentForm, customer_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueCustomers().map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.client_name} - {customer.branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Amount (₹) *</Label>
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
                    <Label htmlFor="payment-date">Date</Label>
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
                  className="w-full"
                >
                  {paymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest sales and payment entries with financial calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Customer Outstanding</TableHead>
                <TableHead className="text-right">Factory Payable</TableHead>
                <TableHead className="text-right">Transport</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions?.map((transaction) => {
                const customer = customers?.find(c => c.id === transaction.customer_id);
                const factoryPrice = 0; // This would need to be calculated from factory_pricing
                const customerPrice = customer?.price_per_bottle || 0;
                const quantity = transaction.quantity || 0;
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {transaction.customers?.client_name} - {transaction.customers?.branch}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.transaction_type === 'sale' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.sku || '-'}</TableCell>
                    <TableCell className="text-right">{transaction.quantity || '-'}</TableCell>
                    <TableCell className="text-right">₹{transaction.amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      ₹{(quantity * customerPrice).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">₹{(quantity * factoryPrice).toLocaleString()}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="truncate max-w-[150px]">
                      {transaction.description || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesEntry;