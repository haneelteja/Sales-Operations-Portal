/**
 * Edit Backup Notification Email Dialog
 * Allows editing the email address for backup failure notifications
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateBackupNotificationEmail, validateEmail } from '@/services/backupService';
import { useToast } from '@/hooks/use-toast';

interface EditNotificationEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onSuccess?: () => void;
}

export const EditNotificationEmailDialog: React.FC<EditNotificationEmailDialogProps> = ({
  open,
  onOpenChange,
  currentEmail,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEmail(currentEmail);
      setError(null);
    }
  }, [open, currentEmail]);

  const handleSave = async () => {
    setError(null);

    // Validate
    const validation = validateEmail(email);
    if (!validation.valid) {
      setError(validation.error || 'Invalid email address');
      return;
    }

    setLoading(true);
    try {
      await updateBackupNotificationEmail(email);
      toast({
        title: 'Success',
        description: 'Notification email updated successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update email';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEmail(currentEmail);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Backup Notification Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="pega2023test@gmail.com"
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              Email address where backup failure notifications will be sent.
            </p>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || email === currentEmail}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
