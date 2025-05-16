
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, TicketResponse } from '@/types/supabase';

interface TicketDetailProps {
  ticket?: SupportTicket | null;
  responses?: TicketResponse[];
  automations?: any[];
  user?: any;
  onStatusChange?: (status: 'open' | 'in_progress' | 'resolved' | 'closed') => void;
  onResponseSubmit?: () => void;
  fetchTicketResponses?: (ticketId: string) => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ 
  ticket, 
  responses = [], 
  automations = [],
  user,
  onStatusChange,
  onResponseSubmit,
  fetchTicketResponses
}) => {
  const { id: ticketId } = useParams<{ id: string }>();
  const [responseMessage, setResponseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user: authUser } = useAuth();

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        toast.error('Failed to load ticket');
        console.error('Error fetching ticket:', error);
        return null;
      }

      return data as SupportTicket;
    } catch (err) {
      console.error('Error in fetchTicket:', err);
      toast.error('Failed to load ticket');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load responses');
        console.error('Error fetching responses:', error);
        return [];
      }

      return data as TicketResponse[];
    } catch (err) {
      console.error('Error in fetchResponses:', err);
      toast.error('Failed to load responses');
      return [];
    }
  };

  // When sending a new response
  const sendResponse = async (message: string) => {
    if (!ticket) return;
    
    try {
      if (!authUser) {
        toast.error('You must be logged in to send a response');
        return;
      }

      const responseData = {
        ticket_id: ticket.id,
        message,
        created_by: authUser.id,
        is_admin: true,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('ticket_responses')
        .insert([responseData]);

      if (error) {
        toast.error('Failed to send response');
        console.error('Error sending response:', error);
        return;
      }

      setResponseMessage('');
      toast.success('Response sent successfully');
      
      if (onResponseSubmit) {
        onResponseSubmit();
      } else if (fetchTicketResponses) {
        fetchTicketResponses(ticket.id);
      }
    } catch (err) {
      console.error('Error in sendResponse:', err);
      toast.error('Failed to send response');
    }
  };

  // Function to close the ticket
  const closeTicket = async () => {
    if (!ticket) return;
    
    try {
      if (onStatusChange) {
        onStatusChange('closed');
        return;
      }
      
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticket.id);

      if (error) {
        toast.error('Failed to close ticket');
        console.error('Error closing ticket:', error);
        return;
      }

      toast.success('Ticket closed successfully');
    } catch (err) {
      console.error('Error in closeTicket:', err);
      toast.error('Failed to close ticket');
    }
  };

  if (isLoading) {
    return <div>Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div>Ticket not found.</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>{ticket.title}</CardTitle>
          <CardDescription>Status: {ticket.status}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{ticket.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p>Created At: {new Date(ticket.created_at).toLocaleString()}</p>
          {ticket.status !== 'closed' && (
            <Button onClick={closeTicket} variant="destructive">Close Ticket</Button>
          )}
        </CardFooter>
      </Card>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Responses</h3>
        {responses && responses.length > 0 ? (
          responses.map((response) => (
            <Card key={response.id} className="mb-4">
              <CardHeader className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${response.created_by}.png`} />
                  <AvatarFallback>
                    {response.is_admin ? 'Admin' : 'User'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{response.is_admin ? 'Admin' : 'User'}</CardTitle>
                  <CardDescription>
                    {new Date(response.created_at).toLocaleString()}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>{response.message}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No responses yet
          </div>
        )}
      </div>

      <div className="mt-6">
        <Textarea
          value={responseMessage}
          onChange={(e) => setResponseMessage(e.target.value)}
          placeholder="Write a response..."
          className="w-full mb-4"
        />
        <Button onClick={() => sendResponse(responseMessage)} disabled={!responseMessage} className="bg-gray-900 hover:bg-gray-800">
          Send Response
        </Button>
      </div>
    </div>
  );
};

export default TicketDetail;
