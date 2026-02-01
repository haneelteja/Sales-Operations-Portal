# Functional Specification: Invoice Configurations Tab
## Under User Management Module

**Version:** 1.0  
**Date:** January 27, 2026  
**Author:** System Design  
**Status:** Ready for Implementation

---

## 1. Executive Summary

This specification defines a new **Configurations** tab within the existing User Management module that allows Manager-role users to centrally manage invoice-related system configurations. The tab provides a paginated, searchable interface for managing Google Drive folder paths and automatic invoice generation settings with immediate system-wide effect.

---

## 2. Overview

### 2.1 Purpose
- Centralized management of invoice-related configurations
- Enable/disable automatic invoice generation
- Configure Google Drive folder paths for invoice storage
- Provide immediate system-wide effect without application restart

### 2.2 Scope
- New tab within User Management module
- Manager-role access only
- Two configuration types:
  1. Invoice folder path in Google Drive
  2. Enable Auto Invoice Generation toggle

### 2.3 Out of Scope
- Configuration history/audit trail (future enhancement)
- Multiple folder paths per configuration (future enhancement)
- Configuration templates (future enhancement)

---

## 3. User Interface Specification

### 3.1 Tab Location and Navigation

**Location:** User Management → Configurations Tab

**Navigation Structure:**
```
User Management
├── Users Tab (existing)
└── Configurations Tab (new)
```

**Tab Implementation:**
- Add tab navigation within User Management component
- Use existing tab component pattern from the application
- Tab should be visible only to Manager-role users
- Tab label: "Configurations"
- Tab icon: Settings/Cog icon (matching application style)

### 3.2 Landing Page Layout

