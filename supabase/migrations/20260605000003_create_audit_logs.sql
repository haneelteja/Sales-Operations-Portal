-- Audit log table to track all user actions across the application
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid,
  username text,
  action text NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  entity_type text NOT NULL,
  entity_id text,
  description text NOT NULL,
  old_values jsonb,
  new_values jsonb
);

-- Performance indexes
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_user_id_idx ON audit_logs (user_id);
CREATE INDEX audit_logs_entity_type_idx ON audit_logs (entity_type);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);

-- Allow authenticated users to insert logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "managers can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);
