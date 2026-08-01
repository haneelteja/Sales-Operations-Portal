import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";

const LABEL_SKUS = ["P 500 ml", "P 1000 ml", "P 750 ml", "P 250 ml", "AL 750 ml", "AL 500 ml", "250 EC"];

type LabelPrice = {
  id: string;
  sku: string;
  effective_from: string;
  price_per_label: number;
  gst_rate: number;
  notes: string | null;
};

const EMPTY_FORM = { sku: LABEL_SKUS[0], effective_from: "", price_per_label: "", gst_rate: "18", notes: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLabelPricesDialog({ open, onOpenChange }: Props) {
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prices = [], isLoading } = useQuery({
    queryKey: ["label-price-history"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("label_price_history")
        .select("id, sku, effective_from, price_per_label, gst_rate, notes")
        .order("sku", { ascending: true })
        .order("effective_from", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LabelPrice[];
    },
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["label-price-history"] });
    queryClient.invalidateQueries({ queryKey: ["prof-label-prices"] });
  };

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<LabelPrice, "id" | "notes"> & { notes: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("label_price_history").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setAddForm(EMPTY_FORM);
      toast({ title: "Label price added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: LabelPrice) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("label_price_history").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast({ title: "Label price updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("label_price_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Label price deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleAdd = () => {
    const price = parseFloat(addForm.price_per_label);
    const gst = parseFloat(addForm.gst_rate);
    if (isNaN(price) || price <= 0 || isNaN(gst) || !addForm.effective_from) return;
    addMutation.mutate({ sku: addForm.sku, effective_from: addForm.effective_from, price_per_label: price, gst_rate: gst, notes: addForm.notes });
  };

  const handleUpdate = (id: string) => {
    const price = parseFloat(editForm.price_per_label);
    const gst = parseFloat(editForm.gst_rate);
    if (isNaN(price) || price <= 0 || isNaN(gst)) return;
    updateMutation.mutate({ id, sku: editForm.sku, effective_from: editForm.effective_from, price_per_label: price, gst_rate: gst, notes: editForm.notes });
  };

  const startEdit = (lp: LabelPrice) => {
    setEditingId(lp.id);
    setEditForm({ sku: lp.sku, effective_from: lp.effective_from, price_per_label: String(lp.price_per_label), gst_rate: String(lp.gst_rate), notes: lp.notes ?? "" });
  };

  const totalIncGst = (price: string, gst: string) => {
    const p = parseFloat(price);
    const g = parseFloat(gst);
    return !isNaN(p) && !isNaN(g) ? `₹${(p * (1 + g / 100)).toFixed(4)}` : "—";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Label Prices</DialogTitle>
          <DialogDescription>
            Per-SKU label price history (ex-GST). Label cost = cases × bottles/case × price/label, using the most recent entry on or before the period end date.
          </DialogDescription>
        </DialogHeader>

        {/* Add form */}
        <div className="flex flex-wrap gap-2 items-end border rounded-md p-3 bg-muted/30">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">SKU</label>
            <select
              value={addForm.sku}
              onChange={(e) => setAddForm((p) => ({ ...p, sku: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {LABEL_SKUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Effective From</label>
            <Input type="date" value={addForm.effective_from} onChange={(e) => setAddForm((p) => ({ ...p, effective_from: e.target.value }))} className="h-8 w-36 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">₹ / label</label>
            <Input type="number" step="0.0001" placeholder="0.9440" value={addForm.price_per_label} onChange={(e) => setAddForm((p) => ({ ...p, price_per_label: e.target.value }))} className="h-8 w-24 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">GST %</label>
            <Input type="number" step="0.01" placeholder="18" value={addForm.gst_rate} onChange={(e) => setAddForm((p) => ({ ...p, gst_rate: e.target.value }))} className="h-8 w-16 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Total / label (incl. GST)</label>
            <Input readOnly value={totalIncGst(addForm.price_per_label, addForm.gst_rate)} className="h-8 w-32 text-sm bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-1 flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground">Notes (optional)</label>
            <Input placeholder="e.g. Morya labels batch" value={addForm.notes} onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))} className="h-8 text-sm" />
          </div>
          <Button size="sm" className="h-8" disabled={!addForm.price_per_label || !addForm.effective_from || addMutation.isPending} onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : prices.length === 0 ? (
          <p className="text-xs text-muted-foreground">No label prices configured. Add a price to enable label cost calculations.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">SKU</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Effective From</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">₹/label</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">GST %</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Total/label</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Notes</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {prices.map((lp) => {
                  const isEdit = editingId === lp.id;
                  const totalPerLabel = lp.price_per_label * (1 + lp.gst_rate / 100);
                  return (
                    <tr key={lp.id} className="border-t">
                      {isEdit ? (
                        <>
                          <td className="px-2 py-1.5">
                            <select value={editForm.sku} onChange={(e) => setEditForm((p) => ({ ...p, sku: e.target.value }))}
                              className="h-7 rounded border border-input bg-background px-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-ring">
                              {LABEL_SKUS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5"><Input type="date" value={editForm.effective_from} onChange={(e) => setEditForm((p) => ({ ...p, effective_from: e.target.value }))} className="h-7 text-xs w-32" /></td>
                          <td className="px-2 py-1.5"><Input type="number" step="0.0001" value={editForm.price_per_label} onChange={(e) => setEditForm((p) => ({ ...p, price_per_label: e.target.value }))} className="h-7 text-xs w-20 ml-auto text-right" /></td>
                          <td className="px-2 py-1.5"><Input type="number" step="0.01" value={editForm.gst_rate} onChange={(e) => setEditForm((p) => ({ ...p, gst_rate: e.target.value }))} className="h-7 text-xs w-14 ml-auto text-right" /></td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground text-xs">{totalIncGst(editForm.price_per_label, editForm.gst_rate)}</td>
                          <td className="px-2 py-1.5"><Input value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} className="h-7 text-xs" /></td>
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600 hover:text-green-700" disabled={updateMutation.isPending} onClick={() => handleUpdate(lp.id)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => setEditingId(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-medium">{lp.sku}</td>
                          <td className="px-3 py-2 text-muted-foreground">{lp.effective_from}</td>
                          <td className="px-3 py-2 text-right font-mono">₹{lp.price_per_label.toFixed(4)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{lp.gst_rate}%</td>
                          <td className="px-3 py-2 text-right font-mono">₹{totalPerLabel.toFixed(4)}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{lp.notes || "—"}</td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600" onClick={() => startEdit(lp)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(lp.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
