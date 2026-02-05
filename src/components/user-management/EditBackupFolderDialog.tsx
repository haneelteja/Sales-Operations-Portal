/**
 * Edit Backup Folder Path Dialog
 * Allows editing the Google Drive folder path for backups
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
import { updateBackupFolderPath, validateBackupFolderPath } from '@/services/backupService';
import { useToast } from '@/hooks/use-toast';

interface EditBackupFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onSuccess?: () => void;
}

export const EditBackupFolderDialog: React.FC<EditBackupFolderDialogProps> = ({
  open,
  onOpenChange,
  currentPath,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [folderPath, setFolderPath] = useState(currentPath);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFolderPath(currentPath);
      setError(null);
    }
  }, [open, currentPath]);

  const handleSave = async () => {
    setError(null);

    // Validate
    const validation = validateBackupFolderPath(folderPath);
    if (!validation.valid) {
      setError(validation.error || 'Invalid folder path');
      return;
    }

    setLoading(true);
    try {
      await updateBackupFolderPath(folderPath);
      toast({
        title: 'Success',
        description: 'Backup folder path updated successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update folder path';
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
    setFolderPath(currentPath);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Backup Folder Path</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderPath">Google Drive Folder Path</Label>
            <Input
              id="folderPath"
              value={folderPath}
              onChange={(e) => {
                setFolderPath(e.target.value);
                setError(null);
              }}
              placeholder="MyDrive/Invoice"
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              Enter the Google Drive folder path where backups will be stored.
              <br />
              Example: MyDrive/DatabaseBackups or Documents/Backups
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
            disabled={loading || folderPath === currentPath}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
