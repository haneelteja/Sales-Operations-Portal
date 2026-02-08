/**
 * Auto Invoice Generation Toggle Switch
 * Toggle switch component for enabling/disabling automatic invoice generation
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { InvoiceConfiguration } from '@/services/invoiceConfigService';

interface AutoInvoiceToggleProps {
  config: InvoiceConfiguration;
  value: boolean;
  onChange: (newValue: boolean) => void;
  isLoading?: boolean;
}

export const AutoInvoiceToggle: React.FC<AutoInvoiceToggleProps> = ({
  config,
  value,
  onChange,
  isLoading = false,
}) => {
  const handleToggle = (checked: boolean) => {
    if (!isLoading) {
      onChange(checked);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <>
          <Switch
            id={`toggle-${config.id}`}
            checked={value}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
          <Label
            htmlFor={`toggle-${config.id}`}
            className="text-sm font-normal cursor-pointer"
          >
            {value ? 'Enabled' : 'Disabled'}
          </Label>
        </>
      )}
    </div>
  );
};
