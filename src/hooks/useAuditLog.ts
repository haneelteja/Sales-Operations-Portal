import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logAction, AuditAction } from '@/lib/auditLogger';

interface LogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

// Hook that wires user context into logAction so callers don't repeat themselves
export function useAuditLog() {
  const { profile } = useAuth();

  const log = useCallback((params: LogParams) => {
    logAction({
      ...params,
      userId: profile?.user_id,
      username: profile?.username ?? profile?.email,
    });
  }, [profile]);

  return log;
}
