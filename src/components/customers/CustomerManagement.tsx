import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const CustomerManagement = () => {
  const [form, setForm] = useState({
    client_name: "",
    branch: "",
    sku: "",
    price_per_case: "",
    price_per_bottle: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const mutation = useMutation({
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
      setForm({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name) {
      toast({ 
        title: "Error", 
        description: "Client name is required",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Customer</CardTitle>
          <CardDescription>
            Add Aamodha Enterprises customer master data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Client Name *</Label>
                <Input
                  id="client-name"
                  value={form.client_name}
                  onChange={(e) => setForm({...form, client_name: e.target.value})}
                  placeholder="Customer company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={form.branch}
                  onChange={(e) => setForm({...form, branch: e.target.value})}
                  placeholder="Branch or location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({...form, sku: e.target.value})}
                  placeholder="Product SKU"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-per-case">Price per Case (₹)</Label>
                <Input
                  id="price-per-case"
                  type="number"
                  step="0.01"
                  value={form.price_per_case}
                  onChange={(e) => setForm({...form, price_per_case: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-per-bottle">Price per Bottle (₹)</Label>
                <Input
                  id="price-per-bottle"
                  type="number"
                  step="0.01"
                  value={form.price_per_bottle}
                  onChange={(e) => setForm({...form, price_per_bottle: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Customer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            All registered customers of Aamodha Enterprises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price/Case</TableHead>
                <TableHead className="text-right">Price/Bottle</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.client_name}</TableCell>
                  <TableCell>{customer.branch}</TableCell>
                  <TableCell>{customer.sku}</TableCell>
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
    </div>
  );
};

export default CustomerManagement;