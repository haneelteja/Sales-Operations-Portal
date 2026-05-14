import React, { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Plus, Trash2, ArrowUpDown, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VendorPricingEntry {
  vendor: string;
  sku: string;
  date: string;
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
    ).map(e => ({ ...e, date: e.date || '' }));
  } catch {
    return [];
  }
}

const emptyRow = (): VendorPricingEntry => ({ vendor: '', sku: '', date: '', price: '', gst: '' });

type SortField = 'vendor' | 'sku' | 'date' | 'price' | 'gst' | null;

export const EditVendorPricingDialog: React.FC<EditVendorPricingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<VendorPricingEntry[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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
      setSearchQuery('');
      setSortField(null);
    }
  }, [open, config]);

  const updateRow = (originalIndex: number, field: keyof VendorPricingEntry, value: string) => {
    setRows(prev => {
      const next = [...prev];
      if (field === 'price' || field === 'gst') {
        next[originalIndex] = { ...next[originalIndex], [field]: value === '' ? '' : Number(value) };
      } else {
        next[originalIndex] = { ...next[originalIndex], [field]: value };
      }
      return next;
    });
    setHasLocalChanges(true);
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
    setHasLocalChanges(true);
  };

  const removeRow = (originalIndex: number) => {
    setRows(prev => prev.filter((_, i) => i !== originalIndex));
    setHasLocalChanges(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const displayRows = useMemo(() => {
    const withIndex = rows.map((row, originalIndex) => ({ row, originalIndex }));

    const filtered = searchQuery.trim()
      ? withIndex.filter(({ row }) => {
          const q = searchQuery.toLowerCase();
          return (
            row.vendor.toLowerCase().includes(q) ||
            row.sku.toLowerCase().includes(q)
          );
        })
      : withIndex;

    if (!sortField) return filtered;

    return [...filtered].sort(({ row: a }, { row: b }) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === '' || aVal === undefined) return 1;
      if (bVal === '' || bVal === undefined) return -1;
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, searchQuery, sortField, sortDir]);

  const saveMutation = useMutation({
    mutationFn: async (entries: VendorPricingEntry[]) => {
      const valid = entries.filter(e => e.vendor.trim() && e.sku.trim());
      const configValue = JSON.stringify(
        valid.map(e => ({
          vendor: e.vendor.trim(),
          sku: e.sku,
          date: e.date || '',
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
      queryClient.invalidateQueries({ queryKey: ['label-vendors-pricing-entries'] });
      toast({ title: 'Success', description: 'Vendor pricing saved.' });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    },
  });

  const isLoading = configLoading || skusLoading;

  const SortButton = ({ field }: { field: SortField }) => (
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Labels Vendor Pricing</DialogTitle>
          <DialogDescription>
            Add vendors with their SKU, effective date, price per label, and GST%. These appear in Labels Purchase and Labels Payment dropdowns.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor or SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="overflow-auto flex-1 min-h-0 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%]">
                      Vendor Name <SortButton field="vendor" />
                    </TableHead>
                    <TableHead className="w-[18%]">
                      SKU <SortButton field="sku" />
                    </TableHead>
                    <TableHead className="w-[14%]">
                      Effective Date <SortButton field="date" />
                    </TableHead>
                    <TableHead className="w-[16%]">
                      Price/Label (₹) <SortButton field="price" />
                    </TableHead>
                    <TableHead className="w-[10%]">
                      GST % <SortButton field="gst" />
                    </TableHead>
                    <TableHead className="w-[12%] text-right">Total/Label (₹)</TableHead>
                    <TableHead className="w-[8%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {rows.length === 0
                          ? 'No vendors added yet. Click "Add row" to get started.'
                          : 'No results match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayRows.map(({ row, originalIndex }) => {
                      const price = row.price === '' ? 0 : Number(row.price);
                      const gst = row.gst === '' ? 0 : Number(row.gst);
                      const total = price * (1 + gst / 100);

                      return (
                        <TableRow key={originalIndex}>
                          <TableCell>
                            <Input
                              value={row.vendor}
                              onChange={e => updateRow(originalIndex, 'vendor', e.target.value)}
                              placeholder="e.g. GMG Labels"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.sku}
                              onValueChange={val => updateRow(originalIndex, 'sku', val)}
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
                              type="date"
                              value={row.date}
                              onChange={e => updateRow(originalIndex, 'date', e.target.value)}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={row.price}
                              onChange={e => updateRow(originalIndex, 'price', e.target.value)}
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
                              onChange={e => updateRow(originalIndex, 'gst', e.target.value)}
                              placeholder="18"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {price > 0 ? `₹${total.toFixed(4)}` : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeRow(originalIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
