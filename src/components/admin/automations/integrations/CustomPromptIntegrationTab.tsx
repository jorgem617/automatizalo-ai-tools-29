
import React from 'react';
import { MessageSquare } from 'lucide-react';
import CodeIntegration from './CodeIntegration';
import { ClientIntegrationSetting } from '../client-integration-utils';

interface CustomPromptIntegrationTabProps {
  promptSetting: ClientIntegrationSetting;
  isSaving: boolean;
  onSave: (setting: ClientIntegrationSetting) => void;
  onUpdateSetting: (updatedSettings: ClientIntegrationSetting[]) => void;
}

const CustomPromptIntegrationTab: React.FC<CustomPromptIntegrationTabProps> = ({
  promptSetting,
  isSaving,
  onSave,
  onUpdateSetting
}) => {
  if (!promptSetting) return null;
  
  return (
    <CodeIntegration
      data={{
        automation_id: promptSetting.client_automation_id,
        integration_type: 'custom_prompt',
        prompt_text: promptSetting.prompt_text || ''
      }}
      type="custom_prompt"
      title="Custom Prompt Template"
      description="Configure the prompt template for this automation"
      placeholder="Enter the prompt template for this client..."
      icon={<MessageSquare className="h-5 w-5" />}
      onCodeChange={(value) => {
        const updatedSetting = { ...promptSetting, prompt_text: value };
        onUpdateSetting([updatedSetting]);
      }}
      onSave={() => onSave(promptSetting)}
      isSaving={isSaving}
    />
  );
};

export default CustomPromptIntegrationTab;
