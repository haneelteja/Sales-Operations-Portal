# Daily Automated SQL Database Backup — Functional & Technical Specification

**Version:** 1.0  
**Date:** January 27, 2026  
**Status:** Production-ready specification  
**Audience:** Backend/Database engineers, DevOps, Frontend, QA, Audit

---

## Table of Contents

1. [Objective & Scope](#1-objective--scope)
2. [Daily Backup Workflow (2:00 PM IST)](#2-daily-backup-workflow-200-pm-ist)
3. [SQL Backup Strategy and Format](#3-sql-backup-strategy-and-format)
4. [Scheduler / Job Configuration](#4-scheduler--job-configuration)
5. [Database Schema for Backup Logs](#5-database-schema-for-backup-logs)
6. [Backup Settings Management](#6-backup-settings-management)
7. [UI: View Backup Logs](#7-ui-view-backup-logs)
8. [Validation Rules and Error Handling](#8-validation-rules-and-error-handling)
9. [Security and Access Control](#9-security-and-access-control)
10. [Reliability, Idempotency, and Audit](#10-reliability-idempotency-and-audit)
11. [Implementation Notes for Engineers](#11-implementation-notes-for-engineers)
12. [QA and UAT Test Cases](#12-qa-and-uat-test-cases)
13. [Production Readiness and Audit Checklist](#13-production-readiness-and-audit-checklist)

---

## 1. Objective & Scope

### 1.1 Objective

Design and implement a **daily automated SQL database backup system** that:

- Runs **every day at 2:00 PM IST** (timezone-aware).
- Backs up **all tables, data, schema, constraints, indexes, and dependencies** for full restoration.
- Stores backups in a **configurable storage location** (e.g. Google Drive).
- Logs every backup in a **dedicated Database Backup Logs** table (auditable, traceable).
- Exposes a **Backup Settings** section and **View Backup Logs** to **Manager/Admin** only.

### 1.2 Constraints Summary

| Requirement | Specification |
|------------|----------------|
| Schedule | 2:00 PM IST daily (explicit IST handling) |
| Format | Compressed SQL dump (e.g. `.sql.gz`) |
| Naming | `SQL_Backup_YYYY-MM-DD_14-00_IST.sql.gz` (user-friendly, IST in name) |
| Logs | Immutable, no manual edits; full audit trail |
| Access | Manager/Admin only for settings and logs |
| Resilience | Partial-failure handling; no overwrite of valid backups; idempotent where applicable |

---

## 2. Daily Backup Workflow (2:00 PM IST)

### 2.1 Schedule Definition

- **Target time (user-facing):** 2:00 PM India Standard Time (IST).
- **IST:** UTC+5:30.  
  Therefore **2:00 PM IST = 08:30 UTC** (same calendar day).
- **Cron (UTC):** `30 8 * * *` (every day at 08:30 UTC).

### 2.2 Workflow Steps

1. **Trigger (2:00 PM IST)**
   - Scheduler (pg_cron, GitHub Actions, or external cron) runs at **08:30 UTC**.
   - Invokes Edge Function `database-backup` with `trigger: 'automatic'`.

2. **Pre-checks**
   - Read backup config: `backup_enabled`, `backup_folder_path`, `backup_retention_days`, `backup_notification_email`.
   - If `backup_enabled === false`, exit without running backup; optionally log “skipped – disabled”.

3. **Generate filename (IST)**
   - Compute current time in IST (e.g. `new Date()` in Edge Function → convert to IST or use fixed 14:00 for scheduled run).
   - For **scheduled** run at 2:00 PM IST use:  
     `SQL_Backup_YYYY-MM-DD_14-00_IST.sql.gz`  
     (e.g. `SQL_Backup_2026-01-27_14-00_IST.sql.gz`).
   - For **manual** run use current IST time:  
     `SQL_Backup_YYYY-MM-DD_HH-MM_IST.sql.gz`.

4. **Create log row**
   - Insert into `backup_logs`: `backup_type = 'automatic'`, `status = 'in_progress'`, `file_name`, `started_at` (UTC), store `started_at_ist` if column exists (or derive in UI).

5. **Run backup**
   - Generate full SQL dump (schema + data + constraints/indexes).
   - Compress (gzip).
   - Upload to configured storage; record `storage_location` / `google_drive_path` and `file_size_bytes`.
   - On success: set `status = 'success'`, `completed_at`, `execution_duration_seconds`.
   - On failure: set `status = 'failed'`, `failure_reason`; do **not** overwrite any existing successful backup file.

6. **Post-backup**
   - Retention job (separate schedule) deletes backups older than `backup_retention_days` from storage and updates logs (e.g. `deleted_at`).

### 2.3 Timezone Handling (IST)

- **Scheduler:** Cron runs in UTC; use `30 8 * * *` for 2:00 PM IST.
- **Logging:** Store `started_at` and `completed_at` in **UTC** (TIMESTAMPTZ). Display in UI in **IST** (convert in frontend or in query).
- **Filename:** Always include `_IST` and use 14-00 for the scheduled 2:00 PM run so the filename is self-describing.

---

## 3. SQL Backup Strategy and Format

### 3.1 Content of Backup

Backup must include everything required for **full restoration**:

- All tables and data.
- Schema (CREATE TABLE, types, defaults).
- Constraints (PRIMARY KEY, UNIQUE, CHECK, FOREIGN KEY).
- Indexes.
- Sequences (and current values).
- Triggers and functions used by the schema (if within project scope).
- No owner/ACL if not required for restoration (e.g. `--no-owner --no-acl` for portability).

### 3.2 Format and Naming

- **Format:** Plain SQL dump compressed with **gzip**.
- **Extension:** `.sql.gz`.
- **Naming convention:**
  - Scheduled (2:00 PM IST):  
    `SQL_Backup_YYYY-MM-DD_14-00_IST.sql.gz`
  - Manual:  
    `SQL_Backup_YYYY-MM-DD_HH-MM_IST.sql.gz`  
  Examples:  
  - `SQL_Backup_2026-01-27_14-00_IST.sql.gz`  
  - `SQL_Backup_2026-01-27_15-30_IST.sql.gz` (manual at 3:30 PM IST).

### 3.3 Production-Grade Dump Command (Reference)

Example for a PostgreSQL-compatible engine (e.g. Supabase):

```bash
pg_dump -h <host> -U <user> -d <database> \
  --no-owner --no-acl \
  --format=plain \
  --file=backup.sql
gzip backup.sql
# Result: backup.sql.gz, then rename to SQL_Backup_YYYY-MM-DD_14-00_IST.sql.gz
```

- Use a single transaction or consistent snapshot if supported to avoid partial/corrupted backups.
- Verify file size > 0 and optionally checksum before marking success.

---

## 4. Scheduler / Job Configuration

### 4.1 Primary: pg_cron (Supabase)

- **Daily backup at 2:00 PM IST:** run at **08:30 UTC** → cron: `30 8 * * *`.
- **Daily cleanup:** run after backup (e.g. 1 hour later) → `30 9 * * *` (09:30 UTC).

Example (replace placeholders):

```sql
SELECT cron.schedule(
  'daily-database-backup-2pm-ist',
  '30 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/database-backup',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'automatic')
  );
  $$
);
```

### 4.2 Alternative: External Cron (e.g. GitHub Actions)

- Schedule: `30 8 * * *` (08:30 UTC = 2:00 PM IST).
- Call the same Edge Function URL with the same payload and `Authorization: Bearer [SERVICE_ROLE_KEY]`.

### 4.3 Timezone Verification

- Document in runbook: “2:00 PM IST = 08:30 UTC”.
- Optionally: Edge Function logs “Scheduled backup for 2:00 PM IST (08:30 UTC)” when trigger is `automatic`.

---

## 5. Database Schema for Backup Logs

### 5.1 Table: `backup_logs`

All backup attempts (automatic and manual) are recorded here. Rows are **append-only** for audit; no manual edits. Updates only by the system (e.g. `status`, `completed_at`, `execution_duration_seconds`, `deleted_at`).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | NO | Primary key, default `gen_random_uuid()` |
| backup_type | VARCHAR(20) | NO | `'automatic'` \| `'manual'` |
| status | VARCHAR(20) | NO | `'in_progress'` \| `'success'` \| `'failed'` |
| file_name | VARCHAR(255) | NO | e.g. `SQL_Backup_2026-01-27_14-00_IST.sql.gz` |
| file_size_bytes | BIGINT | YES | Size of backup file |
| storage_location | TEXT | YES | Full path or identifier in storage (e.g. Google Drive path). Existing implementations may use `google_drive_path` as storage_location. |
| google_drive_file_id | VARCHAR(255) | YES | If using Google Drive; optional |
| failure_reason | TEXT | YES | Filled only when status = 'failed' |
| execution_duration_seconds | NUMERIC(10,2) | YES | completed_at - started_at |
| started_at | TIMESTAMPTZ | NO | When backup started (UTC) |
| completed_at | TIMESTAMPTZ | YES | When backup finished (UTC) |
| triggered_by | UUID | YES | FK to auth.users(id) for manual runs |
| created_at | TIMESTAMPTZ | NO | Row insert time (UTC) |
| updated_at | TIMESTAMPTZ | NO | Last system update (UTC) |
| deleted_at | TIMESTAMPTZ | YES | When file was removed from storage (retention) |

**Constraints:**

- `backup_type IN ('automatic', 'manual')`
- `status IN ('in_progress', 'success', 'failed')`

**Indexes (for logs UI and cleanup):**

- `(started_at DESC)`, `(status)`, `(backup_type)`, `(created_at DESC)`.

**RLS:** Only Manager/Admin can SELECT; INSERT/UPDATE only via service role or trusted backend (no end-user UPDATE of historical data).

### 5.2 Backward Compatibility

If the existing table uses `google_drive_path` instead of `storage_location`, treat `google_drive_path` as the storage location in the spec and UI. Optional migration can add `execution_duration_seconds` and/or rename for clarity; spec uses “storage location” as the logical concept.

---

## 6. Backup Settings Management

### 6.1 Backup Settings Section

Expose a **Backup Settings** area (e.g. under Application Configuration) with:

| Setting | Type | Default | Description |
|--------|------|---------|-------------|
| Enable daily backups | Boolean | true | If false, scheduled job exits without running. |
| Backup schedule | Fixed (configurable in future) | 2:00 PM IST | Display only unless product allows future change. |
| Backup retention period (days) | Integer | 15 | Backups older than this are removed by cleanup job. |
| Backup storage location | String | e.g. `MyDrive/DatabaseBackups` | Folder/path in configured storage (e.g. Google Drive). |

Storage of these can be in `invoice_configurations` (or a dedicated `backup_config` table) with keys such as: `backup_enabled`, `backup_retention_days`, `backup_folder_path`, etc.

### 6.2 Validation Rules

- **Enable/disable:** Boolean; no format validation.
- **Retention days:** Integer; min 1, max 365 (or project limit); invalid values rejected with clear message.
- **Storage location:** Non-empty string; path format validated per storage provider (e.g. no `..`, valid chars); invalid path rejected.

### 6.3 Immediate Effect

- Changes to backup settings take effect on the **next** backup or cleanup run (no restart required).
- Edge Functions read config at runtime from the database.

### 6.4 Audit Logging of Settings Changes

- **Requirement:** All changes to backup settings must be logged for audit.
- **Implementation options:**
  - **Option A:** Dedicated `backup_config_audit` table: `config_key`, `old_value`, `new_value`, `changed_at`, `changed_by` (user id).
  - **Option B:** Use existing audit/history table if the project has one for configuration.
- **Data to log:** key, old value, new value, timestamp (UTC), user id (for manual changes). No passwords or secrets in audit log.

---

## 7. UI: View Backup Logs

### 7.1 Access and Entry Point

- **Access:** Only **Manager** and **Admin**.
- **Entry:** “View Backup Logs” action (e.g. button in Application Configuration or Backup Settings). Opens a dialog or dedicated page.

### 7.2 Display and Behaviour

- **Data source:** `backup_logs` table (via RLS; only managers/admins see rows).
- **Columns (user-friendly):**
  - **Date & time (IST)** — from `started_at` (convert UTC → IST in UI).
  - **Backup type** — Automatic / Manual.
  - **Status** — Success / Failed / In progress.
  - **File name** — e.g. `SQL_Backup_2026-01-27_14-00_IST.sql.gz`.
  - **File size** — Human-readable (e.g. MB, GB).
  - **Storage location** — Display path/link if applicable.
  - **Execution duration** — e.g. “2m 30s”.
  - **Failure reason** — Shown only when status = Failed.

### 7.3 Pagination

- Default page size: e.g. 20 rows.
- Provide Previous/Next and optionally page size selector (20 / 50 / 100).
- Total count available for “Showing X–Y of Z”.

### 7.4 Sorting

- Default sort: **Date & time (IST)** descending (newest first).
- Sortable columns: Date & time, Backup type, Status, File size, Execution duration.
- One-column sort at a time; indicate sort direction (asc/desc).

### 7.5 Filtering

- **By date:** Last 7 days, Last 30 days, Custom range (from/to in IST).
- **By status:** All, Success, Failed, In progress.
- **By backup type:** All, Automatic, Manual.
- Filters apply to the same dataset used for pagination and sorting.

### 7.6 Immutability

- Logs are **read-only** in the UI: no edit or delete actions for backup log rows.

---

## 8. Validation Rules and Error Handling

### 8.1 Backup Execution

- **Database unreachable:** Retry up to 3 times with backoff; then mark run as failed, log `failure_reason`, and send notification.
- **Dump failure (pg_dump error):** Log stderr in `failure_reason`; do not mark as success; notify.
- **Compression failure:** Treat as failed run; log and notify.
- **Storage upload failure:** Retry upload up to 3 times; on final failure set status failed, log, notify. Do **not** overwrite an existing successful backup file for the same logical run.
- **Partial/corrupted backup:** Before marking success, verify file size > 0 and optionally checksum; if invalid, mark failed and do not overwrite previous good backup.

### 8.2 Storage and Overwrites

- **Do not overwrite** a valid backup file. Use a unique filename per run (timestamp/IST in name).
- **Idempotency:** Re-running the same scheduled time (e.g. manual retry) should produce a **new** file (e.g. with a distinct timestamp or run id in name if multiple runs per day) so that no successful backup is overwritten.

### 8.3 Cleanup Job

- Only delete files that are **older** than retention period.
- On delete failure (e.g. Drive API error): log, continue with other files; send notification if any failure.
- Update `backup_logs.deleted_at` only after successful removal from storage (or after marking “deleted” in DB if storage delete is best-effort and tracked separately).

### 8.4 User-Facing Messages

- Success: “Backup completed successfully. File: [file_name].”
- Failure: “Backup failed. See backup logs for details.” (Avoid exposing internal errors in UI; details in logs and notifications.)

---

## 9. Security and Access Control

### 9.1 Roles

- **Manager / Admin:** Can view backup logs, change backup settings, trigger manual backup.
- **Others:** No access to backup settings or backup logs (UI hidden; API enforced by RLS and role checks).

### 9.2 API and Backend

- Scheduled backup and cleanup run with **service role** (no user context).
- Manual backup triggered by user: validate user is Manager/Admin; store `triggered_by` = user id.
- Edge Functions: validate JWT for manual trigger; for cron, require fixed secret or service role in `Authorization` header.

### 9.3 Data Protection

- Backups in transit: HTTPS only.
- Storage (e.g. Google Drive): use provider’s encryption at rest; minimal permissions (only backup service).
- No storage of database passwords or long-lived secrets in backup logs or audit logs; only paths and metadata.

### 9.4 RLS (Summary)

- `backup_logs`: SELECT for users in Manager/Admin; INSERT/UPDATE only by service role or backend (no direct user UPDATE of log rows).

---

## 10. Reliability, Idempotency, and Audit

### 10.1 Resilient to Partial Failures

- Pre-backup: validate DB and storage config; exit cleanly if disabled.
- During run: on failure, set status to `failed`, write `failure_reason`, and send notification; do not leave status `in_progress` indefinitely (set completed_at and status on both success and failure).
- Cleanup: on partial delete failure, log per file and continue; do not roll back successful deletes.

### 10.2 No Overwrite of Valid Backups

- Filename includes date and time (and IST); each run produces a unique file name.
- No reuse of the same file path for a new backup; old file is either retained or explicitly removed by retention job.

### 10.3 Idempotency

- **Scheduled run:** Running at the same cron time twice (e.g. duplicate trigger) should create two log entries and two files (different timestamps or run ids). No “replace” semantics.
- **Manual run:** Each click = one run = one new file and one new log row.

### 10.4 Log Immutability and Audit

- Application and users do **not** edit or delete historical `backup_logs` rows.
- Only the system updates: `status`, `completed_at`, `execution_duration_seconds`, `failure_reason`, `deleted_at`, `updated_at`.
- All backup attempts are traceable: who triggered (manual), when (IST/UTC), status, file name, size, location, duration, failure reason.

---

## 11. Implementation Notes for Engineers

### 11.1 Backend / Database

- Add or align `backup_logs` columns: `execution_duration_seconds`, storage location (or keep `google_drive_path` and map in API).
- Ensure RLS policies: Manager/Admin SELECT; service role INSERT/UPDATE.
- Use TIMESTAMPTZ for all timestamps; convert to IST only in API/UI for display.
- Optional: `backup_config_audit` table and triggers (or app-level writes) when backup config changes.

### 11.2 Edge Functions

- **database-backup:** Accept `trigger: 'automatic' | 'manual'`, optional `triggered_by`. Read config; if disabled return 200 without backup. Generate IST-based filename; create log row; run dump → compress → upload; update log (success/failed, duration, size, path). Never overwrite existing successful file.
- **cleanup-old-backups:** Read `backup_retention_days`; list/identify old backups; delete from storage; set `deleted_at` in `backup_logs`.

### 11.3 DevOps

- Cron: `30 8 * * *` for backup (2:00 PM IST); e.g. `30 9 * * *` for cleanup.
- Secrets: service role key, storage credentials (e.g. Google Drive); no secrets in logs.
- Monitoring: alert on consecutive backup failures; optional dashboard for last success time and file size.

### 11.4 Frontend

- Backup Settings: enable/disable, retention days, storage path; validate inputs; on save write to config and optionally to audit table.
- View Backup Logs: fetch `backup_logs` with pagination, sort, filter; show dates in IST; format file size and duration; no edit/delete.

---

## 12. QA and UAT Test Cases

### 12.1 Schedule and Timezone

- Verify backup runs at 2:00 PM IST (e.g. by checking log `started_at` converted to IST).
- Verify filename for scheduled run contains `_14-00_IST` (or equivalent).

### 12.2 Backup Content and Format

- Restore a backup to a test DB; verify table count, row counts, and a sample of constraints/indexes.
- Confirm file is gzip and expands to valid SQL.

### 12.3 Settings

- Toggle “Enable daily backups” off; confirm next scheduled run does not perform backup (and optionally logs “disabled”).
- Set retention to 7 days; run cleanup; verify only backups older than 7 days are removed and logs updated.
- Invalid retention (e.g. 0, -1, 400) rejected with validation message.
- Invalid storage path rejected.

### 12.4 Logs and UI

- After automatic and manual backups, verify one row per run with correct type, status, file name, size, duration (for success).
- Failed run: status Failed, `failure_reason` populated; no overwrite of previous success file.
- View Backup Logs: pagination, sort by date and status, filter by date range and status; only Manager/Admin can open.
- Non–Manager/Admin: Backup Settings and View Backup Logs not accessible.

### 12.5 Error Handling

- Simulate DB failure: backup marked failed, notification sent, no success row.
- Simulate storage full/upload failure: backup marked failed, no overwrite of existing file.

### 12.6 Audit

- Change backup setting; verify audit record (old value, new value, user, time).

---

## 13. Production Readiness and Audit Checklist

- [ ] Backup runs daily at 2:00 PM IST (cron `30 8 * * *` UTC).
- [ ] Backup includes full schema + data; format is compressed SQL (e.g. `.sql.gz`).
- [ ] Filename convention: `SQL_Backup_YYYY-MM-DD_14-00_IST.sql.gz` (scheduled) and equivalent for manual.
- [ ] All runs logged in `backup_logs` with status, file name, size, storage location, duration, failure reason.
- [ ] Logs are immutable (no user edit/delete); only system updates allowed.
- [ ] Backup settings: enable/disable, retention, storage location; validated; take effect on next run.
- [ ] Settings changes audited (old/new value, user, timestamp).
- [ ] View Backup Logs: Manager/Admin only; pagination, sort, filter; dates in IST.
- [ ] Failed backups do not overwrite valid backups; idempotent behaviour documented.
- [ ] Retention cleanup runs after backup; only deletes files older than configured days.
- [ ] RLS and role checks enforce Manager/Admin access.
- [ ] No secrets in logs or audit tables.
- [ ] QA/UAT passed for schedule, restore, settings, logs, and access control.

---

**End of specification.**  
For implementation details and current codebase alignment, see `DATABASE_BACKUP_SPECIFICATION.md` and `CRON_SETUP.md` in the same folder. This document is the single source of truth for the **2:00 PM IST** requirement, naming, logging, and audit behaviour.
