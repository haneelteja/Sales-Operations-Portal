/**
 * Production - Record and view production by SKU.
 * Inventory is computed from production records (sum of cases per SKU).
 * SKUs come from sku_configurations (Application Configuration → SKU's available in the plant).
 */

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Package, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ColumnFilter } from "@/components/ui/column-filter";
import { exportJsonToExcel } from "@/services/export/excelExport";

interface ProductionRecord {
  id: string;
  production_date: string;
  sku: string;
  no_of_cases: number;
  created_at?: string;
}

interface InventoryBySku {
  sku: string;
  total_cases: number;
}

const Production = () => {
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [columnFilters, setColumnFilters] = useState({ date: "", sku: "", cases: "" });
  const [columnSorts, setColumnSorts] = useState<Record<string, "asc" | "desc" | null>>({
    date: null,
    sku: null,
    cases: null,
  });
  const [form, setForm] = useState({
    production_date: new Date().toISOString().split("T")[0],
    sku: "",
    no_of_cases: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  // Fetch SKUs from sku_configurations
  const { data: availableSKUs = [], isLoading: skusLoading } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_configurations")
        .select("sku")
        .order("sku", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => r.sku).filter(Boolean);
    },
  });

  // Fetch production records
  const { data: productionRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["production-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production")
        .select("id, production_date, sku, no_of_cases, created_at")
        .order("production_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProductionRecord[];
    },
  });

  // Compute inventory: sum of no_of_cases per SKU
  const inventoryBySku: InventoryBySku[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of productionRecords) {
      const cur = map.get(r.sku) ?? 0;
      map.set(r.sku, cur + r.no_of_cases);
    }
    return Array.from(map.entries())
      .map(([sku, total_cases]) => ({ sku, total_cases }))
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }, [productionRecords]);

  const insertMutation = useMutation({
    mutationFn: async (payload: { production_date: string; sku: string; no_of_cases: number }) => {
      const { error } = await supabase.from("production").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-records"] });
      toast({ title: "Success", description: "Production recorded successfully." });
      setRecordDialogOpen(false);
      setForm({
        production_date: new Date().toISOString().split("T")[0],
        sku: "",
        no_of_cases: "",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message || "Failed to record production.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("production").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-records"] });
      toast({ title: "Success", description: "Production record deleted." });
      setDeleteId(null);
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message || "Failed to delete record.",
        variant: "destructive",
      });
    },
  });

  const handleRecord = () => {
    const date = form.production_date;
    const sku = form.sku.trim();
    const noStr = form.no_of_cases.trim();

    if (!date || !sku) {
      toast({
        title: "Validation Error",
        description: "Please select a date and SKU.",
        variant: "destructive",
      });
      return;
    }

    if (date > today) {
      toast({
        title: "Validation Error",
        description: "Production date cannot be after today.",
        variant: "destructive",
      });
      return;
    }

    const no = parseInt(noStr, 10);
    if (isNaN(no) || no < 1 || !Number.isInteger(no)) {
      toast({
        title: "Validation Error",
        description: "Number of cases must be a positive integer.",
        variant: "destructive",
      });
      return;
    }

    insertMutation.mutate({
      production_date: date,
      sku,
      no_of_cases: no,
    });
  };

  const openRecordDialog = () => {
    setForm({
      production_date: new Date().toISOString().split("T")[0],
      sku: "",
      no_of_cases: "",
    });
    setRecordDialogOpen(true);
  };

  // Filter and sort production records
  const filteredAndSortedRecords = useMemo(() => {
    if (!productionRecords.length) return [];
    return productionRecords
      .filter((r) => {
        const searchLower = (debouncedSearchTerm || "").toLowerCase();
        if (searchLower) {
          const match =
            r.sku?.toLowerCase().includes(searchLower) ||
            r.no_of_cases?.toString().includes(searchLower) ||
            new Date(r.production_date).toLocaleDateString().includes(searchLower);
          if (!match) return false;
        }
        if (columnFilters.date && !r.production_date?.startsWith(columnFilters.date)) return false;
        if (columnFilters.sku && !r.sku?.toLowerCase().includes(columnFilters.sku.toLowerCase())) return false;
        if (columnFilters.cases && r.no_of_cases?.toString() !== columnFilters.cases) return false;
        return true;
      })
      .sort((a, b) => {
        const sortKey = Object.keys(columnSorts).find((k) => columnSorts[k] !== null);
        if (!sortKey) return 0;
        const dir = columnSorts[sortKey];
        if (!dir) return 0;
        let cmp = 0;
        if (sortKey === "date") {
          cmp = new Date(a.production_date).getTime() - new Date(b.production_date).getTime();
        } else if (sortKey === "sku") {
          cmp = (a.sku || "").localeCompare(b.sku || "");
        } else if (sortKey === "cases") {
          cmp = (a.no_of_cases || 0) - (b.no_of_cases || 0);
        }
        return dir === "asc" ? cmp : -cmp;
      });
  }, [productionRecords, debouncedSearchTerm, columnFilters, columnSorts]);

  const handleColumnFilterChange = useCallback((key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleColumnSortChange = useCallback((key: string, direction: "asc" | "desc" | null) => {
    setColumnSorts((prev) => {
      const next = { date: null, sku: null, cases: null };
      next[key as keyof typeof next] = direction;
      return next;
    });
  }, []);

  const getUniqueValues = useCallback(
    (key: "production_date" | "sku" | "no_of_cases") => {
      const values = productionRecords
        .map((r) => {
          if (key === "production_date") return r.production_date?.split("T")[0];
          if (key === "no_of_cases") return String(r.no_of_cases);
          return r.sku;
        })
        .filter(Boolean);
      return Array.from(new Set(values)).sort() as string[];
    },
    [productionRecords]
  );

  const exportToExcel = useCallback(async () => {
    const exportData = filteredAndSortedRecords.map((r) => ({
      Date: new Date(r.production_date).toLocaleDateString(),
      SKU: r.sku,
      "No of Cases": r.no_of_cases,
    }));
    await exportJsonToExcel(exportData, 'Production', `Production_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Export Successful", description: `Exported ${exportData.length} records` });
  }, [filteredAndSortedRecords, toast]);

  return (
    <div className="space-y-6">
      {/* Header with Record Production button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Production</h2>
        <Button onClick={openRecordDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Record Production
        </Button>
      </div>

      {/* Inventory by SKU */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            SKU Inventory
          </CardTitle>
          <CardDescription>Total cases per SKU from production records</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryBySku.length === 0 ? (
            <p className="text-sm text-muted-foreground">No production recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {inventoryBySku.map(({ sku, total_cases }) => (
                <div
                  key={sku}
                  className="rounded-lg border bg-muted/50 px-4 py-2 text-sm font-medium"
                >
                  {sku}: <span className="text-primary">{total_cases}</span> cases
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Production Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <CardTitle>Recent Production</CardTitle>
              <CardDescription>Latest production entries</CardDescription>
            </div>
            <div className="flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="Search by date, SKU, cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!filteredAndSortedRecords.length}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : productionRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No production records. Use "Record Production" to add one.
            </p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center justify-between gap-2">
                        <span>Date</span>
                        <ColumnFilter
                          columnKey="date"
                          columnName="Date"
                          filterValue={columnFilters.date}
                          onFilterChange={(v) => handleColumnFilterChange("date", v)}
                          onClearFilter={() => handleColumnFilterChange("date", "")}
                          sortDirection={columnSorts.date}
                          onSortChange={(d) => handleColumnSortChange("date", d)}
                          dataType="date"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center justify-between gap-2">
                        <span>SKU</span>
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={columnFilters.sku}
                          onFilterChange={(v) => handleColumnFilterChange("sku", v)}
                          onClearFilter={() => handleColumnFilterChange("sku", "")}
                          sortDirection={columnSorts.sku}
                          onSortChange={(d) => handleColumnSortChange("sku", d)}
                          dataType="text"
                          options={getUniqueValues("sku")}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center justify-between gap-2">
                        <span>No of Cases</span>
                        <ColumnFilter
                          columnKey="cases"
                          columnName="Cases"
                          filterValue={columnFilters.cases}
                          onFilterChange={(v) => handleColumnFilterChange("cases", v)}
                          onClearFilter={() => handleColumnFilterChange("cases", "")}
                          sortDirection={columnSorts.cases}
                          onSortChange={(d) => handleColumnSortChange("cases", d)}
                          dataType="number"
                          options={getUniqueValues("no_of_cases").map(String)}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.production_date).toLocaleDateString()}</TableCell>
                      <TableCell>{r.sku}</TableCell>
                      <TableCell>{r.no_of_cases}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Production Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Production</DialogTitle>
            <DialogDescription>
              Enter the production details. Date cannot be after today.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="production_date">Date</Label>
              <Input
                id="production_date"
                type="date"
                value={form.production_date}
                max={today}
                onChange={(e) => setForm((prev) => ({ ...prev, production_date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="production_sku">SKU</Label>
              <Select
                value={form.sku}
                onValueChange={(v) => setForm((prev) => ({ ...prev, sku: v }))}
                disabled={skusLoading}
              >
                <SelectTrigger id="production_sku">
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {availableSKUs.map((sku) => (
                    <SelectItem key={sku} value={sku}>
                      {sku}
                    </SelectItem>
                  ))}
                  {availableSKUs.length === 0 && !skusLoading && (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                      No SKUs available. Add SKUs in Application Configuration.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="no_of_cases">No of Cases</Label>
              <Input
                id="no_of_cases"
                type="number"
                min={1}
                step={1}
                placeholder="Positive integer"
                value={form.no_of_cases}
                onChange={(e) => setForm((prev) => ({ ...prev, no_of_cases: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecord}
              disabled={
                insertMutation.isPending ||
                !form.sku ||
                !form.production_date ||
                !form.no_of_cases.trim()
              }
            >
              {insertMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Production;
