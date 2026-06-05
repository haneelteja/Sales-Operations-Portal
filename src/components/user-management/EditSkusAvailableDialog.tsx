import React, { useState, useEffect, useMemo } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SkuRow {
  id: string | null;
  sku: string;
  bottles_per_case: number;
  description?: string;
  display_order: number;
  isNew?: boolean;
}

interface EditSkusAvailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type SortField = 'sku' | 'description' | 'bottles_per_case' | null;

async function fetchSkuConfigurations(): Promise<SkuRow[]> {
  const { data, error } = await supabase
    .from('sku_configurations')
    .select('id, sku, bottles_per_case, description, display_order')
    .order('display_order', { ascending: true })
    .order('sku', { ascending: true });

  if (error) throw new Error(handleSupabaseError(error));
  return (data || []).map((row, idx) => ({
    id: row.id,
    sku: row.sku ?? '',
    bottles_per_case: Number(row.bottles_per_case) || 0,
    description: row.description ?? '',
    display_order: row.display_order ?? idx,
  }));
}

export const EditSkusAvailableDialog: React.FC<EditSkusAvailableDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const log = useAuditLog();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<SkuRow[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data: initialRows, isLoading, isFetching } = useQuery({
    queryKey: ['sku-configurations'],
    queryFn: fetchSkuConfigurations,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setRows([]);
      setHasLocalChanges(false);
      return;
    }
    if (initialRows && !isFetching) {
      setRows(initialRows);
      setHasLocalChanges(false);
      setSearchQuery('');
      setSortField(null);
    }
  }, [open, initialRows, isFetching]);

  const isFiltering = searchQuery.trim() !== '' || sortField !== null;

  const displayRows = useMemo(() => {
    const withIndex = rows.map((row, originalIndex) => ({ row, originalIndex }));

    const filtered = searchQuery.trim()
      ? withIndex.filter(({ row }) => {
          const q = searchQuery.toLowerCase();
          return (
            row.sku.toLowerCase().includes(q) ||
            (row.description ?? '').toLowerCase().includes(q)
          );
        })
      : withIndex;

    if (!sortField) return filtered;

    return [...filtered].sort(({ row: a }, { row: b }) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortField === 'bottles_per_case') {
        aVal = a.bottles_per_case;
        bVal = b.bottles_per_case;
      } else {
        aVal = a[sortField] ?? '';
        bVal = b[sortField] ?? '';
      }
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, searchQuery, sortField, sortDir]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: null,
        sku: '',
        bottles_per_case: 0,
        description: '',
        display_order: prev.length,
        isNew: true,
      },
    ]);
    setHasLocalChanges(true);
  };

  const removeRow = (originalIndex: number) => {
    setRows((prev) => prev.filter((_, i) => i !== originalIndex));
    setHasLocalChanges(true);
  };

  const updateRow = (
    originalIndex: number,
    field: 'sku' | 'bottles_per_case' | 'description',
    value: string | number
  ) => {
    setRows((prev) => {
      const next = [...prev];
      if (field === 'bottles_per_case') {
        next[originalIndex] = { ...next[originalIndex], bottles_per_case: Number(value) || 0 };
      } else if (field === 'description') {
        next[originalIndex] = { ...next[originalIndex], description: String(value) };
      } else {
        next[originalIndex] = { ...next[originalIndex], sku: String(value) };
      }
      return next;
    });
    setHasLocalChanges(true);
  };

  const moveRow = (originalIndex: number, direction: 'up' | 'down') => {
    setRows((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? originalIndex - 1 : originalIndex + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[originalIndex], next[targetIndex]] = [next[targetIndex], next[originalIndex]];
      return next;
    });
    setHasLocalChanges(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField(null); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortField(null);
    setSortDir('asc');
  };

  const saveMutation = useMutation({
    mutationFn: async (rowsToSave: SkuRow[]) => {
      const toInsert: { sku: string; bottles_per_case: number; description: string | null; display_order: number }[] = [];
      const toUpdate: { id: string; sku: string; bottles_per_case: number; description: string | null; display_order: number }[] = [];
      const keptIds = new Set(rowsToSave.filter((r) => r.id && !r.isNew).map((r) => r.id as string));
      const toDelete = (initialRows ?? []).filter((r) => r.id && !keptIds.has(r.id)).map((r) => r.id as string);

      rowsToSave.forEach((row, idx) => {
        const sku = row.sku.trim();
        const bottles = Math.max(0, Math.floor(Number(row.bottles_per_case) || 0));
        const description = row.description?.trim() || null;
        const display_order = idx;
        if (!sku) return;

        if (row.id && !row.isNew) {
          toUpdate.push({ id: row.id, sku, bottles_per_case: bottles, description, display_order });
        } else {
          toInsert.push({ sku, bottles_per_case: bottles, description, display_order });
        }
      });

      const errors: string[] = [];

      for (const id of toDelete) {
        const { error } = await supabase.from('sku_configurations').delete().eq('id', id);
        if (error) errors.push(`Delete: ${error.message}`);
      }

      for (const row of toUpdate) {
        const { error } = await supabase
          .from('sku_configurations')
          .update({
            sku: row.sku,
            bottles_per_case: row.bottles_per_case,
            description: row.description,
            display_order: row.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (error) errors.push(`${row.sku}: ${error.message}`);
      }

      if (toInsert.length) {
        const { error } = await supabase.from('sku_configurations').upsert(
          toInsert,
          { onConflict: 'sku' }
        );
        if (error) errors.push(error.message);
      }

      if (errors.length) throw new Error(errors.join('; '));
    },
    onSuccess: () => {
      log({ action: 'UPDATE', entityType: 'sku_configuration', description: 'SKU configurations saved' });
      queryClient.invalidateQueries({ queryKey: ['sku-configurations'] });
      toast({ title: 'Success', description: 'SKU configurations saved.' });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save SKU configurations',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    const invalid = rows.some((r) => !r.sku.trim() || (Number(r.bottles_per_case) || 0) < 0);
    if (invalid) {
      toast({
        title: 'Validation',
        description: 'SKU is required and bottles per case must be a non-negative number.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(rows);
  };

  const SortBtn = ({ field }: { field: SortField }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-5 w-5 p-0 ml-1"
      onClick={() => handleSort(field)}
    >
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col" aria-describedby="skus-plant-desc">
        <DialogHeader>
          <DialogTitle>SKU&apos;s available in the plant</DialogTitle>
          <DialogDescription id="skus-plant-desc">
            Add, edit, or remove SKUs. Use the ↑ ↓ buttons to reorder (visible when not searching/sorting).
          </DialogDescription>
        </DialogHeader>

        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isFiltering && (
                <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>

            {isFiltering && (
              <p className="text-xs text-muted-foreground -mt-1">
                Row reordering is disabled while search or sort is active.
              </p>
            )}

            <div className="overflow-auto flex-1 min-h-0 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isFiltering && <TableHead className="w-[72px]">Order</TableHead>}
                    <TableHead className="w-[18%]">
                      SKU <SortBtn field="sku" />
                    </TableHead>
                    <TableHead>
                      Invoice Description <SortBtn field="description" />
                    </TableHead>
                    <TableHead className="w-[14%]">
                      Bottles/case <SortBtn field="bottles_per_case" />
                    </TableHead>
                    <TableHead className="w-[8%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isFiltering ? 4 : 5} className="text-center text-muted-foreground py-8">
                        {rows.length === 0 ? 'No SKUs yet. Click "Add row" to start.' : 'No results match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayRows.map(({ row, originalIndex }) => (
                      <TableRow key={row.id ?? `new-${originalIndex}`}>
                        {!isFiltering && (
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                disabled={originalIndex === 0}
                                onClick={() => moveRow(originalIndex, 'up')}
                                aria-label="Move up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                disabled={originalIndex === rows.length - 1}
                                onClick={() => moveRow(originalIndex, 'down')}
                                aria-label="Move down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <Input
                            value={row.sku}
                            onChange={(e) => updateRow(originalIndex, 'sku', e.target.value)}
                            placeholder="e.g. P 500 ml"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.description ?? ''}
                            onChange={(e) => updateRow(originalIndex, 'description', e.target.value)}
                            placeholder="e.g. Premium Drinking Water 500 ml"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={row.bottles_per_case || ''}
                            onChange={(e) => updateRow(originalIndex, 'bottles_per_case', e.target.value)}
                            placeholder="0"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeRow(originalIndex)}
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="mt-2 self-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add row
            </Button>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasLocalChanges || saveMutation.isPending || isLoading}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
