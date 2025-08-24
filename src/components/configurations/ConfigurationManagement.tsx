import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const ConfigurationManagement = () => {
  const [skuForm, setSkuForm] = useState({
    sku: "",
    bottles_per_case: "",
    cost_per_bottle: ""
  });

  const [pricingForm, setPricingForm] = useState({
    pricing_date: new Date().toISOString().split('T')[0],
    sku: "",
    price_per_bottle: "",
    tax: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // SKU Configurations queries and mutations
  const { data: skuConfigs } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sku_configurations")
        .select("*")
        .order("sku");
      return data || [];
    },
  });

  const skuMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("sku_configurations")
        .insert({
          ...data,
          bottles_per_case: parseInt(data.bottles_per_case),
          cost_per_bottle: parseFloat(data.cost_per_bottle)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "SKU configuration added successfully!" });
      setSkuForm({
        sku: "",
        bottles_per_case: "",
        cost_per_bottle: ""
      });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add SKU: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Factory Pricing queries and mutations
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

  const pricingMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("factory_pricing")
        .insert({
          ...data,
          price_per_bottle: parseFloat(data.price_per_bottle),
          tax: data.tax ? parseFloat(data.tax) : null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Factory pricing added successfully!" });
      setPricingForm({
        pricing_date: new Date().toISOString().split('T')[0],
        sku: "",
        price_per_bottle: "",
        tax: ""
      });
      queryClient.invalidateQueries({ queryKey: ["factory-pricing"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add pricing: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuForm.sku || !skuForm.bottles_per_case || !skuForm.cost_per_bottle) {
      toast({ 
        title: "Error", 
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }
    skuMutation.mutate(skuForm);
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingForm.sku || !pricingForm.price_per_bottle) {
      toast({ 
        title: "Error", 
        description: "SKU and Price per Bottle are required",
        variant: "destructive"
      });
      return;
    }
    pricingMutation.mutate(pricingForm);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sku-config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sku-config">SKU Configurations</TabsTrigger>
          <TabsTrigger value="factory-pricing">Factory Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="sku-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add SKU Configuration</CardTitle>
              <CardDescription>
                Configure available SKUs and their bottle/case specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSkuSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={skuForm.sku}
                      onChange={(e) => setSkuForm({...skuForm, sku: e.target.value})}
                      placeholder="e.g., SKU001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bottles-per-case">No of Bottles per Case *</Label>
                    <Input
                      id="bottles-per-case"
                      type="number"
                      value={skuForm.bottles_per_case}
                      onChange={(e) => setSkuForm({...skuForm, bottles_per_case: e.target.value})}
                      placeholder="12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost-per-bottle">Cost per Bottle (₹) *</Label>
                    <Input
                      id="cost-per-bottle"
                      type="number"
                      step="0.01"
                      value={skuForm.cost_per_bottle}
                      onChange={(e) => setSkuForm({...skuForm, cost_per_bottle: e.target.value})}
                      placeholder="10.50"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={skuMutation.isPending}>
                  {skuMutation.isPending ? "Adding..." : "Add SKU Configuration"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SKU Configurations List</CardTitle>
              <CardDescription>
                All configured SKUs with pricing details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Bottles per Case</TableHead>
                    <TableHead className="text-right">Cost per Bottle</TableHead>
                    <TableHead className="text-right">Cost per Case</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skuConfigs?.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.sku}</TableCell>
                      <TableCell>{config.bottles_per_case}</TableCell>
                      <TableCell className="text-right">₹{config.cost_per_bottle}</TableCell>
                      <TableCell className="text-right">₹{config.cost_per_case}</TableCell>
                      <TableCell>{new Date(config.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factory-pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Factory Pricing</CardTitle>
              <CardDescription>
                Enter price information from the factory side for calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePricingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      placeholder="Select from available SKUs"
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
                    <TableHead className="text-right">Price per Bottle</TableHead>
                    <TableHead className="text-right">Tax (%)</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factoryPricing?.map((pricing) => (
                    <TableRow key={pricing.id}>
                      <TableCell>{new Date(pricing.pricing_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{pricing.sku}</TableCell>
                      <TableCell className="text-right">₹{pricing.price_per_bottle}</TableCell>
                      <TableCell className="text-right">{pricing.tax ? `${pricing.tax}%` : '-'}</TableCell>
                      <TableCell>{new Date(pricing.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigurationManagement;