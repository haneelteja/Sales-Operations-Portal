import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { WhatsAppConfigurationSection } from './WhatsAppConfigurationSection';
import { WhatsAppTemplatesSection } from './WhatsAppTemplatesSection';

type SubTab = 'settings' | 'templates';

const WhatsAppConfigurationTab: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<SubTab>('settings');

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
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Configurations</h2>
        <p className="text-gray-600">
          Configure WhatsApp messaging for invoices, payment reminders, and notifications
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(['settings', 'templates'] as SubTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'pb-3 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab === 'settings' ? 'Settings' : 'Templates'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'settings' && <WhatsAppConfigurationSection />}
      {activeTab === 'templates' && <WhatsAppTemplatesSection />}
    </div>
  );
};

export default WhatsAppConfigurationTab;
