import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const LabelVendorManagement = () => {
  const [form, setForm] = useState({
    vendor_name: "",
    label_type: "",
    price_per_label: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors } = useQuery({
    queryKey: ["label-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_vendors")
        .select("*")
        .order("vendor_name");
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("label_vendors")
        .insert({
          ...data,
          price_per_label: data.price_per_label ? parseFloat(data.price_per_label) : null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label vendor added successfully!" });
      setForm({
        vendor_name: "",
        label_type: "",
        price_per_label: ""
      });
      queryClient.invalidateQueries({ queryKey: ["label-vendors"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add vendor: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor_name) {
      toast({ 
        title: "Error", 
        description: "Vendor name is required",
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
          <CardTitle>Add New Label Vendor</CardTitle>
          <CardDescription>
            Add label vendor master data with pricing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-name">Vendor Name *</Label>
                <Input
                  id="vendor-name"
                  value={form.vendor_name}
                  onChange={(e) => setForm({...form, vendor_name: e.target.value})}
                  placeholder="Label vendor company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label-type">Label Type</Label>
                <Input
                  id="label-type"
                  value={form.label_type}
                  onChange={(e) => setForm({...form, label_type: e.target.value})}
                  placeholder="e.g., Adhesive, Sleeve, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-per-label">Price per Label (₹)</Label>
                <Input
                  id="price-per-label"
                  type="number"
                  step="0.0001"
                  value={form.price_per_label}
                  onChange={(e) => setForm({...form, price_per_label: e.target.value})}
                  placeholder="0.0000"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Vendor"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Label Vendors List</CardTitle>
          <CardDescription>
            All registered label vendors with pricing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Label Type</TableHead>
                <TableHead className="text-right">Price per Label</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors?.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                  <TableCell>{vendor.label_type}</TableCell>
                  <TableCell className="text-right">
                    {vendor.price_per_label ? `₹${vendor.price_per_label}` : '-'}
                  </TableCell>
                  <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LabelVendorManagement;