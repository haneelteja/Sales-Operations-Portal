import { useCallback } from 'react';
import { logAction, AuditAction } from '@/lib/auditLogger';

interface LogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

// Hook that delegates to logAction — identity is always read from the live session inside logAction
export function useAuditLog() {
  const log = useCallback((params: LogParams) => {
    logAction(params);
  }, []);

  return log;
}
