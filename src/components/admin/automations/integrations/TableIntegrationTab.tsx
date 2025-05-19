
import React from 'react';
import { Table } from 'lucide-react';
import CodeIntegration from './CodeIntegration';
import { ClientIntegrationSetting } from '../client-integration-utils';

interface TableIntegrationTabProps {
  tableSetting: ClientIntegrationSetting;
  isSaving: boolean;
  onSave: (setting: ClientIntegrationSetting) => void;
  onUpdateSetting: (updatedSettings: ClientIntegrationSetting[]) => void;
}

const TableIntegrationTab: React.FC<TableIntegrationTabProps> = ({
  tableSetting,
  isSaving,
  onSave,
  onUpdateSetting
}) => {
  if (!tableSetting) return null;
  
  return (
    <CodeIntegration
      data={{
        automation_id: tableSetting.client_automation_id,
        integration_type: 'table',
        integration_code: tableSetting.integration_code || ''
      }}
      type="table"
      title="Table Integration"
      description="Paste the HTML code for the client's table embed"
      placeholder="<iframe src='https://table-url' ...>"
      icon={<Table className="h-5 w-5" />}
      onCodeChange={(value) => {
        const updatedSetting = { ...tableSetting, integration_code: value };
        onUpdateSetting([updatedSetting]);
      }}
      onSave={() => onSave(tableSetting)}
      isSaving={isSaving}
    />
  );
};

export default TableIntegrationTab;
