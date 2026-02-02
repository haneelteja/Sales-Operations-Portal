/**
 * Manual Payment Reminder Component
 * Allows managers to manually send payment reminder messages to customers
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sendWhatsAppMessage, getWhatsAppConfig } from '@/services/whatsappService';
import type { Customer } from '@/types';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomerReceivable {
  customer: Customer;
  outstanding: number;
  invoiceCount: number;
  oldestInvoiceDate: string | null;
}

export const ManualPaymentReminder: React.FC = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('client_name');
      
      if (error) throw error;
      return (data || []) as Customer[];
    },
  });

  // Fetch customer receivables (outstanding amounts)
  const { data: receivables, isLoading: receivablesLoading } = useQuery({
    queryKey: ['customer-receivables'],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('sales_transactions')
        .select('customer_id, transaction_type, amount, transaction_date')
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Calculate outstanding per customer
      const customerMap = new Map<string, CustomerReceivable>();

      transactions?.forEach((tx) => {
        if (!customerMap.has(tx.customer_id)) {
          const customer = customers?.find((c) => c.id === tx.customer_id);
          if (!customer) return;

          customerMap.set(tx.customer_id, {
            customer,
            outstanding: 0,
            invoiceCount: 0,
            oldestInvoiceDate: null,
          });
        }

        const receivable = customerMap.get(tx.customer_id)!;
        if (tx.transaction_type === 'sale') {
          receivable.outstanding += tx.amount || 0;
          receivable.invoiceCount++;
          if (!receivable.oldestInvoiceDate || tx.transaction_date < receivable.oldestInvoiceDate) {
            receivable.oldestInvoiceDate = tx.transaction_date;
          }
        } else if (tx.transaction_type === 'payment') {
          receivable.outstanding -= tx.amount || 0;
        }
      });

      // Filter only customers with outstanding > 0
      return Array.from(customerMap.values())
        .filter((r) => r.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding);
    },
    enabled: !!customers,
  });

  // Get selected customer details
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId || !receivables) return null;
    return receivables.find((r) => r.customer.id === selectedCustomerId);
  }, [selectedCustomerId, receivables]);

  // Send payment reminder
  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) {
        throw new Error('Please select a customer');
      }

      const config = await getWhatsAppConfig();
      if (!config.whatsapp_enabled || !config.whatsapp_payment_reminder_enabled) {
        throw new Error('WhatsApp payment reminders are disabled');
      }

      if (!selectedCustomer.customer.whatsapp_number) {
        throw new Error('Customer does not have a WhatsApp number configured');
      }

      // Format outstanding amount
      const outstandingAmount = `₹${selectedCustomer.outstanding.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })}`;

      // Calculate days overdue (if oldest invoice exists)
      let daysOverdue = 0;
      if (selectedCustomer.oldestInvoiceDate) {
        const oldestDate = new Date(selectedCustomer.oldestInvoiceDate);
        const today = new Date();
        daysOverdue = Math.floor((today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Prepare placeholders for payment reminder template
      const placeholders: Record<string, string> = {
        customerName: selectedCustomer.customer.client_name,
        outstandingAmount: outstandingAmount,
        invoiceCount: selectedCustomer.invoiceCount.toString(),
        daysOverdue: daysOverdue > 0 ? daysOverdue.toString() : '0',
        oldestInvoiceDate: selectedCustomer.oldestInvoiceDate
          ? new Date(selectedCustomer.oldestInvoiceDate).toLocaleDateString('en-IN')
          : 'N/A',
      };

      // Send WhatsApp message
      const result = await sendWhatsAppMessage({
        customerId: selectedCustomer.customer.id,
        messageType: 'payment_reminder',
        triggerType: 'manual',
        placeholders,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send payment reminder');
      }

      return result;
    },
    onSuccess: () => {
      setSendStatus({
        type: 'success',
        message: 'Payment reminder sent successfully!',
      });
      toast({
        title: 'Success',
        description: 'Payment reminder sent successfully via WhatsApp',
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      // Clear selection after 3 seconds
      setTimeout(() => {
        setSelectedCustomerId('');
        setSendStatus(null);
      }, 3000);
    },
    onError: (error: Error) => {
      setSendStatus({
        type: 'error',
        message: error.message,
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSend = () => {
    setSendStatus(null);
    sendReminderMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Manual Payment Reminder
        </CardTitle>
        <CardDescription>
          Send payment reminder messages to customers with outstanding invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <Label htmlFor="customer-select">Select Customer</Label>
          <Select
            value={selectedCustomerId}
            onValueChange={setSelectedCustomerId}
            disabled={customersLoading || receivablesLoading}
          >
            <SelectTrigger id="customer-select">
              <SelectValue placeholder="Choose a customer with outstanding balance" />
            </SelectTrigger>
            <SelectContent>
              {receivablesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading customers...
                </SelectItem>
              ) : receivables && receivables.length > 0 ? (
                receivables.map((receivable) => (
                  <SelectItem key={receivable.customer.id} value={receivable.customer.id}>
                    {receivable.customer.client_name}
                    {receivable.customer.branch && ` - ${receivable.customer.branch}`}
                    {' '}
                    <span className="text-muted-foreground">
                      (Outstanding: ₹{receivable.outstanding.toLocaleString('en-IN')})
                    </span>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No customers with outstanding balance
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Customer Details */}
        {selectedCustomer && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Customer:</span>
              <span className="text-sm">{selectedCustomer.customer.client_name}</span>
            </div>
            {selectedCustomer.customer.branch && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Branch:</span>
                <span className="text-sm">{selectedCustomer.customer.branch}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Outstanding Amount:</span>
              <span className="text-sm font-semibold text-red-600">
                ₹{selectedCustomer.outstanding.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pending Invoices:</span>
              <span className="text-sm">{selectedCustomer.invoiceCount}</span>
            </div>
            {selectedCustomer.oldestInvoiceDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Oldest Invoice Date:</span>
                <span className="text-sm">
                  {new Date(selectedCustomer.oldestInvoiceDate).toLocaleDateString('en-IN')}
                </span>
              </div>
            )}
            {!selectedCustomer.customer.whatsapp_number && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This customer does not have a WhatsApp number configured. Please add it in the
                  customer configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Status Message */}
        {sendStatus && (
          <Alert variant={sendStatus.type === 'error' ? 'destructive' : 'default'}>
            {sendStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{sendStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={
            !selectedCustomer ||
            !selectedCustomer.customer.whatsapp_number ||
            sendReminderMutation.isPending ||
            customersLoading ||
            receivablesLoading
          }
          className="w-full"
        >
          {sendReminderMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Payment Reminder
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
