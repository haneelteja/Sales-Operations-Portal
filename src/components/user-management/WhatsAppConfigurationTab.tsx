/**
 * WhatsApp Configuration Tab
 * Dedicated tab for managing WhatsApp integration settings
 */

import React from 'react';
import { WhatsAppConfigurationSection } from './WhatsAppConfigurationSection';

const WhatsAppConfigurationTab: React.FC = () => {
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
