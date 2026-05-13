/**
 * Reusable dialog for editing a JSON array config (e.g. transport_vendors, expense_groups)
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditListConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configKey: string;
  title: string;
  description: string;
  placeholder?: string;
  queryKey?: string;
}

function parseJsonArray(val: string): string[] {
  try {
    const parsed = JSON.parse(val || '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const EditListConfigDialog: React.FC<EditListConfigDialogProps> = ({
  open,
  onOpenChange,
  configKey,
  title,
  description,
  placeholder = 'Enter value',
  queryKey = 'invoice-configurations',
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<string[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: [queryKey, configKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_configurations')
        .select('id, config_value')
        .eq('config_key', configKey)
        .maybeSingle();
      if (error) throw error;
      return data; // null if row doesn't exist yet
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setRows(config ? parseJsonArray(config.config_value || '[]') : []);
      setHasLocalChanges(false);
    }
  }, [open, config]);

  const addRow = () => {
    setRows((prev) => [...prev, '']);
    setHasLocalChanges(true);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setHasLocalChanges(true);
  };

  const updateRow = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setHasLocalChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: string[]) => {
      const trimmed = values.map((v) => v.trim()).filter(Boolean);
      const configValue = JSON.stringify(trimmed);
      const { error } = await supabase
        .from('invoice_configurations')
        .upsert(
          { config_key: configKey, config_value: configValue, config_type: 'json' },
          { onConflict: 'config_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [queryKey, configKey] });
      if (configKey === 'transport_vendors') {
        queryClient.invalidateQueries({ queryKey: ['transport-vendors-config'] });
      }
      if (configKey === 'expense_groups') {
        queryClient.invalidateQueries({ queryKey: ['expense-groups-config'] });
      }
      if (configKey === 'label_vendors') {
        queryClient.invalidateQueries({ queryKey: ['label-vendors-config'] });
      }
      toast({ title: 'Success', description: 'Saved successfully.' });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(rows);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1 min-h-0 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[85%]">Value</TableHead>
                    <TableHead className="w-[15%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={row}
                          onChange={(e) => updateRow(index, e.target.value)}
                          placeholder={placeholder}
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

            <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-2 self-start">
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
