/**
 * Edit SKUs Available in the Plant Dialog
 * Table with SKU and Bottles per case; users can add new rows and save to sku_configurations.
 */

import React, { useState, useEffect } from 'react';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SkuRow {
  id: string | null;
  sku: string;
  bottles_per_case: number;
  description?: string;
  isNew?: boolean;
}

interface EditSkusAvailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

async function fetchSkuConfigurations(): Promise<SkuRow[]> {
  const { data, error } = await supabase
    .from('sku_configurations')
    .select('id, sku, bottles_per_case, description')
    .order('sku', { ascending: true });

  if (error) throw new Error(handleSupabaseError(error));
  return (data || []).map((row) => ({
    id: row.id,
    sku: row.sku ?? '',
    bottles_per_case: Number(row.bottles_per_case) || 0,
    description: row.description ?? '',
  }));
}

export const EditSkusAvailableDialog: React.FC<EditSkusAvailableDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SkuRow[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: initialRows, isLoading: isLoadingRows } = useQuery({
    queryKey: ['sku-configurations'],
    queryFn: fetchSkuConfigurations,
    enabled: open,
  });

  useEffect(() => {
    if (open && initialRows) {
      setRows(initialRows.map((r) => ({ ...r })));
      setHasLocalChanges(false);
    }
  }, [open, initialRows]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: null, sku: '', bottles_per_case: 0, description: '', isNew: true },
    ]);
    setHasLocalChanges(true);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setHasLocalChanges(true);
  };

  const updateRow = (index: number, field: 'sku' | 'bottles_per_case' | 'description', value: string | number) => {
    setRows((prev) => {
      const next = [...prev];
      if (field === 'bottles_per_case') {
        next[index] = { ...next[index], bottles_per_case: Number(value) || 0 };
      } else if (field === 'description') {
        next[index] = { ...next[index], description: String(value) };
      } else {
        next[index] = { ...next[index], sku: String(value).trim() };
      }
      return next;
    });
    setHasLocalChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (rowsToSave: SkuRow[]) => {
      const toInsert: { sku: string; bottles_per_case: number; description: string | null }[] = [];
      const toUpdate: { id: string; sku: string; bottles_per_case: number; description: string | null }[] = [];
      const keptIds = new Set(rowsToSave.filter((r) => r.id && !r.isNew).map((r) => r.id as string));
      const toDelete = (initialRows ?? []).filter((r) => r.id && !keptIds.has(r.id)).map((r) => r.id as string);

      for (const row of rowsToSave) {
        const sku = row.sku.trim();
        const bottles = Math.max(0, Math.floor(Number(row.bottles_per_case) || 0));
        const description = row.description?.trim() || null;
        if (!sku) continue;

        if (row.id && !row.isNew) {
          toUpdate.push({ id: row.id, sku, bottles_per_case: bottles, description });
        } else {
          toInsert.push({ sku, bottles_per_case: bottles, description });
        }
      }

      const errors: string[] = [];

      for (const id of toDelete) {
        const { error } = await supabase.from('sku_configurations').delete().eq('id', id);
        if (error) errors.push(`Delete: ${error.message}`);
      }

      for (const row of toUpdate) {
        const { error } = await supabase
          .from('sku_configurations')
          .update({ sku: row.sku, bottles_per_case: row.bottles_per_case, description: row.description, updated_at: new Date().toISOString() })
          .eq('id', row.id);
        if (error) errors.push(`${row.sku}: ${error.message}`);
      }

      if (toInsert.length) {
        const { error } = await supabase.from('sku_configurations').upsert(
          toInsert.map((r) => ({ sku: r.sku, bottles_per_case: r.bottles_per_case, description: r.description })),
          { onConflict: 'sku' }
        );
        if (error) errors.push(error.message);
      }

      if (errors.length) throw new Error(errors.join('; '));
    },
    onSuccess: () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col" aria-describedby="skus-plant-desc">
        <DialogHeader>
          <DialogTitle>SKU&apos;s available in the plant</DialogTitle>
          <DialogDescription id="skus-plant-desc">Add, edit, or remove SKUs. Deleted rows will be removed when you save.</DialogDescription>
        </DialogHeader>

        {isLoadingRows ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1 min-h-0 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">SKU</TableHead>
                    <TableHead className="w-[45%]">Invoice Description</TableHead>
                    <TableHead className="w-[22%]">Bottles per case</TableHead>
                    <TableHead className="w-[8%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id ?? `new-${index}`}>
                      <TableCell>
                        <Input
                          value={row.sku}
                          onChange={(e) => updateRow(index, 'sku', e.target.value)}
                          placeholder="e.g. 500p"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.description ?? ''}
                          onChange={(e) => updateRow(index, 'description', e.target.value)}
                          placeholder="e.g. Premium Drinking Water 500 ml"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={row.bottles_per_case || ''}
                          onChange={(e) => updateRow(index, 'bottles_per_case', e.target.value)}
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
                          onClick={() => removeRow(index)}
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
            disabled={!hasLocalChanges || saveMutation.isPending || isLoadingRows}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
