import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupportTicket, TicketResponse, Automation } from '@/types/automation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isErrorResponse } from '@/types/supabase';

interface TicketDetailProps {
  ticket: SupportTicket | null;
  responses: TicketResponse[];
  automations: Automation[];
  user: any;
  onStatusChange: (status: 'open' | 'in_progress' | 'resolved' | 'closed') => void;
  onResponseSubmit: () => void;
  fetchTicketResponses: (ticketId: string) => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  responses,
  automations,
  user,
  onStatusChange,
  onResponseSubmit,
  fetchTicketResponses
}) => {
  const [newResponse, setNewResponse] = useState('');
  
  const getAutomationTitle = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId);
    return automation?.title || 'Unknown Automation';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleSubmitResponse = async () => {
    if (!ticket || !user || !newResponse.trim()) return;
    
    try {
      const { error } = await supabase
        .from('ticket_responses')
        .insert([{
          ticket_id: ticket.id,
          message: newResponse,
          created_by: user.id,
          is_admin: true,
          created_at: new Date().toISOString()
        }]) as any;
        
      if (error) throw error;
      
      fetchTicketResponses(ticket.id);
      
      if (ticket.status === 'open') {
        onStatusChange('in_progress');
      }
      
      setNewResponse('');
      
      toast.success('Response submitted successfully');
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast.error(error.message || 'Failed to submit response');
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    
    try {
      // First delete all responses
      const { error: responseError } = await supabase
        .from('ticket_responses')
        .delete()
        .eq('ticket_id', ticket.id) as any;
      
      if (responseError) throw responseError;
      
      // Then delete the ticket
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticket.id) as any;
        
      if (error) throw error;
      
      toast.success('Ticket deleted successfully');
      // Return true to indicate success to the parent component
      return true;
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      toast.error(error.message || 'Failed to delete ticket');
      return false;
    }
  };
  
  if (!ticket) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Select a ticket to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{ticket.title}</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              <p>Automation: {getAutomationTitle(ticket.automation_id)}</p>
              <p>Created: {new Date(ticket.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={getStatusColor(ticket.status) as any}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Select 
              value={ticket.status} 
              onValueChange={(value) => onStatusChange(value as 'open' | 'in_progress' | 'resolved' | 'closed')}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            {ticket.status === 'closed' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={async () => {
                  const success = await handleDeleteTicket();
                  if (success) {
                    // Let the parent know to refresh the ticket list
                    onResponseSubmit();
                  }
                }}
              >
                Delete Ticket
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-bold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>
        
        <h3 className="font-bold mb-2">Conversation</h3>
        
        <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
          {responses.length > 0 ? (
            responses.map((response) => (
              <div key={response.id} className={`p-3 rounded-lg ${
                response.is_admin ? 'bg-blue-50 ml-6' : 'bg-gray-50 mr-6'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">
                    {response.is_admin ? 'Support Team' : 'Client'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(response.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No responses yet
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <Textarea
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Type your response here..."
            rows={4}
          />
          <Button 
            onClick={handleSubmitResponse}
            disabled={!newResponse.trim()}
          >
            Send Response
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketDetail;
