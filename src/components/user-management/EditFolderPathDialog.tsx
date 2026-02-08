/**
 * Edit Folder Path Dialog
 * Modal dialog for editing Google Drive folder path
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateFolderPath } from '@/services/invoiceConfigService';

interface EditFolderPathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onSave: (newPath: string) => void;
  isLoading?: boolean;
}

export const EditFolderPathDialog: React.FC<EditFolderPathDialogProps> = ({
  open,
  onOpenChange,
  currentPath,
  onSave,
  isLoading = false,
}) => {
  const [folderPath, setFolderPath] = useState(currentPath);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or currentPath changes
  useEffect(() => {
    if (open) {
      setFolderPath(currentPath);
      setError(null);
    }
  }, [open, currentPath]);

  const handleSave = () => {
    // Validate path
    const validation = validateFolderPath(folderPath);
    if (!validation.valid) {
      setError(validation.error || 'Invalid folder path');
      return;
    }

    setError(null);
    onSave(folderPath.trim());
  };

  const handleCancel = () => {
    setFolderPath(currentPath);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Invoice Folder Path</DialogTitle>
          <DialogDescription>
            Specify the Google Drive folder path where invoice files (DOCX and PDF) are stored.
            Use format: MyDrive/FolderName
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-path">Folder Path</Label>
            <Input
              id="folder-path"
              placeholder="MyDrive/Invoice"
              value={folderPath}
              onChange={(e) => {
                setFolderPath(e.target.value);
                setError(null); // Clear error on input change
              }}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-gray-500">
              Example: MyDrive/Invoice or MyDrive/Invoices/2026
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !folderPath.trim()}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
