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
import { useToast } from "@/hooks/use-toast";

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

      {/* Production Form */}
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

      {/* Payment Form */}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FactoryPayables;