**Page Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  User Management > Configurations                          │
│  [Header with title and description]                       │
├─────────────────────────────────────────────────────────────┤
│  [Search Bar]                    [Refresh Button]          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │ S.NO │ Description              │ Action              │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  1   │ Invoice folder path...   │ [Edit]              │ │
│  │  2   │ Enable Auto Invoice...  │ [Toggle Switch]     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Pagination Controls]                                      │
└─────────────────────────────────────────────────────────────┘
```

**Header Section:**
- Title: "Invoice Configurations"
- Description: "Manage invoice generation settings and Google Drive folder paths"
- Position: Top of the page, consistent with existing User Management styling

**Search Bar:**
- Placeholder: "Search configurations..."
- Position: Above the table
- Behavior: Real-time filtering of configuration descriptions
- Clear button (X icon) when search has value

**Refresh Button:**
- Position: Right side, aligned with search bar
- Icon: Refresh/Reload icon
- Behavior: Reloads configuration data from database

---

## 4. Table Specification

### 4.1 Table Structure

**Table Columns (exactly 3 columns):**

| Column | Width | Alignment | Description |
|--------|-------|-----------|-------------|
| S.NO | 10% | Center | Sequential number (1, 2, ...) |
| Description | 60% | Left | Human-readable configuration name |
| Action | 30% | Center | Interactive control (Edit button or Toggle switch) |

### 4.2 Table Styling

- Follow existing application table styling
- Alternating row colors (zebra striping)
- Hover effect on rows
- Responsive design (horizontal scroll on mobile)
- Header row: Bold, background color matching application theme

### 4.3 Pagination

**Pagination Controls:**
- Position: Below the table
- Display: "Showing X of Y configurations"
- Controls:
  - Previous button (disabled on first page)
  - Page numbers (current page highlighted)
  - Next button (disabled on last page)
  - Page size selector: 10, 25, 50, 100 items per page

**Default Settings:**
- Page size: 25 items per page
- Start on page 1

**Pagination Behavior:**
- Maintain pagination state during search/filter operations
- Reset to page 1 when search query changes
- Preserve pagination when switching between tabs

### 4.4 Search/Filter Functionality

**Search Behavior:**
- Search field: Text input above the table
- Search scope: Configuration descriptions only
- Search type: Case-insensitive, partial match
- Real-time filtering: Updates table as user types
- Debounce: 300ms delay to prevent excessive filtering

**Search Examples:**
- Query: "folder" → Matches "Invoice folder path in Google Drive"
- Query: "auto" → Matches "Enable Auto Invoice Generation"
- Query: "invoice" → Matches both configurations

---

## 5. Configuration Definitions

### 5.1 Configuration 1: Invoice Folder Path in Google Drive

**Display Name:** "Invoice folder path in Google Drive"

**Description:** "Specifies the Google Drive folder path where invoice files (DOCX and PDF) are stored. Default: MyDrive/Invoice"

**Action Type:** Edit Button

**Default Value:** "MyDrive/Invoice"

**Storage:**
- Database field: `invoice_folder_path` (TEXT)
- Table: `invoice_configurations` (new table, see Database Schema)

**Validation Rules:**
- Required field (cannot be empty)
- Format: Google Drive-style path
- Valid characters: Letters, numbers, spaces, forward slashes (/), hyphens (-), underscores (_)
- Maximum length: 255 characters
- Must start with "MyDrive/" or valid folder name
- Path segments separated by forward slashes (/)
- Examples:
  - ✅ Valid: "MyDrive/Invoice"
  - ✅ Valid: "MyDrive/Invoices/2026"
  - ✅ Valid: "MyDrive/Client_Invoices"
  - ❌ Invalid: "C:\Invoice" (Windows path)
  - ❌ Invalid: "../Invoice" (relative path)
  - ❌ Invalid: "" (empty)

**Edit Dialog:**
- Trigger: Click "Edit" button in Action column
- Modal dialog overlay (centered, backdrop blur)
- Dialog title: "Edit Invoice Folder Path"
- Input field:
  - Label: "Folder Path"
  - Placeholder: "MyDrive/Invoice"
  - Pre-filled with current value
  - Full width input
  - Validation feedback (error message below input)
- Buttons:
  - Cancel (left, outline style)
  - Save (right, primary style)
- Dialog size: Medium (max-width: 500px)

**Save Behavior:**
- Validate input before saving
- Show loading state on Save button during save operation
- On success:
  - Close dialog
  - Show success toast notification: "Invoice folder path updated successfully"
  - Refresh table data
  - Apply change immediately to invoice generation system
- On error:
  - Show error toast notification with error message
  - Keep dialog open for user to correct

**Cancel Behavior:**
- Close dialog without saving
- Discard any changes made to input field

### 5.2 Configuration 2: Enable Auto Invoice Generation

**Display Name:** "Enable Auto Invoice Generation"

**Description:** "When enabled, invoices (DOCX and PDF) are automatically generated for every client sale transaction. Manual invoice generation remains available regardless of this setting."

**Action Type:** Toggle Switch

**Default Value:** `true` (enabled)

**Storage:**
- Database field: `auto_invoice_generation_enabled` (BOOLEAN)
- Table: `invoice_configurations` (new table)

**Toggle Switch Behavior:**
- Visual state:
  - ON (enabled): Switch to right, green/blue color
  - OFF (disabled): Switch to left, gray color
- Click behavior:
  - Toggle state immediately in UI (optimistic update)
  - Show loading indicator during save operation
  - On success:
    - Show success toast: "Auto invoice generation [enabled/disabled]"
    - Apply change immediately to invoice generation system
  - On error:
    - Revert toggle state
    - Show error toast with error message

**System Impact:**
- When enabled (`true`):
  - SalesEntry component automatically generates invoices on sale transaction
  - Both DOCX and PDF files are generated
  - Files are uploaded to configured Google Drive folder
- When disabled (`false`):
  - Automatic generation is skipped
  - Manual "Generate Invoice" button remains available
  - Users can still manually generate invoices

---

## 6. Database Schema

### 6.1 New Table: `invoice_configurations`

```sql
CREATE TABLE IF NOT EXISTS invoice_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('string', 'boolean', 'number')),
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoice_configs_key 
  ON invoice_configurations(config_key);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_invoice_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_configs_updated_at
  BEFORE UPDATE ON invoice_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_configs_updated_at();
```

### 6.2 Initial Data Seeding

```sql
-- Insert default configurations
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('invoice_folder_path', 'MyDrive/Invoice', 'string', 'Invoice folder path in Google Drive'),
  ('auto_invoice_generation_enabled', 'true', 'boolean', 'Enable Auto Invoice Generation')
ON CONFLICT (config_key) DO NOTHING;
```

### 6.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE invoice_configurations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read configurations
CREATE POLICY "Allow authenticated users to read invoice configs"
  ON invoice_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Allow managers to update configurations
CREATE POLICY "Allow managers to update invoice configs"
  ON invoice_configurations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role = 'manager'
    )
  );
```

---

## 7. API/Backend Requirements

### 7.1 Fetch Configurations

**Endpoint:** `GET /rest/v1/invoice_configurations`

**Query Parameters:**
- `select=*` (all fields)
- `order=config_key.asc` (alphabetical order)

**Response:**
```json
[
  {
    "id": "uuid",
    "config_key": "invoice_folder_path",
    "config_value": "MyDrive/Invoice",
    "config_type": "string",
    "description": "Invoice folder path in Google Drive",
    "updated_by": "uuid",
    "updated_at": "2026-01-27T10:00:00Z",
    "created_at": "2026-01-27T09:00:00Z"
  },
  {
    "id": "uuid",
    "config_key": "auto_invoice_generation_enabled",
    "config_value": "true",
    "config_type": "boolean",
    "description": "Enable Auto Invoice Generation",
    "updated_by": "uuid",
    "updated_at": "2026-01-27T10:00:00Z",
    "created_at": "2026-01-27T09:00:00Z"
  }
]
```

