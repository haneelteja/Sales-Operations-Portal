import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ColumnFilter } from '@/components/ui/column-filter';
import { Download, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { exportJsonToExcel } from '@/services/export/excelExport';

interface PricingRecord {
  id: string;
  sku: string;
  price_per_bottle: number;
  cost_per_case: number | null;
  bottles_per_case: number;
  pricing_date: string;
}

interface SkuConfig {
  sku: string;
  bottles_per_case: number;
}

const FactoryPricingTab: React.FC = () => {
  const { profile } = useAuth();
  const isManager = profile?.role === 'manager';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    pricing_date: new Date().toISOString().split('T')[0],
    sku: '',
    price_per_bottle: '',
  });
  const [editingRecord, setEditingRecord] = useState<PricingRecord | null>(null);
  const [editForm, setEditForm] = useState({ pricing_date: '', price_per_bottle: '' });

  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, string | string[]>>({
    sku: '', price_per_bottle: '', cost_per_case: '', pricing_date: '',
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, 'asc' | 'desc' | null>>({
    sku: null, price_per_bottle: null, cost_per_case: null, pricing_date: null,
  });

  const { data: skuConfigs } = useQuery({
    queryKey: ['sku-configurations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sku_configurations')
        .select('sku, bottles_per_case')
        .order('sku', { ascending: true });
      return (data || []) as SkuConfig[];
    },
  });

  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['factory-pricing'],
    queryFn: async () => {
      const { data } = await supabase
        .from('factory_pricing')
        .select('id, sku, price_per_bottle, cost_per_case, bottles_per_case, pricing_date')
        .order('pricing_date', { ascending: false });
      return (data || []) as PricingRecord[];
    },
  });

  const selectedSkuConfig = useMemo(
    () => skuConfigs?.find(s => s.sku === form.sku),
    [skuConfigs, form.sku]
  );

  const calculatedCostPerCase = useMemo(() => {
    const ppb = parseFloat(form.price_per_bottle);
    const bpc = selectedSkuConfig?.bottles_per_case;
    if (!ppb || !bpc) return null;
    return ppb * bpc;
  }, [form.price_per_bottle, selectedSkuConfig]);

  const editCalculatedCost = useMemo(() => {
    if (!editingRecord) return null;
    const ppb = parseFloat(editForm.price_per_bottle);
    if (!ppb) return null;
    return ppb * editingRecord.bottles_per_case;
  }, [editForm.price_per_bottle, editingRecord]);

  const handleSkuChange = (sku: string) => {
    const latestPricing = pricingData?.find(p => p.sku === sku);
    setForm(f => ({
      ...f,
      sku,
      price_per_bottle: latestPricing?.price_per_bottle?.toString() ?? '',
    }));
  };

  // Group pricing records by SKU (already ordered by pricing_date DESC)
  const groupedPricing = useMemo(() => {
    if (!pricingData) return [];
    const groups = new Map<string, PricingRecord[]>();
    for (const record of pricingData) {
      if (!groups.has(record.sku)) groups.set(record.sku, []);
      groups.get(record.sku)!.push(record);
    }
    return Array.from(groups.entries()).map(([sku, records]) => ({
      sku,
      latest: records[0],
      history: records,
    }));
  }, [pricingData]);

  const filteredAndSortedRows = useMemo(() => {
    let rows = [...groupedPricing];

    const skuFilter = columnFilters.sku;
    if (skuFilter && (Array.isArray(skuFilter) ? skuFilter.length > 0 : skuFilter)) {
      const filters = Array.isArray(skuFilter) ? skuFilter : [skuFilter];
      rows = rows.filter(r => filters.some(f => r.sku.toLowerCase().includes(f.toLowerCase())));
    }

    const ppbFilter = Array.isArray(columnFilters.price_per_bottle)
      ? columnFilters.price_per_bottle[0]
      : columnFilters.price_per_bottle;
    if (ppbFilter) rows = rows.filter(r => r.latest.price_per_bottle?.toString().includes(ppbFilter));

    const cpcFilter = Array.isArray(columnFilters.cost_per_case)
      ? columnFilters.cost_per_case[0]
      : columnFilters.cost_per_case;
    if (cpcFilter) rows = rows.filter(r => r.latest.cost_per_case?.toString().includes(cpcFilter));

    const dateFilter = Array.isArray(columnFilters.pricing_date)
      ? columnFilters.pricing_date[0]
      : columnFilters.pricing_date;
    if (dateFilter) rows = rows.filter(r => r.latest.pricing_date === dateFilter);

    const activeSort = Object.entries(columnSorts).find(([, d]) => d !== null);
    if (activeSort) {
      const [col, dir] = activeSort;
      rows.sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'sku': va = a.sku; vb = b.sku; break;
          case 'price_per_bottle': va = a.latest.price_per_bottle || 0; vb = b.latest.price_per_bottle || 0; break;
          case 'cost_per_case': va = a.latest.cost_per_case || 0; vb = b.latest.cost_per_case || 0; break;
          case 'pricing_date': va = a.latest.pricing_date; vb = b.latest.pricing_date; break;
          default: return 0;
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [groupedPricing, columnFilters, columnSorts]);

  const uniqueSkus = useMemo(
    () => [...new Set(pricingData?.map(p => p.sku) || [])].sort(),
    [pricingData]
  );

  const handleColumnFilterChange = useCallback((col: string, val: string | string[]) => {
    setColumnFilters(prev => ({ ...prev, [col]: val }));
  }, []);

  const handleClearColumnFilter = useCallback((col: string) => {
    setColumnFilters(prev => ({ ...prev, [col]: '' }));
  }, []);

  const handleColumnSortChange = useCallback((col: string, dir: 'asc' | 'desc' | null) => {
    setColumnSorts(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k !== col) next[k] = null; });
      next[col] = dir;
      return next;
    });
  }, []);

  const addMutation = useMutation({
    mutationFn: async () => {
      const ppb = parseFloat(form.price_per_bottle);
      const bpc = selectedSkuConfig?.bottles_per_case || 0;
      const { error } = await supabase.from('factory_pricing').insert({
        sku: form.sku,
        price_per_bottle: ppb,
        cost_per_case: ppb * bpc,
        bottles_per_case: bpc,
        pricing_date: form.pricing_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Pricing record added.' });
      setForm({ pricing_date: new Date().toISOString().split('T')[0], sku: '', price_per_bottle: '' });
      queryClient.invalidateQueries({ queryKey: ['factory-pricing'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRecord) return;
      const ppb = parseFloat(editForm.price_per_bottle);
      const { error } = await supabase
        .from('factory_pricing')
        .update({
          price_per_bottle: ppb,
          cost_per_case: ppb * editingRecord.bottles_per_case,
          pricing_date: editForm.pricing_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRecord.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Updated', description: 'Pricing record updated.' });
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['factory-pricing'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('factory_pricing').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Pricing record deleted.' });
      queryClient.invalidateQueries({ queryKey: ['factory-pricing'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.price_per_bottle || !form.pricing_date) {
      toast({ title: 'Validation', description: 'SKU, date, and price per bottle are required.', variant: 'destructive' });
      return;
    }
    addMutation.mutate();
  };

  const handleEditClick = (record: PricingRecord) => {
    setEditingRecord(record);
    setEditForm({ pricing_date: record.pricing_date, price_per_bottle: record.price_per_bottle?.toString() ?? '' });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Delete this pricing record?')) deleteMutation.mutate(id);
  };

  const exportToExcel = () => {
    const rows = filteredAndSortedRows.map(r => ({
      SKU: r.sku,
      'Bottles/Case': r.latest.bottles_per_case,
      'Price/Bottle (₹)': r.latest.price_per_bottle,
      'Cost/Case (₹)': r.latest.cost_per_case,
      'Pricing Date': r.latest.pricing_date,
    }));
    exportJsonToExcel(rows, 'factory-pricing');
  };

  const toggleExpand = (sku: string) => {
    setExpandedSkus(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const colCount = isManager ? 7 : 6;

  const EditInlineForm = ({ record }: { record: PricingRecord }) => (
    <div className="flex items-center gap-1 justify-end flex-wrap">
      <Input
        type="date"
        value={editForm.pricing_date}
        onChange={e => setEditForm(f => ({ ...f, pricing_date: e.target.value }))}
        className="h-7 w-32 text-xs"
      />
      <Input
        type="number"
        step="0.0001"
        value={editForm.price_per_bottle}
        onChange={e => setEditForm(f => ({ ...f, price_per_bottle: e.target.value }))}
        className="h-7 w-24 text-xs"
        placeholder="₹/bottle"
      />
      {editForm.price_per_bottle && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          = ₹{(parseFloat(editForm.price_per_bottle) * record.bottles_per_case).toFixed(4)}/case
        </span>
      )}
      <Button size="sm" className="h-7 text-xs px-2" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
        Save
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setEditingRecord(null)}>
        Cancel
      </Button>
    </div>
  );

  const ActionButtons = ({ record }: { record: PricingRecord }) => (
    <div className="flex items-center gap-1 justify-end">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(record)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => handleDeleteClick(record.id)}
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add Record Form */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Add Factory Pricing Record</h3>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={form.pricing_date}
                onChange={e => setForm(f => ({ ...f, pricing_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Select value={form.sku} onValueChange={handleSkuChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {(skuConfigs || []).map(s => (
                    <SelectItem key={s.sku} value={s.sku}>{s.sku}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price per Bottle (₹) *</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={form.price_per_bottle}
                onChange={e => setForm(f => ({ ...f, price_per_bottle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cost per Case (₹)</Label>
              <Input
                type="number"
                value={calculatedCostPerCase?.toFixed(4) ?? ''}
                disabled
                className="bg-muted"
                placeholder="Auto-calculated"
              />
            </div>
          </div>
          {form.sku && selectedSkuConfig && (
            <p className="text-xs text-muted-foreground">
              {selectedSkuConfig.sku}: {selectedSkuConfig.bottles_per_case} bottles/case
              {calculatedCostPerCase != null && ` → ₹${calculatedCostPerCase.toFixed(4)}/case`}
            </p>
          )}
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Saving...' : 'Add Pricing Record'}
          </Button>
        </form>
      </div>

      {/* Pricing Table */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Factory Pricing</h3>
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedRows.length} SKUs
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="w-8" />
                <TableHead>
                  <div className="flex items-center justify-between">
                    <span>Pricing Date</span>
                    <ColumnFilter
                      columnKey="pricing_date"
                      columnName="Pricing Date"
                      filterValue={columnFilters.pricing_date}
                      onFilterChange={val => handleColumnFilterChange('pricing_date', val)}
                      onClearFilter={() => handleClearColumnFilter('pricing_date')}
                      sortDirection={columnSorts.pricing_date}
                      onSortChange={dir => handleColumnSortChange('pricing_date', dir)}
                      dataType="date"
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    <span>SKU</span>
                    <ColumnFilter
                      columnKey="sku"
                      columnName="SKU"
                      filterValue={columnFilters.sku}
                      onFilterChange={val => handleColumnFilterChange('sku', val)}
                      onClearFilter={() => handleClearColumnFilter('sku')}
                      sortDirection={columnSorts.sku}
                      onSortChange={dir => handleColumnSortChange('sku', dir)}
                      dataType="multiselect"
                      options={uniqueSkus}
                    />
                  </div>
                </TableHead>
                <TableHead>Bottles/Case</TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    <span>Price/Bottle (₹)</span>
                    <ColumnFilter
                      columnKey="price_per_bottle"
                      columnName="Price/Bottle"
                      filterValue={columnFilters.price_per_bottle}
                      onFilterChange={val => handleColumnFilterChange('price_per_bottle', val)}
                      onClearFilter={() => handleClearColumnFilter('price_per_bottle')}
                      sortDirection={columnSorts.price_per_bottle}
                      onSortChange={dir => handleColumnSortChange('price_per_bottle', dir)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    <span>Cost/Case (₹)</span>
                    <ColumnFilter
                      columnKey="cost_per_case"
                      columnName="Cost/Case"
                      filterValue={columnFilters.cost_per_case}
                      onFilterChange={val => handleColumnFilterChange('cost_per_case', val)}
                      onClearFilter={() => handleClearColumnFilter('cost_per_case')}
                      sortDirection={columnSorts.cost_per_case}
                      onSortChange={dir => handleColumnSortChange('cost_per_case', dir)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                {isManager && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">
                    No pricing records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedRows.map(({ sku, latest, history }) => {
                  const isExpanded = expandedSkus.has(sku);
                  const hasHistory = history.length > 1;

                  return (
                    <React.Fragment key={sku}>
                      {/* Latest row */}
                      <TableRow>
                        <TableCell className="px-2">
                          {hasHistory && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleExpand(sku)}
                            >
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{latest.pricing_date}</TableCell>
                        <TableCell className="font-medium">{latest.sku}</TableCell>
                        <TableCell>{latest.bottles_per_case}</TableCell>
                        <TableCell>
                          ₹{latest.price_per_bottle?.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                        </TableCell>
                        <TableCell>
                          {latest.cost_per_case != null
                            ? `₹${latest.cost_per_case.toLocaleString('en-IN', { maximumFractionDigits: 4 })}`
                            : '—'}
                        </TableCell>
                        {isManager && (
                          <TableCell className="text-right">
                            {editingRecord?.id === latest.id
                              ? <EditInlineForm record={latest} />
                              : <ActionButtons record={latest} />}
                          </TableCell>
                        )}
                      </TableRow>

                      {/* Historical rows */}
                      {isExpanded && history.slice(1).map(record => (
                        <TableRow key={record.id} className="bg-slate-50/60">
                          <TableCell />
                          <TableCell className="text-sm text-muted-foreground">{record.pricing_date}</TableCell>
                          <TableCell className="pl-8 text-sm text-muted-foreground">{record.sku}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{record.bottles_per_case}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            ₹{record.price_per_bottle?.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.cost_per_case != null
                              ? `₹${record.cost_per_case.toLocaleString('en-IN', { maximumFractionDigits: 4 })}`
                              : '—'}
                          </TableCell>
                          {isManager && (
                            <TableCell className="text-right">
                              {editingRecord?.id === record.id
                                ? <EditInlineForm record={record} />
                                : <ActionButtons record={record} />}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default FactoryPricingTab;
