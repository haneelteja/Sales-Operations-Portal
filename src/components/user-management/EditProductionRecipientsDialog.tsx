import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductionOrderRecipient } from '@/services/invoiceConfigService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_RECIPIENT: ProductionOrderRecipient = { label: '', type: 'individual', identifier: '' };

export const EditProductionRecipientsDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ProductionOrderRecipient[]>([{ ...EMPTY_RECIPIENT }]);

  const { data: configRow } = useQuery({
    queryKey: ['invoice-configurations', 'production_order_recipients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoice_configurations')
        .select('*')
        .eq('config_key', 'production_order_recipients')
        .maybeSingle();
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (configRow?.config_value) {
      try {
        const parsed: ProductionOrderRecipient[] = JSON.parse(configRow.config_value);
        setRows(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ ...EMPTY_RECIPIENT }]);
      } catch {
        setRows([{ ...EMPTY_RECIPIENT }]);
      }
    } else {
      setRows([{ ...EMPTY_RECIPIENT }]);
    }
  }, [open, configRow]);

  const saveMutation = useMutation({
    mutationFn: async (recipients: ProductionOrderRecipient[]) => {
      const valid = recipients.filter((r) => r.label.trim() && r.identifier.trim());
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('invoice_configurations')
        .upsert({
          config_key: 'production_order_recipients',
          config_value: JSON.stringify(valid),
          config_type: 'string',
          description: 'WhatsApp recipients for new order notifications (individuals or groups)',
          updated_by: user?.id || null,
        }, { onConflict: 'config_key' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Production order recipients updated.' });
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations', 'production_order_recipients'] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_RECIPIENT }]);

  const removeRow = (i: number) =>
    setRows((prev) => prev.length === 1 ? [{ ...EMPTY_RECIPIENT }] : prev.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof ProductionOrderRecipient, value: string) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSave = () => saveMutation.mutate(rows);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Production Orders — WhatsApp Recipients</DialogTitle>
          <DialogDescription>
            Configure who gets notified on WhatsApp when a new order is placed.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-gray-500">
          Add phone numbers (individuals) or group IDs (WhatsApp groups) to notify when a new order is placed.
          For group IDs use the format <code className="bg-gray-100 px-1 rounded">120363XXXXXXXXXX@g.us</code>.
        </p>

        <div className="space-y-3 mt-2 max-h-80 overflow-y-auto pr-1">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_1fr_auto] gap-2 items-end">
              <div>
                {i === 0 && <Label className="text-xs mb-1 block">Label</Label>}
                <Input
                  placeholder="e.g. Factory Manager"
                  value={row.label}
                  onChange={(e) => updateRow(i, 'label', e.target.value)}
                />
              </div>
              <div>
                {i === 0 && <Label className="text-xs mb-1 block">Type</Label>}
                <Select value={row.type} onValueChange={(v) => updateRow(i, 'type', v as 'individual' | 'group')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {i === 0 && (
                  <Label className="text-xs mb-1 block">
                    {row.type === 'group' ? 'Group ID' : 'Phone Number'}
                  </Label>
                )}
                <Input
                  placeholder={row.type === 'group' ? '120363XXXXXXXXXX@g.us' : '+919876543210'}
                  value={row.identifier}
                  onChange={(e) => updateRow(i, 'identifier', e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(i)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add Recipient
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
