
import React, { useState, useEffect } from 'react';
import { useAdminVerification } from '@/hooks/useAdminVerification';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ClientAutomationWithDetails,
  fetchClientAutomations,
  initializeClientIntegrationSettings
} from '@/components/admin/automations/client-integration-utils';
import ClientAutomationsList from '@/components/admin/automations/ClientAutomationsList';
import ClientIntegrationForm from '@/components/admin/automations/ClientIntegrationForm';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminContent from '@/components/layout/admin/AdminContent';

const ClientAutomationsManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [clientAutomations, setClientAutomations] = useState<ClientAutomationWithDetails[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<ClientAutomationWithDetails | null>(null);
  const { isAdmin, isVerifying } = useAdminVerification();
  const isMobile = useIsMobile();

  const fetchData = async () => {
    setIsLoading(true);
    console.log('Fetching client automations...');
    try {
      const data = await fetchClientAutomations();
      console.log(`Successfully fetched ${data.length} client automations`);
      setClientAutomations(data);
    } catch (error) {
      console.error('Error fetching client automations:', error);
      toast.error('Failed to load client automations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !isVerifying) {
      fetchData();
    }
  }, [isAdmin, isVerifying]);

  const handleViewConfig = async (automation: ClientAutomationWithDetails) => {
    setSelectedAutomation(automation);
    
    // Initialize settings if this is a new automation (setup_status is pending)
    if (automation.setup_status === 'pending') {
      const initialized = await initializeClientIntegrationSettings(automation);
      if (initialized) {
        toast.success('Integration settings initialized successfully');
      }
    }
  };

  const handleBack = () => {
    setSelectedAutomation(null);
    fetchData();
  };

  if (isVerifying) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-600">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-2 font-semibold">Access denied</p>
        <p className="text-gray-600">You don't have permission to access this section.</p>
      </div>
    );
  }

  return (
    <AdminContent>
      {selectedAutomation ? (
        <ClientIntegrationForm 
          clientAutomation={selectedAutomation}
          onBack={handleBack}
          onConfigUpdate={fetchData}
        />
      ) : (
        <ClientAutomationsList 
          clientAutomations={clientAutomations}
          isLoading={isLoading}
          onViewConfig={handleViewConfig}
        />
      )}
    </AdminContent>
  );
};

export default ClientAutomationsManager;
