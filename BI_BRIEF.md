# Aamodha Operations Portal — Technical & Business-Rules Brief

> For a read-only BI agent. Every claim cites a source file.

---

## 1. App Overview

### Purpose
"Sales Operations Portal — Aamodha Enterprises" is a B2B sales operations management system for a beverage/FMCG distribution business. It tracks orders, client sales (debits), payments (credits), factory costs, transport, labels, outstanding receivables, WhatsApp payment reminders, and automated email reports.

Source: `src/pages/Index.tsx` line 236

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Recharts |
| State/Data | TanStack Query (react-query) |
| Auth | Supabase Auth (email/password, JWT) |
| Database | Supabase (PostgreSQL + RLS) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Invoice storage | Google Drive and/or OneDrive (configurable) |
| WhatsApp API | 360messenger.com |
| Email | Resend (resend.com) |
| Hosting | UNKNOWN — no deployment config found |

### Environments / Deployment Notes
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` injected at build time via Vite.
- `src/integrations/supabase/client.ts` lines 24–31 purges three old Supabase project refs from localStorage on load — the project has migrated Supabase instances at least twice.

### Navigation Structure

Single-page app; routing is a `useState` hook on `activeView`.

| `activeView` key | Screen | Manager-only? |
|---|---|---|
| `dashboard` | Dashboard | No |
| `order-management` | Orders Management | No |
| `receivables-tracking` | Receivables Tracker | No |
| `client-transactions` | Client Transactions | No |
| `factory` | Factory Transactions | No |
| `transport` | Transport | No |
| `labels` | Labels | No |
| `profitability` | Profitability | Yes |
| `sales-tracker` | Sales Tracker | Yes |
| `audit-logs` | Audit Logs | Yes |
| `user-management` | User Management | Yes |
| `application-configuration` | Application Configuration | Yes |
| `whatsapp-configuration` | WhatsApp Configurations | Yes |
| `email-reports` | Email Reports | Yes |

Source: `src/pages/Index.tsx` line 36; `src/components/AppSidebar.tsx`

---

## 2. Screens / Modules Map

### 2.1 Dashboard
- **Role gating**: None
- **Primary entities**: `sales_transactions`, `factory_payables`, `transport_expenses`, `customers`
- **KPIs (Row 1 — Financials)**: Factory Outstanding, Client Outstanding, Sale This Month, Sale Prev Month, Collection Rate
- **KPIs (Row 2 — Alerts)**: Critical Alerts (>₹1L), Payment Overdue, Due Soon, Over Credit Limit, Caution
- **Alert thresholds**: Critical >₹1,00,000 / High >₹50,000 / Medium otherwise
- **Actions**: Export to Excel (`Client_Receivables_YYYY-MM-DD.xlsx`) ✍, View Ledger drawer, Log Note drawer
- **Sub-panels**: BusinessAnalyticsChart (monthly trend), ClientOverviewPanel (per-client deep-dive)
- **Data window**: Outstanding = all-time; Sales KPIs = current/prior month; Receivables table = **last 90 days only** ⚠ (see §8.5)

Source: `src/components/dashboard/Dashboard.tsx` lines 78–249, 383–408

### 2.2 Orders Management
- **Role gating**: None
- **Primary entities**: `orders`, `orders_dispatch`
- **Statuses**: `pending` → `dispatched` → `delivered` | `cancelled`
- **`stock_ready` flag**: boolean, togglable independently of status
- **Actions**: Create order ✍, edit ✍, update status ✍, record dispatch (inserts `orders_dispatch` row) ✍, mark delivered ✍
- **Sort**: `get_orders_sorted()` RPC — pending first, then `tentative_delivery_date DESC`

### 2.3 Receivables Tracker
- **Role gating**: None
- **Primary entities**: `sales_transactions` (via `get_receivables_summary()` RPC), `client_followups`
- **Per-row metrics**: outstanding, payment count, last/first payment dates, avg days between payments, expected next payment, payment status
- **Balance filter**: 3-state — With balance (>0) / All / No balance (≤0)
- **Activity filter**: Active (all) / Inactive (clients with ALL `customer_id`s having `is_active=false`, from `get_inactive_receivables()`)
- **Actions**: Log followup notes ✍, update next_followup_date ✍, assign staff ✍, view ledger drawer, export Excel ✍

### 2.4 Client Transactions
- **Role gating**: None
- **Primary entities**: `sales_transactions` (all), `invoices`, `customers`
- **Tabs**: Record Sale | Record Client Payment | Configurations
- **Sale amount formula**: `quantity_cases × customers.price_per_case` (auto-populated, overridable)
- **Multi-SKU support**: each item creates a separate `sales_transactions` row
- **Actions**: Record sale ✍, record payment ✍, edit transaction ✍, delete transaction ✍, generate invoice ✍ (Google Drive/OneDrive), export Excel ✍, export Ledger ✍
- **Auto-save**: form data persisted to `localStorage`

Source: `src/components/sales/SalesEntry.tsx` lines 444–474, 773

### 2.5 Factory Transactions
- **Primary entities**: `factory_payables`, `factory_pricing`, `production`
- **`transaction_type`**: `'production'` (money owed to factory) / `'payment'` (money paid to factory)
- **Actions**: Create, edit, delete factory payable/payment ✍

### 2.6 Transport
- **Primary entities**: `transport_expenses`
- **Fields**: amount, expense_date, expense_group, transport_vendor, client_id (FK → customers)
- **Actions**: Create, edit, delete ✍

### 2.7 Labels
- **Primary entities**: `label_purchases`, `label_vendors`, `label_payments`, `label_availabilities`, `back_label_purchases`
- **Actions**: Record label purchase ✍, record payment ✍, manage vendors ✍

### 2.8–2.9 Profitability / Sales Tracker
- **Role gating**: Manager only
- **UNKNOWN** — component files not read during audit

### 2.10 Audit Logs
- **Role gating**: Manager only
- **Primary entity**: `audit_logs`
- **Fields**: action (CREATE/UPDATE/DELETE), entity_type, entity_id, old_values JSONB, new_values JSONB, username

### 2.11–2.14 Management Tabs
- **User Management**: `user_management`, `profiles` — email, role, status, associated_branches[], associated_clients[]
- **Application Configuration**: `invoice_configurations` key-value store
- **WhatsApp Configuration**: `whatsapp_templates`, `payment_reminder_schedules`
- **Email Reports**: `email_report_schedules` — configure 3 report types, send times, recipients; on-demand Inactive Clients CSV export

---

## 3. Domain Model

### 3.1 `customers`
**One row per `(client_name, branch, SKU)`.** A single real-world client ordering 3 SKUs = 3 rows.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `client_name` | text | Originally `dealer_name` in early migrations |
| `branch` | text (nullable) | Area/location |
| `sku` | text (nullable) | Product SKU for this pricing row |
| `price_per_case` | numeric | Client-specific sell price |
| `price_per_bottle` | numeric | |
| `pricing_date` | date | When this price became effective |
| `is_active` | boolean (default true) | false = hidden from all forms and queries |
| `is_deprecated` | boolean (default false) | true = hidden from forms but history preserved |
| `gst_number` | text (nullable) | |
| `whatsapp_number` | text (nullable) | Used by payment reminders |

Source: `src/integrations/supabase/types.ts` lines 48–91; `supabase/migrations/20260603000000_add_is_deprecated_to_customers.sql`

### 3.2 `sales_transactions`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `customer_id` | FK → customers | |
| `transaction_date` | date | |
| `transaction_type` | text | `'sale'` (debit) or `'payment'` (credit). No `'adjustment'` type exists. |
| `amount` | numeric | Raw transaction amount |
| `total_amount` | numeric | **Trigger-maintained running outstanding balance** — NOT the transaction amount |
| `quantity` | integer (nullable) | Number of cases |
| `sku` | text (nullable) | |
| `branch` | text (nullable) | Redundant with customers.branch; kept for query convenience |
| `invoice_id` | text (nullable) | Added in migration `20260606000000` |

Source: `src/integrations/supabase/types.ts` lines 349–400

### 3.3 `invoices`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `invoice_number` | varchar UNIQUE | Format: `INV-YYYY-MM-NNN` |
| `transaction_id` | FK → sales_transactions | |
| `customer_id` | FK → customers | |
| `invoice_date` | date | |
| `due_date` | date (nullable) | |
| `status` | varchar | `'generated'` \| `'sent'` \| `'paid'` \| `'cancelled'` |
| `storage_provider` | varchar | `'google_drive'` \| `'onedrive'` |
| `word_file_id` / `pdf_file_id` | text | Cloud file IDs |
| `word_file_url` / `pdf_file_url` | text | Download URLs |

Source: `src/integrations/supabase/types.ts` lines 607–678

### 3.4 `orders`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `client` | text | Client name — NOT a FK |
| `branch` | text (nullable) | |
| `sku` | text | |
| `number_of_cases` | integer | |
| `order_date` | date (nullable) | |
| `tentative_delivery_date` | date (nullable) | |
| `status` | text | `'pending'` \| `'dispatched'` \| `'delivered'` \| `'cancelled'` |
| `customer_id` | FK → customers (nullable) | |
| `stock_ready` | boolean (default false) | Added `20260618050000` |

Source: `src/integrations/supabase/types.ts` lines 748–795

### 3.5 `orders_dispatch`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `client` | text | |
| `branch` | text (nullable) | |
| `sku` | text | |
| `cases` | integer | |
| `delivery_date` | date (nullable) | |
| `customer_id` | FK → customers (nullable) | |
| `order_date` | date | Added `20260601100000` |

**⚠ No FK to `orders.id`** — link is implicit via client+branch+SKU+date.

### 3.6 `factory_payables`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `transaction_date` | date | |
| `transaction_type` | text | `'production'` (cost owed) \| `'payment'` (paid) |
| `amount` | numeric | |
| `quantity` | integer (nullable) | Cases |
| `sku` | text (nullable) | |
| `customer_id` | FK → customers (nullable) | Links to which client this production was for |

### 3.7 `factory_pricing`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `sku` | text | |
| `pricing_date` | date | |
| `price_per_bottle` | numeric | |
| `bottles_per_case` | integer | |
| `cost_per_case` | numeric (nullable) | Generated column: `price_per_bottle × bottles_per_case` |
| `tax` | numeric (nullable) | |

### 3.8 `sku_configurations`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `sku` | text UNIQUE | Canonical SKU identifier |
| `bottles_per_case` | integer | |
| `cost_per_bottle` | numeric | |
| `cost_per_case` | numeric (nullable) | |
| `display_order` | integer | Added `20260514100000` |

### 3.9 `transport_expenses`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `amount` | numeric | |
| `expense_date` | date | |
| `expense_group` | text (nullable) | |
| `transport_vendor` | text (nullable) | |
| `client_id` | FK → customers (nullable) | |
| `branch` | text (nullable) | |

### 3.10 Labels

**`label_purchases`**: vendor_id (FK → label_vendors), client_id (FK → customers, nullable), quantity, cost_per_label, total_amount, sku, description

**`label_vendors`**: vendor_name, label_type, price_per_label

**`label_payments`**: payment_amount, payment_date, payment_method, `vendor` (text — NOT a FK)

**`label_availabilities`**: available_quantity, client_id, sku

**`back_label_purchases`**: global stock (not per-client) — purchase_date, quantity, cost_per_label, total_amount

**`customer_back_label_history`**: time-bounded per-client requirement — client_name, requires_back_label (boolean), effective_from (date)

### 3.11 `profiles`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | = auth.users.id |
| `email` | text | |
| `full_name` | text (nullable) | |
| `role` | enum | `'admin'` \| `'manager'` \| `'employee'` \| `'viewer'` |

### 3.12 `client_followups`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `dealer_name` | text | = client_name (original column name) |
| `branch` | text | |
| `comments` | text (nullable) | Latest follow-up note |
| `next_followup_date` | date (nullable) | |

UNIQUE: `(dealer_name, branch)` — one row per client+branch pair.

### 3.13 `customer_assignee`
`customer_id` (PK, FK → customers), `assignee_name`, `updated_at`

### 3.14 `payment_reminder_schedules`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | text | e.g. `'3-Day Reminder'` |
| `days_of_week` | JSONB | Array of JS day numbers 0–6 |
| `send_time_ist` | varchar | HH:MM |
| `is_enabled` | boolean | |
| `is_recurring` | boolean (default true) | One-time if false |
| `min_outstanding_amount` | numeric (default 0) | |
| `start_date` | date (nullable) | |

Seeded: `'3-Day Reminder'` (enabled), `'7-Day Reminder'` (enabled), `'15-Day Reminder'` (disabled)

### 3.15 `festival_campaigns`
Status: `'scheduled'` | `'sending'` | `'sent'` | `'failed'` | `'cancelled'`
Fields: name, template_id, media_url, media_type (`'image'`|`'video'`), scheduled_at, total_recipients, sent_count, failed_count

### 3.16 `email_report_schedules`
`report_type` (UNIQUE): `'orders_payment_status'` | `'payment_followup'` | `'credit_risk'`
Fields: label, enabled, send_time (HH:MM IST), recipient_email, last_sent_at

### 3.17 `audit_logs`
action: `'CREATE'` | `'UPDATE'` | `'DELETE'`
Fields: user_id, username, action, entity_type, entity_id, description, old_values (JSONB), new_values (JSONB)

### 3.18 Other Material Tables
| Table | Purpose |
|---|---|
| `production` | Production run records (production_date, sku, no_of_cases) — not FK-linked to factory_payables |
| `material_purchases` | Raw material/packaging purchases |
| `client_contacts` | Named contacts per client for WhatsApp targeting |
| `client_followup_notes` | Timestamped notes per customer_id |
| `whatsapp_message_logs` | Full WhatsApp send history with status, failure_reason, api_response |
| `whatsapp_templates` | Message templates with placeholders array |
| `payment_reminder_logs` | Per-send history for scheduled reminders |
| `festival_campaign_recipients` | Per-recipient send status for campaigns |
| `email_report_logs` | Email send history (⚠ absent from types.ts — see §8.8) |
| `invoice_configurations` | App config key-value store |
| `invoice_number_sequence` | Sequential invoice numbering per prefix+year+month |
| `saved_filters` | User-saved filter presets per module |
| `backup_logs` | Database backup run history |
| `user_management` | Extended user records with associated_branches[], associated_clients[] |
| `_archived_adjustments` | Legacy data — not referenced by active code |
| `_archived_label_design_costs` | Legacy data — not referenced by active code |

**No database views are defined.** Source: `src/integrations/supabase/types.ts` line 1044: `Views: { [_ in never]: never }`

---

## 4. Business Rules & Calculations

### 4.1 Outstanding Balance (trigger-maintained running total)

```sql
-- supabase/migrations/20260623100000_fix_outstanding_recalculation_and_backfill.sql (lines 14–25)
SUM(
  CASE WHEN st2.transaction_type = 'sale' THEN st2.amount ELSE -st2.amount END
) OVER (
  ORDER BY
    st2.transaction_date,
    CASE WHEN st2.transaction_type = 'payment' THEN 0 ELSE 1 END,
    st2.created_at
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS running_total
```

- Ordering: date ASC → payments before sales on same date → created_at ASC
- Fires on every INSERT/UPDATE/DELETE on `sales_transactions`; groups by `(client_name, branch)`
- Re-entrance guard: `IF pg_trigger_depth() > 1 THEN RETURN NULL`

### 4.2 Aggregate Outstanding — `get_receivables_summary()` RPC

```sql
-- supabase/migrations/20260708110000_receivables_summary_rpc.sql (lines 19–33)
COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
- COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
AS outstanding
```

Groups by `(c.id, c.client_name, c.branch)` — one row per `customer_id`.
Also returns: `payment_count`, `last_payment_date`, `first_payment_date`, `payments_this_month`.

### 4.3 Inactive Clients — `get_inactive_receivables()` RPC

```sql
-- supabase/migrations/20260903183830_add_get_inactive_receivables.sql
WHERE NOT EXISTS (
  SELECT 1 FROM customers c_active
  WHERE c_active.client_name = c.client_name
    AND COALESCE(c_active.branch, '') = COALESCE(c.branch, '')
    AND c_active.is_active = true
)
GROUP BY c.client_name, COALESCE(c.branch, '')
```

Returns: customer_id (representative), client_name, branch, outstanding, payment_count, last_payment_date, first_payment_date, payments_this_month

### 4.4 Sale Amount Calculation

```typescript
// src/components/sales/SalesEntry.tsx (lines 463–465)
const qty = parseInt(quantity);
if (qty && customerSKURecord.price_per_case) {
  calculatedAmount = (qty * customerSKURecord.price_per_case).toFixed(2);
}
```

`amount = quantity_cases × customers.price_per_case` — auto-calculated but overridable.

### 4.5 Factory Outstanding

```typescript
// src/components/dashboard/Dashboard.tsx (lines 245–246)
factoryOutstanding: aggregates.factory_payables - aggregates.factory_payments
```

From `get_dashboard_aggregates()` RPC:
```sql
-- supabase/migrations/20260608100000_add_dashboard_aggregates_rpc.sql (lines 12–13)
'factory_payables', COALESCE((SELECT SUM(amount) FROM factory_payables WHERE transaction_type = 'production'), 0),
'factory_payments', COALESCE((SELECT SUM(amount) FROM factory_payables WHERE transaction_type = 'payment'), 0),
```

### 4.6 Gross Profit (Dashboard)

```typescript
// src/components/dashboard/Dashboard.tsx (lines 84–86)
profit: aggregates.total_sales - aggregates.factory_payables - aggregates.transport_expenses
```

Per-client monthly profit in BusinessAnalyticsChart allocates factory and label costs proportionally by case volume share:
```typescript
// src/components/dashboard/BusinessAnalyticsChart.tsx (lines 286–292)
profit += data.revenue - factoryCost * share - labelsCost * share - (transportMap.get(data.clientId) ?? 0);
// share = client_cases / total_cases_that_month
```

**⚠ Profit is hidden from `admin` role** (`src/components/dashboard/BusinessAnalyticsChart.tsx` line 144)

### 4.7 Credit Limit (ClientOverviewPanel)

```typescript
// src/components/dashboard/ClientOverviewPanel.tsx (lines 376–382)
const recent180Sales = sales.filter(t => t.transaction_date >= cutoff180Str);
const creditLimit = recent180Sales.reduce((s, t) => s + (t.amount ?? 0), 0) / 6;
const creditUtilization = creditLimit > 0
  ? Math.min(999, (outstanding / creditLimit) * 100)
  : (outstanding > 0 ? 999 : 0);
```

`creditLimit = SUM(sales last 180 days) / 6` — average monthly over last 6 months.

**⚠ Different formula in email `credit_risk` report:**
```typescript
// supabase/functions/send-report-emails/index.ts (lines 582–588)
const avgMonthly = totalSales / monthsActive;
const paymentRatio = totalSales > 0 ? totalPaid / totalSales : 0;
const creditLimit = avgMonthly * paymentRatio;
```

### 4.8 Payment Status Categories

```typescript
// src/lib/receivablesUtils.ts (lines 103–118)
if (totalPayments === 0)           paymentStatus = 'No Payments';
else if (totalPayments === 1)      paymentStatus = 'Only 1 Payment';
else if (paymentDaysOverdue > 14)  paymentStatus = 'OVERDUE';
else if (paymentDaysOverdue > 0)   paymentStatus = 'DUE SOON';
// DUE SOON also if expectedNextPayment is within 5 days
else                               paymentStatus = 'ON TRACK';
```

- `avgDaysBetweenPayments = (lastPmtDate - firstPmtDate) / (paymentCount - 1)`
- `expectedNextPayment = lastPmtDate + avgDaysBetweenPayments`
- `paymentDaysOverdue = max(0, today - expectedNextPayment)`

### 4.9 Dashboard Priority Thresholds

```typescript
// src/components/dashboard/Dashboard.tsx (lines 356–358)
priority = outstanding > 100000 ? "critical" : outstanding > 50000 ? "high" : "medium"
```

### 4.10 Collections This Month

```typescript
// src/lib/receivablesUtils.ts (lines 68–71)
let collectionsThisMonth = 0;
for (const r of summaryRows) {
  collectionsThisMonth += Number(r.payments_this_month);
}
```

`payments_this_month` = sum of payment transactions on or after `date_trunc('month', CURRENT_DATE)` in `get_receivables_summary()`.

### 4.11 Invoice Numbering

Format: `INV-YYYY-MM-NNN` (sequential per year-month, stored in `invoice_number_sequence`).

```sql
-- supabase/migrations/20250127000000_create_invoice_system.sql (lines 100–106)
v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 3, '0');
-- v_prefix_key = 'INV-2026-06' for June 2026
```

### 4.12 Order Status Lifecycle

`'pending'` → `'dispatched'` → `'delivered'` | `'cancelled'`

`stock_ready` is a boolean flag togglable independently of status.

Sort order for `get_orders_sorted()`:
```sql
-- supabase/migrations/20250120000001_receivables_function.sql (lines 57–90)
ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
         tentative_delivery_date DESC NULLS LAST
