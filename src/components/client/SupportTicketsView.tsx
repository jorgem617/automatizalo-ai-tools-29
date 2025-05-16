
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, ClientAutomation } from '@/types/automation';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import TicketCard from './ticket/TicketCard';
import { castRelation } from '@/utils/supabaseHelpers';

const SupportTicketsView = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [automations, setAutomations] = useState<ClientAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchSupportTickets(),
        fetchMyAutomations()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const fetchSupportTickets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const typedData = data?.map(ticket => ({
        ...ticket,
        status: ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed'
      })) || [];
      
      setTickets(typedData);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast.error('Failed to load your support tickets');
    }
  };
  
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
        const defaultAutomation = {
          id: item.automation_id,
          title: 'Unknown Automation',
          description: '',
          has_webhook: false,
          has_custom_prompt: false,
          has_form_integration: false,
          has_table_integration: false,
          installation_price: 0,
          monthly_price: 0,
          active: true
        };
        
        return {
          ...item,
          automation: castRelation(item.automation, defaultAutomation)
        } as ClientAutomation;
      });
      
      setAutomations(typedData);
    } catch (error) {
      console.error('Error fetching client automations:', error);
    }
  };

  const getAutomationTitle = (automationId: string) => {
    const clientAutomation = automations.find(a => a.automation_id === automationId);
    return clientAutomation?.automation?.title || 'Unknown Automation';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-xl font-bold">Support Tickets</h2>
        <Link to="/client-portal/support/new">
          <Button>Create New Ticket</Button>
        </Link>
      </div>
      
      {tickets.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">You haven't created any support tickets yet.</p>
          <Link to="/client-portal/support/new">
            <Button className="mt-4">Create Your First Ticket</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {tickets.map((ticket) => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              automationTitle={getAutomationTitle(ticket.automation_id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTicketsView;
