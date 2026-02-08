# Functional Specification: Application Configuration Tab
## Under User Management Module

**Version:** 2.0  
**Date:** January 27, 2026  
**Author:** System Design  
**Status:** Ready for Implementation  
**Replaces:** Previous "Configurations" tab specification (now corrected)

---

## 1. Executive Summary

This specification defines a new **Application Configuration** tab within the existing User Management module. This tab allows Manager-role users to manage application-level invoice-related configurations, separate from the existing SKU-focused Configurations tab. The new tab provides a paginated, searchable interface for managing Google Drive folder paths and automatic invoice generation settings with immediate system-wide effect.

**Key Distinction:**
- **Existing Configurations Tab:** Manages SKU configurations for factories and clients (unchanged)
- **New Application Configuration Tab:** Manages application-level invoice settings (new, under User Management)

---

## 2. Rollback Confirmation

### 2.1 Rollback Scope

**Status:** ✅ **NO ROLLBACK REQUIRED**

**Verification:**
- ✅ Existing `ConfigurationManagement.tsx` component contains **NO** invoice-related code
- ✅ Existing Configurations tab is purely for SKU management (customers and factory pricing)
- ✅ No invoice-related UI, logic, or API bindings found in the existing Configurations tab
- ✅ SKU configuration functionality remains intact and unaffected

**Conclusion:** The existing Configurations tab is clean and requires no changes. All invoice-related functionality will be implemented in the new Application Configuration tab under User Management.

### 2.2 Preservation Checklist

**Existing Configurations Tab Functionality (Must Remain Unchanged):**
- ✅ Customer SKU pricing management
- ✅ Factory pricing management
- ✅ SKU configuration (bottles per case)
- ✅ All existing filters, sorting, and search functionality
- ✅ All existing CRUD operations
- ✅ All existing export functionality

---

## 3. Overview

### 3.1 Purpose
- Centralized management of **application-level** invoice-related configurations
- Enable/disable automatic invoice generation
- Configure Google Drive folder paths for invoice storage
- Provide immediate system-wide effect without application restart

### 3.2 Scope
- New tab within User Management module
- Manager-role access only
- Two configuration types:
  1. Invoice folder path in Google Drive
  2. Enable Auto Invoice Generation toggle

### 3.3 Out of Scope
- SKU-related configurations (handled by existing Configurations tab)
- Configuration history/audit trail (future enhancement)
- Multiple folder paths per configuration (future enhancement)
- Configuration templates (future enhancement)

---

## 4. Tab Placement and Navigation

### 4.1 Location

**Navigation Path:** User Management → Application Configuration Tab

**Tab Structure:**
```
User Management
├── Users Tab (existing)
└── Application Configuration Tab (new)
```

**Important:** This is a **separate tab** from the existing "Configurations" tab in the main navigation, which remains dedicated to SKU management.

### 4.2 Tab Implementation

**Tab Properties:**
- **Tab Label:** "Application Configuration"
- **Tab Icon:** Settings/Cog icon (matching application style)
- **Tab Position:** Second tab in User Management (after Users tab)
- **Visibility:** Only visible to Manager and Admin roles

**Component Structure:**
```typescript
// In UserManagement.tsx
<Tabs defaultValue="users">
  <TabsList>
    <TabsTrigger value="users">Users</TabsTrigger>
    <TabsTrigger value="app-config">Application Configuration</TabsTrigger>
  </TabsList>
  <TabsContent value="users">
    {/* Existing Users tab content */}
  </TabsContent>
  <TabsContent value="app-config">
    <ApplicationConfigurationTab />
  </TabsContent>
</Tabs>
```

### 4.3 Access Control

**Role-Based Visibility:**
- **Manager:** ✅ Can view and edit Application Configuration tab
- **Admin:** ✅ Can view and edit Application Configuration tab (inherits Manager permissions)
- **Client:** ❌ Cannot see Application Configuration tab

**Implementation:**
```typescript
// Hide tab if user is not Manager/Admin
{profile?.role === 'manager' || profile?.role === 'admin' ? (
  <TabsTrigger value="app-config">Application Configuration</TabsTrigger>
) : null}
```

---

## 5. Landing Page Layout

### 5.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  User Management > Application Configuration                 │
│  [Header with title and description]                         │
├─────────────────────────────────────────────────────────────┤
│  [Search Bar]                    [Refresh Button]          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │ S.NO │ Description              │ Action              │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  1   │ Invoice folder path...   │ [Edit]              │ │
│  │  2   │ Enable Auto Invoice...   │ [Toggle Switch]     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Pagination Controls]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Header Section

