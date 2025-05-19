
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

// Add new interface for newsletter subscriptions for type safety
export interface NewsletterSubscription {
  id: string;
  email: string;
  frequency: string;
  created_at: string;
  updated_at?: string;
}
