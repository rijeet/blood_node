'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CollectionInfo {
  name: string;
  exists: boolean;
  documentCount: number;
  indexCount: number;
}

interface DatabaseStatus {
  connected: boolean;
  database: string;
  collections: CollectionInfo[];
  errors: string[];
  timestamp: string;
}

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/init-db?action=health');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load database status:', error);
      setMessage('Failed to load database status');
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async () => {
    setActionLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/init-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Database initialized successfully! Created ${result.collections.length} collections.`);
        loadStatus(); // Refresh status
      } else {
        setMessage(`⚠️ Database initialization completed with errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      setMessage('❌ Failed to initialize database');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database Status</h1>
          <p className="text-gray-600">Monitor and manage your MongoDB collections</p>
        </div>
        <div className="space-x-2">
          <Button onClick={loadStatus} variant="outline">
            Refresh
          </Button>
          <Button 
            onClick={initializeDatabase} 
            disabled={actionLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {actionLoading ? 'Initializing...' : 'Initialize Database'}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' :
          message.includes('⚠️') ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
          'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                Connection Status
              </CardTitle>
              <CardDescription>
                Database: {status.database}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  Status: {status.connected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-gray-600">
                  Last checked: {new Date(status.timestamp).toLocaleString()}
                </p>
                {status.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {status.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collections Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Collections Overview</CardTitle>
              <CardDescription>
                {status.collections.length} collections found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Collections:</span>
                  <span className="font-medium">{status.collections.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Existing Collections:</span>
                  <span className="font-medium text-green-600">
                    {status.collections.filter(c => c.exists).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Documents:</span>
                  <span className="font-medium">
                    {status.collections.reduce((sum, c) => sum + c.documentCount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Indexes:</span>
                  <span className="font-medium">
                    {status.collections.reduce((sum, c) => sum + c.indexCount, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collections Table */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Collection Details</CardTitle>
            <CardDescription>
              Detailed information about each collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Collection</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Documents</th>
                    <th className="text-left p-2 font-medium">Indexes</th>
                    <th className="text-left p-2 font-medium">Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {status.collections.map((collection) => (
                    <tr key={collection.name} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{collection.name}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          collection.exists 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {collection.exists ? 'Exists' : 'Missing'}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {collection.documentCount.toLocaleString()}
                      </td>
                      <td className="p-2 text-sm">
                        {collection.indexCount}
                      </td>
                      <td className="p-2 text-sm text-gray-500">
                        {collection.documentCount > 0 ? '~' + Math.round(collection.documentCount * 0.5) + ' KB' : '0 B'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required Collections Info */}
      <Card>
        <CardHeader>
          <CardTitle>Required Collections</CardTitle>
          <CardDescription>
            All collections needed for Blood Node to function properly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'users', description: 'User accounts and profiles' },
              { name: 'verification_tokens', description: 'Email verification tokens' },
              { name: 'refresh_tokens', description: 'JWT refresh tokens' },
              { name: 'relatives', description: 'Family relationships' },
              { name: 'invites', description: 'Family invitations' },
              { name: 'plans', description: 'Subscription plans' },
              { name: 'emergency_alerts', description: 'Emergency blood alerts' },
              { name: 'donation_records', description: 'Blood donation history' },
              { name: 'notifications', description: 'User notifications' },
              { name: 'audit_logs', description: 'System audit logs' },
              { name: 'connection_test', description: 'Database connection tests' }
            ].map((collection) => (
              <div key={collection.name} className="p-3 border rounded-lg">
                <h4 className="font-medium font-mono text-sm">{collection.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{collection.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
