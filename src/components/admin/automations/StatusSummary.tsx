
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientIntegrationSetting, ClientAutomationWithDetails } from './client-integration-utils';

interface StatusSummaryProps {
  integrationSettings: ClientIntegrationSetting[];
  clientAutomation: ClientAutomationWithDetails;
  onCompleteSetup: () => Promise<void>;
  isSaving: boolean;
}

const StatusSummary: React.FC<StatusSummaryProps> = ({
  integrationSettings,
  clientAutomation,
  onCompleteSetup,
  isSaving
}) => {
  const total = integrationSettings.length;
  const configured = integrationSettings.filter(s => s.status === 'configured' || s.status === 'active').length;
  const completed = clientAutomation.setup_status === 'completed';
  
  return (
    <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-medium">Integration Status</h3>
        <p className="text-sm text-gray-500">{configured}/{total} configured</p>
      </div>
      <div>
        {completed ? (
          <Badge className="bg-green-100 text-green-800">Setup Completed</Badge>
        ) : (
          <Button 
            size="sm"
            onClick={onCompleteSetup}
            disabled={configured < total || isSaving}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
};

export default StatusSummary;
