/**
 * Storage Provider Select Component
 * Dropdown select for choosing cloud storage provider (Google Drive or OneDrive)
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { InvoiceConfiguration } from '@/services/invoiceConfigService';

interface StorageProviderSelectProps {
  config: InvoiceConfiguration;
  value: 'google_drive' | 'onedrive';
  onChange: (newValue: 'google_drive' | 'onedrive') => void;
  isLoading?: boolean;
}

export const StorageProviderSelect: React.FC<StorageProviderSelectProps> = ({
  value,
  onChange,
  isLoading = false,
}) => {
  const handleChange = (newValue: string) => {
    if (!isLoading && (newValue === 'google_drive' || newValue === 'onedrive')) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center justify-center">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <Select value={value} onValueChange={handleChange} disabled={isLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google_drive">Google Drive</SelectItem>
            <SelectItem value="onedrive">OneDrive</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
