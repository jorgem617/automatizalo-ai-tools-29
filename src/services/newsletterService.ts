import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { NewsletterSubscription } from '@/types/automation';
import { toast } from 'sonner';

/**
 * Subscribe a user to the newsletter
 */
export const subscribeToNewsletter = async (email: string, frequency: string): Promise<boolean> => {
  try {
    const sql = `
      INSERT INTO newsletter_subscriptions (email, frequency)
      VALUES ('${escapeSql(email)}', '${escapeSql(frequency)}')
      ON CONFLICT (email) DO UPDATE SET frequency = EXCLUDED.frequency
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
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
