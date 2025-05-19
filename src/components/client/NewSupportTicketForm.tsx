import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClientAutomation, Automation } from '@/types/automation';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { castRelation } from '@/utils/supabaseHelpers';

interface NewSupportTicketFormProps {
  preselectedAutomationId?: string;
}

const NewSupportTicketForm: React.FC<NewSupportTicketFormProps> = ({ preselectedAutomationId }) => {
  const [automations, setAutomations] = useState<ClientAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    automationId: preselectedAutomationId || ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMyAutomations();
    }
  }, [user]);

  const fetchMyAutomations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('client_automations')
        .select('*, automation:automation_id(*)')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .order('purchase_date', { ascending: false });
        
      if (error) throw error;
      
      // Process the data to handle potential relation errors
      const typedData = data.map(item => {
        // Handle the automation relation which might be an error
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
          automation: castRelation(item.automation, defaultAutomation)
        } as ClientAutomation;
      });
      
      setAutomations(typedData);
      
      if (typedData.length > 0 && !preselectedAutomationId) {
        setFormData(prev => ({
          ...prev,
          automationId: typedData[0].automation_id
        }));
      }
    } catch (error) {
      console.error('Error fetching client automations:', error);
      toast.error('Failed to load your automations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAutomationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      automationId: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a support ticket');
      return;
    }
    
    if (!formData.automationId) {
      toast.error('Please select an automation');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          client_id: user.id,
          automation_id: formData.automationId,
          title: formData.title,
          description: formData.description,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (error) throw error;
      
      toast.success('Support ticket created successfully');
      navigate('/client-portal'); // Fixed: Navigate to client-portal instead of client-portal/support
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      toast.error(error.message || 'Failed to create support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (automations.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-2">No Active Automations</h2>
        <p className="text-gray-500 mb-4">You need an active automation to create a support ticket.</p>
        <Button onClick={() => navigate('/client-portal/marketplace')}>
          Browse Marketplace
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="automationId">Select Automation</Label>
            <Select 
              value={formData.automationId} 
              onValueChange={handleAutomationChange}
              disabled={!!preselectedAutomationId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an automation" />
              </SelectTrigger>
              <SelectContent>
                {automations.map((item) => (
                  <SelectItem key={item.automation_id} value={item.automation_id}>
                    {item.automation?.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please provide details about your issue"
              rows={6}
              required
            />
          </div>

          <div className="pt-2 flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/client-portal/support')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewSupportTicketForm;
