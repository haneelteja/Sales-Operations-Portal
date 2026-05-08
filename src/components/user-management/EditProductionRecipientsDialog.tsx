import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductionOrderRecipient } from '@/services/invoiceConfigService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_RECIPIENT: ProductionOrderRecipient = { label: '', type: 'individual', identifier: '' };

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export const EditProductionRecipientsDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ProductionOrderRecipient[]>([{ ...EMPTY_RECIPIENT }]);
  const [errors, setErrors] = useState<Record<number, string>>({});

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
        // Migrate any legacy group entries to individual
        const normalised = parsed.map((r) => ({ ...r, type: 'individual' as const }));
        setRows(Array.isArray(normalised) && normalised.length > 0 ? normalised : [{ ...EMPTY_RECIPIENT }]);
      } catch {
        setRows([{ ...EMPTY_RECIPIENT }]);
      }
    } else {
      setRows([{ ...EMPTY_RECIPIENT }]);
    }
    setErrors({});
  }, [open, configRow]);

  const validate = (recipients: ProductionOrderRecipient[]): Record<number, string> => {
    const errs: Record<number, string> = {};
    recipients.forEach((r, i) => {
      if (!r.label.trim()) {
        errs[i] = 'Label is required';
        return;
      }
      const cleaned = r.identifier.replace(/\s/g, '');
      if (!cleaned) {
        errs[i] = 'Phone number is required';
        return;
      }
      if (!PHONE_REGEX.test(cleaned)) {
        errs[i] = 'Invalid phone number — use format +919876543210';
      }
    });
    return errs;
  };

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
          description: 'WhatsApp recipients for new production order notifications',
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

  const removeRow = (i: number) => {
    setRows((prev) => prev.length === 1 ? [{ ...EMPTY_RECIPIENT }] : prev.filter((_, idx) => idx !== i));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };

  const updateRow = (i: number, field: 'label' | 'identifier', value: string) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSave = () => {
    const filled = rows.filter((r) => r.label.trim() || r.identifier.trim());
    const toValidate = filled.length > 0 ? filled : rows;
    const errs = validate(toValidate);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    saveMutation.mutate(filled);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Production Orders — WhatsApp Recipients</DialogTitle>
          <DialogDescription>
            Configure who gets notified on WhatsApp when a new production order is placed.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-gray-500">
          Add the phone numbers of individuals to notify. Use international format, e.g. <code className="bg-gray-100 px-1 rounded">+919876543210</code>.
        </p>

        <div className="space-y-3 mt-2 max-h-80 overflow-y-auto pr-1">
          {rows.map((row, i) => (
            <div key={i} className="space-y-1">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                  {i === 0 && <Label className="text-xs mb-1 block">Label</Label>}
                  <Input
                    placeholder="e.g. Factory Manager"
                    value={row.label}
                    onChange={(e) => updateRow(i, 'label', e.target.value)}
                    className={errors[i] ? 'border-red-400' : ''}
                  />
                </div>
                <div>
                  {i === 0 && <Label className="text-xs mb-1 block">Phone Number</Label>}
                  <Input
                    placeholder="+919876543210"
                    value={row.identifier}
                    onChange={(e) => updateRow(i, 'identifier', e.target.value)}
                    className={errors[i] ? 'border-red-400' : ''}
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
              {errors[i] && <p className="text-xs text-red-500 pl-1">{errors[i]}</p>}
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
