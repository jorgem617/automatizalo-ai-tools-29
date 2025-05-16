import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface TicketResponse {
  id: string;
  ticket_id: string;
  message: string;
  created_by: string;
  is_admin: boolean;
  created_at: string;
}

const TicketDetail = () => {
  const { id: ticketId } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    fetchTicket();
    fetchResponses();
  }, [ticketId]);

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
        return;
      }

      setTicket(data);
    } catch (err) {
      console.error('Error in fetchTicket:', err);
      toast.error('Failed to load ticket');
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
        return;
      }

      setResponses(data);
    } catch (err) {
      console.error('Error in fetchResponses:', err);
      toast.error('Failed to load responses');
    }
  };

  // When sending a new response
  const sendResponse = async (message: string) => {
    try {
      const user = auth.user();
      if (!user) {
        toast.error('You must be logged in to send a response');
        return;
      }

      const responseData = {
        ticket_id: ticketId,
        message,
        created_by: user.id,
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
      fetchResponses();
    } catch (err) {
      console.error('Error in sendResponse:', err);
      toast.error('Failed to send response');
    }
  };

  // Function to close the ticket
  const closeTicket = async () => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) {
        toast.error('Failed to close ticket');
        console.error('Error closing ticket:', error);
        return;
      }

      toast.success('Ticket closed successfully');
      fetchTicket(); // Refresh ticket details
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
        {responses.map((response) => (
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
        ))}
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
