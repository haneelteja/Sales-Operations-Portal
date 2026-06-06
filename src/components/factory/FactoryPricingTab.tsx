import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ColumnFilter } from '@/components/ui/column-filter';
import { Download, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { exportJsonToExcel } from '@/services/export/excelExport';
import { useAuditLog } from '@/hooks/useAuditLog';

interface PricingRecord {
  id: string;
  sku: string;
  price_per_bottle: number;
  cost_per_case: number | null;
  bottles_per_case: number;
  pricing_date: string;
  tax: number | null;
  description: string | null;
}

interface SkuConfig {
  sku: string;
  bottles_per_case: number;
}

const fmt = (n: number | null | undefined, digits = 4) =>
  n != null ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: digits })}` : '—';

const calcTotalCostPerBottle = (price: number, gstPct: number) =>
  price * (1 + gstPct / 100);

const calcCostPerCase = (price: number, gstPct: number, bottles: number) =>
  calcTotalCostPerBottle(price, gstPct) * bottles;

const FactoryPricingTab: React.FC = () => {
  const { profile } = useAuth();
  const isManager = profile?.role === 'manager';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();

  const [form, setForm] = useState({
    pricing_date: new Date().toISOString().split('T')[0],
    sku: '',
    price_per_bottle: '',
    gst: '',
    description: '',
  });

  const [editingRecord, setEditingRecord] = useState<PricingRecord | null>(null);
  const [editForm, setEditForm] = useState({
    pricing_date: '',
    price_per_bottle: '',
    gst: '',
    description: '',
  });

  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, string | string[]>>({
    sku: '', pricing_date: '', price_per_bottle: '', cost_per_case: '',
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, 'asc' | 'desc' | null>>({
    sku: null, pricing_date: null, price_per_bottle: null, cost_per_case: null,
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
        .select('id, sku, price_per_bottle, cost_per_case, bottles_per_case, pricing_date, tax, description')
        .order('pricing_date', { ascending: false });
      return (data || []) as PricingRecord[];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const selectedSkuConfig = useMemo(
    () => skuConfigs?.find(s => s.sku === form.sku),
    [skuConfigs, form.sku]
  );

  const formPpb = parseFloat(form.price_per_bottle) || 0;
  const formGst = parseFloat(form.gst) || 0;
  const formBpc = selectedSkuConfig?.bottles_per_case || 0;

  const calcFormTotalBottle = formPpb > 0 ? calcTotalCostPerBottle(formPpb, formGst) : null;
  const calcFormCostCase = formPpb > 0 && formBpc > 0 ? calcCostPerCase(formPpb, formGst, formBpc) : null;

  const editPpb = parseFloat(editForm.price_per_bottle) || 0;
  const editGst = parseFloat(editForm.gst) || 0;
  const editBpc = editingRecord?.bottles_per_case || 0;
  const editTotalBottle = editPpb > 0 ? calcTotalCostPerBottle(editPpb, editGst) : null;
  const editCostCase = editTotalBottle != null && editBpc > 0 ? editTotalBottle * editBpc : null;

  const handleSkuChange = (sku: string) => {
    const latest = pricingData?.find(p => p.sku === sku);
    setForm(f => ({
      ...f,
      sku,
      price_per_bottle: latest?.price_per_bottle?.toString() ?? '',
      gst: latest?.tax?.toString() ?? '',
    }));
  };

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
      const gst = parseFloat(form.gst) || 0;
      const bpc = selectedSkuConfig?.bottles_per_case || 0;
      const { error } = await supabase.from('factory_pricing').insert({
        sku: form.sku,
        price_per_bottle: ppb,
        tax: gst,
        bottles_per_case: bpc,
        pricing_date: form.pricing_date,
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      log({ action: 'CREATE', entityType: 'factory_pricing', description: `Factory pricing added: ${form.sku} @ ₹${form.price_per_bottle}/bottle (GST ${form.gst || 0}%)`, newValues: { sku: form.sku, price_per_bottle: form.price_per_bottle, gst: form.gst, pricing_date: form.pricing_date } });
      toast({ title: 'Saved', description: 'Pricing record added.' });
      setForm({ pricing_date: new Date().toISOString().split('T')[0], sku: '', price_per_bottle: '', gst: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['factory-pricing'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRecord) return;
      const ppb = parseFloat(editForm.price_per_bottle);
      const gst = parseFloat(editForm.gst) || 0;
      const { error } = await supabase
        .from('factory_pricing')
        .update({
          price_per_bottle: ppb,
          tax: gst,
          pricing_date: editForm.pricing_date,
          description: editForm.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRecord.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (editingRecord) {
        log({ action: 'UPDATE', entityType: 'factory_pricing', entityId: editingRecord.id, description: `Factory pricing updated: ${editingRecord.sku} → ₹${editForm.price_per_bottle}/bottle (GST ${editForm.gst || 0}%)`, oldValues: { price_per_bottle: editingRecord.price_per_bottle, tax: editingRecord.tax, pricing_date: editingRecord.pricing_date }, newValues: { price_per_bottle: editForm.price_per_bottle, gst: editForm.gst, pricing_date: editForm.pricing_date } });
      }
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
    onSuccess: (_, variables) => {
      log({ action: 'DELETE', entityType: 'factory_pricing', entityId: variables, description: `Factory pricing record deleted: ID ${variables}` });
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
    setEditForm({
      pricing_date: record.pricing_date,
      price_per_bottle: record.price_per_bottle?.toString() ?? '',
      gst: record.tax?.toString() ?? '',
      description: record.description ?? '',
    });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Delete this pricing record?')) deleteMutation.mutate(id);
  };

  const exportToExcel = async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: ['factory-pricing'],
      queryFn: async () => {
        const { data } = await supabase
          .from('factory_pricing')
          .select('id, sku, price_per_bottle, cost_per_case, bottles_per_case, pricing_date, tax, description')
          .order('pricing_date', { ascending: false });
        return (data || []) as PricingRecord[];
      },
      staleTime: 0,
    });

    queryClient.setQueryData(['factory-pricing'], fresh);

    const freshGroups = new Map<string, PricingRecord[]>();
    for (const record of fresh) {
      if (!freshGroups.has(record.sku)) freshGroups.set(record.sku, []);
      freshGroups.get(record.sku)!.push(record);
    }

    const rows = Array.from(freshGroups.values()).flatMap(history =>
      history.map(record => {
        const gst = record.tax ?? 0;
        const totalBottle = calcTotalCostPerBottle(record.price_per_bottle, gst);
        return {
          'Pricing Date': record.pricing_date,
          SKU: record.sku,
          'Bottles/Case': record.bottles_per_case,
          'Price/Bottle (₹)': record.price_per_bottle,
          'GST (%)': gst,
          'Total Cost/Bottle (₹)': isNaN(totalBottle) ? '' : +totalBottle.toFixed(4),
          'Total Cost/Case (₹)': record.cost_per_case,
          Description: record.description ?? '',
        };
      })
    );

    await exportJsonToExcel(rows, 'Elma Factory Pricing', 'elma-factory-pricing.xlsx');
  };

  const toggleExpand = (sku: string) => {
    setExpandedSkus(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  // chevron + pricing_date + sku + bottles + price + gst + total_bottle + cost_case + description + actions(mgr)
  const colCount = isManager ? 10 : 9;

  const EditInlineForm = ({ record }: { record: PricingRecord }) => (
    <div className="flex items-end gap-1 justify-end flex-wrap">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground">Date</span>
        <Input
          type="date"
          value={editForm.pricing_date}
          onChange={e => setEditForm(f => ({ ...f, pricing_date: e.target.value }))}
          className="h-7 w-32 text-xs"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground">Price/Bottle (₹)</span>
        <Input
          type="number"
          step="0.0001"
          value={editForm.price_per_bottle}
          onChange={e => setEditForm(f => ({ ...f, price_per_bottle: e.target.value }))}
          className="h-7 w-24 text-xs"
          placeholder="₹/bottle"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground">GST (%)</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={editForm.gst}
          onChange={e => setEditForm(f => ({ ...f, gst: e.target.value }))}
          className="h-7 w-16 text-xs"
          placeholder="%"
        />
      </div>
      {editCostCase != null && (
        <span className="text-xs text-muted-foreground whitespace-nowrap self-end pb-1">
          = {fmt(editCostCase)}/case
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground">Description</span>
        <Input
          value={editForm.description}
          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
          className="h-7 w-36 text-xs"
          placeholder="Optional"
        />
      </div>
      <Button size="sm" className="h-7 text-xs px-2 self-end" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
        Save
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs px-2 self-end" onClick={() => setEditingRecord(null)}>
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
              <SearchableSelect
                options={(skuConfigs || []).map(s => ({ value: s.sku, label: s.sku }))}
                value={form.sku}
                onValueChange={handleSkuChange}
                placeholder="Select SKU"
              />
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
              <Label>GST (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 18"
                value={form.gst}
                onChange={e => setForm(f => ({ ...f, gst: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Total Cost per Bottle (₹)</Label>
              <Input
                type="number"
                value={calcFormTotalBottle?.toFixed(4) ?? ''}
                disabled
                className="bg-muted"
                placeholder="Auto-calculated"
              />
            </div>
            <div className="space-y-2">
              <Label>Total Cost per Case (₹)</Label>
              <Input
                type="number"
                value={calcFormCostCase?.toFixed(4) ?? ''}
                disabled
                className="bg-muted"
                placeholder="Auto-calculated"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional notes"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          {form.sku && selectedSkuConfig && (
            <p className="text-xs text-muted-foreground">
              {selectedSkuConfig.sku}: {selectedSkuConfig.bottles_per_case} bottles/case
              {calcFormCostCase != null && ` → Total cost ₹${calcFormCostCase.toFixed(4)}/case`}
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
                <TableHead>GST (%)</TableHead>
                <TableHead>Total Cost/Bottle (₹)</TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    <span>Total Cost/Case (₹)</span>
                    <ColumnFilter
                      columnKey="cost_per_case"
                      columnName="Total Cost/Case"
                      filterValue={columnFilters.cost_per_case}
                      onFilterChange={val => handleColumnFilterChange('cost_per_case', val)}
                      onClearFilter={() => handleClearColumnFilter('cost_per_case')}
                      sortDirection={columnSorts.cost_per_case}
                      onSortChange={dir => handleColumnSortChange('cost_per_case', dir)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
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
                  const latestGst = latest.tax || 0;
                  const latestTotalBottle = calcTotalCostPerBottle(latest.price_per_bottle, latestGst);

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
                                : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{latest.pricing_date}</TableCell>
                        <TableCell className="font-medium">{latest.sku}</TableCell>
                        <TableCell>{latest.bottles_per_case}</TableCell>
                        <TableCell>{fmt(latest.price_per_bottle)}</TableCell>
                        <TableCell>{latestGst > 0 ? `${latestGst}%` : '—'}</TableCell>
                        <TableCell>{fmt(latestTotalBottle)}</TableCell>
                        <TableCell>
                          {latest.cost_per_case != null ? fmt(latest.cost_per_case) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                          {latest.description ?? '—'}
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
                      {isExpanded && history.slice(1).map(record => {
                        const recGst = record.tax || 0;
                        const recTotalBottle = calcTotalCostPerBottle(record.price_per_bottle, recGst);
                        return (
                          <TableRow key={record.id} className="bg-slate-50/60">
                            <TableCell />
                            <TableCell className="text-sm text-muted-foreground">{record.pricing_date}</TableCell>
                            <TableCell className="pl-8 text-sm text-muted-foreground">{record.sku}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{record.bottles_per_case}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fmt(record.price_per_bottle)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{recGst > 0 ? `${recGst}%` : '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fmt(recTotalBottle)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.cost_per_case != null ? fmt(record.cost_per_case) : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                              {record.description ?? '—'}
                            </TableCell>
                            {isManager && (
                              <TableCell className="text-right">
                                {editingRecord?.id === record.id
                                  ? <EditInlineForm record={record} />
                                  : <ActionButtons record={record} />}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
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
