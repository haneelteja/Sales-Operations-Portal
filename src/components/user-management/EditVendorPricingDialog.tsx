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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export interface VendorPricingEntry {
  vendor: string;
  sku: string;
  price: number | '';
  gst: number | '';
}

interface EditVendorPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseEntries(val: string): VendorPricingEntry[] {
  try {
    const parsed = JSON.parse(val || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is VendorPricingEntry =>
        e && typeof e.vendor === 'string' && typeof e.sku === 'string'
    );
  } catch {
    return [];
  }
}

const emptyRow = (): VendorPricingEntry => ({ vendor: '', sku: '', price: '', gst: '' });

export const EditVendorPricingDialog: React.FC<EditVendorPricingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<VendorPricingEntry[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['invoice-configurations', 'label_vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_configurations')
        .select('id, config_value')
        .eq('config_key', 'label_vendors')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: skuConfigs, isLoading: skusLoading } = useQuery({
    queryKey: ['sku_configurations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sku_configurations')
        .select('sku')
        .order('sku', { ascending: true });
      return (data || []).map(d => d.sku).filter(Boolean);
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setRows(config ? parseEntries(config.config_value || '[]') : []);
      setHasLocalChanges(false);
    }
  }, [open, config]);

  const updateRow = (index: number, field: keyof VendorPricingEntry, value: string) => {
    setRows(prev => {
      const next = [...prev];
      if (field === 'price' || field === 'gst') {
        next[index] = { ...next[index], [field]: value === '' ? '' : Number(value) };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
    setHasLocalChanges(true);
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
    setHasLocalChanges(true);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
    setHasLocalChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (entries: VendorPricingEntry[]) => {
      const valid = entries.filter(e => e.vendor.trim() && e.sku.trim());
      const configValue = JSON.stringify(
        valid.map(e => ({
          vendor: e.vendor.trim(),
          sku: e.sku,
          price: e.price === '' ? 0 : Number(e.price),
          gst: e.gst === '' ? 0 : Number(e.gst),
        }))
      );
      if (!config?.id) throw new Error('Config row not found. Please refresh and try again.');
      const { error } = await supabase
        .from('invoice_configurations')
        .update({ config_value: configValue })
        .eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations', 'label_vendors'] });
      queryClient.invalidateQueries({ queryKey: ['label-vendors-config'] });
      toast({ title: 'Success', description: 'Vendor pricing saved.' });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    },
  });

  const isLoading = configLoading || skusLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Labels Vendor Pricing</DialogTitle>
          <DialogDescription>
            Add vendors with their SKU, price per label, and GST%. These appear in Labels Purchase and Labels Payment dropdowns.
          </DialogDescription>
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
                    <TableHead className="w-[30%]">Vendor Name</TableHead>
                    <TableHead className="w-[25%]">SKU</TableHead>
                    <TableHead className="w-[20%]">Price per Label (₹)</TableHead>
                    <TableHead className="w-[15%]">GST %</TableHead>
                    <TableHead className="w-[10%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No vendors added yet. Click "Add row" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={row.vendor}
                            onChange={e => updateRow(index, 'vendor', e.target.value)}
                            placeholder="e.g. GMG Labels"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.sku}
                            onValueChange={val => updateRow(index, 'sku', val)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select SKU" />
                            </SelectTrigger>
                            <SelectContent>
                              {(skuConfigs || []).map(sku => (
                                <SelectItem key={sku} value={sku}>{sku}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={row.price}
                            onChange={e => updateRow(index, 'price', e.target.value)}
                            placeholder="0.0000"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={row.gst}
                            onChange={e => updateRow(index, 'gst', e.target.value)}
                            placeholder="18"
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
            onClick={() => saveMutation.mutate(rows)}
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
