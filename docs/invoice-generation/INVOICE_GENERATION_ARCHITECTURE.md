# Invoice Generation System - Architecture & Implementation Plan

## 📋 Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Database Schema Changes](#database-schema-changes)
3. [Invoice Number Generation](#invoice-number-generation)
4. [Integration Architecture](#integration-architecture)
5. [Implementation Steps](#implementation-steps)
6. [Data Mapping](#data-mapping)
7. [Error Handling](#error-handling)
8. [Verification Checklist](#verification-checklist)

---

## 🏗️ High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Transaction                        │
│              (SalesEntry Component)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Invoice Generation Service                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Generate Invoice Number (Sequential/Date-based)  │   │
│  │  2. Create Invoice Record in Database                │   │
│  │  3. Fetch Transaction + Customer Data                │   │
│  │  4. Generate Word Document (.docx)                   │   │
│  │  5. Convert to PDF                                   │   │
│  │  6. Upload to Google Drive / OneDrive                │   │
│  │  7. Update Invoice Record with File URLs             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│   Google Drive   │         │    OneDrive       │
│   (Primary)      │         │   (Alternative)    │
└──────────────────┘         └──────────────────┘
```

### Key Components

1. **Invoice Service** (`src/services/invoiceService.ts`)
   - Handles invoice number generation
   - Coordinates document generation
   - Manages cloud storage uploads

2. **Document Generator** (`src/services/documentGenerator.ts`)
   - Word template processing (docxtemplater)
   - PDF conversion
   - Template management

3. **Cloud Storage Adapter** (`src/services/cloudStorage/`)
   - Google Drive integration
   - OneDrive integration
   - Abstract interface for both

4. **Database Layer**
   - `invoices` table (new)
   - `invoice_number_sequence` table (new)
   - Triggers for auto-generation

5. **React Hooks**
   - `useInvoiceGeneration` - Generate invoice on transaction create
   - `useInvoiceUpdate` - Regenerate invoice on transaction update
   - `useInvoiceDownload` - Download invoice from cloud storage

---

## 🗄️ Database Schema Changes

### 1. Create `invoices` Table

```sql
-- ==============================================
-- INVOICES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_id UUID NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Invoice metadata
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- File storage references
  word_file_id VARCHAR(255), -- Google Drive / OneDrive file ID
  pdf_file_id VARCHAR(255),   -- Google Drive / OneDrive file ID
  word_file_url TEXT,          -- Direct download URL
  pdf_file_url TEXT,            -- Direct download URL
  
  -- Storage provider info
  storage_provider VARCHAR(20) DEFAULT 'google_drive' CHECK (storage_provider IN ('google_drive', 'onedrive')),
  folder_path TEXT,             -- Folder path in cloud storage
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'cancelled')),
  last_regenerated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();
```

### 2. Create `invoice_number_sequence` Table

```sql
-- ==============================================
-- INVOICE NUMBER SEQUENCE
-- ==============================================
-- Tracks sequential invoice numbers per year/month
CREATE TABLE IF NOT EXISTS invoice_number_sequence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix VARCHAR(20) NOT NULL, -- e.g., 'INV', 'INV-2025'
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  current_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prefix, year, month)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoice_seq_prefix_year_month 
  ON invoice_number_sequence(prefix, year, month);
```

### 3. Create Function to Generate Invoice Number

```sql
-- ==============================================
-- GENERATE INVOICE NUMBER FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION generate_invoice_number(
  p_prefix VARCHAR DEFAULT 'INV',
  p_use_year BOOLEAN DEFAULT true,
  p_use_month BOOLEAN DEFAULT false
)
RETURNS VARCHAR AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_sequence INTEGER;
  v_invoice_number VARCHAR;
  v_prefix_key VARCHAR;
BEGIN
  -- Get current year and month
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  v_month := EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Build prefix key based on options
  IF p_use_year AND p_use_month THEN
    v_prefix_key := p_prefix || '-' || v_year || '-' || LPAD(v_month::TEXT, 2, '0');
  ELSIF p_use_year THEN
    v_prefix_key := p_prefix || '-' || v_year;
  ELSE
    v_prefix_key := p_prefix;
  END IF;
  
  -- Get or create sequence record
  INSERT INTO invoice_number_sequence (prefix, year, month, current_sequence)
  VALUES (v_prefix_key, v_year, v_month, 0)
  ON CONFLICT (prefix, year, month) 
  DO UPDATE SET 
    current_sequence = invoice_number_sequence.current_sequence + 1
  RETURNING current_sequence INTO v_sequence;
  
  -- If INSERT didn't happen, UPDATE did, so get the updated value
  IF v_sequence IS NULL THEN
    UPDATE invoice_number_sequence
    SET current_sequence = current_sequence + 1
    WHERE prefix = v_prefix_key AND year = v_year AND month = v_month
    RETURNING current_sequence INTO v_sequence;
  END IF;
  
  -- Format invoice number: INV-2025-01-001 or INV-2025-001 or INV-001
  IF p_use_year AND p_use_month THEN
    v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 3, '0');
  ELSIF p_use_year THEN
    v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 3, '0');
  ELSE
    v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 5, '0');
  END IF;
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;
```

### 4. Create Trigger to Auto-Generate Invoice on Transaction Create

```sql
-- ==============================================
-- AUTO-GENERATE INVOICE ON TRANSACTION CREATE
-- ==============================================
-- Note: This trigger will be replaced by application-level logic
-- for better control and error handling, but included for reference

