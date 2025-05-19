import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { castRelation, safeCastArray } from "@/utils/supabaseHelpers";
import { Automation } from "@/types/automation";

// Define the missing ClientIntegrationSetting type
export interface ClientIntegrationSetting {
  id?: string;
  client_automation_id: string;
  integration_type: 'webhook' | 'form' | 'table' | 'custom_prompt';
  test_url?: string;
  production_url?: string;
  integration_code?: string;
  prompt_text?: string;
  status: 'pending' | 'configured' | 'active';
  created_at?: string;
  updated_at?: string;
  last_updated_by?: string;
}

export interface ClientAutomationWithDetails {
  id: string;
  client_id: string;
  automation_id: string;
  status: 'active' | 'canceled' | 'pending';
  setup_status: 'pending' | 'in_progress' | 'completed';
  purchase_date: string;
  next_billing_date: string;
  client?: { email: string; id: string };
  automation?: Automation;
}

// Function to fetch client automations for the manager
export const fetchClientAutomations = async (): Promise<ClientAutomationWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('client_automations')
      .select(`
        *,
        client:client_id(id, email),
        automation:automation_id(*)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Process the data to handle potential relation errors
    return data.map(item => {
      // Define default automation
      const defaultAutomation: Automation = {
        id: item.automation_id,
        title: 'Unknown Automation',
        description: '',
        has_webhook: false,
        has_custom_prompt: false,
        has_form_integration: false,
        has_table_integration: false,
        installation_price: 0,
        monthly_price: 0,
        active: true,
        created_at: '',
        updated_at: ''
      };
      
      return {
        ...item,
        client: item.client || { id: item.client_id, email: 'Unknown Client' },
        automation: castRelation<Automation>(item.automation) || defaultAutomation
      } as ClientAutomationWithDetails;
    });
  } catch (error) {
    console.error('Failed to fetch client automations:', error);
    toast.error('Failed to load client automations');
    return [];
  }
};

// Function to fetch client integration settings
export const fetchClientIntegrationSettings = async (clientAutomationId: string): Promise<ClientIntegrationSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('client_integration_settings')
      .select('*')
      .eq('client_automation_id', clientAutomationId);
      
    if (error) throw error;
    
    // If no settings exist, create default ones based on automation capabilities
    if (data.length === 0) {
      return await initializeClientIntegrationSettings({
        id: clientAutomationId,
        automation_id: '', // Will be populated from the query below
        client_id: '',
        status: 'active',
        setup_status: 'pending',
        purchase_date: '',
        next_billing_date: ''
      });
    }
    
    return data as ClientIntegrationSetting[];
  } catch (error) {
    console.error('Failed to fetch integration settings:', error);
    toast.error('Failed to load integration settings');
    return [];
  }
};

// Initialize client integration settings based on automation capabilities
export const initializeClientIntegrationSettings = async (
  clientAutomation: Partial<ClientAutomationWithDetails>
): Promise<ClientIntegrationSetting[]> => {
  try {
    // First, get the automation details if not already provided
    let automation = clientAutomation.automation;
    
    if (!automation) {
      const { data: automationData, error: automationError } = await supabase
        .from('client_automations')
        .select('automation:automation_id(*)')
        .eq('id', clientAutomation.id)
        .single();
        
      if (automationError) throw automationError;
      
      // Define default automation
      const defaultAutomation: Automation = {
        id: '',
        title: 'Unknown Automation',
        description: '',
        has_webhook: false,
        has_custom_prompt: false,
        has_form_integration: false,
        has_table_integration: false,
        installation_price: 0,
        monthly_price: 0,
        active: true,
        created_at: '',
        updated_at: ''
      };
      
      // Use castRelation with a default value
      automation = castRelation<Automation>(automationData?.automation) || defaultAutomation;
    }
    
    const settingsToCreate: ClientIntegrationSetting[] = [];
    
    if (automation.has_webhook) {
      settingsToCreate.push({
        client_automation_id: clientAutomation.id!,
        integration_type: 'webhook',
        status: 'pending'
      });
    }
    
    if (automation.has_custom_prompt) {
      settingsToCreate.push({
        client_automation_id: clientAutomation.id!,
        integration_type: 'custom_prompt',
        status: 'pending'
      });
    }
    
    if (automation.has_form_integration) {
      settingsToCreate.push({
        client_automation_id: clientAutomation.id!,
        integration_type: 'form',
        status: 'pending'
      });
    }
    
    if (automation.has_table_integration) {
      settingsToCreate.push({
        client_automation_id: clientAutomation.id!,
        integration_type: 'table',
        status: 'pending'
      });
    }
    
    if (settingsToCreate.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('client_integration_settings')
        .insert(settingsToCreate)
        .select();
        
      if (insertError) throw insertError;
      
      return insertedData as ClientIntegrationSetting[];
    }
    
    return [];
  } catch (error) {
    console.error('Failed to initialize integration settings:', error);
    toast.error('Failed to initialize integration settings');
    return [];
  }
};

// Function to save client integration setting
export const saveClientIntegrationSetting = async (setting: ClientIntegrationSetting): Promise<{ success: boolean }> => {
  try {
    const { id, ...updateData } = setting;
    
    // Update existing setting or create new one
    if (id) {
      const { error } = await supabase
        .from('client_integration_settings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('client_integration_settings')
        .insert({
          ...updateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save integration setting:', error);
    toast.error('Failed to save integration settings');
    return { success: false };
  }
};

// Function to update client automation status
export const updateClientAutomationStatus = async (
  clientAutomationId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('client_automations')
      .update({
        setup_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientAutomationId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update automation status:', error);
    toast.error('Failed to update automation status');
    return { success: false };
  }
};
