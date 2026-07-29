import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

// Fire-and-forget: never awaited, never blocks the caller
export function logAction(params: AuditLogParams): void {
  (async () => {
    try {
      // Always read identity from the live session — never trust caller-supplied values.
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const username = session?.user?.email ?? 'Unknown';

      await supabase.from('audit_logs').insert({
        user_id: userId ?? null,
        username: username ?? 'Unknown',
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        description: params.description,
        old_values: params.oldValues ?? null,
        new_values: params.newValues ?? null,
      });
    } catch {
      // Silent — logging must never break the main flow
    }
  })();
}
