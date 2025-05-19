
import React from 'react';
import { Box } from 'lucide-react';
import CodeIntegration from './CodeIntegration';
import { ClientIntegrationSetting } from '../client-integration-utils';

interface FormIntegrationTabProps {
  formSetting: ClientIntegrationSetting;
  isSaving: boolean;
  onSave: (setting: ClientIntegrationSetting) => void;
  onUpdateSetting: (updatedSettings: ClientIntegrationSetting[]) => void;
}

const FormIntegrationTab: React.FC<FormIntegrationTabProps> = ({
  formSetting,
  isSaving,
  onSave,
  onUpdateSetting
}) => {
  if (!formSetting) return null;
  
  return (
    <CodeIntegration
      data={{
        automation_id: formSetting.client_automation_id,
        integration_type: 'form',
        integration_code: formSetting.integration_code || ''
      }}
      type="form"
      title="Form Integration"
      description="Paste the HTML code for the client's form embed"
      placeholder="<iframe src='https://form-url' ...>"
      icon={<Box className="h-5 w-5" />}
      onCodeChange={(value) => {
        const updatedSetting = { ...formSetting, integration_code: value };
        onUpdateSetting([updatedSetting]);
      }}
      onSave={() => onSave(formSetting)}
      isSaving={isSaving}
    />
  );
};

export default FormIntegrationTab;