### 7.2 Update Configuration

**Endpoint:** `PATCH /rest/v1/invoice_configurations`

**Request Body:**
```json
{
  "config_value": "MyDrive/Invoices/2026",
  "updated_by": "uuid"
}
```

**Query Parameters:**
- `id=eq.{config_id}` (target specific configuration)

**Response:**
```json
{
  "id": "uuid",
  "config_key": "invoice_folder_path",
  "config_value": "MyDrive/Invoices/2026",
  "config_type": "string",
  "description": "Invoice folder path in Google Drive",
  "updated_by": "uuid",
  "updated_at": "2026-01-27T10:05:00Z",
  "created_at": "2026-01-27T09:00:00Z"
}
```

**Error Handling:**
- 400 Bad Request: Invalid config_value format
- 403 Forbidden: User is not a Manager
- 404 Not Found: Configuration not found
- 500 Internal Server Error: Database error

---

## 8. Role-Based Access Control

### 8.1 Access Rules

**Manager Role:**
- ✅ View Configurations tab
- ✅ View all configurations
- ✅ Edit invoice folder path
- ✅ Toggle auto invoice generation
- ✅ Search and filter configurations

**Admin Role:**
- ✅ Same permissions as Manager (inherits Manager permissions)

**Client Role:**
- ❌ Cannot access Configurations tab
- ❌ Cannot view configurations
- ❌ Cannot modify configurations

### 8.2 UI Access Control

**Tab Visibility:**
- Check user role on component mount
- Hide Configurations tab if user is not Manager/Admin
- Show access denied message if user navigates directly to URL

**Component-Level Check:**
```typescript
if (profile?.role !== 'manager' && profile?.role !== 'admin') {
  return <AccessDeniedMessage />;
}
```

---

## 9. Immediate System Effects

### 9.1 Invoice Folder Path Change

**When Changed:**
1. Update database immediately
2. Invalidate configuration cache (if exists)
3. Apply to all new invoice generations:
   - SalesEntry component reads updated path
   - Google Drive adapter uses new folder path
   - All subsequent invoices saved to new location
4. Existing invoices remain in old location (no migration)

**Implementation:**
- Configuration service reads from database on each invoice generation
- No caching (or short TTL cache: 30 seconds)
- Real-time effect for new invoices

### 9.2 Auto Invoice Generation Toggle

**When Enabled:**
1. Update database immediately
2. SalesEntry component checks configuration on mount
3. All new sale transactions trigger automatic invoice generation
4. Both DOCX and PDF files generated and uploaded

**When Disabled:**
1. Update database immediately
2. SalesEntry component skips automatic generation
3. Manual "Generate Invoice" button remains functional
4. Users can still generate invoices on-demand

**Implementation:**
- Configuration service provides `isAutoInvoiceEnabled()` function
- SalesEntry component calls this function before generating invoices
- No application restart required
- Changes take effect on next sale transaction

---

## 10. User Stories

### 10.1 As a Manager, I want to...

**US-1:** View all invoice configurations in a table
- **Given:** I am logged in as a Manager
- **When:** I navigate to User Management > Configurations
- **Then:** I see a table with all invoice configurations

**US-2:** Edit the Google Drive folder path for invoices
- **Given:** I am on the Configurations page
- **When:** I click "Edit" for "Invoice folder path in Google Drive"
- **Then:** A dialog opens with the current path
- **And:** I can modify the path
- **And:** I can save or cancel changes

**US-3:** Enable/disable automatic invoice generation
- **Given:** I am on the Configurations page
- **When:** I toggle the "Enable Auto Invoice Generation" switch
- **Then:** The setting is saved immediately
- **And:** The change takes effect for all new sale transactions

**US-4:** Search configurations by description
- **Given:** I am on the Configurations page
- **When:** I type in the search box
- **Then:** The table filters to show matching configurations

**US-5:** Navigate through paginated results
- **Given:** There are more than 25 configurations
- **When:** I click "Next" or select a page number
- **Then:** I see the next page of configurations

---

## 11. Technical Implementation Notes

### 11.1 Component Structure

```
UserManagement/
├── UserManagement.tsx (main component with tabs)
├── UsersTab.tsx (existing)
└── ConfigurationsTab.tsx (new)
    ├── ConfigurationsTable.tsx
    ├── EditFolderPathDialog.tsx
    └── AutoInvoiceToggle.tsx
```