**Title:** "Application Configuration"  
**Description:** "Manage application-level invoice generation settings and Google Drive folder paths"

**Styling:**
- Follow existing User Management header styling
- Position: Top of the page
- Font: Match existing User Management title styling

### 5.3 Search Bar

**Properties:**
- **Placeholder:** "Search configurations..."
- **Position:** Above the table, left-aligned
- **Behavior:** Real-time filtering of configuration descriptions
- **Debounce:** 300ms delay
- **Clear Button:** X icon appears when search has value

**Search Scope:**
- Searches configuration descriptions only
- Case-insensitive, partial match
- Examples:
  - "folder" → Matches "Invoice folder path in Google Drive"
  - "auto" → Matches "Enable Auto Invoice Generation"
  - "invoice" → Matches both configurations

### 5.4 Refresh Button

**Properties:**
- **Position:** Right side, aligned with search bar
- **Icon:** Refresh/Reload icon (matching application style)
- **Behavior:** Reloads configuration data from database
- **Loading State:** Shows spinner during refresh

---

## 6. Table Specification

### 6.1 Table Structure

**Table Columns (exactly 3 columns):**

| Column | Width | Alignment | Description |
|--------|-------|-----------|-------------|
| S.NO | 10% | Center | Sequential number (1, 2, ...) |
| Description | 60% | Left | Human-readable configuration name |
| Action | 30% | Center | Interactive control (Edit button or Toggle switch) |

### 6.2 Table Styling

- Follow existing application table styling (matching User Management tables)
- Alternating row colors (zebra striping)
- Hover effect on rows
- Responsive design (horizontal scroll on mobile)
- Header row: Bold, background color matching application theme

### 6.3 Table Data

**Configuration 1:**
- **S.NO:** 1
- **Description:** "Invoice folder path in Google Drive"
- **Action:** Edit button

**Configuration 2:**
- **S.NO:** 2
- **Description:** "Enable Auto Invoice Generation"
- **Action:** Toggle switch

### 6.4 Pagination

**Pagination Controls:**
- **Position:** Below the table
- **Display:** "Showing X of Y configurations"
- **Controls:**
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

**Note:** With only 2 configurations, pagination may seem unnecessary, but it's included for future scalability and consistency with application patterns.

---

## 7. Configuration Definitions

### 7.1 Configuration 1: Invoice Folder Path in Google Drive

**Display Name:** "Invoice folder path in Google Drive"

**Description:** "Specifies the Google Drive folder path where invoice files (DOCX and PDF) are stored. Default: MyDrive/Invoice"

**Action Type:** Edit Button

**Default Value:** `"MyDrive/Invoice"`

**Storage:**
- Database field: `config_value` (TEXT)
- Database key: `invoice_folder_path`
- Table: `invoice_configurations` (see Database Schema section)

**Validation Rules:**
- **Required:** Yes (cannot be empty)
- **Format:** Google Drive-style path
- **Valid Characters:** Letters, numbers, spaces, forward slashes (/), hyphens (-), underscores (_)
- **Maximum Length:** 255 characters
- **Must Start With:** "MyDrive/" or valid folder name
- **Path Separator:** Forward slashes (/)
- **Examples:**
  - ✅ Valid: `"MyDrive/Invoice"`
  - ✅ Valid: `"MyDrive/Invoices/2026"`
  - ✅ Valid: `"MyDrive/Client_Invoices"`
  - ❌ Invalid: `"C:\Invoice"` (Windows path)
  - ❌ Invalid: `"../Invoice"` (relative path)
  - ❌ Invalid: `""` (empty)

**Edit Button:**
- **Label:** "Edit"
- **Style:** Secondary/outline button
- **Icon:** Edit icon (optional)
- **Position:** Center-aligned in Action column

**Edit Dialog:**
- **Trigger:** Click "Edit" button
- **Type:** Modal dialog overlay (centered, backdrop blur)
- **Dialog Title:** "Edit Invoice Folder Path"
- **Dialog Size:** Medium (max-width: 500px)

**Dialog Content:**
- **Input Field:**
  - **Label:** "Folder Path"
  - **Placeholder:** "MyDrive/Invoice"
  - **Pre-filled:** Current value from database
  - **Full width:** Yes
  - **Validation:** Real-time validation feedback
  - **Error Message:** Display below input if invalid

