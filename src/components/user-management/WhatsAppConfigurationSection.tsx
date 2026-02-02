/**
 * WhatsApp Configuration Section
 * Manages WhatsApp integration settings
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getWhatsAppConfig,
  updateWhatsAppConfig,
  type WhatsAppConfig,
} from '@/services/whatsappService';
import { ManualPaymentReminder } from './ManualPaymentReminder';

export const WhatsAppConfigurationSection: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch WhatsApp configuration
  const { data: config, isLoading, error: configError } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: getWhatsAppConfig,
    retry: 2,
  });

  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string | boolean }) =>
      updateWhatsAppConfig(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast({
        title: 'Success',
        description: 'WhatsApp configuration updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update configuration',
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    updateMutation.mutate({ key, value });
  };

  // Use default config if not loaded yet or if there's an error
  const displayConfig: WhatsAppConfig = config || {
    whatsapp_enabled: false,
    whatsapp_stock_delivered_enabled: false,
    whatsapp_invoice_enabled: false,
    whatsapp_payment_reminder_enabled: false,
    whatsapp_festival_enabled: false,
    whatsapp_api_key: '',
    whatsapp_api_url: 'https://api.360messenger.com',
    whatsapp_retry_max: 3,
    whatsapp_retry_interval_minutes: 30,
    whatsapp_failure_notification_email: 'pega2023test@gmail.com',
    whatsapp_payment_reminder_days: '3,7',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          WhatsApp Integration
        </CardTitle>
        <CardDescription>
          Configure WhatsApp messaging for invoices, payment reminders, and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Message */}
        {configError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load WhatsApp configuration: {configError instanceof Error ? configError.message : 'Unknown error'}. Using default values.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Indicator */}
        {isLoading && !config && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Loading WhatsApp configuration...</span>
          </div>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Enable WhatsApp Integration</Label>
            <p className="text-sm text-muted-foreground">
              Master switch to enable/disable all WhatsApp messaging
            </p>
          </div>
          <Switch
            checked={displayConfig.whatsapp_enabled}
            onCheckedChange={(checked) => handleToggle('whatsapp_enabled', checked)}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Message Type Toggles */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Message Types</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Invoice Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send invoice PDF via WhatsApp after generation
                </p>
              </div>
              <Switch
                checked={displayConfig.whatsapp_invoice_enabled}
                onCheckedChange={(checked) => handleToggle('whatsapp_invoice_enabled', checked)}
                disabled={!displayConfig.whatsapp_enabled || updateMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Stock Delivered Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send notification when stock is delivered
                </p>
              </div>
              <Switch
                checked={displayConfig.whatsapp_stock_delivered_enabled}
                onCheckedChange={(checked) => handleToggle('whatsapp_stock_delivered_enabled', checked)}
                disabled={!displayConfig.whatsapp_enabled || updateMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Payment Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Send scheduled payment reminder messages
                </p>
              </div>
              <Switch
                checked={displayConfig.whatsapp_payment_reminder_enabled}
                onCheckedChange={(checked) => handleToggle('whatsapp_payment_reminder_enabled', checked)}
                disabled={!displayConfig.whatsapp_enabled || updateMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Festival / Salutation Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Send festival greetings and salutation messages
                </p>
              </div>
              <Switch
                checked={displayConfig.whatsapp_festival_enabled}
                onCheckedChange={(checked) => handleToggle('whatsapp_festival_enabled', checked)}
                disabled={!displayConfig.whatsapp_enabled || updateMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold">API Configuration</h4>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={displayConfig.whatsapp_api_key || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                API key is configured securely. Contact administrator to change.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-url">API URL</Label>
              <Input
                id="api-url"
                value={displayConfig.whatsapp_api_url || 'https://api.360messenger.com'}
                readOnly
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Manual Payment Reminder */}
        <div className="pt-4 border-t">
          <ManualPaymentReminder />
        </div>
      </CardContent>
    </Card>
  );
};