```

### 4.13 `is_active` vs `is_deprecated`

- `is_active = false` → excluded from entry form dropdowns and active customer queries
  (e.g. `ClientOverviewPanel` line 193: `.eq('is_active', true)`)
- `is_deprecated = true` → also hidden from entry forms and analysis tables, but transaction history is preserved for historical queries
- `get_inactive_receivables()` specifically targets clients where ALL customer_ids have `is_active = false`

Source: `supabase/migrations/20260603000000_add_is_deprecated_to_customers.sql`

---

## 5. Data Flows

### 5.1 Order → Sale → Invoice → Payment → Outstanding

1. **Order created** → `orders` row, `status = 'pending'`
2. **Sale entered** → `sales_transactions` row, `transaction_type = 'sale'`, `amount = qty × price_per_case`
3. **Trigger fires** → `recalculate_outstanding_for_client(client_name, branch)` updates `total_amount` (running balance) for all rows in that client+branch group
4. **Invoice generated** (optional, if auto-invoice enabled) → `generate-invoice` edge function → `invoices` row created, Word/PDF uploaded to Google Drive or OneDrive
5. **Payment entered** → `sales_transactions` row, `transaction_type = 'payment'`; trigger fires again, reducing running balances
6. **UI displays**: `transaction.total_amount` (trigger-stored) or `get_receivables_summary()` for aggregated view

### 5.2 Dispatch / Delivery Recording

1. Order status → `'dispatched'` + insert `orders_dispatch` row (separate table, no FK to `orders.id`)
2. Order status → `'delivered'` when confirmed
3. Reconciling orders ↔ dispatch requires matching on `(client, branch, sku, date)` — no direct FK

### 5.3 Label Purchase / Stock Flow

1. `label_purchases` row inserted (vendor, quantity, cost, optional client+SKU)
2. `label_payments` row inserted separately (text vendor name, not FK)
3. `label_availabilities` tracks available_quantity per client+SKU (UNKNOWN if auto-updated)
4. Back labels: `back_label_purchases` (global stock) + `customer_back_label_history` (time-bounded per-client requirement — find MAX(effective_from) ≤ target_date)

### 5.4 WhatsApp Payment Reminder Flow

1. Cron (every 15 min) → `payment-reminder-scheduler` edge function
2. Calls `get_customer_outstanding()` → filter by `outstanding ≥ min_outstanding_amount`
3. Dedup: skip clients already sent today (query `payment_reminder_logs WHERE status='sent' AND triggered_at >= today_IST_midnight`)
4. Message sent via `whatsapp-send` edge function → 360messenger.com API using key from `invoice_configurations`
5. Contacts: use `client_contacts` rows if they exist, else `customers.whatsapp_number`
6. Logs → `payment_reminder_logs` + `whatsapp_message_logs`
7. One-time schedules: set `is_enabled = false` after first successful send
8. Summary email sent to `backup_notification_email` via `send-email` edge function

### 5.5 Email Report Schedule Flow

1. Hourly cron → `send-report-emails` edge function
2. Match IST hour to `send_time`; skip if `last_sent_at` is today IST (unless `force=true`)
3. **Data sources per report type**:
   - `orders_payment_status`: `get_customer_outstanding()` + `orders WHERE status='pending'` + `sales_transactions` (for order frequency analysis)
   - `payment_followup`: `get_customer_outstanding()` + `client_followups`
   - `credit_risk`: `get_customer_outstanding()` + all `sales_transactions`
4. Send via Resend API
5. Update `last_sent_at` in `email_report_schedules`; insert row in `email_report_logs`

---

## 6. APIs & Integrations

### 6.1 Supabase RPCs

| Function | Description |
|---|---|
| `get_receivables_summary()` | Receivables Tracker — outstanding + payment stats per customer_id+client+branch |
| `get_customer_outstanding()` | Outstanding + invoice_count + oldest_sale_date per customer_id |
| `get_inactive_receivables()` | Clients where ALL SKU customer_ids have `is_active=false` |
| `get_dashboard_aggregates()` | Single-call dashboard aggregates (sales, factory, transport, label costs, current/prior month) |
| `get_orders_sorted()` | Pending-first order list |
| `get_latest_sales_by_client_area(JSONB)` | Batch latest sale per client+area (Transport) |
| `generate_invoice_number(prefix, use_year, use_month)` | Sequential invoice numbering |
| `recalculate_outstanding_for_client(client_name, branch)` | Recomputes `total_amount` running balance |
| `get_user_role(user_id)` | Returns app_role for a user |
| `has_role_or_higher(required_role, user_id)` | Role hierarchy check |
| `user_has_data_access(table_name, client_name, branch_name)` | Data-level RLS helper |
| `ping()` | Keepalive — returns epoch |

### 6.2 Edge Functions

| Function | Purpose |
|---|---|
| `payment-reminder-scheduler` | Automated payment reminder dispatch (cron + manual) |
| `send-report-emails` | 3 scheduled email reports via Resend |
| `whatsapp-notify` | Sends WhatsApp messages via 360messenger.com to a list of recipients |
| `whatsapp-send` | Structured WhatsApp send (uses templates, logs to whatsapp_message_logs) |
| `whatsapp-retry` | Retries failed WhatsApp messages |
| `whatsapp-pdf-proxy` | Proxies PDF files for WhatsApp attachment |
| `festival-campaign-sender` | Sends festival broadcast campaigns |
| `generate-invoice` (implied) | Creates invoice document and uploads to Drive/OneDrive |
| `google-drive-upload` / `google-drive-token` | Google Drive file storage + OAuth refresh |
| `onedrive-upload` / `onedrive-token` | OneDrive file storage + OAuth refresh |
| `database-backup` / `backup-scheduler` / `cleanup-old-backups` | Scheduled DB backups to Google Drive |
| `create-user` / `delete-user` | Auth user management |
| `send-daily-audit-email` | Daily audit summary email (content UNKNOWN) |
| `send-email` | Generic email send helper (used internally) |
| `send-welcome-email` (+ variants) | New user welcome emails |

### 6.3 External APIs

| API | Provider | Used for | Config location |
|---|---|---|---|
| WhatsApp Messaging | 360messenger.com | Payment reminders, notifications | `invoice_configurations.whatsapp_api_key` |
| Email | Resend | Reports, welcome, audit emails | `RESEND_API_KEY` env var |
| File storage | Google Drive | Invoice Word/PDF storage | `google-drive-token` edge function |
| File storage (alt) | Microsoft OneDrive | Invoice storage alternative | `onedrive-token` edge function |

### 6.4 Auth Roles

| Role | Access |
|---|---|
| `manager` | Full access — all screens |
| `admin` | All screens; profit metric hidden in BusinessAnalyticsChart |
| `employee` | Core tabs only — no profitability, sales-tracker, audit-logs, user-mgmt, config, email-reports |
| `viewer` | Same as employee |

Source: `src/pages/Index.tsx` lines 114–215; `src/integrations/supabase/types.ts` line 1109

### 6.5 Environment Variable Names

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (client-side build) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `SUPABASE_URL` | Supabase URL (edge functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (edge functions) |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `PAYMENT_REMINDER_CRON_SECRET` | Auth secret for payment reminder cron endpoint |

---

## 7. Existing Reports / Analytics

### 7.1 Dashboard KPI Tiles (real-time)
- **Source**: `get_dashboard_aggregates()` + `get_receivables_summary()`
- **Metrics**: Factory Outstanding, Client Outstanding, Sale This Month, Sale Prev Month, Collection Rate, 5 alert counts
- **Date range**: Outstanding = all-time; Sales = current/prior month

### 7.2 Business Analytics Chart (interactive)
- **Source**: Direct table queries — `sales_transactions`, `factory_payables`, `label_purchases`, `back_label_purchases`, `transport_expenses`
- **Metrics**: Monthly Cases, Revenue, Profit, Collections (last 12 months or year-filtered)
- **Filters**: Year selector, multi-select month filter, per-metric toggle
- **Profit hidden for `admin` role**

### 7.3 Client Overview Panel (per-client deep-dive)
- **Source**: `sales_transactions`, `factory_payables`, `transport_expenses`, `label_purchases`, `client_followups`, `client_followup_notes`
- **Metrics**: Lifetime Revenue, Outstanding, Credit Limit, Credit Utilization %, Last Payment, Avg Payment Frequency, Expected Next Payment, First/Latest Order, Total Orders, Order Status (NEW/ACTIVE/AT RISK/INACTIVE), Payment Status

### 7.4 Email: Orders & Payment Status (`orders_payment_status`)
- **Cadence**: Daily at configured IST hour
- **Content**: Summary counts + pending orders table + order analysis (avg days between orders, expected next order, days overdue)
- **Source**: `orders WHERE status='pending'` + `get_customer_outstanding()` + `sales_transactions`

### 7.5 Email: Payment Follow Up (`payment_followup`)
- **Content**: Summary + table of client, outstanding, next_followup_date, latest note, status (Overdue / Upcoming / No Date)
- **Status logic**: Overdue if `next_followup_date < today`; Upcoming if set and future; No Date otherwise
- **Source**: `get_customer_outstanding()` + `client_followups`

### 7.6 Email: Credit Risk (`credit_risk`)
- **Content**: Summary + table of client, credit_limit, outstanding, used%, status (Over Limit / Warning / OK)
- **Thresholds**: Over Limit >100%; Warning 75–100%; OK otherwise
- **Formula**: `creditLimit = (totalSales / monthsActive) × (totalPaid / totalSales)` ⚠ differs from UI formula

### 7.7 On-Demand Excel Exports
- Client Receivables Outstanding (Dashboard)
- Recent Transactions flat export (Client Transactions)
- Client Ledger with running balance (Client Transactions)
- Receivables Tracker export (active or inactive clients)

### 7.8 On-Demand CSV Export
- Inactive Clients with Outstanding (Email Reports tab): source `get_inactive_receivables()`, columns = Client, Branch, Outstanding, First Order, Last Order, No. of Orders, Next Follow-up, Assignee

---

## 8. Data Quality & Known Caveats

### 8.1 ⚠ Multiple `customer_id` Per Real Client
One row per `(client_name, branch, SKU)` — a client with 3 SKUs has 3 `customer_id`s. Outstanding must always be aggregated by `client_name + branch` across all IDs. Several migrations fix mis-attributed data from this design (e.g. `supabase/migrations/20260714100000_fix_alley91_split_customer_id.sql`).

### 8.2 ⚠ Denormalized Running Balance
`sales_transactions.total_amount` is trigger-maintained. Direct SQL inserts (bypassing the trigger) will leave balances stale. Recovery: call `recalculate_outstanding_for_client()` for all client+branch pairs.

Source: `supabase/migrations/20260516000000_add_outstanding_recalculation_trigger.sql`

### 8.3 Column Rename History
- `sales_transactions.area` renamed to `branch` in `20260520000001`
- `client_followups` still uses `dealer_name` as the column name (= client_name)
- The trigger function uses `COALESCE(c.client_name, c.dealer_name)` and `COALESCE(c.branch, c.area)` for backward compatibility

### 8.4 ⚠ Two Different Credit Limit Formulas
- **ClientOverviewPanel**: `SUM(sales last 180 days) / 6`
- **Email `credit_risk` report**: `(totalSales / monthsActive) × (totalPaid / totalSales)`

These produce different numbers for the same client. Any BI report must document which formula was used.

### 8.5 ⚠ Dashboard Receivables Table: 90-Day Window Only
The Dashboard receivables table queries only the **last 90 days** of transactions. `totalSales` and `totalPayments` shown there are NOT lifetime totals. The Receivables Tracker uses `get_receivables_summary()` which is full-history. Do not mix these figures.

Source: `src/components/dashboard/Dashboard.tsx` lines 108–131

### 8.6 Historical Data Corrections (Pre–mid-2026 data suspect)
Over 30 migrations from June–July 2026 correct duplicate sales, mis-attributed factory payables, and transport amounts. Historical data before mid-2026 should be treated with caution.

Examples: `20260629*`, `20260630*`, `20260714*`

### 8.7 `orders_dispatch` Has No FK to `orders`
Reconciling orders to dispatch events requires matching on `(client, branch, sku)` — fragile for same-client multi-order scenarios on the same SKU.

### 8.8 `email_report_logs` Not in `types.ts`
The table exists and is used by the edge function but is absent from `src/integrations/supabase/types.ts` — it was added via migration after the last type regeneration. BI queries must be written directly in SQL.

### 8.9 `payment_reminder_schedules` Schema Evolution
Went through 7+ schema migrations (column added, type changed from int[] to JSONB, constraints dropped). Confirm live column set directly from the database.

### 8.10 `_archived_*` Tables
`_archived_adjustments` and `_archived_label_design_costs` are present in the schema but not referenced by any active application code. They may contain legacy data from a prior system version.

---

## 9. Recommended BI Source-of-Truth

| BI Use Case | Recommended Source | Notes |
|---|---|---|
| **Client outstanding (authoritative)** | `get_receivables_summary()` or `get_customer_outstanding()` | Aggregate by `client_name + branch` across all `customer_id`s |
| **Monthly sales revenue** | `sales_transactions WHERE transaction_type='sale'` GROUP BY month | Join `customers` for client dimension |
| **Monthly collections (payments)** | `sales_transactions WHERE transaction_type='payment'` GROUP BY month | |
| **Factory cost owed** | `factory_payables WHERE transaction_type='production'` | |
| **Factory payments made** | `factory_payables WHERE transaction_type='payment'` | |
| **Net factory outstanding** | `SUM(production) - SUM(payment)` from `factory_payables` | |
| **Gross profit** | `sales - factory_production - transport_expenses` | Add label costs for full COGS |
| **Transport expenses** | `transport_expenses` | `client_id` FK allows per-client attribution |
| **Label costs** | `label_purchases.total_amount + back_label_purchases.total_amount` | `back_label_purchases` is global (not per-client) |
| **Active customers** | `customers WHERE is_active=true AND is_deprecated=false` | Exclude both flags |
| **Historical incl. deprecated** | `customers WHERE is_active=true` | Do NOT filter `is_deprecated` for historical analysis |
| **Outstanding per-row running balance** | `sales_transactions.total_amount` | Reliable only if trigger was never bypassed |
| **Order pipeline** | `orders WHERE status='pending'` | |
| **Dispatch history** | `orders_dispatch` | Join on client+branch+SKU; no FK to orders |
| **Payment reminder effectiveness** | `payment_reminder_logs` + `payment_reminder_schedules` | |
| **Credit utilization** | `sales_transactions` using `SUM(last 180 days) / 6` | Use UI formula for consistency with ClientOverviewPanel; document which formula |
| **User actions / audit trail** | `audit_logs` | Manager-only in UI; accessible via SQL for BI |
| **WhatsApp delivery** | `whatsapp_message_logs` | |
| **Inactive clients** | `get_inactive_receivables()` RPC | Strictly config-based (`is_active=false`), not date-based |

---

## 10. Open Questions

1. **Opening balances**: No `opening_balance` column confirmed on `customers`. Pre-existing client balances may have been entered as `sales_transactions` rows, but there is no way to identify them from the repo alone.

2. **Profitability module** (`src/components/profitability/Profitability.tsx`): Not read — data sources and KPI definitions UNKNOWN.

3. **Sales Tracker module** (`src/components/sales-tracker/SalesTrackerView.tsx`): Not read — UNKNOWN.

4. **`send-daily-audit-email` edge function**: Content, schedule, and recipient UNKNOWN.

5. **Canonical SKU list**: Migrations reference P-series, Jismat, EL, AL, 250 EC naming conventions. The full live SKU list is in `sku_configurations` but was not queried. Confirm from database.

6. **`user_has_data_access` RLS function**: Its implementation (which migration, what it checks against `user_management.associated_clients/branches`) was not read — row-level access control details are UNKNOWN.

7. **Hosting platform**: No `vercel.json`, `netlify.toml`, or CI config file found in the repo.

8. **`email_report_logs` exact schema**: Confirm from `supabase/migrations/20260615100000_create_email_report_logs.sql`.

9. **`payment_reminder_schedules` live schema**: 7+ schema-altering migrations — confirm live column set from the database.

10. **Invoice prefix configuration**: The exact `invoice_configurations` key name for the invoice prefix (other than the default `'INV'`) is UNKNOWN without reading `invoiceConfigService.ts`.
