
import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { toast } from 'sonner';

// Types for newsletter functionality
export type NewsletterFrequency = 'weekly' | 'monthly';

export interface NewsletterSubscription {
  id: string;
  email: string;
  frequency: NewsletterFrequency;
  created_at: string;
}

export interface NewsletterTemplate {
  id?: string;
  name: string;
  subject: string;
  header_text?: string;
  footer_text?: string;
  created_at?: string;
}

export interface NewsletterContent {
  id?: string;
  template_id: string;
  title: string;
  content: string;
  position: number;
  created_at?: string;
}

export interface NewsletterHistory {
  id: string;
  template_id?: string;
  subject: string;
  content: string;
  frequency: NewsletterFrequency;
  recipient_count: number;
  sent_at: string;
}

export interface SendNewsletterOptions {
  templateId?: string;
  customSubject?: string;
  customContent?: string;
  testMode?: boolean;
  testEmail?: string;
}

/**
 * Subscribe a user to the newsletter
 */
export const subscribeToNewsletter = async (email: string, frequency: NewsletterFrequency): Promise<boolean> => {
  try {
    const sql = `
      INSERT INTO newsletter_subscriptions (email, frequency)
      VALUES ('${escapeSql(email)}', '${escapeSql(frequency)}')
      ON CONFLICT (email) DO UPDATE SET frequency = EXCLUDED.frequency
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    toast.success("Successfully subscribed to newsletter");
    return true;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    toast.error("Failed to subscribe to newsletter");
    return false;
  }
};

/**
 * Unsubscribe a user from the newsletter
 */
export const unsubscribeFromNewsletter = async (email: string): Promise<boolean> => {
  try {
    const sql = `
      DELETE FROM newsletter_subscriptions
      WHERE email = '${escapeSql(email)}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return false;
  }
};

/**
 * Get all newsletter subscribers
 */
export const getNewsletterSubscribers = async (): Promise<NewsletterSubscription[]> => {
  try {
    const sql = `
      SELECT * FROM newsletter_subscriptions
      ORDER BY created_at DESC
    `;
    
    const { data, error } = await runQuery<NewsletterSubscription>(sql);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting newsletter subscribers:', error);
    toast.error('Failed to load newsletter subscribers');
    return [];
  }
};

/**
 * Get subscriber count by frequency
 */
export const getSubscriberCountByFrequency = async (): Promise<{ frequency: string; count: number }[]> => {
  try {
    const sql = `
      SELECT frequency, COUNT(*) as count
      FROM newsletter_subscriptions
      GROUP BY frequency
      ORDER BY count DESC
    `;
    
    const { data, error } = await runQuery<{ frequency: string; count: number }>(sql);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting subscriber count by frequency:', error);
    return [];
  }
};

/**
 * Check if an email is subscribed
 */
export const isEmailSubscribed = async (email: string): Promise<boolean> => {
  try {
    const sql = `
      SELECT COUNT(*) as count
      FROM newsletter_subscriptions
      WHERE email = '${escapeSql(email)}'
    `;
    
    const { data, error } = await runQuery<{ count: number }>(sql);
    
    if (error) throw error;
    return data && data[0] && data[0].count > 0;
  } catch (error) {
    console.error('Error checking if email is subscribed:', error);
    return false;
  }
};

/**
 * Get all newsletter templates
 */
export const getNewsletterTemplates = async (): Promise<NewsletterTemplate[]> => {
  try {
    const sql = `
      SELECT * FROM newsletter_templates
      ORDER BY created_at DESC
    `;
    
    const { data, error } = await runQuery<NewsletterTemplate>(sql);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting newsletter templates:', error);
    toast.error('Failed to load newsletter templates');
    return [];
  }
};

/**
 * Create a new newsletter template
 */
export const createNewsletterTemplate = async (template: NewsletterTemplate): Promise<boolean> => {
  try {
    const { name, subject, header_text, footer_text } = template;
    
    const sql = `
      INSERT INTO newsletter_templates (name, subject, header_text, footer_text)
      VALUES (
        '${escapeSql(name)}', 
        '${escapeSql(subject)}', 
        ${header_text ? `'${escapeSql(header_text)}'` : 'NULL'}, 
        ${footer_text ? `'${escapeSql(footer_text)}'` : 'NULL'}
      )
      RETURNING id
    `;
    
    const { data, error } = await runQuery<{ id: string }>(sql);
    
    if (error) throw error;
    toast.success('Template created successfully');
    return true;
  } catch (error) {
    console.error('Error creating newsletter template:', error);
    toast.error('Failed to create template');
    return false;
  }
};

/**
 * Update an existing newsletter template
 */
