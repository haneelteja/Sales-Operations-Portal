/**
 * Edit Backup Execution Time Dialog
 * Allows editing the daily backup time in IST (HH:MM)
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
import { updateBackupScheduleTime, validateBackupScheduleTime } from '@/services/backupService';
import { useToast } from '@/hooks/use-toast';

interface EditBackupTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTime: string;
  onSuccess?: () => void;
}

/** Normalize to HH:MM for input[type="time"] (e.g. "14:00") */
function toTimeInputValue(value: string): string {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value.trim())) return '14:00';
  const [h, m] = value.trim().split(':').map(Number);
  const hour = Math.max(0, Math.min(23, Math.floor(h)));
  const min = Math.max(0, Math.min(59, Math.floor(m)));
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export const EditBackupTimeDialog: React.FC<EditBackupTimeDialogProps> = ({
  open,
  onOpenChange,
  currentTime,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [timeValue, setTimeValue] = useState(toTimeInputValue(currentTime));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTimeValue(toTimeInputValue(currentTime));
      setError(null);
    }
  }, [open, currentTime]);

  const handleSave = async () => {
    setError(null);

    const validation = validateBackupScheduleTime(timeValue);
    if (!validation.valid) {
      setError(validation.error || 'Invalid time');
      return;
    }

    setLoading(true);
    try {
      await updateBackupScheduleTime(timeValue);
      toast({
        title: 'Success',
        description: 'Backup time updated. The new time will apply on the next scheduled run.',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update backup time';
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
    setTimeValue(toTimeInputValue(currentTime));
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Backup Execution Time</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="backup-time">Time (IST – India Standard Time)</Label>
            <Input
              id="backup-time"
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              Daily backup will run at this time in IST. Example: 14:00 = 2:00 PM IST.
            </p>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
