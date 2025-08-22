import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const SalesEntry = () => {
  const [saleForm, setSaleForm] = useState({
    customer_id: "",
    amount: "",
    quantity: "",
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

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("*").order("client_name");
      return data || [];
    },
  });

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

      // Create corresponding factory production entry for Elma
      const { error: factoryError } = await supabase
        .from("factory_payables")
        .insert({
          transaction_type: "production",
          amount: parseFloat(data.amount),
          quantity: data.quantity ? parseInt(data.quantity) : null,
          description: `Production for ${data.description}`,
          transaction_date: data.transaction_date
        });

      if (factoryError) throw factoryError;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Sale recorded successfully!" });
      setSaleForm({
        customer_id: "",
        amount: "",
        quantity: "",
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
    if (!saleForm.customer_id || !saleForm.amount) {
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
    <Tabs defaultValue="sale" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sale">Record Sale</TabsTrigger>
        <TabsTrigger value="payment">Record Payment</TabsTrigger>
      </TabsList>

      <TabsContent value="sale" className="space-y-6">
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-customer">Customer *</Label>
              <Select 
                value={saleForm.customer_id} 
                onValueChange={(value) => setSaleForm({...saleForm, customer_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.client_name} - {customer.branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sale-amount">Amount (₹) *</Label>
              <Input
                id="sale-amount"
                type="number"
                step="0.01"
                value={saleForm.amount}
                onChange={(e) => setSaleForm({...saleForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sale-quantity">Quantity</Label>
              <Input
                id="sale-quantity"
                type="number"
                value={saleForm.quantity}
                onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                placeholder="Number of units"
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
      </TabsContent>

      <TabsContent value="payment" className="space-y-6">
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
                  {customers?.map((customer) => (
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
      </TabsContent>
    </Tabs>
  );
};

export default SalesEntry;