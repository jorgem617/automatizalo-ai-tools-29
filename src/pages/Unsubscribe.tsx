
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { runQuery } from '@/components/admin/adminActions';
import { escapeSql } from '@/components/admin/adminActions';

const Unsubscribe = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use runQuery since newsletter_subscriptions may not be in the generated types
      const { data: existingSubscriptions, error: checkError } = await runQuery(
        `SELECT id FROM newsletter_subscriptions WHERE email = '${escapeSql(email)}'`
      );
      
      if (checkError) {
        throw checkError;
      }

      // If the email doesn't exist, show a success message anyway for privacy reasons
      if (!existingSubscriptions || existingSubscriptions.length === 0) {
        console.log('Email not found in subscription list:', email);
        // We still show success for privacy reasons
        setUnsubscribed(true);
        setEmail('');
        setIsSubmitting(false);
        toast.success('You have been unsubscribed from our newsletter');
        return;
      }
      
      // Delete the subscription
      const { error: deleteError } = await runQuery(
        `DELETE FROM newsletter_subscriptions WHERE email = '${escapeSql(email)}'`
      );
      
      if (deleteError) {
        throw deleteError;
      }
      
      console.log('Successfully unsubscribed:', email);
      toast.success('You have been unsubscribed from our newsletter');
      setUnsubscribed(true);
      setEmail('');
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Unsubscribe from Newsletter</h1>
        <p className="text-gray-600 mb-8">
          We're sorry to see you go. Enter your email address below to unsubscribe from our newsletter.
        </p>
      </div>
      
      {unsubscribed ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
          <h2 className="text-xl font-medium text-green-800 mb-2">Successfully Unsubscribed</h2>
          <p className="text-green-700">
            You have been successfully unsubscribed from our newsletter. You will no longer receive emails from us.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8">
          <form onSubmit={handleUnsubscribe} className="max-w-md mx-auto">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Unsubscribe'}
            </Button>
            
            <p className="mt-4 text-sm text-gray-600 text-center">
              If you're having trouble, please contact us at contact@automatizalo.co
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default Unsubscribe;