- **Buttons:**
  - **Cancel:** Left side, outline style
  - **Save:** Right side, primary style
  - **Loading State:** Save button shows spinner during save operation

**Save Behavior:**
1. Validate input before saving
2. Show loading state on Save button
3. On success:
   - Close dialog
   - Show success toast: "Invoice folder path updated successfully"
   - Refresh table data
   - Apply change immediately to invoice generation system
4. On error:
   - Show error toast with error message
   - Keep dialog open for user to correct

**Cancel Behavior:**
- Close dialog without saving
- Discard any changes made to input field
- No toast notification

**Validation Error Messages:**
- "Folder path is required"
- "Invalid folder path format. Use Google Drive format: MyDrive/FolderName"
- "Path cannot exceed 255 characters"
- "Path must start with 'MyDrive/'"

### 7.2 Configuration 2: Enable Auto Invoice Generation

**Display Name:** "Enable Auto Invoice Generation"

**Description:** "When enabled, invoices (DOCX and PDF) are automatically generated for every client sale transaction. Manual invoice generation remains available regardless of this setting."

**Action Type:** Toggle Switch

**Default Value:** `true` (enabled)

**Storage:**
- Database field: `config_value` (TEXT, stored as "true" or "false")
- Database key: `auto_invoice_generation_enabled`
- Table: `invoice_configurations`

**Toggle Switch Behavior:**

**Visual States:**
- **ON (enabled):** Switch to right, green/blue color (matching application theme)
- **OFF (disabled):** Switch to left, gray color

**Interaction:**
- Click to toggle state
- Immediate visual feedback (optimistic update)
- Loading indicator during save operation

**Save Behavior:**
1. Toggle state immediately in UI (optimistic update)
2. Show loading indicator during save operation
3. On success:
   - Show success toast: "Auto invoice generation [enabled/disabled]"
   - Apply change immediately to invoice generation system
4. On error:
   - Revert toggle state to previous value
   - Show error toast with error message

**System Impact:**

**When Enabled (`true`):**
- SalesEntry component automatically generates invoices on sale transaction
- Both DOCX and PDF files are generated
- Files are uploaded to configured Google Drive folder
- Invoice records are created in database

**When Disabled (`false`):**
- Automatic generation is skipped
- Manual "Generate Invoice" button remains functional
- Users can still generate invoices on-demand
- No impact on existing invoices

**Implementation Notes:**
- Configuration service provides `isAutoInvoiceEnabled()` function
- SalesEntry component calls this function before generating invoices
- No application restart required
- Changes take effect on next sale transaction

---

## 8. Database Schema

### 8.1 New Table: `invoice_configurations`

```sql
-- ==============================================
-- INVOICE CONFIGURATIONS TABLE
-- ==============================================
-- Stores application-level invoice-related configurations
-- ==============================================

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

### 8.2 Initial Data Seeding

```sql
-- ==============================================
-- INSERT DEFAULT CONFIGURATIONS
-- ==============================================

INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('invoice_folder_path', 'MyDrive/Invoice', 'string', 'Invoice folder path in Google Drive'),
  ('auto_invoice_generation_enabled', 'true', 'boolean', 'Enable Auto Invoice Generation')
ON CONFLICT (config_key) DO NOTHING;
```

### 8.3 Row Level Security (RLS) Policies

```sql
-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

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

-- Allow managers to insert configurations (for initial setup)
CREATE POLICY "Allow managers to insert invoice configs"
  ON invoice_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role = 'manager'
    )
  );
```

---

## 9. API/Backend Requirements

### 9.1 Fetch Configurations

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

**Error Handling:**
- 401 Unauthorized: User not authenticated
- 500 Internal Server Error: Database error

### 9.2 Update Configuration

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
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User is not a Manager
- 404 Not Found: Configuration not found
- 500 Internal Server Error: Database error

**Validation:**
- Server-side validation for folder path format
- Server-side validation for boolean values ("true" or "false")

---

## 10. Role-Based Access Control

### 10.1 Access Rules

**Manager Role:**
- ✅ View Application Configuration tab
- ✅ View all configurations
- ✅ Edit invoice folder path
- ✅ Toggle auto invoice generation
- ✅ Search and filter configurations

**Admin Role:**
- ✅ Same permissions as Manager (inherits Manager permissions)

**Client Role:**
- ❌ Cannot access Application Configuration tab
- ❌ Cannot view configurations
- ❌ Cannot modify configurations

### 10.2 UI Access Control

**Tab Visibility:**
- Check user role on component mount
- Hide Application Configuration tab if user is not Manager/Admin
- Show access denied message if user navigates directly to URL

**Component-Level Check:**
```typescript
// In ApplicationConfigurationTab component
if (profile?.role !== 'manager' && profile?.role !== 'admin') {
  return (
    <Alert variant="destructive">
      <Shield className="h-4 w-4" />
      <AlertDescription>
        Access denied. Application Configuration is only available to users with Manager or Admin role.
        Your current role: {profile?.role || 'Unknown'}
      </AlertDescription>
    </Alert>
  );
}
```

**Database-Level Security:**
- RLS policies enforce Manager role requirement
- Database rejects updates from non-Manager users
- Frontend and backend both enforce access control

---

## 11. Immediate System Effects

### 11.1 Invoice Folder Path Change

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

**Code Integration:**
```typescript
// In googleDriveAdapter.ts or storageService.ts
import { getInvoiceFolderPath } from '@/services/invoiceConfigService';

