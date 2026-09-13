-- RPC for the database-backup edge function to include the applied migration list
-- in the backup file header, so restoring knows which migrations to replay first.
CREATE OR REPLACE FUNCTION get_applied_migrations()
RETURNS TABLE(version text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = supabase_migrations, public
AS $$
  SELECT version
  FROM supabase_migrations.schema_migrations
  ORDER BY version;
$$;

GRANT EXECUTE ON FUNCTION get_applied_migrations() TO service_role;
