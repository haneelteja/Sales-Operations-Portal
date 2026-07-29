-- Restrict audit log visibility to admins only.
-- Previously any authenticated user could read all audit logs (business data leak).

DROP POLICY IF EXISTS "managers can view all audit logs" ON audit_logs;

CREATE POLICY "admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_management
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );
