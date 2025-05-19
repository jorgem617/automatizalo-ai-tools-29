
import React from 'react';
import WebhookIntegration from './WebhookIntegration';
import { ClientIntegrationSetting } from '../client-integration-utils';

interface WebhookIntegrationTabProps {
  webhookSetting: ClientIntegrationSetting;
  isSaving: boolean;
  onSave: (setting: ClientIntegrationSetting) => void;
  onUpdateData: (setting: ClientIntegrationSetting, field: string, value: string) => void;
}

const WebhookIntegrationTab: React.FC<WebhookIntegrationTabProps> = ({ 
  webhookSetting, 
  isSaving, 
  onSave,
  onUpdateData 
}) => {
  if (!webhookSetting) return null;
  
  return (
    <WebhookIntegration
      webhookData={{
        automation_id: webhookSetting.client_automation_id,
        integration_type: 'webhook',
        test_url: webhookSetting.test_url || '',
        production_url: webhookSetting.production_url || ''
      }}
      onWebhookTestUrlChange={(value) => onUpdateData(webhookSetting, 'test_url', value)}
      onWebhookProdUrlChange={(value) => onUpdateData(webhookSetting, 'production_url', value)}
      onSaveWebhook={() => onSave(webhookSetting)}
      isSaving={isSaving}
    />
  );
};

export default WebhookIntegrationTab;
