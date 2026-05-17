import type { PaymentForm } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';

type PaymentEntryCardProps = {
  paymentForm: PaymentForm;
  customerName: string;
  customerNames: string[];
  branches: string[];
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCustomerChange: (customerName: string) => void;
  onBranchChange: (branch: string) => void;
  onFormChange: (updates: Partial<PaymentForm>) => void;
  safeNumValue: (value: string | number | undefined | null) => string;
};

export function PaymentEntryCard({
  paymentForm,
  customerName,
  customerNames,
  branches,
  isPending,
  onSubmit,
  onCustomerChange,
  onBranchChange,
  onFormChange,
  safeNumValue,
}: PaymentEntryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="mb-0">Record Client Payment</CardTitle>
          <CardDescription className="mb-0">Record a payment received from client</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-date">Date</Label>
              <Input
                id="payment-date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={paymentForm.transaction_date}
                onChange={(e) => onFormChange({ transaction_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-customer">Client *</Label>
              <SearchableSelect
                options={customerNames.map(n => ({ value: n, label: n }))}
                value={customerName}
                onValueChange={onCustomerChange}
                placeholder="Select client"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-area">Branch *</Label>
              <SearchableSelect
                options={branches.map(b => ({ value: b, label: b }))}
                value={paymentForm.area ?? ''}
                onValueChange={onBranchChange}
                placeholder={paymentForm.customer_id ? 'Select branch' : 'Select client first'}
                disabled={!paymentForm.customer_id}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (Rs) *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={safeNumValue(paymentForm.amount)}
                onChange={(e) => onFormChange({ amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-description">Description</Label>
              <Input
                id="payment-description"
                value={paymentForm.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                placeholder="Payment details..."
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
