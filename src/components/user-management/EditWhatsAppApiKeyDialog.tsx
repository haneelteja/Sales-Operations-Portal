/**
 * Dialog to edit WhatsApp API key in Application Configuration
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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

interface EditWhatsAppApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditWhatsAppApiKeyDialog: React.FC<EditWhatsAppApiKeyDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['invoice-configurations', 'whatsapp_api_key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_configurations')
        .select('id, config_value')
        .eq('config_key', 'whatsapp_api_key')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && config) {
      setApiKey(config.config_value || '');
    }
  }, [open, config]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from('invoice_configurations')
        .update({ config_value: value })
        .eq('config_key', 'whatsapp_api_key');
      if (error) throw error;
    },
    onSuccess: () => {
      log({ action: 'UPDATE', entityType: 'invoice_configuration', description: 'WhatsApp API key updated' });
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast({ title: 'Success', description: 'WhatsApp API key updated.' });
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
    saveMutation.mutate(apiKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp API Key</DialogTitle>
          <DialogDescription>
            360Messenger API key for WhatsApp messaging. Keep this secure.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="whatsapp-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
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
