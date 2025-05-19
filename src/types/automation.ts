
export interface Automation {
  id: string;
  title: string;
  description: string;
  installation_price: number;
  monthly_price: number;
  has_webhook: boolean;
  has_custom_prompt: boolean;
  has_form_integration: boolean;
  has_table_integration: boolean;
  active: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientAutomation {
  id: string;
  client_id: string;
  automation_id: string;
  purchase_date: string;
  status: 'active' | 'canceled' | 'pending';
  next_billing_date: string;
  setup_status: 'pending' | 'in_progress' | 'completed';
  automation?: Automation;
  created_at?: string;
  updated_at?: string;
}

export interface SupportTicket {
  id: string;
  client_id: string;
  automation_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

// Add interface for newsletter subscriptions
export interface NewsletterSubscription {
  id: string;
  email: string;
  frequency: string;
  created_at: string;
  updated_at?: string;
}

// Add interface for ticket responses
export interface TicketResponse {
  id: string;
  ticket_id: string;
  message: string;
  created_by: string;
  is_admin: boolean;
  created_at: string;
}

// Add interface for integrations
export interface Integration {
  id?: string;
  automation_id: string;
  integration_type: 'webhook' | 'form' | 'table' | 'custom_prompt';
  test_url?: string;
  production_url?: string;
  integration_code?: string;
  prompt_text?: string; // Added field for custom prompts
  created_at?: string;
  updated_at?: string;
}
