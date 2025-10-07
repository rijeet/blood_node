'use client';

import { useState, useEffect } from 'react';
import { SupportTicketForm } from '@/components/support/support-ticket-form';
import { SupportTicketList } from '@/components/support/support-ticket-list';
import { SupportTicketConversation } from '@/components/support/support-ticket-conversation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SupportTicket {
  _id: string;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_by: 'user' | 'admin';
  message_count: number;
}

interface SupportMessage {
  _id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
  is_read: boolean;
}

interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
}

type ViewMode = 'list' | 'create' | 'conversation';

export default function SupportPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user's support tickets
  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch('/api/support/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        console.error('Failed to load tickets');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific ticket with messages
  const loadTicket = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setViewMode('conversation');
      } else {
        console.error('Failed to load ticket');
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    }
  };

  // Create new ticket
  const handleCreateTicket = async (data: { subject: string; message: string; priority: string }) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Reload tickets and switch to list view
        await loadTickets();
        setViewMode('list');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply to ticket
  const handleReply = async (message: string) => {
    if (!selectedTicket) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/support/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        // Reload the ticket to get updated messages
        await loadTicket(selectedTicket._id);
        // Also reload the tickets list to update status
        await loadTickets();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-white">Loading support tickets...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {viewMode === 'list' && (
          <SupportTicketList
            tickets={tickets}
            onTicketClick={loadTicket}
            onCreateNew={() => setViewMode('create')}
          />
        )}

        {viewMode === 'create' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">Create Support Ticket</h1>
              <button
                onClick={() => setViewMode('list')}
                className="text-gray-400 hover:text-white"
              >
                ← Back to Tickets
              </button>
            </div>
            <SupportTicketForm
              onSubmit={handleCreateTicket}
              isLoading={isSubmitting}
            />
          </div>
        )}

        {viewMode === 'conversation' && selectedTicket && (
          <SupportTicketConversation
            ticket={selectedTicket}
            onBack={() => setViewMode('list')}
            onReply={handleReply}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
