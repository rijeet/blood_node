'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SupportTicketConversation } from '@/components/support/support-ticket-conversation';
import { AdminNav } from '@/components/admin/admin-nav';

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

type ViewMode = 'list' | 'conversation';

export default function AdminSupportPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  // Load all support tickets
  const loadTickets = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin access token found');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setPagination(data.pagination || { total: 0, totalPages: 0, currentPage: 1 });
      } else {
        console.error('Failed to load tickets');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters.status, filters.search, filters.page]);

  // Load specific ticket with messages
  const loadTicket = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin access token found');
        return;
      }

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
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

  // Reply to ticket as admin
  const handleReply = async (message: string) => {
    if (!selectedTicket) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No admin access token found');
      }

      const response = await fetch(`/api/admin/support/tickets/${selectedTicket._id}/reply`, {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close ticket
  const handleCloseTicket = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No admin access token found');
      }

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Reload tickets to update status
        await loadTickets();
        // If viewing this ticket, reload it
        if (selectedTicket && selectedTicket._id === ticketId) {
          await loadTicket(ticketId);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close ticket');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'replied':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AdminNav />
        <div className="flex items-center justify-center py-12">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex items-center justify-center py-12">
              <Clock className="w-8 h-8 animate-spin text-blue-500 mr-3" />
              <span className="text-white">Loading support tickets...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNav />
      <div className="py-8">
        <div className="container mx-auto px-4">
        {viewMode === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
                <p className="text-gray-400">Manage user support requests</p>
              </div>
            </div>

            {/* Filters */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
                    >
                      <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="" className="text-white hover:bg-gray-700">All Status</SelectItem>
                        <SelectItem value="open" className="text-white hover:bg-gray-700">Open</SelectItem>
                        <SelectItem value="replied" className="text-white hover:bg-gray-700">Replied</SelectItem>
                        <SelectItem value="closed" className="text-white hover:bg-gray-700">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <div className="space-y-4">
              {tickets.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Support Tickets</h3>
                    <p className="text-gray-400 text-center">
                      No tickets found matching your criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                tickets.map((ticket) => (
                  <Card
                    key={ticket._id}
                    className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                    onClick={() => loadTicket(ticket._id)}
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
                              Last activity {formatDistanceToNow(new Date(ticket.last_message_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {ticket.status !== 'closed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseTicket(ticket._id);
                              }}
                              className="border-red-500 text-red-400 hover:bg-red-500/20"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Close
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={filters.page === 1}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-gray-400">
                  Page {filters.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                  disabled={filters.page === pagination.totalPages}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Next
                </Button>
              </div>
            )}
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
    </div>
  );
}
