import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ConfigurationManagement = () => {
  const [customerForm, setCustomerForm] = useState({
    client_name: "",
    branch: "",
    sku: "",
    price_per_case: "",
    price_per_bottle: ""
  });

  const [pricingForm, setPricingForm] = useState({
    pricing_date: new Date().toISOString().split('T')[0],
    sku: "",
    bottles_per_case: "",
    price_per_bottle: "",
    tax: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const canManageFactory = (profile?.role === 'manager' || profile?.role === 'admin');

  // Customer Management queries and mutations
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .order("client_name");
      return data || [];
    },
  });

  // Get available SKUs from factory pricing with bottles per case info
  const { data: factoryPricingData } = useQuery({
    queryKey: ["factory-pricing-data"],
    enabled: canManageFactory,
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("sku, bottles_per_case")
        .order("sku");
      return data || [];
    },
  });

  // Get available SKUs from factory pricing
  const { data: availableSKUs } = useQuery({
    queryKey: ["available-skus"],
    enabled: canManageFactory,
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("sku")
        .order("sku");
      
      // Get unique SKUs
      const uniqueSKUs = [...new Set(data?.map(item => item.sku) || [])];
      return uniqueSKUs;
    },
  });

  const customerMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("customers")
        .insert({
          ...data,
          price_per_case: data.price_per_case ? parseFloat(data.price_per_case) : null,
          price_per_bottle: data.price_per_bottle ? parseFloat(data.price_per_bottle) : null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer added successfully!" });
      setCustomerForm({
        client_name: "",
        branch: "",
        sku: "",
        price_per_case: "",
        price_per_bottle: ""
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Factory Pricing queries and mutations
  const { data: factoryPricing } = useQuery({
    queryKey: ["factory-pricing"],
    enabled: canManageFactory,
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("*")
        .order("pricing_date", { ascending: false });
      return data || [];
    },
  });

  const pricingMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("factory_pricing")
        .insert({
          pricing_date: data.pricing_date,
          sku: data.sku,
          bottles_per_case: parseInt(data.bottles_per_case),
          price_per_bottle: parseFloat(data.price_per_bottle),
          tax: data.tax ? parseFloat(data.tax) : null
          // cost_per_case is a generated column, so we don't insert it
        });

      if (error) throw error;
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

  // Calculate price per case based on selected SKU and price per bottle
  const calculatePricePerCase = () => {
    if (!customerForm.sku || !customerForm.price_per_bottle) return "";
    
    const selectedSKUData = factoryPricingData?.find(item => item.sku === customerForm.sku);
    if (!selectedSKUData) return "";
    
    const pricePerBottle = parseFloat(customerForm.price_per_bottle) || 0;
    const bottlesPerCase = selectedSKUData.bottles_per_case || 0;
    
    return (pricePerBottle * bottlesPerCase).toFixed(2);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.client_name || !customerForm.branch) {
      toast({ 
        title: "Error", 
        description: "Client Name and Branch are required",
        variant: "destructive"
      });
      return;
    }
    
    // Auto-calculate price per case before submitting
    const calculatedPricePerCase = calculatePricePerCase();
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
  const calculateCostPerCase = () => {
    const bottles = parseFloat(pricingForm.bottles_per_case) || 0;
    const pricePerBottle = parseFloat(pricingForm.price_per_bottle) || 0;
    return bottles * pricePerBottle;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className={`grid w-full ${canManageFactory ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          {canManageFactory && (
            <TabsTrigger value="factory-pricing">Factory Pricing</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Customer</CardTitle>
              <CardDescription>
                Add new customers with their pricing details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={customerForm.client_name}
                      onChange={(e) => setCustomerForm({...customerForm, client_name: e.target.value})}
                      placeholder="e.g., ABC Company"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch *</Label>
                    <Input
                      id="branch"
                      value={customerForm.branch}
                      onChange={(e) => setCustomerForm({...customerForm, branch: e.target.value})}
                      placeholder="e.g., Mumbai"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer-sku">SKU</Label>
                    <Select 
                      value={customerForm.sku} 
                      onValueChange={(value) => setCustomerForm({...customerForm, sku: value, price_per_case: ""})}
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
                    <Label htmlFor="customer-price-per-bottle">Price per Bottle (₹)</Label>
                    <Input
                      id="customer-price-per-bottle"
                      type="number"
                      step="0.01"
                      value={customerForm.price_per_bottle}
                      onChange={(e) => setCustomerForm({...customerForm, price_per_bottle: e.target.value})}
                      placeholder="12.50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price-per-case">Price per Case (₹)</Label>
                    <Input
                      id="price-per-case"
                      type="number"
                      step="0.01"
                      value={calculatePricePerCase() || customerForm.price_per_case}
                      disabled
                      className="bg-muted"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={customerMutation.isPending}>
                  {customerMutation.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customers List</CardTitle>
              <CardDescription>
                All registered customers with their pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price per Case</TableHead>
                    <TableHead className="text-right">Price per Bottle</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.client_name}</TableCell>
                      <TableCell>{customer.branch}</TableCell>
                      <TableCell>{customer.sku || '-'}</TableCell>
                      <TableCell className="text-right">
                        {customer.price_per_case ? `₹${customer.price_per_case}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.price_per_bottle ? `₹${customer.price_per_bottle}` : '-'}
                      </TableCell>
                      <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageFactory && (<TabsContent value="factory-pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Factory Pricing</CardTitle>
              <CardDescription>
                Enter price information from the factory side for calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePricingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing-date">Date *</Label>
                    <Input
                      id="pricing-date"
                      type="date"
                      value={pricingForm.pricing_date}
                      onChange={(e) => setPricingForm({...pricingForm, pricing_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pricing-sku">SKU *</Label>
                    <Input
                      id="pricing-sku"
                      value={pricingForm.sku}
                      onChange={(e) => setPricingForm({...pricingForm, sku: e.target.value})}
                      placeholder="e.g., SKU001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bottles-per-case-pricing">No of Bottles per Case *</Label>
                    <Input
                      id="bottles-per-case-pricing"
                      type="number"
                      value={pricingForm.bottles_per_case}
                      onChange={(e) => setPricingForm({...pricingForm, bottles_per_case: e.target.value})}
                      placeholder="12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price-per-bottle">Price per Bottle (₹) *</Label>
                    <Input
                      id="price-per-bottle"
                      type="number"
                      step="0.01"
                      value={pricingForm.price_per_bottle}
                      onChange={(e) => setPricingForm({...pricingForm, price_per_bottle: e.target.value})}
                      placeholder="12.50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost-per-case">Cost per Case (₹)</Label>
                    <Input
                      id="cost-per-case"
                      type="number"
                      step="0.01"
                      value={calculateCostPerCase().toFixed(2)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax">TAX (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={pricingForm.tax}
                      onChange={(e) => setPricingForm({...pricingForm, tax: e.target.value})}
                      placeholder="18.00"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={pricingMutation.isPending}>
                  {pricingMutation.isPending ? "Adding..." : "Add Factory Pricing"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Factory Pricing History</CardTitle>
              <CardDescription>
                Historical pricing data from the factory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Bottles per Case</TableHead>
                    <TableHead className="text-right">Price per Bottle</TableHead>
                    <TableHead className="text-right">Cost per Case</TableHead>
                    <TableHead className="text-right">Tax (%)</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factoryPricing?.map((pricing) => (
                    <TableRow key={pricing.id}>
                     <TableCell>{new Date(pricing.pricing_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{pricing.sku}</TableCell>
                      <TableCell className="text-right">{pricing.bottles_per_case || '-'}</TableCell>
                      <TableCell className="text-right">₹{pricing.price_per_bottle}</TableCell>
                      <TableCell className="text-right">{pricing.cost_per_case ? `₹${pricing.cost_per_case}` : '-'}</TableCell>
                      <TableCell className="text-right">{pricing.tax ? `${pricing.tax}%` : '-'}</TableCell>
                      <TableCell>{new Date(pricing.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>)}
      </Tabs>
    </div>
  );
};

export default ConfigurationManagement;