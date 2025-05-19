
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientIntegrationSetting } from './client-integration-utils';
import WebhookIntegrationTab from './integrations/WebhookIntegrationTab';
import CustomPromptIntegrationTab from './integrations/CustomPromptIntegrationTab';
import FormIntegrationTab from './integrations/FormIntegrationTab';
import TableIntegrationTab from './integrations/TableIntegrationTab';

interface IntegrationTabsProps {
  integrationSettings: ClientIntegrationSetting[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: (setting: ClientIntegrationSetting) => void;
  updateIntegrationSettings: (settings: ClientIntegrationSetting[]) => void;
  updateWebhookData: (setting: ClientIntegrationSetting, field: string, value: string) => void;
  isSaving: boolean;
}

const IntegrationTabs: React.FC<IntegrationTabsProps> = ({
  integrationSettings,
  activeTab,
  setActiveTab,
  onSave,
  updateIntegrationSettings,
  updateWebhookData,
  isSaving
}) => {
  const availableIntegrations = integrationSettings.map(s => s.integration_type);
  
  const getSettingByType = (type: string): ClientIntegrationSetting | undefined => {
    return integrationSettings.find(setting => setting.integration_type === type);
  };
  
  if (availableIntegrations.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-md text-center">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No integrations available for this automation.</p>
      </div>
    );
  }
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full" style={{ 
        gridTemplateColumns: `repeat(${availableIntegrations.length}, 1fr)` 
      }}>
        {availableIntegrations.includes('webhook') && 
          <TabsTrigger value="webhook">Webhook</TabsTrigger>}
        {availableIntegrations.includes('custom_prompt') && 
          <TabsTrigger value="custom_prompt">Custom Prompt</TabsTrigger>}
        {availableIntegrations.includes('form') && 
          <TabsTrigger value="form">Form</TabsTrigger>}
        {availableIntegrations.includes('table') && 
          <TabsTrigger value="table">Table</TabsTrigger>}
      </TabsList>
      
      {availableIntegrations.includes('webhook') && (
        <TabsContent value="webhook" className="pt-4">
          <WebhookIntegrationTab
            webhookSetting={getSettingByType('webhook')!}
            isSaving={isSaving}
            onSave={onSave}
            onUpdateData={updateWebhookData}
          />
        </TabsContent>
      )}
      
      {availableIntegrations.includes('custom_prompt') && (
        <TabsContent value="custom_prompt" className="pt-4">
          <CustomPromptIntegrationTab
            promptSetting={getSettingByType('custom_prompt')!}
            isSaving={isSaving}
            onSave={onSave}
            onUpdateSetting={updateIntegrationSettings}
          />
        </TabsContent>
      )}
      
      {availableIntegrations.includes('form') && (
        <TabsContent value="form" className="pt-4">
          <FormIntegrationTab
            formSetting={getSettingByType('form')!}
            isSaving={isSaving}
            onSave={onSave}
            onUpdateSetting={updateIntegrationSettings}
          />
        </TabsContent>
      )}
      
      {availableIntegrations.includes('table') && (
        <TabsContent value="table" className="pt-4">
          <TableIntegrationTab
            tableSetting={getSettingByType('table')!}
            isSaving={isSaving}
            onSave={onSave}
            onUpdateSetting={updateIntegrationSettings}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default IntegrationTabs;
