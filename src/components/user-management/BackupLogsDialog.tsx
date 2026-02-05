/**
 * Backup Logs Dialog Component
 * Displays backup logs with filtering, sorting, and pagination
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBackupLogs, formatFileSize, formatDateInIST, formatDuration, type BackupLog } from '@/services/backupService';
import { useToast } from '@/hooks/use-toast';

interface BackupLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BackupLogsDialog: React.FC<BackupLogsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'in_progress'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'automatic' | 'manual'>('all');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('30days');

  // Sorting (per spec: Date & time, File size, Execution duration, Status)
  const [sortBy, setSortBy] = useState<'started_at' | 'file_size_bytes' | 'status' | 'execution_duration_seconds'>('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, page, statusFilter, typeFilter, dateRange, sortBy, sortOrder]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        filters.backup_type = typeFilter;
      }
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        if (dateRange === '7days') {
          startDate.setDate(startDate.getDate() - 7);
        } else {
          startDate.setDate(startDate.getDate() - 30);
        }
        filters.startDate = startDate.toISOString();
        filters.endDate = endDate.toISOString();
      }

      const result = await getBackupLogs(page, pageSize, filters, sortBy, sortOrder);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch backup logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: 'started_at' | 'file_size_bytes' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'automatic' ? 'default' : 'secondary'}>
        {type === 'automatic' ? 'Automatic' : 'Manual'}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Database Backup Logs</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 items-end pb-4 border-b">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Date Range</label>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchLogs} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort('started_at')}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    Date & Time
                    {sortBy === 'started_at' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    Status
                    {sortBy === 'status' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                </TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('file_size_bytes')}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    File Size
                    {sortBy === 'file_size_bytes' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('execution_duration_seconds')}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    Duration
                    {sortBy === 'execution_duration_seconds' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                </TableHead>
                <TableHead>Storage location</TableHead>
                <TableHead>Failure Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No backup logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell title={`UTC: ${log.started_at}`}>
                      {formatDateInIST(log.started_at)}
                    </TableCell>
                    <TableCell>{getTypeBadge(log.backup_type)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="font-mono text-sm">{log.file_name}</TableCell>
                    <TableCell>
                      {log.file_size_bytes ? formatFileSize(log.file_size_bytes) : '—'}
                    </TableCell>
                    <TableCell>
                      {formatDuration(log.execution_duration_seconds)}
                    </TableCell>
                    <TableCell>
                      {log.google_drive_path ? (
                        <a
                          href={log.google_drive_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.failure_reason ? (
                        <span className="text-red-600 text-sm" title={log.failure_reason}>
                          {log.failure_reason.length > 50
                            ? `${log.failure_reason.substring(0, 50)}...`
                            : log.failure_reason}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
