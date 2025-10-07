'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface SupportTicketListProps {
  tickets: SupportTicket[];
  onTicketClick: (ticketId: string) => void;
  onCreateNew: () => void;
}

export function SupportTicketList({ tickets, onTicketClick, onCreateNew }: SupportTicketListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'replied':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'replied':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'closed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getLastMessageText = (ticket: SupportTicket) => {
    if (ticket.last_message_by === 'admin') {
      return 'Admin replied';
    }
    return 'You replied';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">My Support Tickets</h2>
          <p className="text-gray-400">Manage your support requests and view responses</p>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-gray-400 text-center mb-6">
              You haven't created any support tickets yet. Click the button above to create your first ticket.
            </p>
            <Button
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Create First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket._id}
              className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
              onClick={() => onTicketClick(ticket._id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="text-lg font-semibold text-white truncate">
                        {ticket.subject}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {ticket.message_count} message{ticket.message_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>
                        Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </span>
                      <span>
                        {getLastMessageText(ticket)} {formatDistanceToNow(new Date(ticket.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
