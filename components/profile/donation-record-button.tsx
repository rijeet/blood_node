'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface DonationRecord {
  _id: string;
  donation_date: string;
  blood_group: string;
  bags_donated: number;
  donation_place?: string;
  emergency_serial_number?: string;
  created_at: string;
}

interface DonationRecordButtonProps {
  userId: string;
  className?: string;
}

export function DonationRecordButton({ userId, className }: DonationRecordButtonProps) {
  const [recordCount, setRecordCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState<DonationRecord[]>([]);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRecordCount();
  }, [userId]);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const fetchRecordCount = async () => {
    try {
      const data = await apiClient.get(`/api/profile/donation-records/count?user_id=${userId}`);
      setRecordCount(data.count);
    } catch (error) {
      console.error('Failed to fetch donation record count:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const data = await apiClient.get(`/api/profile/donation-records?user_id=${userId}`);
      setRecords(data.records);
    } catch (error) {
      console.error('Failed to fetch donation records:', error);
    }
  };

  const handleMouseEnter = async () => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    if (!showModal) {
      await fetchRecords();
      setShowModal(true);
    }
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to prevent flickering
    const timeout = setTimeout(() => {
      setShowModal(false);
    }, 100);
    setHoverTimeout(timeout);
  };

  if (loading) {
    return (
      <Button disabled className={className}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Loading...
      </Button>
    );
  }

  return (
    <>
      <Button 
        onMouseEnter={handleMouseEnter}
        variant="outline"
        className={`flex items-center space-x-2 ${className}`}
      >
        <span>🩸</span>
        <span>Donation Record</span>
        <Badge variant="secondary" className="ml-1">
          {recordCount}
        </Badge>
      </Button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onMouseLeave={handleMouseLeave}
        >
          <Card 
            className="max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onMouseEnter={() => {
              // Clear any existing timeout when mouse enters modal
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
              setShowModal(true);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Donation History</h2>
                <div className="text-sm text-gray-500">
                  Hover to keep open
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {records.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🩸</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Donation Records</h3>
                  <p className="text-gray-600">
                    You haven't made any blood donations yet. Start by responding to emergency alerts!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <Card key={record._id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {new Date(record.donation_date).toLocaleDateString()}
                            </h3>
                            {record.emergency_serial_number && (
                              <Badge variant="outline" className="text-xs">
                                Emergency: {record.emergency_serial_number}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Blood Group:</span>
                              <span className="ml-2 font-medium">{record.blood_group}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Bags Donated:</span>
                              <span className="ml-2 font-medium">{record.bags_donated}</span>
                            </div>
                            {record.donation_place && (
                              <div className="col-span-2">
                                <span className="text-gray-600">Location:</span>
                                <span className="ml-2 font-medium">{record.donation_place}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Total Donations: <span className="font-semibold">{recordCount}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Thank you for helping save lives! 🩸
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
