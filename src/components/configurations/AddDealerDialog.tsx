/**
 * Add client (customer rows) - Configurations
 * Supports new or existing client/branch; pricing changes always INSERT new rows (history preserved).
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import type { Customer } from "@/types";
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
import { Switch } from "@/components/ui/switch";
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
  price_per_case: number;
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

async function fetchDistinctClientNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("dealer_name")
    .eq("is_active", true);
  if (error) throw new Error(handleSupabaseError(error));
  const set = new Set<string>();
  (data || []).forEach((r) => {
    const n = r.dealer_name?.trim();
    if (n) set.add(n);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

async function fetchBranchesForClient(dealerName: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("area")
    .eq("dealer_name", dealerName)
    .eq("is_active", true);
  if (error) throw new Error(handleSupabaseError(error));
  const set = new Set<string>();
  (data || []).forEach((r) => {
    const a = r.area?.trim();
    if (a) set.add(a);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

async function fetchRowsForPair(dealerName: string, area: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("dealer_name", dealerName)
    .eq("area", area)
    .eq("is_active", true)
    .order("pricing_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(handleSupabaseError(error));
  return (data || []) as Customer[];
}

/** Latest row per SKU by pricing_date (then created_at) */
function latestRowPerSku(rows: Customer[]): Map<string, Customer> {
  const map = new Map<string, Customer>();
  rows.forEach((r) => {
    if (!r.sku?.trim()) return;
    const sku = r.sku.trim();
    const cur = map.get(sku);
    if (!cur) {
      map.set(sku, r);
      return;
    }
    const dNew = new Date(r.pricing_date || r.created_at || 0).getTime();
    const dOld = new Date(cur.pricing_date || cur.created_at || 0).getTime();
    if (dNew >= dOld) map.set(sku, r);
  });
  return map;
}

