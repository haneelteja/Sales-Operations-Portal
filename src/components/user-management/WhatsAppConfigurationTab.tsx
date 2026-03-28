/**
 * WhatsApp Configuration Tab
 * Dedicated tab for managing WhatsApp integration settings
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { WhatsAppConfigurationSection } from './WhatsAppConfigurationSection';

const WhatsAppConfigurationTab: React.FC = () => {
  const { profile } = useAuth();

  if (profile?.role !== 'manager') {
    return (
      <Alert className="m-6" variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. This page is only available to users with Manager role.
          Your current role: {profile?.role || 'Unknown'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Configurations</h2>
        <p className="text-gray-600">
          Configure WhatsApp messaging for invoices, payment reminders, and notifications
        </p>
      </div>

      {/* WhatsApp Configuration Section */}
      <WhatsAppConfigurationSection />
    </div>
  );
};

export default WhatsAppConfigurationTab;
