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
import { useAuditLog } from '@/hooks/useAuditLog';

const ASSIGNEE_PALETTE = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

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

function parseAssigneeNames(val: string): string[] {
  try {
    const parsed = JSON.parse(val || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => {
      if (typeof x === 'string') return x;
      if (x && typeof x.name === 'string') return x.name;
      return '';
    }).filter(Boolean);
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
  const log = useAuditLog();
  const [rows, setRows] = useState<{ id: string; value: string }[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const isAssigneeList = configKey === 'assignee_list';

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
      const parse = isAssigneeList ? parseAssigneeNames : parseJsonArray;
      const strings = config ? parse(config.config_value || '[]') : [];
      setRows(strings.map((value) => ({ id: crypto.randomUUID(), value })));
      setHasLocalChanges(false);
    }
  }, [open, config, isAssigneeList]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), value: '' }]);
    setHasLocalChanges(true);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setHasLocalChanges(true);
  };

  const updateRow = (index: number, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, value } : r)));
    setHasLocalChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: string[]) => {
      const trimmed = values.map((v) => v.trim()).filter(Boolean);
      const configValue = isAssigneeList
        ? JSON.stringify(trimmed.map((name, i) => ({ name, bgClass: ASSIGNEE_PALETTE[i % ASSIGNEE_PALETTE.length] })))
        : JSON.stringify(trimmed);
      if (!config?.id) throw new Error('Config row not found. Please refresh and try again.');
      const { error } = await supabase
        .from('invoice_configurations')
        .update({ config_value: configValue })
        .eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      log({ action: 'UPDATE', entityType: 'invoice_configuration', description: `Config list updated: ${configKey} — ${variables.length} item(s)`, newValues: { configKey, values: variables } });
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
      if (configKey === 'assignee_list') {
        queryClient.invalidateQueries({ queryKey: ['assignee-list-config'] });
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
    saveMutation.mutate(rows.map((r) => r.value));
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
                    {isAssigneeList && <TableHead className="w-10">Color</TableHead>}
                    <TableHead>Value</TableHead>
                    <TableHead className="w-[15%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id}>
                      {isAssigneeList && (
                        <TableCell>
                          <div
                            className={`h-4 w-4 rounded-full flex-shrink-0 ${ASSIGNEE_PALETTE[index % ASSIGNEE_PALETTE.length]}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Input
                          value={row.value}
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