async function fetchSampleContactForClient(
  dealerName: string
): Promise<{ gst_number: string | null; whatsapp_number: string | null } | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("gst_number, whatsapp_number")
    .eq("dealer_name", dealerName)
    .eq("is_active", true)
    .order("pricing_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(handleSupabaseError(error));
  if (!data) return null;
  return { gst_number: data.gst_number, whatsapp_number: data.whatsapp_number };
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
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [selectedExistingClient, setSelectedExistingClient] = useState("");
  const [dealerNameInput, setDealerNameInput] = useState("");
  const [isExistingBranch, setIsExistingBranch] = useState(false);
  const [selectedExistingBranch, setSelectedExistingBranch] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [skuRows, setSkuRows] = useState<SkuPricingRow[]>([getInitialRow()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** After loading an existing client+branch, baseline prices per SKU - inserts only when price changes or SKU is new */
  const initialPricesBySkuRef = useRef<Record<string, number>>({});

  const { data: skuOptions = [], isLoading: skusLoading } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: fetchSkuConfigurations,
    enabled: open,
  });

  const { data: distinctClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["add-client-distinct-names"],
    queryFn: fetchDistinctClientNames,
    enabled: open,
  });

  const { data: branchesForClient = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["add-client-branches", selectedExistingClient],
    queryFn: () => fetchBranchesForClient(selectedExistingClient),
    enabled: open && isExistingClient && !!selectedExistingClient.trim(),
  });

  const pairKey =
    isExistingClient && isExistingBranch && selectedExistingClient && selectedExistingBranch
      ? `${selectedExistingClient}|||${selectedExistingBranch}`
      : null;

  const { data: rowsForPair = [], isFetching: pairRowsLoading } = useQuery({
    queryKey: ["add-client-pair-rows", pairKey],
    queryFn: () => fetchRowsForPair(selectedExistingClient, selectedExistingBranch),
    enabled: open && !!pairKey,
  });

  const { data: sampleContact } = useQuery({
    queryKey: ["add-client-contact", selectedExistingClient],
    queryFn: () => fetchSampleContactForClient(selectedExistingClient),
    enabled: open && isExistingClient && !!selectedExistingClient.trim(),
  });

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

  const resetForm = useCallback(() => {
    setDate(new Date().toISOString().split("T")[0]);
    setIsExistingClient(false);
    setSelectedExistingClient("");
    setDealerNameInput("");
    setIsExistingBranch(false);
    setSelectedExistingBranch("");
    setBranchInput("");
    setGstNumber("");
    setWhatsappNumber("");
    setSkuRows(updateRowPricePerCase([getInitialRow()]));
    setFieldErrors({});
    initialPricesBySkuRef.current = {};
  }, [updateRowPricePerCase]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  // Prefill GST / WhatsApp when picking an existing client (from the latest active row for that client)
  useEffect(() => {
    if (!open || !isExistingClient || !selectedExistingClient.trim()) return;
    if (!sampleContact) return;
    setGstNumber(sampleContact.gst_number || "");
    setWhatsappNumber(sampleContact.whatsapp_number || "");
  }, [open, isExistingClient, selectedExistingClient, sampleContact]);

  // When both client and branch are existing, load latest SKU rows (display only - saves insert new rows)
  useEffect(() => {
    if (!open || !pairKey || pairRowsLoading) return;
    if (!rowsForPair.length) {
      initialPricesBySkuRef.current = {};
      setSkuRows(updateRowPricePerCase([getInitialRow()]));
      return;
    }
    const latest = latestRowPerSku(rowsForPair);
    const prices: Record<string, number> = {};
    const rows: SkuPricingRow[] = [];
    latest.forEach((cust) => {
      if (!cust.sku) return;
      const sku = cust.sku.trim();
      const ppb = cust.price_per_bottle ?? 0;
      prices[sku] = ppb;
      const opt = skuOptions.find((o) => o.sku === sku);
      rows.push({
        sku,
        price_per_bottle: String(ppb),
        bottles_per_case: opt?.bottles_per_case ?? 0,
        price_per_case: cust.price_per_case ?? 0,
      });
    });
    initialPricesBySkuRef.current = prices;
    if (rows.length === 0) {
      setSkuRows(updateRowPricePerCase([getInitialRow()]));
    } else {
      setSkuRows(updateRowPricePerCase(rows));
    }
    const one = rowsForPair[0];
    if (one?.gst_number) setGstNumber(one.gst_number);
    if (one?.whatsapp_number) setWhatsappNumber(one.whatsapp_number);
  }, [open, pairKey, rowsForPair, pairRowsLoading, skuOptions, updateRowPricePerCase]);

  const resolvedDealerName = isExistingClient ? selectedExistingClient.trim() : dealerNameInput.trim();
  const resolvedArea =
    isExistingClient && isExistingBranch
      ? selectedExistingBranch.trim()
      : branchInput.trim();

  const isPairHistoryMode = isExistingClient && isExistingBranch && !!pairKey && rowsForPair.length > 0;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!date?.trim()) errors.date = "Date is required";

    if (isExistingClient) {
      if (!selectedExistingClient.trim()) errors.dealer_name = "Select a client";
    } else {
      if (!dealerNameInput?.trim()) errors.dealer_name = "Client name is required";
    }

    if (isExistingClient && isExistingBranch) {
      if (!selectedExistingBranch.trim()) errors.area = "Select a branch";
    } else {
      if (!branchInput?.trim()) errors.area = "Branch is required";
    }

    const gstResult = gstinSchema.safeParse(gstNumber?.trim().toUpperCase());
    if (!gstResult.success) errors.gst_number = gstResult.error.errors[0]?.message ?? "Invalid GST Number";
    const waResult = indiaWhatsAppSchema.safeParse(whatsappNumber?.trim());
    if (!waResult.success) errors.whatsapp_number = waResult.error.errors[0]?.message ?? "Invalid WhatsApp Number";

    const filledRows = skuRows.filter(
      (r) => r.sku && r.price_per_bottle !== "" && parseFloat(r.price_per_bottle) >= 0
    );
    if (filledRows.length === 0) errors.sku_rows = "Add at least one SKU with a price";
    skuRows.forEach((row, i) => {
      if (!row.sku && (row.price_per_bottle !== "" || row.price_per_case > 0))
        errors[`sku_${i}`] = "Select SKU";
      if (row.sku && (row.price_per_bottle === "" || parseFloat(row.price_per_bottle) < 0))
        errors[`price_${i}`] = "Enter a valid price per bottle";
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const priceChangedOrNew = (sku: string, pricePerBottleStr: string): boolean => {
    const skuKey = sku.trim();
    const prev = initialPricesBySkuRef.current[skuKey];
    if (prev === undefined) return true;
    const cur = parseFloat(pricePerBottleStr);
    if (Number.isNaN(cur)) return false;
    return Math.abs(cur - prev) > 1e-4;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const gst = gstNumber.trim().toUpperCase();
      let wa = whatsappNumber.trim().replace(/\s/g, "");
      if (wa && !wa.startsWith("+")) wa = `+91${wa}`;

      const rowsToConsider = skuRows.filter(
        (r) =>
          r.sku.trim() &&
          r.price_per_bottle !== "" &&
          !Number.isNaN(parseFloat(r.price_per_bottle)) &&
          parseFloat(r.price_per_bottle) >= 0 &&
          r.bottles_per_case > 0
      );

      let rowsToInsert = rowsToConsider;
      if (isPairHistoryMode) {
        rowsToInsert = rowsToConsider.filter((r) => priceChangedOrNew(r.sku, r.price_per_bottle));
        if (rowsToInsert.length === 0) {
          throw new Error(
            "No price changes to save. Edit a price or add a SKU, or turn off existing branch to add a new branch."
          );
        }
      }

      if (rowsToInsert.length === 0) throw new Error("Add at least one SKU pricing row with valid values.");

      const inserts = rowsToInsert.map((row) => ({
        dealer_name: resolvedDealerName,
        area: resolvedArea,
        pricing_date: date,
        gst_number: gst || null,
        whatsapp_number: wa || null,
        sku: row.sku.trim(),
        price_per_bottle: parseFloat(row.price_per_bottle),
        bottles_per_case: row.bottles_per_case,
      }));
      const { error } = await supabase.from("customers").insert(inserts);
      if (error) throw new Error(handleSupabaseError(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["add-client-distinct-names"] });
      queryClient.invalidateQueries({ queryKey: ["add-client-branches"] });
      queryClient.invalidateQueries({ queryKey: ["add-client-pair-rows"] });
      toast({
        title: "Success",
        description: isPairHistoryMode
          ? "New pricing rows added. Previous rows were kept."
          : "Client pricing saved.",
      });
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
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>
            Choose new or existing client and branch. Saving always adds new rows; existing client + branch with
            unchanged prices does nothing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3 bg-muted/40">
            <div className="flex items-center gap-2">
              <Switch
                id="existing-client"
                checked={isExistingClient}
                onCheckedChange={(v) => {
                  setIsExistingClient(v);
                  setSelectedExistingClient("");
                  setDealerNameInput("");
                  setIsExistingBranch(false);
                  setSelectedExistingBranch("");
                  setBranchInput("");
                  initialPricesBySkuRef.current = {};
                  setSkuRows(updateRowPricePerCase([getInitialRow()]));
                }}
              />
              <Label htmlFor="existing-client" className="cursor-pointer">
                Existing client
              </Label>
            </div>
            {isExistingClient && (
              <div className="flex items-center gap-2">
                <Switch
                  id="existing-branch"
                  checked={isExistingBranch}
                  onCheckedChange={(v) => {
                    setIsExistingBranch(v);
                    setSelectedExistingBranch("");
                    setBranchInput("");
                    initialPricesBySkuRef.current = {};
                    if (!v) setSkuRows(updateRowPricePerCase([getInitialRow()]));
                  }}
                />
                <Label htmlFor="existing-branch" className="cursor-pointer">
                  Existing branch
                </Label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dealer-date">Pricing date *</Label>
              <Input
                id="dealer-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {fieldErrors.date && <p className="text-sm text-destructive">{fieldErrors.date}</p>}
            </div>

            {isExistingClient ? (
              <div className="space-y-2 sm:col-span-1">
                <Label>Client *</Label>
                <Select
                  value={selectedExistingClient || "__none__"}
                  onValueChange={(v) => {
                    setSelectedExistingClient(v === "__none__" ? "" : v);
                    setIsExistingBranch(false);
                    setSelectedExistingBranch("");
                    setBranchInput("");
                    initialPricesBySkuRef.current = {};
                    setSkuRows(updateRowPricePerCase([getInitialRow()]));
                  }}
                  disabled={clientsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={clientsLoading ? "Loading..." : "Select client"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select client</SelectItem>
                    {distinctClients.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.dealer_name && <p className="text-sm text-destructive">{fieldErrors.dealer_name}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dealer-name">Client name *</Label>
                <Input
                  id="dealer-name"
                  value={dealerNameInput}
                  onChange={(e) => setDealerNameInput(e.target.value)}
                  placeholder="Client name"
                />
                {fieldErrors.dealer_name && <p className="text-sm text-destructive">{fieldErrors.dealer_name}</p>}
              </div>
            )}

            {isExistingClient && isExistingBranch ? (
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select
                  value={selectedExistingBranch || "__none__"}
                  onValueChange={(v) => setSelectedExistingBranch(v === "__none__" ? "" : v)}
                  disabled={!selectedExistingClient || branchesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={branchesLoading ? "Loading..." : "Select branch"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select branch</SelectItem>
                    {branchesForClient.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.area && <p className="text-sm text-destructive">{fieldErrors.area}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dealer-area">Branch *</Label>
                <Input
                  id="dealer-area"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  placeholder="Branch"
                />
                {fieldErrors.area && <p className="text-sm text-destructive">{fieldErrors.area}</p>}
              </div>
            )}

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
              {fieldErrors.whatsapp_number && (
                <p className="text-sm text-destructive">{fieldErrors.whatsapp_number}</p>
              )}
            </div>
          </div>

          {isPairHistoryMode && (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
              Loaded latest prices per SKU for this client and branch. Change a price or add a SKU to create new rows
              for <strong>{date}</strong> - existing rows are not updated.
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>SKU pricing *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={pairRowsLoading}>
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
                    <TableHead className="w-[30%]">Price per Bottle (INR)</TableHead>
                    <TableHead className="w-[30%]">Price per Case (INR)</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skuRows.map((row, index) => {
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
                            <p className="text-xs text-destructive mt-1">
                              {fieldErrors[`sku_${index}`] || fieldErrors[`price_${index}`]}
                            </p>
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
            <Button type="submit" disabled={saveMutation.isPending || pairRowsLoading}>
              {(saveMutation.isPending || pairRowsLoading) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