### 11.2 State Management

**Local State:**
- Search query
- Current page
- Page size
- Edit dialog open/close
- Form validation errors

**Server State (React Query):**
- Configurations list (query)
- Update configuration mutation

### 11.3 Configuration Service

**New Service:** `src/services/invoiceConfigService.ts`

```typescript
export interface InvoiceConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'boolean' | 'number';
  description: string;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export async function getInvoiceConfigurations(): Promise<InvoiceConfiguration[]>
export async function updateInvoiceConfiguration(
  id: string, 
  config_value: string
): Promise<InvoiceConfiguration>
export function getInvoiceFolderPath(): Promise<string>
export function isAutoInvoiceEnabled(): Promise<boolean>
```

### 11.4 Integration Points

**SalesEntry Component:**
- Import `isAutoInvoiceEnabled()` from config service
- Check before auto-generating invoices
- Use `getInvoiceFolderPath()` for folder path

**Google Drive Adapter:**
- Use folder path from configuration service
- Fallback to default if configuration not found

---

## 12. Testing Requirements

### 12.1 Unit Tests

- Configuration service functions
- Form validation logic
- Toggle switch state management
- Search/filter functionality

### 12.2 Integration Tests

- Database CRUD operations
- RLS policy enforcement
- Role-based access control
- Configuration update flow

### 12.3 E2E Tests

- Manager can view configurations
- Manager can edit folder path
- Manager can toggle auto generation
- Client cannot access configurations
- Changes take effect immediately

---

## 13. Error Handling

### 13.1 Validation Errors

**Folder Path Validation:**
- Show inline error message below input
- Prevent save until valid
- Error messages:
  - "Folder path is required"
  - "Invalid folder path format. Use Google Drive format: MyDrive/FolderName"
  - "Path cannot exceed 255 characters"

### 13.2 Network Errors

- Show toast notification on save failure
- Retry mechanism for failed updates
- Graceful degradation (show cached value if available)

### 13.3 Permission Errors

- Show access denied message
- Redirect to appropriate page
- Log security violation attempt

---

## 14. Performance Considerations

### 14.1 Optimization

- Debounce search input (300ms)
- Pagination to limit data load
- Lazy load configuration values
- Cache configuration values (30-second TTL)

### 14.2 Scalability

- Table supports up to 1000 configurations
- Pagination handles large datasets
- Search is client-side filtered (acceptable for small dataset)

---

## 15. Future Enhancements

### 15.1 Phase 2 Features

- Configuration history/audit trail
- Multiple folder paths per configuration type
- Configuration templates
- Export/import configurations
- Configuration validation rules UI

### 15.2 Phase 3 Features

- Configuration scheduling (time-based changes)
- Configuration notifications
- Configuration approval workflow
- Configuration versioning

---

## 16. Acceptance Criteria

### 16.1 Must Have

- ✅ Configurations tab visible to Manager role only
- ✅ Table displays exactly 3 columns (S.NO, Description, Action)
- ✅ Two configurations displayed:
  - Invoice folder path (with Edit button)
  - Enable Auto Invoice Generation (with Toggle switch)
- ✅ Edit dialog for folder path with validation
- ✅ Toggle switch for auto invoice generation
- ✅ Search functionality
- ✅ Pagination controls
- ✅ Changes take effect immediately
- ✅ Role-based access control enforced

### 16.2 Should Have

- ⚠️ Refresh button
- ⚠️ Loading states during operations
- ⚠️ Success/error toast notifications
- ⚠️ Responsive design (mobile-friendly)

### 16.3 Nice to Have

- 💡 Configuration descriptions tooltips
- 💡 Configuration change history
- 💡 Bulk configuration updates
- 💡 Configuration export/import

---

## 17. Glossary

- **Configuration:** A system setting that controls invoice generation behavior
- **Folder Path:** Google Drive folder location where invoices are stored
- **Auto Invoice Generation:** Automatic creation of invoices when sale transactions are recorded
- **Manager Role:** User role with elevated permissions to manage system configurations
- **RLS:** Row Level Security (Supabase security feature)

---

## 18. References

- Existing User Management component: `src/components/user-management/UserManagement.tsx`
- Invoice generation hook: `src/hooks/useInvoiceGeneration.ts`
- SalesEntry component: `src/components/sales/SalesEntry.tsx`
- Google Drive adapter: `src/services/cloudStorage/googleDriveAdapter.ts`

---

## 19. Approval

**Prepared by:** System Design Team  
**Reviewed by:** [Pending]  
**Approved by:** [Pending]  
**Date:** [Pending]

---

**End of Specification**