export const updateNewsletterTemplate = async (id: string, template: NewsletterTemplate): Promise<boolean> => {
  try {
    const { name, subject, header_text, footer_text } = template;
    
    const sql = `
      UPDATE newsletter_templates
      SET 
        name = '${escapeSql(name)}', 
        subject = '${escapeSql(subject)}', 
        header_text = ${header_text ? `'${escapeSql(header_text)}'` : 'NULL'}, 
        footer_text = ${footer_text ? `'${escapeSql(footer_text)}'` : 'NULL'},
        updated_at = now()
      WHERE id = '${escapeSql(id)}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    toast.success('Template updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating newsletter template:', error);
    toast.error('Failed to update template');
    return false;
  }
};

/**
 * Delete a newsletter template
 */
export const deleteNewsletterTemplate = async (id: string): Promise<boolean> => {
  try {
    // First delete all template content
    const deleteContentSql = `
      DELETE FROM newsletter_content
      WHERE template_id = '${escapeSql(id)}'
    `;
    
    await runQuery(deleteContentSql);
    
    // Then delete the template
    const deleteTemplateSql = `
      DELETE FROM newsletter_templates
      WHERE id = '${escapeSql(id)}'
    `;
    
    const { error } = await runQuery(deleteTemplateSql);
    
    if (error) throw error;
    toast.success('Template deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting newsletter template:', error);
    toast.error('Failed to delete template');
    return false;
  }
};

/**
 * Get newsletter content for a specific template
 */
export const getNewsletterContentByTemplateId = async (templateId: string): Promise<NewsletterContent[]> => {
  try {
    const sql = `
      SELECT * FROM newsletter_content
      WHERE template_id = '${escapeSql(templateId)}'
      ORDER BY position ASC
    `;
    
    const { data, error } = await runQuery<NewsletterContent>(sql);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error getting content for template ${templateId}:`, error);
    toast.error('Failed to load template content');
    return [];
  }
};

/**
 * Add content to a newsletter template
 */
export const addNewsletterContent = async (content: NewsletterContent): Promise<boolean> => {
  try {
    const { template_id, title, content: htmlContent, position } = content;
    
    const sql = `
      INSERT INTO newsletter_content (template_id, title, content, position)
      VALUES (
        '${escapeSql(template_id)}', 
        '${escapeSql(title)}', 
        '${escapeSql(htmlContent)}',
        ${position}
      )
      RETURNING id
    `;
    
    const { error } = await runQuery<{ id: string }>(sql);
    
    if (error) throw error;
    toast.success('Content added successfully');
    return true;
  } catch (error) {
    console.error('Error adding newsletter content:', error);
    toast.error('Failed to add content');
    return false;
  }
};

/**
 * Update existing newsletter content
 */
export const updateNewsletterContent = async (id: string, content: Partial<NewsletterContent>): Promise<boolean> => {
  try {
    const updateFields = Object.entries(content)
      .filter(([key]) => ['title', 'content', 'position'].includes(key))
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key} = '${escapeSql(value)}'`;
        }
        return `${key} = ${value}`;
      })
      .join(', ');
    
    if (!updateFields) {
      return false;
    }
    
    const sql = `
      UPDATE newsletter_content
      SET ${updateFields}, updated_at = now()
      WHERE id = '${escapeSql(id)}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    toast.success('Content updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating newsletter content:', error);
    toast.error('Failed to update content');
    return false;
  }
};

/**
 * Delete newsletter content
 */
export const deleteNewsletterContent = async (id: string): Promise<boolean> => {
  try {
    const sql = `
      DELETE FROM newsletter_content
      WHERE id = '${escapeSql(id)}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    toast.success('Content deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting newsletter content:', error);
    toast.error('Failed to delete content');
    return false;
  }
};

/**
 * Get newsletter sending history
 */
export const getNewsletterHistory = async (): Promise<NewsletterHistory[]> => {
  try {
    const sql = `
      SELECT * FROM newsletter_history
      ORDER BY sent_at DESC
    `;
    
    const { data, error } = await runQuery<NewsletterHistory>(sql);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting newsletter history:', error);
    toast.error('Failed to load newsletter history');
    return [];
  }
};

/**
 * Preview a newsletter before sending
 */
export const previewNewsletter = async (
  frequency: NewsletterFrequency, 
  options: SendNewsletterOptions
): Promise<{ subject: string; content: string } | null> => {
  try {
    const { templateId, customSubject, customContent } = options;
    
    const response = await fetch(`${window.location.origin}/functions/v1/send-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency,
        templateId,
        customSubject,
        customContent,
        previewOnly: true
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate preview');
    }
    
    const data = await response.json();
    return {
      subject: data.subject,
      content: data.content
    };
  } catch (error) {
    console.error('Error previewing newsletter:', error);
    toast.error('Failed to generate preview');
    return null;
  }
};

/**
 * Send a newsletter
 */
export const sendNewsletter = async (
  frequency: NewsletterFrequency, 
  options: SendNewsletterOptions
): Promise<boolean> => {
  try {
    const { templateId, customSubject, customContent, testMode, testEmail } = options;
    
    const response = await fetch(`${window.location.origin}/functions/v1/send-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency,
        templateId,
        customSubject,
        customContent,
        testMode,
        testEmail
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send newsletter');
    }
    
    const data = await response.json();
    
    if (testMode) {
      toast.success('Test email sent successfully');
    } else {
      toast.success(`Newsletter sent to ${data.message || 'subscribers'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending newsletter:', error);
    toast.error('Failed to send newsletter');
    return false;
  }
};

/**
 * Toggle newsletter automation
 */
export const toggleNewsletterAutomation = async (
  enabled: boolean, 
  settings: { weeklyTemplateId?: string; monthlyTemplateId?: string }
): Promise<boolean> => {
  try {
    const { weeklyTemplateId, monthlyTemplateId } = settings;
    
    const response = await fetch(`${window.location.origin}/functions/v1/toggle-newsletter-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enable: enabled,
        weeklyTemplateId,
        monthlyTemplateId
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to toggle automation');
    }
    
    const data = await response.json();
    
    toast.success(data.message || `Newsletter automation ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  } catch (error) {
    console.error('Error toggling newsletter automation:', error);
    toast.error('Failed to update automation settings');
    return false;
  }
};