CREATE OR REPLACE FUNCTION create_invoice_on_transaction_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_number VARCHAR;
BEGIN
  -- Only create invoice for 'sale' transactions
  IF NEW.transaction_type = 'sale' THEN
    -- Generate invoice number
    v_invoice_number := generate_invoice_number('INV', true, true);
    
    -- Create invoice record (file uploads will be handled by application)
    INSERT INTO invoices (
      invoice_number,
      transaction_id,
      customer_id,
      invoice_date,
      status
    )
    VALUES (
      v_invoice_number,
      NEW.id,
      NEW.customer_id,
      NEW.transaction_date,
      'generated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to enable automatic invoice creation via trigger
-- CREATE TRIGGER trigger_create_invoice_on_transaction_insert
--   AFTER INSERT ON sales_transactions
--   FOR EACH ROW
--   WHEN (NEW.transaction_type = 'sale')
--   EXECUTE FUNCTION create_invoice_on_transaction_insert();
```

---

## 🔢 Invoice Number Generation

### Strategy Options

**Option 1: Sequential with Year-Month (Recommended)**
- Format: `INV-2025-01-001`
- Prefix: `INV`
- Year: `2025`
- Month: `01`
- Sequence: `001` (resets each month)
- **Pros**: Easy to identify month/year, shorter numbers
- **Cons**: Resets monthly (may confuse if not clear)

**Option 2: Sequential with Year Only**
- Format: `INV-2025-001`
- Prefix: `INV`
- Year: `2025`
- Sequence: `001` (resets each year)
- **Pros**: Longer sequences, simpler format
- **Cons**: Longer numbers over time

**Option 3: Pure Sequential**
- Format: `INV-00001`
- Prefix: `INV`
- Sequence: `00001` (never resets)
- **Pros**: Simple, never duplicates
- **Cons**: Numbers grow indefinitely

### Implementation

The `generate_invoice_number()` SQL function supports all three strategies via parameters:
- `p_use_year`: Include year in number
- `p_use_month`: Include month in number (requires year)

**Recommended**: Use Option 1 (`INV-2025-01-001`) for better organization and easier monthly reporting.

---

## ☁️ Integration Architecture

### Google Drive Integration

**Authentication:**
- OAuth 2.0 with service account or user credentials
- Store refresh tokens securely (Supabase Edge Function secrets)

**Folder Structure:**
```
/Invoices/
  ├── 2025/
  │   ├── 01-January/
  │   │   ├── INV-2025-01-001.docx
  │   │   ├── INV-2025-01-001.pdf
  │   │   ├── INV-2025-01-002.docx
  │   │   └── INV-2025-01-002.pdf
  │   └── 02-February/
  └── 2026/
```

**API Endpoints:**
- Upload file: `POST https://www.googleapis.com/upload/drive/v3/files`
- Get file: `GET https://www.googleapis.com/drive/v3/files/{fileId}`
- Create folder: `POST https://www.googleapis.com/drive/v3/files`

### OneDrive Integration

**Authentication:**
- Microsoft Graph API with Azure AD
- Use `@microsoft/microsoft-graph-client` (already in dependencies)

**Folder Structure:**
```
/Invoices/
  ├── 2025/
  │   ├── 01-January/
  │   │   ├── INV-2025-01-001.docx
  │   │   ├── INV-2025-01-001.pdf
  │   └── 02-February/
  └── 2026/
```

**API Endpoints:**
- Upload file: `PUT /me/drive/root:/{path}:/content`
- Get file: `GET /me/drive/items/{itemId}`
- Create folder: `POST /me/drive/root/children`

### Storage Adapter Pattern

```typescript
interface CloudStorageAdapter {
  uploadFile(file: Buffer, fileName: string, folderPath: string): Promise<FileUploadResult>;
  getFileUrl(fileId: string): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
  createFolder(folderPath: string): Promise<string>;
}

class GoogleDriveAdapter implements CloudStorageAdapter { ... }
class OneDriveAdapter implements CloudStorageAdapter { ... }
```

---

## 🚀 Implementation Steps

### Phase 1: Database Setup (Day 1)

1. **Run SQL migrations**
   - Create `invoices` table
   - Create `invoice_number_sequence` table
   - Create `generate_invoice_number()` function
   - Create indexes

2. **Update TypeScript types**
   - Add `Invoice` interface to `src/types/index.ts`
   - Update Supabase types (run `npx supabase gen types typescript`)

### Phase 2: Core Invoice Service (Day 2-3)

1. **Create invoice service**
   - `src/services/invoiceService.ts`
   - Functions:
     - `generateInvoiceNumber()`
     - `createInvoiceRecord()`
     - `getInvoiceByTransactionId()`
     - `updateInvoiceOnTransactionChange()`

2. **Create document generator**
   - `src/services/documentGenerator.ts`
   - Functions:
     - `generateWordDocument(templatePath, data)`
     - `convertWordToPDF(wordBuffer)`
     - `loadInvoiceTemplate()`

### Phase 3: Template Creation (Day 3)

1. **Create Word template**
   - `templates/invoice-template.docx`
   - Use docxtemplater placeholders: `{invoiceNumber}`, `{clientName}`, etc.

2. **Template structure:**
   ```
   ┌─────────────────────────────────────┐
   │  [Company Logo]                     │
   │  Company Name                        │
   │  Address, Phone, Email               │
   └─────────────────────────────────────┘
   
   Invoice Number: {invoiceNumber}
   Invoice Date: {invoiceDate}
   Due Date: {dueDate}
   
   Bill To:
   {clientName}
   {branch}
   {clientAddress}
   
   ┌─────────────────────────────────────┐
   │ SKU | Qty | Price | Amount          │
   ├─────────────────────────────────────┤
   │ {sku} | {quantity} | {price} | {amount} │
   └─────────────────────────────────────┘
   
   Total Amount: {totalAmount}
   Amount in Words: {amountInWords}
   
   Terms & Conditions:
   {terms}
   ```

### Phase 4: Cloud Storage Integration (Day 4-5)

1. **Set up Google Drive**
   - Create service account or OAuth app
   - Store credentials in Supabase Edge Function secrets
   - Implement `GoogleDriveAdapter`

2. **Set up OneDrive (Optional)**
   - Register Azure AD app
   - Implement `OneDriveAdapter`

3. **Create storage service**
   - `src/services/cloudStorage/storageService.ts`
   - Factory pattern to select adapter

### Phase 5: React Integration (Day 6)

1. **Create hooks**
   - `src/hooks/useInvoiceGeneration.ts`
   - `src/hooks/useInvoiceDownload.ts`

2. **Update SalesEntry component**
   - Call invoice generation on transaction create
   - Call invoice regeneration on transaction update
   - Add "Download Invoice" button

3. **Add PDF library**
   - Install `pdfkit` or `jspdf` + `html2canvas`
   - Or use `libreoffice` CLI (server-side)

### Phase 6: Testing & Error Handling (Day 7)

1. **Error handling**
   - Retry logic for cloud uploads
   - Fallback to local storage if cloud fails
   - Transaction rollback on errors

2. **Testing**
   - Unit tests for invoice number generation
   - Integration tests for document generation
   - E2E tests for full flow

---

## 📊 Data Mapping

### Transaction → Invoice Data Mapping

```typescript
interface InvoiceData {
  // Invoice metadata
  invoiceNumber: string;           // Generated: INV-2025-01-001
  invoiceDate: string;              // From: transaction.transaction_date
  dueDate: string;                 // Calculated: invoiceDate + 30 days
  
  // Company details (static - from config)
  companyName: string;              // "Aamodha Operations"
  companyAddress: string;           // From config/env
  companyPhone: string;             // From config/env
  companyEmail: string;             // From config/env
  companyGSTIN?: string;           // From config/env
  
  // Client details (from customers table)
  clientName: string;              // From: customer.client_name
  branch: string | null;            // From: customer.branch
  clientAddress?: string;          // From: customer.address (if exists)
  clientPhone?: string;            // From: customer.phone (if exists)
  clientEmail?: string;            // From: customer.email (if exists)
  
  // Transaction details
  sku: string;                      // From: transaction.sku
  quantity: number;                 // From: transaction.quantity
  pricePerCase: number;             // From: customer.price_per_case
  amount: number;                   // From: transaction.amount
  totalAmount: number;              // From: transaction.total_amount
  
  // Calculated fields
  amountInWords: string;            // Converted: "Ten Thousand Rupees Only"
  taxAmount?: number;               // Calculated if applicable
  grandTotal: number;               // totalAmount + taxAmount
  
  // Terms & conditions (static - from config)
  terms: string;                   // From config/env
}
```

### Template Placeholders

```javascript
{
  // Invoice header
  invoiceNumber: "INV-2025-01-001",
  invoiceDate: "2025-01-27",
  dueDate: "2025-02-26",
  
  // Company
  companyName: "Aamodha Operations",
  companyAddress: "123 Business Street, City, State, PIN",
  companyPhone: "+91-1234567890",
  companyEmail: "info@aamodha.com",
  companyGSTIN: "GSTIN123456789",
  
  // Client
  clientName: "Alley 91",
  branch: "Nanakram",
  clientAddress: "Client Address (if available)",
  
  // Items
  items: [
    {
      sku: "250 EC",
      description: "250 EC - 250ml",
      quantity: 80,
      unitPrice: 200.00,
      amount: 16000.00
    }
  ],
  
  // Totals
  subtotal: 16000.00,
  tax: 0.00,
  totalAmount: 16000.00,
  amountInWords: "Sixteen Thousand Rupees Only",
  
  // Terms
  terms: "Payment due within 30 days. Late payment may incur interest charges."
}
```

---

## ⚠️ Error Handling

### Error Scenarios & Handling

1. **Invoice Number Generation Failure**
   - **Cause**: Database constraint violation, sequence table lock
   - **Handling**: Retry with exponential backoff, log error
   - **Fallback**: Use UUID-based temporary number, regenerate later

2. **Document Generation Failure**
   - **Cause**: Template file missing, invalid data, docxtemplater error
   - **Handling**: Validate data before generation, catch template errors
   - **Fallback**: Generate basic text invoice, retry with corrected data

3. **PDF Conversion Failure**
   - **Cause**: LibreOffice not available, conversion timeout
   - **Handling**: Use alternative library (pdfkit), increase timeout
   - **Fallback**: Store Word document only, convert later via background job

4. **Cloud Storage Upload Failure**
   - **Cause**: Network error, authentication failure, quota exceeded
   - **Handling**: Retry with exponential backoff, verify credentials
   - **Fallback**: Store locally, queue for retry, notify admin

5. **Transaction Update During Invoice Generation**
   - **Cause**: Race condition, concurrent updates
   - **Handling**: Use database transactions, lock invoice record
   - **Fallback**: Regenerate invoice after update completes

### Error Recovery Strategy

```typescript
async function generateInvoiceWithRetry(
  transactionId: string,
  maxRetries: number = 3
): Promise<Invoice> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateInvoice(transactionId);
    } catch (error) {
      if (attempt === maxRetries) {
        // Log to error tracking service
        await logError('invoice_generation_failed', {
          transactionId,
          error: error.message,
          attempts: attempt
        });
        throw error;
      }
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
}
```

---

## ✅ Verification Checklist

### Invoice Creation
- [ ] Invoice number is generated correctly (format: INV-YYYY-MM-NNN)
- [ ] Invoice record is created in database
- [ ] Word document is generated with correct data
- [ ] PDF document is generated and matches Word version
- [ ] Files are uploaded to Google Drive / OneDrive
- [ ] File URLs are stored in invoice record
- [ ] Invoice is linked to correct transaction
- [ ] Invoice date matches transaction date

### Invoice Update
- [ ] Invoice is regenerated when transaction is updated
- [ ] Old files are replaced (or versioned) in cloud storage
- [ ] Invoice number remains unchanged (unless business rule allows)
- [ ] Updated invoice reflects new transaction data
- [ ] `last_regenerated_at` timestamp is updated

### Data Accuracy
- [ ] Client name matches transaction customer
- [ ] Branch matches transaction branch
- [ ] SKU matches transaction SKU
- [ ] Quantity matches transaction quantity
- [ ] Amount matches transaction amount
- [ ] Amount in words is calculated correctly
- [ ] Invoice date is correct
- [ ] Due date is calculated correctly (invoice date + terms)

### File Management
- [ ] Word and PDF files are in sync
- [ ] Files are organized in correct folders (year/month)
- [ ] File names follow convention: `{invoiceNumber}.{ext}`
- [ ] Files are accessible via stored URLs
- [ ] Files can be downloaded successfully

### Error Handling
- [ ] Errors are logged with context
- [ ] Failed invoices are retried automatically
- [ ] User is notified of generation failures
- [ ] Partial failures don't corrupt data
- [ ] Database transactions are rolled back on errors

### Performance
- [ ] Invoice generation completes within 10 seconds
- [ ] Multiple concurrent invoices don't cause conflicts
- [ ] Cloud uploads don't block UI
- [ ] Large transactions (>1000 items) are handled

### Security
- [ ] Cloud storage credentials are secure
- [ ] Invoice files are not publicly accessible
- [ ] Only authorized users can generate/download invoices
- [ ] Invoice numbers cannot be manipulated

---

## 📝 Next Steps

1. **Review and approve architecture**
2. **Set up cloud storage credentials** (Google Drive / OneDrive)
3. **Create Word template** with placeholders
4. **Implement database migrations**
5. **Build core services** (invoice, document, storage)
6. **Integrate with SalesEntry component**
7. **Test end-to-end flow**
8. **Deploy to production**

---

## 🔗 Related Files

- Database migrations: `supabase/migrations/YYYYMMDD_create_invoices.sql`
- Invoice service: `src/services/invoiceService.ts`
- Document generator: `src/services/documentGenerator.ts`
- Cloud storage: `src/services/cloudStorage/`
- React hooks: `src/hooks/useInvoiceGeneration.ts`
- Word template: `templates/invoice-template.docx`
