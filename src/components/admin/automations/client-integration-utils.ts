
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { escapeSql, runQuery } from '@/components/admin/adminActions';
import { ClientIntegrationSetting, ClientAutomation, User, isErrorResponse } from '@/types/supabase';

export interface ClientAutomationWithDetails {
  id: string;
  client_id: string;
  automation_id: string;
  purchase_date: string;
  status: 'active' | 'canceled' | 'pending';
  next_billing_date: string;
  setup_status: 'pending' | 'in_progress' | 'completed';
  client?: User;
  automation?: {
    id: string;
    title: string;
    description: string;
    has_webhook: boolean;
    has_custom_prompt: boolean;
    has_form_integration: boolean;
    has_table_integration: boolean;
  };
}

/**
 * Fetches client automation details
 */
export const fetchClientAutomations = async () => {
  try {
    console.log("Fetching client automations...");
    
    // First fetch client automations with automation details
    const { data: automations, error: automationsError } = await supabase
      .from('client_automations')
      .select(`
        *,
        automation:automations(*)
      `);

    if (automationsError) {
      throw automationsError;
    }

    // For each client automation, fetch the associated user information separately
    const clientAutomationsWithDetails = await Promise.all((automations || []).map(async (item: any) => {
      // Get client info from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', item.client_id)
        .single();
      
      // Even if user fetch fails, continue with default values
      const clientData = userError ? 
        { id: item.client_id, email: 'Unknown email' } : 
        userData;
      
      return {
        id: item.id,
        client_id: item.client_id,
        automation_id: item.automation_id,
        purchase_date: item.purchase_date,
        status: item.status,
        next_billing_date: item.next_billing_date,
        setup_status: item.setup_status,
        client: clientData,
        automation: item.automation
      } as ClientAutomationWithDetails;
    }));
    
    console.log(`Successfully fetched ${clientAutomationsWithDetails.length} client automations`);
    return clientAutomationsWithDetails;
  } catch (error) {
    console.error('Failed to fetch client automations:', error);
    toast.error('Failed to load client automation data');
    return [];
  }
};

/**
 * Fetches integration settings for a specific client automation
 */
export const fetchClientIntegrationSettings = async (clientAutomationId: string) => {
  if (!clientAutomationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('client_integration_settings')
      .select('*')
      .eq('client_automation_id', clientAutomationId)
      .order('integration_type');

    if (error) {
      throw error;
    }
    
    return data as ClientIntegrationSetting[];
  } catch (error) {
    console.error('Failed to fetch integration settings:', error);
    toast.error('Failed to load integration settings');
    return [];
  }
};

/**
 * Saves an integration setting (creates or updates)
 */
export const saveClientIntegrationSetting = async (data: ClientIntegrationSetting) => {
  if (!data || !data.client_automation_id) return null;
  
  try {
    let result;
    
    if (data.id) {
      // Update existing setting
      const { data: updatedData, error } = await supabase
        .from('client_integration_settings')
        .update({
          test_url: data.test_url,
          production_url: data.production_url,
          integration_code: data.integration_code,
          prompt_text: data.prompt_text,
          status: data.status,
          last_updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', data.id)
        .select();
      
      if (error) throw error;
      result = updatedData?.[0];
    } else {
      // Create new setting
      const { data: newData, error } = await supabase
        .from('client_integration_settings')
        .insert({
          client_automation_id: data.client_automation_id,
          integration_type: data.integration_type,
          test_url: data.test_url,
          production_url: data.production_url,
          integration_code: data.integration_code,
          prompt_text: data.prompt_text,
          status: data.status,
          last_updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select();
      
      if (error) throw error;
      result = newData?.[0];
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Failed to save ${data.integration_type} setting:`, error);
    toast.error(`Failed to save ${data.integration_type} setting`);
    return { success: false, error };
  }
};

/**
 * Updates the setup status of a client automation
 */
export const updateClientAutomationStatus = async (id: string, setupStatus: 'pending' | 'in_progress' | 'completed') => {
  try {
    const { error } = await supabase
      .from('client_automations')
      .update({ 
        setup_status: setupStatus,
      })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update client automation status:', error);
    toast.error('Failed to update automation status');
    return false;
  }
};

/**
 * Creates empty integration settings for a client automation based on the automation's features
 */
export const initializeClientIntegrationSettings = async (clientAutomation: ClientAutomationWithDetails) => {
  if (!clientAutomation?.id || !clientAutomation.automation) return false;
  
  const settingsToCreate = [];
  const { has_webhook, has_custom_prompt, has_form_integration, has_table_integration } = clientAutomation.automation;
  
  if (has_webhook) {
    settingsToCreate.push({
      client_automation_id: clientAutomation.id,
      integration_type: 'webhook' as const,
      status: 'pending' as const
    });
  }
  
  if (has_custom_prompt) {
    settingsToCreate.push({
      client_automation_id: clientAutomation.id,
      integration_type: 'custom_prompt' as const,
      status: 'pending' as const
    });
  }
  
  if (has_form_integration) {
    settingsToCreate.push({
      client_automation_id: clientAutomation.id,
      integration_type: 'form' as const,
      status: 'pending' as const
    });
  }
  
  if (has_table_integration) {
    settingsToCreate.push({
      client_automation_id: clientAutomation.id,
      integration_type: 'table' as const,
      status: 'pending' as const
    });
  }
  
  try {
    if (settingsToCreate.length > 0) {
      const { error } = await supabase
        .from('client_integration_settings')
        .insert(settingsToCreate as any);
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize integration settings:', error);
    toast.error('Failed to initialize integration settings');
    return false;
  }
};
