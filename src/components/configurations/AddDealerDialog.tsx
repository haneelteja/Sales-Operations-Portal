/**
 * Add Dealer Dialog – Configurations
 * Form: Date, Dealer Name, Area, GST Number, WhatsApp Number, and repeatable SKU pricing rows.
 * Price per case is auto-calculated from SKU bottles per case × price per bottle.
 * SKU list comes from Application Configurations (sku_configurations).
 */

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { gstinSchema, indiaWhatsAppSchema } from "@/lib/validation/schemas";

export interface SkuOption {
  sku: string;
  bottles_per_case: number;
}

export interface SkuPricingRow {
  sku: string;
  price_per_bottle: string;
  bottles_per_case: number;
  price_per_case: number; // read-only, computed
}

interface AddDealerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

async function fetchSkuConfigurations(): Promise<SkuOption[]> {
  const { data, error } = await supabase
    .from("sku_configurations")
    .select("sku, bottles_per_case")
    .order("sku", { ascending: true });
  if (error) throw new Error(handleSupabaseError(error));
  return (data || []).map((r) => ({
    sku: r.sku ?? "",
    bottles_per_case: Number(r.bottles_per_case) || 0,
  }));
}

const getInitialRow = (): SkuPricingRow => ({
  sku: "",
  price_per_bottle: "",
  bottles_per_case: 0,
  price_per_case: 0,
});