const folderPath = await getInvoiceFolderPath(); // Reads fresh from DB
```

### 11.2 Auto Invoice Generation Toggle

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

**Code Integration:**
```typescript
// In SalesEntry.tsx
import { isAutoInvoiceEnabled } from '@/services/invoiceConfigService';

// In saleMutation.onSuccess
const autoEnabled = await isAutoInvoiceEnabled();
if (autoEnabled) {
  // Auto-generate invoice
  await generateInvoice.mutateAsync(...);
}
```

---

## 12. User Stories

### 12.1 As a Manager, I want to...

**US-1:** View all application configurations in a table
- **Given:** I am logged in as a Manager
- **When:** I navigate to User Management > Application Configuration
- **Then:** I see a table with all application configurations

**US-2:** Edit the Google Drive folder path for invoices
- **Given:** I am on the Application Configuration page
- **When:** I click "Edit" for "Invoice folder path in Google Drive"
- **Then:** A dialog opens with the current path
- **And:** I can modify the path
- **And:** I can save or cancel changes

**US-3:** Enable/disable automatic invoice generation
- **Given:** I am on the Application Configuration page
- **When:** I toggle the "Enable Auto Invoice Generation" switch
- **Then:** The setting is saved immediately
- **And:** The change takes effect for all new sale transactions

**US-4:** Search configurations by description
- **Given:** I am on the Application Configuration page
- **When:** I type in the search box
- **Then:** The table filters to show matching configurations

**US-5:** Navigate through paginated results
- **Given:** There are more than 25 configurations (future scalability)
- **When:** I click "Next" or select a page number
- **Then:** I see the next page of configurations

**US-6:** Verify that existing Configurations tab is unaffected
- **Given:** I am logged in as a Manager
- **When:** I navigate to the main Configurations tab
- **Then:** I see SKU-related configurations only
- **And:** No invoice-related configurations are visible

---

## 13. Technical Implementation Notes

### 13.1 Component Structure

```
UserManagement/
├── UserManagement.tsx (main component with tabs)
│   ├── UsersTab (existing)
│   └── ApplicationConfigurationTab (new)
│       ├── ConfigurationsTable.tsx
│       ├── EditFolderPathDialog.tsx
│       └── AutoInvoiceToggle.tsx
```

### 13.2 New Files to Create

**Components:**
- `src/components/user-management/ApplicationConfigurationTab.tsx` (main tab component)
- `src/components/user-management/ConfigurationsTable.tsx` (table component)
- `src/components/user-management/EditFolderPathDialog.tsx` (edit dialog)

**Services:**
- `src/services/invoiceConfigService.ts` (configuration service)

**Database:**
- `supabase/migrations/YYYYMMDD_create_invoice_configurations.sql` (migration)

### 13.3 Files to Modify

**UserManagement.tsx:**
- Add tabs structure
- Add Application Configuration tab trigger
- Import and render ApplicationConfigurationTab component

**SalesEntry.tsx:**
- Import `isAutoInvoiceEnabled` from config service
- Check configuration before auto-generating invoices

**googleDriveAdapter.ts or storageService.ts:**
- Import `getInvoiceFolderPath` from config service
- Use configuration value for folder path

### 13.4 State Management

**Local State:**
- Search query
- Current page
- Page size
- Edit dialog open/close
- Form validation errors
- Toggle switch loading state

**Server State (React Query):**
- Configurations list (query)
- Update configuration mutation

**Configuration Service:**
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
export async function getInvoiceFolderPath(): Promise<string>
export async function isAutoInvoiceEnabled(): Promise<boolean>
```

