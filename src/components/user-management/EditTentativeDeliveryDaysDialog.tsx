/**
 * Dialog to edit tentative delivery days config
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
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

interface EditTentativeDeliveryDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTentativeDeliveryDaysDialog: React.FC<EditTentativeDeliveryDaysDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();
  const [days, setDays] = useState<string>('5');

  const { data: config, isLoading } = useQuery({
    queryKey: ['invoice-configurations', 'tentative_delivery_days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_configurations')
        .select('id, config_value')
        .eq('config_key', 'tentative_delivery_days')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && config) {
      const val = config.config_value?.trim();
      setDays(val ? String(parseInt(val, 10) || 5) : '5');
    }
  }, [open, config]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) throw new Error('Enter a valid non-negative number');
      const { error } = await supabase
        .from('invoice_configurations')
        .update({ config_value: String(num) })
        .eq('config_key', 'tentative_delivery_days');
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      log({ action: 'UPDATE', entityType: 'invoice_configuration', description: `Tentative delivery days updated to ${variables} days`, newValues: { tentative_delivery_days: variables } });
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations', 'tentative_delivery_days'] });
      queryClient.invalidateQueries({ queryKey: ['tentative-delivery-days'] });
      toast({ title: 'Success', description: 'Tentative delivery days updated.' });
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
    const num = parseInt(days, 10);
    if (isNaN(num) || num < 0) {
      toast({
        title: 'Validation',
        description: 'Enter a valid non-negative number.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(days);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tentative Delivery Days</DialogTitle>
          <DialogDescription>
            Number of days to add to the order date when calculating the default tentative delivery date for new orders.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tentative-days">Days</Label>
              <Input
                id="tentative-days"
                type="number"
                min={0}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || isLoading}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
