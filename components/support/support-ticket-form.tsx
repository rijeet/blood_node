'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';

interface SupportTicketFormProps {
  onSubmit: (data: { subject: string; message: string; priority: string }) => Promise<void>;
  isLoading?: boolean;
}

export function SupportTicketForm({ onSubmit, isLoading = false }: SupportTicketFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({ subject: '', message: '', priority: 'medium' });
    } catch (error) {
      console.error('Error submitting ticket:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Blood Node Support</CardTitle>
        <CardDescription className="text-gray-300">
          Here you can contact us for any queries or issues related to site. We'll try our best to help you. But please:
        </CardDescription>
        <div className="text-sm text-gray-400 space-y-1">
          <p>• Go through our FAQ section first. You'll find solution to all common problems.</p>
          <p>• Do not open ticket for these cases: Torrent approval delay, Lack of seed or speed in torrents</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-white">
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              placeholder="Enter ticket subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${
                errors.subject ? 'border-red-500' : ''
              }`}
            />
            {errors.subject && (
              <p className="text-sm text-red-400">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium text-white">
              Priority
            </label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="low" className="text-white hover:bg-gray-700">Low</SelectItem>
                <SelectItem value="medium" className="text-white hover:bg-gray-700">Medium</SelectItem>
                <SelectItem value="high" className="text-white hover:bg-gray-700">High</SelectItem>
                <SelectItem value="urgent" className="text-white hover:bg-gray-700">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-white">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Describe your issue or question in detail"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={6}
              className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none ${
                errors.message ? 'border-red-500' : ''
              }`}
            />
            {errors.message && (
              <p className="text-sm text-red-400">{errors.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
