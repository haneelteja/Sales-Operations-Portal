// Bulk Operations Component
import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit, 
  Download, 
  Archive,
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BulkOperationsService } from '@/lib/search/bulkOperationsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { SearchModule } from '@/types/search';
import { cn } from '@/lib/utils';

interface BulkOperationsProps {
  module: SearchModule;
  records: Array<{ id: string; [key: string]: unknown }>;
  onSelectionChange?: (selectedIds: string[]) => void;
  className?: string;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  module,
  records,
  onSelectionChange,
  className,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'update' | 'delete' | 'archive' | 'export' | 'assign' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds(new Set());
      setIsSelectAll(false);
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
      setIsSelectAll(true);
    }
    onSelectionChange?.(Array.from(isSelectAll ? [] : records.map(r => r.id)));
  };

  const handleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setIsSelectAll(newSelected.size === records.length);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleBulkAction = async (action: typeof bulkAction) => {
    if (!action || selectedIds.size === 0 || !user?.id) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const recordIds = Array.from(selectedIds);
      let result;

      switch (action) {
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${recordIds.length} record(s)? This action cannot be undone.`)) {
            setIsProcessing(false);
            return;
          }
          result = await BulkOperationsService.executeBulkDelete(module, recordIds);
          break;

        case 'update':
          // For update, you'd typically show a form to specify what to update
          toast({
            title: 'Info',
            description: 'Bulk update requires additional configuration. Please use the edit dialog.',
          });
          setIsProcessing(false);
          setShowBulkDialog(false);
          return;

        case 'archive':
          result = await BulkOperationsService.executeBulkUpdate(module, recordIds, {
            status: 'archived',
            updated_at: new Date().toISOString(),
          });
          break;

        case 'assign':
          // For assign, you'd typically show a form to select who to assign to
          toast({
            title: 'Info',
            description: 'Bulk assign requires additional configuration. Please use the assign dialog.',
          });
          setIsProcessing(false);
          setShowBulkDialog(false);
          return;

        case 'export':
          // Export functionality
          await exportRecords(recordIds);
          setIsProcessing(false);
          setShowBulkDialog(false);
          toast({
            title: 'Success',
            description: `Exported ${recordIds.length} record(s)`,
          });
          return;

        default:
          setIsProcessing(false);
          return;
      }

      if (result) {
        if (result.failed > 0) {
          toast({
            title: 'Partial Success',
            description: `${result.success} succeeded, ${result.failed} failed. Check errors for details.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: `Successfully processed ${result.success} record(s)`,
          });
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [module] });
        
        // Clear selection
        setSelectedIds(new Set());
        setIsSelectAll(false);
        onSelectionChange?.([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to execute bulk operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setShowBulkDialog(false);
    }
  };

  const exportRecords = async (recordIds: string[]) => {
    // Implementation would use XLSX or similar library
    // This is a placeholder
    records.filter(r => recordIds.includes(r.id));
  };

  const selectedCount = selectedIds.size;

  if (records.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedCount} record{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction('update');
                      setShowBulkDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction('assign');
                      setShowBulkDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction('archive');
                      setShowBulkDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction('export');
                      setShowBulkDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setBulkAction('delete');
                      setShowBulkDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIds(new Set());
                  setIsSelectAll(false);
                  onSelectionChange?.([]);
                }}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select All Checkbox */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="flex items-center gap-2"
        >
          {isSelectAll ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span>Select All</span>
        </Button>
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'delete' && 'Delete Records'}
              {bulkAction === 'update' && 'Update Records'}
              {bulkAction === 'archive' && 'Archive Records'}
              {bulkAction === 'export' && 'Export Records'}
              {bulkAction === 'assign' && 'Assign Records'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'delete' && `Are you sure you want to delete ${selectedCount} record(s)? This action cannot be undone.`}
              {bulkAction === 'update' && `Update ${selectedCount} record(s) with new values.`}
              {bulkAction === 'archive' && `Archive ${selectedCount} record(s).`}
              {bulkAction === 'export' && `Export ${selectedCount} record(s) to Excel.`}
              {bulkAction === 'assign' && `Assign ${selectedCount} record(s) to a user.`}
            </DialogDescription>
          </DialogHeader>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-gray-600">Processing... {progress}%</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkDialog(false);
                setBulkAction(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={() => handleBulkAction(bulkAction)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {bulkAction === 'delete' && 'Delete'}
                  {bulkAction === 'update' && 'Update'}
                  {bulkAction === 'archive' && 'Archive'}
                  {bulkAction === 'export' && 'Export'}
                  {bulkAction === 'assign' && 'Assign'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Export checkbox component for use in tables
export const BulkSelectCheckbox: React.FC<{
  recordId: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ recordId, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(recordId)}
      className="flex items-center justify-center"
    >
      {isSelected ? (
        <CheckSquare className="h-4 w-4 text-blue-600" />
      ) : (
        <Square className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );
};
