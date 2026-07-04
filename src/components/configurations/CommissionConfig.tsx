import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, PencilLine } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Commission {
  id: string;
  customer_id: string;
  referrer_name: string;
  sku: string;
  amount_per_case: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
  customers: {
    client_name: string;
    branch: string;
  } | null;
}

interface Customer {
  id: string;
  client_name: string;
  branch: string;
  sku: string | null;
}

const EMPTY_FORM = {
  customer_id: "",
  referrer_name: "",
  sku: "",
  amount_per_case: "",
  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",
  notes: "",
};

const CommissionConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["client-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_commissions")
        .select("*, customers(client_name, branch)")
        .order("is_active", { ascending: false })
        .order("effective_from", { ascending: false });
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as Commission[];
    },
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers-for-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as Customer[];
    },
  });

  const { data: skuConfigs = [] } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_configurations")
        .select("sku")
        .order("sku", { ascending: true });
      if (error) throw new Error(handleSupabaseError(error));
      const seen = new Set<string>();
      return (data || []).filter((r) => {
        const key = (r.sku as string).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((r) => r.sku as string);
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.customer_id || !form.referrer_name.trim() || !form.sku || !form.amount_per_case || !form.effective_from) {
        throw new Error("Client, referrer name, SKU, amount, and effective from are required.");
      }
      const { error } = await supabase.from("client_commissions").insert({
        customer_id: form.customer_id,
        referrer_name: form.referrer_name.trim(),
        sku: form.sku,
        amount_per_case: parseFloat(form.amount_per_case),
        effective_from: form.effective_from,
        effective_to: form.effective_to || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw new Error(handleSupabaseError(error));
    },
    onSuccess: () => {
      toast({ title: "Commission added" });
      setIsAddOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["client-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["prof-commissions"] });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!form.referrer_name.trim() || !form.sku || !form.amount_per_case || !form.effective_from) {
        throw new Error("Referrer name, SKU, amount, and effective from are required.");
      }
      const { error } = await supabase
        .from("client_commissions")
        .update({
          referrer_name: form.referrer_name.trim(),
          sku: form.sku,
          amount_per_case: parseFloat(form.amount_per_case),
          effective_from: form.effective_from,
          effective_to: form.effective_to || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", id);
      if (error) throw new Error(handleSupabaseError(error));
    },
    onSuccess: () => {
      toast({ title: "Commission updated" });
      setIsAddOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["client-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["prof-commissions"] });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("client_commissions").update({ is_active }).eq("id", id);
      if (error) throw new Error(handleSupabaseError(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["prof-commissions"] });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_commissions").delete().eq("id", id);
      if (error) throw new Error(handleSupabaseError(error));
    },
    onSuccess: () => {
      toast({ title: "Commission deleted" });
      queryClient.invalidateQueries({ queryKey: ["client-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["prof-commissions"] });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsAddOpen(true);
  };

  const openEdit = (c: Commission) => {
    setEditingId(c.id);
    setForm({
      customer_id: c.customer_id,
      referrer_name: c.referrer_name,
      sku: c.sku,
      amount_per_case: c.amount_per_case.toString(),
      effective_from: c.effective_from,
      effective_to: c.effective_to ?? "",
      notes: c.notes ?? "",
    });
    setIsAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      addMutation.mutate();
    }
  };

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Commission configuration</h2>
          <p className="text-sm text-muted-foreground">
            Referral commissions per client and SKU — applied as expenses in Profitability.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add commission
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active commissions</CardTitle>
          <CardDescription>
            Commission amounts are deducted per case in the Profitability report. Invoices and outstanding balances are not affected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No commissions configured yet.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead className="text-right">₹/case</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{c.customers?.client_name ?? "—"}</TableCell>
                      <TableCell>{c.customers?.branch ?? "—"}</TableCell>
                      <TableCell>{c.sku}</TableCell>
                      <TableCell>{c.referrer_name}</TableCell>
                      <TableCell className="text-right">₹{c.amount_per_case.toFixed(2)}</TableCell>
                      <TableCell>{new Date(c.effective_from).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>{c.effective_to ? new Date(c.effective_to).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={(v) => toggleActiveMutation.mutate({ id: c.id, is_active: v })}
                          />
                          <Badge variant={c.is_active ? "default" : "secondary"}>
                            {c.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{c.notes ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete commission?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the ₹{c.amount_per_case}/case commission for{" "}
                                  {c.customers?.client_name} — {c.sku}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(c.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(v) => { setIsAddOpen(v); if (!v) { setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg" aria-describedby="commission-dialog-desc">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit commission" : "Add commission"}</DialogTitle>
            <DialogDescription id="commission-dialog-desc">
              Set the referral commission amount per case for a client and SKU.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comm-customer">Client *</Label>
              <Select
                value={form.customer_id}
                onValueChange={(v) => {
                  const cust = customers.find((c) => c.id === v);
                  setForm((f) => ({ ...f, customer_id: v, sku: cust?.sku ?? f.sku }));
                }}
                disabled={!!editingId}
              >
                <SelectTrigger id="comm-customer">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_name}{c.branch ? ` — ${c.branch}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comm-referrer">Referrer name *</Label>
              <Input
                id="comm-referrer"
                value={form.referrer_name}
                onChange={(e) => setForm((f) => ({ ...f, referrer_name: e.target.value }))}
                placeholder="e.g. Suresh Kumar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comm-sku">SKU *</Label>
                <Select value={form.sku} onValueChange={(v) => setForm((f) => ({ ...f, sku: v }))}>
                  <SelectTrigger id="comm-sku">
                    <SelectValue placeholder="Select SKU…" />
                  </SelectTrigger>
                  <SelectContent>
                    {skuConfigs.map((sku) => (
                      <SelectItem key={sku} value={sku}>{sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer?.sku && form.sku !== selectedCustomer.sku && (
                  <p className="text-xs text-muted-foreground">Client's default SKU: {selectedCustomer.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comm-amount">Amount per case (₹) *</Label>
                <Input
                  id="comm-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount_per_case}
                  onChange={(e) => setForm((f) => ({ ...f, amount_per_case: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comm-from">Effective from *</Label>
                <Input
                  id="comm-from"
                  type="date"
                  value={form.effective_from}
                  onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comm-to">Effective to (optional)</Label>
                <Input
                  id="comm-to"
                  type="date"
                  value={form.effective_to}
                  onChange={(e) => setForm((f) => ({ ...f, effective_to: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comm-notes">Notes (optional)</Label>
              <Input
                id="comm-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional context…"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setEditingId(null); setForm(EMPTY_FORM); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                {editingId
                  ? (updateMutation.isPending ? "Saving…" : "Save changes")
                  : (addMutation.isPending ? "Adding…" : "Add commission")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionConfig;