export const AddDealerDialog: React.FC<AddDealerDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dealerName, setDealerName] = useState("");
  const [area, setArea] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [skuRows, setSkuRows] = useState<SkuPricingRow[]>([getInitialRow()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: skuOptions = [], isLoading: skusLoading } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: fetchSkuConfigurations,
    enabled: open,
  });

  // Recompute price_per_case when SKU or price_per_bottle changes (bottles_per_case from selected SKU)
  const updateRowPricePerCase = useCallback(
    (rows: SkuPricingRow[]) => {
      return rows.map((row) => {
        const bottles = row.bottles_per_case || 0;
        const priceBottle = parseFloat(row.price_per_bottle);
        const valid = !isNaN(priceBottle) && priceBottle >= 0 && bottles > 0;
        return {
          ...row,
          price_per_case: valid ? Math.round(priceBottle * bottles * 100) / 100 : 0,
        };
      });
    },
    []
  );

  const setRowsWithRecalc = useCallback(
    (updater: (prev: SkuPricingRow[]) => SkuPricingRow[]) => {
      setSkuRows((prev) => updateRowPricePerCase(updater(prev)));
    },
    [updateRowPricePerCase]
  );

  const setRow = (index: number, updates: Partial<SkuPricingRow>) => {
    setRowsWithRecalc((prev) => {
      const next = [...prev];
      const row = { ...next[index], ...updates };
      if (updates.sku !== undefined) {
        const opt = skuOptions.find((o) => o.sku === updates.sku);
        if (opt) row.bottles_per_case = opt.bottles_per_case;
      }
      next[index] = row;
      return next;
    });
  };

  const addRow = () => setRowsWithRecalc((prev) => [...prev, getInitialRow()]);
  const removeRow = (index: number) =>
    setRowsWithRecalc((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split("T")[0]);
      setDealerName("");
      setArea("");
      setGstNumber("");
      setWhatsappNumber("");
      setSkuRows(updateRowPricePerCase([getInitialRow()]));
      setFieldErrors({});
    }
  }, [open, updateRowPricePerCase]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!date?.trim()) errors.date = "Date is required";
    if (!dealerName?.trim()) errors.dealer_name = "Dealer Name is required";
    if (!area?.trim()) errors.area = "Area is required";
    const gstResult = gstinSchema.safeParse(gstNumber?.trim().toUpperCase());
    if (!gstResult.success) errors.gst_number = gstResult.error.errors[0]?.message ?? "Invalid GST Number";
    const waResult = indiaWhatsAppSchema.safeParse(whatsappNumber?.trim());
    if (!waResult.success) errors.whatsapp_number = waResult.error.errors[0]?.message ?? "Invalid WhatsApp Number";
    const filledRows = skuRows.filter((r) => r.sku && (r.price_per_bottle !== "" || parseFloat(r.price_per_bottle) >= 0));
    if (filledRows.length === 0) errors.sku_rows = "Add at least one SKU with Price per Bottle";
    skuRows.forEach((row, i) => {
      if (!row.sku && (row.price_per_bottle !== "" || row.price_per_case > 0)) errors[`sku_${i}`] = "Select SKU";
      if (row.sku && (!row.price_per_bottle || parseFloat(row.price_per_bottle) < 0)) errors[`price_${i}`] = "Enter a valid price per bottle";
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rowsToInsert = skuRows.filter(
        (r) => r.sku.trim() && r.price_per_bottle !== "" && parseFloat(r.price_per_bottle) >= 0 && r.bottles_per_case > 0
      );
      if (rowsToInsert.length === 0) throw new Error("Add at least one SKU pricing row with valid values.");
      const gst = gstNumber.trim().toUpperCase();
      let wa = whatsappNumber.trim().replace(/\s/g, "");
      if (wa && !wa.startsWith("+")) wa = `+91${wa}`;
      const inserts = rowsToInsert.map((row) => ({
        dealer_name: dealerName.trim(),
        area: area.trim(),
        pricing_date: date,
        gst_number: gst || null,
        whatsapp_number: wa || null,
        sku: row.sku.trim(),
        price_per_bottle: parseFloat(row.price_per_bottle),
        price_per_case: row.price_per_case,
      }));
      const { error } = await supabase.from("customers").insert(inserts);
      if (error) throw new Error(handleSupabaseError(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Success", description: "Dealer added successfully." });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Validation error", description: "Please fix the errors below.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Dealer</DialogTitle>
          <DialogDescription>
            Enter dealer details and SKU pricing. Price per case is calculated from bottles per case.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dealer-date">Date *</Label>
              <Input
                id="dealer-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {fieldErrors.date && <p className="text-sm text-destructive">{fieldErrors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-name">Dealer Name *</Label>
              <Input
                id="dealer-name"
                value={dealerName}
                onChange={(e) => setDealerName(e.target.value)}
                placeholder="Dealer Name"
              />
              {fieldErrors.dealer_name && <p className="text-sm text-destructive">{fieldErrors.dealer_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-area">Area *</Label>
              <Input
                id="dealer-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area"
              />
              {fieldErrors.area && <p className="text-sm text-destructive">{fieldErrors.area}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-gst">GST Number *</Label>
              <Input
                id="dealer-gst"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 22AAAAA0000A1Z5"
                maxLength={15}
              />
              {fieldErrors.gst_number && <p className="text-sm text-destructive">{fieldErrors.gst_number}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dealer-whatsapp">WhatsApp Number *</Label>
              <Input
                id="dealer-whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+919876543210 or 9876543210"
              />
              {fieldErrors.whatsapp_number && <p className="text-sm text-destructive">{fieldErrors.whatsapp_number}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>SKU Pricing *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-2" />
                Add row
              </Button>
            </div>
            {fieldErrors.sku_rows && <p className="text-sm text-destructive">{fieldErrors.sku_rows}</p>}
            <div className="border rounded-md overflow-auto max-h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">SKU</TableHead>
                    <TableHead className="w-[30%]">Price per Bottle (₹)</TableHead>
                    <TableHead className="w-[30%]">Price per Case (₹)</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skuRows.map((row, index) => {
                    // SKUs already selected in other rows cannot be selected again (one SKU per dealer)
                    const selectedSkusInOtherRows = new Set(
                      skuRows.map((r, i) => (i !== index && r.sku ? r.sku : null)).filter(Boolean) as string[]
                    );
                    const availableOptions = skuOptions.filter(
                      (opt) => opt.sku === row.sku || !selectedSkusInOtherRows.has(opt.sku)
                    );
                    return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={row.sku || "__none__"}
                          onValueChange={(v) => setRow(index, { sku: v === "__none__" ? "" : v })}
                          disabled={skusLoading}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={skusLoading ? "Loading..." : "Select SKU"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Select SKU</SelectItem>
                            {availableOptions.map((opt) => (
                              <SelectItem key={opt.sku} value={opt.sku}>
                                {opt.sku} ({opt.bottles_per_case} bottles/case)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(fieldErrors[`sku_${index}`] || fieldErrors[`price_${index}`]) && (
                          <p className="text-xs text-destructive mt-1">{fieldErrors[`sku_${index}`] || fieldErrors[`price_${index}`]}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.price_per_bottle}
                          onChange={(e) => setRow(index, { price_per_bottle: e.target.value })}
                          placeholder="0.00"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          readOnly
                          value={row.price_per_case > 0 ? row.price_per_case.toFixed(2) : ""}
                          className="h-9 bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeRow(index)}
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Dealer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
