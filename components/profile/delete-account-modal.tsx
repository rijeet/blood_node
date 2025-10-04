'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X, Trash2, Shield } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userCode: string, confirmationText: string) => Promise<void>;
  userCode: string;
  userName?: string;
}

export function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userCode, 
  userName 
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedConfirmation = `DELETE ${userCode}`;
  const isConfirmationValid = confirmationText === expectedConfirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfirmationValid) {
      setError('Please type the exact confirmation text');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(userCode, confirmationText);
      // Modal will be closed by parent component on success
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Delete Account
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Warning Content */}
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-medium mb-2">⚠️ This will permanently delete:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Your user account and profile</li>
                    <li>All family member records</li>
                    <li>All donation history</li>
                    <li>All notifications and invites</li>
                    <li>All emergency alerts</li>
                    <li>All security and login data</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Account:</strong> {userName || 'User'} ({userCode})
              </p>
            </div>
          </div>

          {/* Confirmation Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To confirm deletion, type exactly:
              </Label>
              <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <code className="text-sm font-mono text-gray-900 dark:text-white">
                  DELETE {userCode}
                </code>
              </div>
            </div>

            <div>
              <Input
                id="confirmation"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type: DELETE ${userCode}`}
                className={`w-full ${
                  confirmationText && !isConfirmationValid
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isConfirmationValid
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                disabled={isDeleting}
                autoComplete="off"
              />
              {confirmationText && !isConfirmationValid && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Text does not match exactly
                </p>
              )}
              {isConfirmationValid && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Confirmation text matches
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!isConfirmationValid || isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Footer Warning */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              By deleting your account, you acknowledge that this action is irreversible
              and all your data will be permanently removed from our systems.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