---

## 14. Testing Requirements

### 14.1 Unit Tests

- Configuration service functions
- Form validation logic
- Toggle switch state management
- Search/filter functionality
- Folder path validation

### 14.2 Integration Tests

- Database CRUD operations
- RLS policy enforcement
- Role-based access control
- Configuration update flow
- API endpoint responses

### 14.3 E2E Tests

- Manager can view Application Configuration tab
- Manager can edit folder path
- Manager can toggle auto generation
- Client cannot access Application Configuration tab
- Changes take effect immediately
- Existing Configurations tab remains unaffected

### 14.4 Regression Tests

- Verify existing Configurations tab (SKU management) still works
- Verify no invoice-related code in ConfigurationManagement component
- Verify User Management Users tab still works
- Verify SalesEntry component works with new configuration checks

---

## 15. Error Handling

### 15.1 Validation Errors

**Folder Path Validation:**
- Show inline error message below input
- Prevent save until valid
- Error messages:
  - "Folder path is required"
  - "Invalid folder path format. Use Google Drive format: MyDrive/FolderName"
  - "Path cannot exceed 255 characters"

### 15.2 Network Errors

- Show toast notification on save failure
- Retry mechanism for failed updates
- Graceful degradation (show cached value if available)
- Error messages:
  - "Failed to update configuration. Please try again."
  - "Network error. Please check your connection."

### 15.3 Permission Errors

- Show access denied message
- Redirect to appropriate page
- Log security violation attempt
- Error message:
  - "Access denied. Application Configuration is only available to Manager and Admin roles."

---

## 16. Performance Considerations

### 16.1 Optimization

- Debounce search input (300ms)
- Pagination to limit data load (though only 2 items currently)
- Lazy load configuration values
- Cache configuration values (30-second TTL for immediate effect)

### 16.2 Scalability

- Table supports up to 1000 configurations (future-proof)
- Pagination handles large datasets
- Search is client-side filtered (acceptable for small dataset)

---

## 17. Acceptance Criteria

### 17.1 Must Have

- ✅ Application Configuration tab visible to Manager role only
- ✅ Tab located under User Management (separate from main Configurations tab)
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
- ✅ Existing Configurations tab (SKU management) remains unaffected

### 17.2 Should Have

- ⚠️ Refresh button
- ⚠️ Loading states during operations
- ⚠️ Success/error toast notifications
- ⚠️ Responsive design (mobile-friendly)

### 17.3 Nice to Have

- 💡 Configuration descriptions tooltips
- 💡 Configuration change history
- 💡 Bulk configuration updates
- 💡 Configuration export/import

---

## 18. Rollback Verification Checklist

### 18.1 Pre-Implementation Verification

- [ ] Verify `ConfigurationManagement.tsx` has NO invoice-related code
- [ ] Verify existing Configurations tab works correctly (SKU management)
- [ ] Verify no invoice-related imports in ConfigurationManagement
- [ ] Verify no invoice-related state in ConfigurationManagement
- [ ] Verify no invoice-related API calls in ConfigurationManagement

### 18.2 Post-Implementation Verification

- [ ] Verify existing Configurations tab still works (SKU management)
- [ ] Verify no new invoice-related code in ConfigurationManagement
- [ ] Verify Application Configuration tab is separate and independent
- [ ] Verify both tabs can coexist without conflicts

---

## 19. Glossary

- **Application Configuration:** System-level settings that control application behavior (invoice generation, storage paths)
- **SKU Configuration:** Product-specific settings (bottles per case, pricing) managed in existing Configurations tab
- **Folder Path:** Google Drive folder location where invoices are stored
- **Auto Invoice Generation:** Automatic creation of invoices when sale transactions are recorded
- **Manager Role:** User role with elevated permissions to manage system configurations

---

## 20. References

- Existing User Management component: `src/components/user-management/UserManagement.tsx`
- Existing Configurations component: `src/components/configurations/ConfigurationManagement.tsx`
- Invoice generation hook: `src/hooks/useInvoiceGeneration.ts`
- SalesEntry component: `src/components/sales/SalesEntry.tsx`
- Google Drive adapter: `src/services/cloudStorage/googleDriveAdapter.ts`

---

## 21. Approval

**Prepared by:** System Design Team  
**Reviewed by:** [Pending]  
**Approved by:** [Pending]  
**Date:** [Pending]

---

**End of Specification**
