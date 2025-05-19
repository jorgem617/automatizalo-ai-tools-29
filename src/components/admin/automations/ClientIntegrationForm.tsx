
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ClientAutomationWithDetails, 
  ClientIntegrationSetting,
  fetchClientIntegrationSettings,
  saveClientIntegrationSetting,
  updateClientAutomationStatus
} from './client-integration-utils';
import LoadingIndicator from './LoadingIndicator';
import StatusSummary from './StatusSummary';
import IntegrationTabs from './IntegrationTabs';

interface ClientIntegrationFormProps {
  clientAutomation: ClientAutomationWithDetails;
  onBack: () => void;
  onConfigUpdate: () => void;
}

const ClientIntegrationForm: React.FC<ClientIntegrationFormProps> = ({
  clientAutomation,
  onBack,
  onConfigUpdate
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('webhook');
  const [integrationSettings, setIntegrationSettings] = useState<ClientIntegrationSetting[]>([]);
  
  useEffect(() => {
    loadIntegrationSettings();
  }, [clientAutomation.id]);
  
  const loadIntegrationSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await fetchClientIntegrationSettings(clientAutomation.id);
      setIntegrationSettings(settings);
      
      // Set initial active tab based on available integrations
      if (settings.length > 0) {
        setActiveTab(settings[0].integration_type);
      }
    } catch (error) {
      console.error('Failed to load integration settings:', error);
      toast.error('Failed to load integration settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async (setting: ClientIntegrationSetting) => {
    setIsSaving(true);
    try {
      const result = await saveClientIntegrationSetting({
        ...setting,
        status: 'configured'
      });
      
      if (result?.success) {
        toast.success(`${setting.integration_type} integration configured successfully`);
        await loadIntegrationSettings();
        
        // Update client automation status to in_progress if it was pending
        if (clientAutomation.setup_status === 'pending') {
          await updateClientAutomationStatus(clientAutomation.id, 'in_progress');
          onConfigUpdate();
        }
      }
    } catch (error) {
      console.error(`Failed to save ${setting.integration_type} integration:`, error);
      toast.error(`Failed to save ${setting.integration_type} integration`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCompleteSetup = async () => {
    setIsSaving(true);
    try {
      const pendingSettings = integrationSettings.filter(s => s.status === 'pending');
      
      if (pendingSettings.length > 0) {
        toast.warning('Please configure all integrations before completing setup');
        return;
      }
      
      // Update all integrations to active
      for (const setting of integrationSettings) {
        if (setting.status !== 'active') {
          await saveClientIntegrationSetting({
            ...setting,
            status: 'active'
          });
        }
      }
      
      // Update client automation status to completed
      await updateClientAutomationStatus(clientAutomation.id, 'completed');
      onConfigUpdate();
      
      toast.success('Client automation setup completed successfully');
    } catch (error) {
      console.error('Failed to complete setup:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateWebhookData = (setting: ClientIntegrationSetting, field: string, value: string) => {
    const updatedSettings = integrationSettings.map(s => 
      s.id === setting.id ? { ...s, [field]: value } : s
    );
    setIntegrationSettings(updatedSettings);
  };
  
  const updateIntegrationSettings = (updatedSettings: ClientIntegrationSetting[]) => {
    const newSettings = integrationSettings.map(s => {
      const updatedSetting = updatedSettings.find(us => us.id === s.id);
      return updatedSetting || s;
    });
    setIntegrationSettings(newSettings);
  };
  
  if (isLoading) {
    return <LoadingIndicator message="Loading integration settings..." />;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client Automations
        </Button>
        <h2 className="text-xl font-semibold">
          Configuring: {clientAutomation.automation?.title}
        </h2>
      </div>
      
      <div className="text-sm text-gray-500">
        Client: {clientAutomation.client?.email}
      </div>
      
      <StatusSummary 
        integrationSettings={integrationSettings}
        clientAutomation={clientAutomation}
        onCompleteSetup={handleCompleteSetup}
        isSaving={isSaving}
      />
      
      <IntegrationTabs
        integrationSettings={integrationSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={handleSave}
        updateIntegrationSettings={updateIntegrationSettings}
        updateWebhookData={updateWebhookData}
        isSaving={isSaving}
      />
    </div>
  );
};

export default ClientIntegrationForm;
