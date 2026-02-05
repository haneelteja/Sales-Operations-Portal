/**
 * Backup Service
 * Manages database backup operations and configurations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BackupLog {
  id: string;
  backup_type: 'automatic' | 'manual';
  status: 'success' | 'failed' | 'in_progress';
  file_name: string;
  file_size_bytes: number | null;
  google_drive_file_id: string | null;
  google_drive_path: string | null;
  failure_reason: string | null;
  execution_duration_seconds: number | null;
  triggered_by: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BackupConfig {
  backup_folder_path: string;
  backup_notification_email: string;
  backup_enabled: boolean;
  backup_retention_days: number;
  backup_schedule_time_ist?: string;
}

/**
 * Fetch all backup logs with pagination
 */
export async function getBackupLogs(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: 'success' | 'failed' | 'in_progress';
    backup_type?: 'automatic' | 'manual';
    startDate?: string;
    endDate?: string;
  },
  sortBy: 'started_at' | 'file_size_bytes' | 'status' | 'execution_duration_seconds' = 'started_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ logs: BackupLog[]; total: number }> {
  try {
    let query = supabase
      .from('backup_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.backup_type) {
      query = query.eq('backup_type', filters.backup_type);
    }
    if (filters?.startDate) {
      query = query.gte('started_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('started_at', filters.endDate);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching backup logs:', error);
      throw new Error(`Failed to fetch backup logs: ${error.message}`);
    }

    return {
      logs: (data || []) as BackupLog[],
      total: count || 0,
    };
  } catch (error) {
    logger.error('Error in getBackupLogs:', error);
    throw error;
  }
}

/**
 * Get backup configuration
 */
export async function getBackupConfig(): Promise<BackupConfig> {
  try {
    const { data, error } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .in('config_key', ['backup_folder_path', 'backup_notification_email', 'backup_enabled', 'backup_retention_days', 'backup_schedule_time_ist']);

    if (error) {
      logger.error('Error fetching backup config:', error);
      throw new Error(`Failed to fetch backup config: ${error.message}`);
    }

    const config: BackupConfig = {
      backup_folder_path: 'MyDrive/DatabaseBackups',
      backup_notification_email: 'pega2023test@gmail.com',
      backup_enabled: true,
      backup_retention_days: 15,
      backup_schedule_time_ist: '14:00',
    };

    (data || []).forEach((item) => {
      if (item.config_key === 'backup_folder_path') {
        config.backup_folder_path = item.config_value;
      } else if (item.config_key === 'backup_notification_email') {
        config.backup_notification_email = item.config_value;
      } else if (item.config_key === 'backup_enabled') {
        config.backup_enabled = item.config_value === 'true';
      } else if (item.config_key === 'backup_retention_days') {
        const n = parseInt(item.config_value, 10);
        config.backup_retention_days = Number.isFinite(n) ? Math.max(1, Math.min(365, n)) : 15;
      } else if (item.config_key === 'backup_schedule_time_ist') {
        config.backup_schedule_time_ist = item.config_value?.trim() || '14:00';
      }
    });

    return config;
  } catch (error) {
    logger.error('Error in getBackupConfig:', error);
    throw error;
  }
}

/**
 * Update backup folder path
 */
export async function updateBackupFolderPath(folderPath: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('invoice_configurations')
      .update({
        config_value: folderPath,
        updated_by: user?.id || null,
      })
      .eq('config_key', 'backup_folder_path');

    if (error) {
      logger.error('Error updating backup folder path:', error);
      throw new Error(`Failed to update backup folder path: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in updateBackupFolderPath:', error);
    throw error;
  }
}

/**
 * Update backup notification email
 */
export async function updateBackupNotificationEmail(email: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('invoice_configurations')
      .update({
        config_value: email,
        updated_by: user?.id || null,
      })
      .eq('config_key', 'backup_notification_email');

    if (error) {
      logger.error('Error updating backup notification email:', error);
      throw new Error(`Failed to update backup notification email: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in updateBackupNotificationEmail:', error);
    throw error;
  }
}

/**
 * Update backup schedule time (IST), e.g. "14:00"
 */
export async function updateBackupScheduleTime(timeIST: string): Promise<void> {
  const validation = validateBackupScheduleTime(timeIST);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('invoice_configurations')
      .update({
        config_value: timeIST.trim(),
        updated_by: user?.id || null,
      })
      .eq('config_key', 'backup_schedule_time_ist');

    if (error) {
      logger.error('Error updating backup schedule time:', error);
      throw new Error(`Failed to update backup schedule time: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in updateBackupScheduleTime:', error);
    throw error;
  }
}

/**
 * Trigger manual backup
 */
export async function triggerManualBackup(): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/database-backup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'manual',
        triggered_by: session.user.id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Backup failed');
    }

    return {
      success: true,
      logId: result.logId,
    };
  } catch (error) {
    logger.error('Error triggering manual backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate backup folder path
 */
export function validateBackupFolderPath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim() === '') {
    return { valid: false, error: 'Folder path is required' };
  }

  if (path.length > 255) {
    return { valid: false, error: 'Path cannot exceed 255 characters' };
  }

  // Google Drive path validation
  const pathPattern = /^[a-zA-Z0-9\s\/\-_]+$/;
  
  if (!pathPattern.test(path)) {
    return {
      valid: false,
      error: 'Invalid folder path format. Use format: FolderName/SubFolder or MyDrive/FolderName',
    };
  }

  return { valid: true };
}

/**
 * Validate backup schedule time (IST): HH:MM 24-hour, 00:00-23:59
 */
export function validateBackupScheduleTime(time: string): { valid: boolean; error?: string } {
  if (!time || typeof time !== 'string') {
    return { valid: false, error: 'Backup time is required' };
  }
  const trimmed = time.trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) {
    return {
      valid: false,
      error: 'Enter a valid time in HH:MM format (24-hour). Example: 14:00 for 2:00 PM IST.',
    };
  }
  return { valid: true };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email address is required' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Invalid email address format' };
  }

  return { valid: true };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** IST timezone for backup log display (DAILY_BACKUP_SPECIFICATION_2PM_IST) */
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a UTC ISO date string for display in IST
 */
export function formatDateInIST(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString('en-IN', { timeZone: IST_TIMEZONE });
}

/**
 * Format execution duration (seconds) as human-readable e.g. "2m 30s"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
