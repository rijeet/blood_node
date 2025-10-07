'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, User, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportMessage {
  _id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
  is_read: boolean;
}

interface SupportTicket {
  _id: string;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_by: 'user' | 'admin';
  messages: SupportMessage[];
}

interface SupportTicketConversationProps {
  ticket: SupportTicket;
  onBack: () => void;
  onReply: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function SupportTicketConversation({ 
  ticket, 
  onBack, 
  onReply, 
  isLoading = false 
}: SupportTicketConversationProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(replyMessage.trim());
      setReplyMessage('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'replied':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white truncate">{ticket.subject}</h2>
          <div className="flex items-center space-x-3 mt-1">
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1">{ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</span>
            </Badge>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </Badge>
            <span className="text-sm text-gray-400">
              Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto p-6 space-y-4">
            {ticket.messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.sender_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {message.sender_type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {message.sender_type === 'user' ? 'You' : 'Admin'}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {ticket.status !== 'closed' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Reply to Ticket</CardTitle>
            <CardDescription className="text-gray-400">
              Send a message to our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReply} className="space-y-4">
              <Textarea
                placeholder="Type your message here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!replyMessage.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {ticket.status === 'closed' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ticket Closed</h3>
              <p className="text-gray-400">
                This support ticket has been closed and no further replies are allowed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
