# Invoice Generation System - Implementation Guide

## 📋 Quick Start

This guide provides step-by-step instructions to implement the invoice generation system.

---

## Prerequisites

1. **Database Migration**: Run the SQL migration to create invoice tables
2. **Cloud Storage Setup**: Configure Google Drive or OneDrive credentials
3. **Word Template**: Create invoice template with placeholders
4. **Environment Variables**: Set company configuration

---

## Step 1: Database Setup

### 1.1 Run Migration

Execute the migration file in your Supabase SQL Editor:

```bash
# File: supabase/migrations/20250127000000_create_invoice_system.sql
```

Or run via Supabase CLI:

```bash
supabase db push
```

### 1.2 Verify Tables

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('invoices', 'invoice_number_sequence');

-- Test invoice number generation
SELECT generate_invoice_number('INV', true, true);
```

---

## Step 2: Cloud Storage Configuration

### 2.1 Google Drive Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google Drive API"

2. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: Add your app URL

3. **Get Refresh Token**
   - Use OAuth 2.0 Playground or implement OAuth flow
   - Store refresh token securely (Supabase Edge Function secrets)

4. **Store Credentials**
   - Add to Supabase Edge Function secrets:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `GOOGLE_REFRESH_TOKEN`

### 2.2 OneDrive Setup (Optional)

1. **Register Azure AD App**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register new application
   - Add "Microsoft Graph" API permissions
   - Generate client secret

2. **Store Credentials**
   - Add to Supabase Edge Function secrets:
     - `ONEDRIVE_CLIENT_ID`
     - `ONEDRIVE_CLIENT_SECRET`
     - `ONEDRIVE_TENANT_ID`

---

## Step 3: Create Word Template

### 3.1 Template Location

Create template file at:
```
public/templates/invoice-template.docx
```

### 3.2 Template Structure

Create a Word document with the following placeholders:

```
┌─────────────────────────────────────────┐
│  [Company Logo - Optional]               │
│  {companyName}                           │
│  {companyAddress}                        │
│  Phone: {companyPhone}                   │
│  Email: {companyEmail}                   │
│  GSTIN: {companyGSTIN}                   │
└─────────────────────────────────────────┘

INVOICE

Invoice Number: {invoiceNumber}
Invoice Date: {invoiceDate}
Due Date: {dueDate}

───────────────────────────────────────────

Bill To:
{clientName}
{branch}
{clientAddress}
Phone: {clientPhone}
Email: {clientEmail}

───────────────────────────────────────────

ITEMS

{#items}
SKU: {sku}
Description: {description}
Quantity: {quantity}
Unit Price: {unitPrice}
Amount: {amount}
{/items}

───────────────────────────────────────────

Subtotal: {subtotal}
Tax: {tax}
Total Amount: {totalAmount}

Amount in Words: {amountInWords}

───────────────────────────────────────────

Terms & Conditions:
{terms}
```

### 3.3 Placeholder Reference

| Placeholder | Description | Example |
|------------|-------------|---------|
| `{invoiceNumber}` | Generated invoice number | INV-2025-01-001 |
| `{invoiceDate}` | Invoice date | 27-01-2025 |
| `{dueDate}` | Payment due date | 26-02-2025 |
| `{companyName}` | Your company name | Aamodha Operations |
| `{companyAddress}` | Company address | 123 Business St |
| `{companyPhone}` | Company phone | +91-1234567890 |
| `{companyEmail}` | Company email | info@company.com |
| `{companyGSTIN}` | GSTIN number | GSTIN123456789 |
| `{clientName}` | Client name | Alley 91 |
| `{branch}` | Branch name | Nanakram |
| `{clientAddress}` | Client address | (if available) |
| `{#items}` | Loop start | (for multiple items) |
| `{sku}` | Product SKU | 250 EC |
| `{description}` | Item description | 250 EC - 250ml |
| `{quantity}` | Quantity | 80 |
| `{unitPrice}` | Price per unit | ₹200.00 |
| `{amount}` | Line total | ₹16,000.00 |
| `{/items}` | Loop end | |
| `{subtotal}` | Subtotal | ₹16,000.00 |
| `{tax}` | Tax amount | ₹0.00 |
| `{totalAmount}` | Grand total | ₹16,000.00 |
| `{amountInWords}` | Amount in words | Sixteen Thousand Rupees Only |
| `{terms}` | Terms & conditions | Payment due within 30 days... |

---

## Step 4: Environment Variables

Add to `.env` file (and Vercel dashboard):

```env
# Company Configuration
VITE_COMPANY_NAME=Aamodha Operations
VITE_COMPANY_ADDRESS=123 Business Street, City, State, PIN
VITE_COMPANY_PHONE=+91-1234567890
VITE_COMPANY_EMAIL=info@aamodha.com
VITE_COMPANY_GSTIN=GSTIN123456789
VITE_INVOICE_TERMS=Payment due within 30 days. Late payment may incur interest charges.

# Storage Provider (optional, defaults to google_drive)
VITE_STORAGE_PROVIDER=google_drive
```

---

## Step 5: Integrate with SalesEntry Component

### 5.1 Update SalesEntry.tsx

Add invoice generation on transaction create:

```typescript
import { useInvoiceGeneration } from '@/hooks/useInvoiceGeneration';

// Inside SalesEntry component
const invoiceGeneration = useInvoiceGeneration();

// In createSaleMutation onSuccess:
onSuccess: async (data) => {
  // ... existing code ...
  
  // Generate invoice for sale transactions
  if (data.transaction_type === 'sale') {
    try {
      // Fetch customer data
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', data.customer_id)
        .single();
      
      if (customer) {
        await invoiceGeneration.mutateAsync({
          transactionId: data.id,
          transaction: data,
          customer: customer,
        });
      }
    } catch (error) {
      console.error('Invoice generation failed:', error);
      // Don't fail the transaction if invoice generation fails
    }
  }
}
```

### 5.2 Add Invoice Regeneration on Update

```typescript
// In updateMutation onSuccess:
onSuccess: async () => {
  // ... existing code ...
  
  // Regenerate invoice if transaction was updated
  if (editingTransaction?.transaction_type === 'sale') {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', editingTransaction.customer_id)
        .single();
      
      if (customer) {
        const updatedTransaction = { ...editingTransaction, ...data };
        await invoiceGeneration.mutateAsync({
          transactionId: editingTransaction.id,
          transaction: updatedTransaction,
          customer: customer,
        });
      }
    } catch (error) {
      console.error('Invoice regeneration failed:', error);
    }
  }
}
```

### 5.3 Add Download Invoice Button

```typescript
import { useInvoice, useInvoiceDownload } from '@/hooks/useInvoiceGeneration';

// In transaction table row:
const { data: invoice } = useInvoice(transaction.id);
const downloadInvoice = useInvoiceDownload();

// Add button in actions column:
{invoice && (
  <>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => downloadInvoice.mutate({ invoice, format: 'word' })}
    >
      <Download className="h-4 w-4" />
      Invoice (Word)
    </Button>
    {invoice.pdf_file_url && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => downloadInvoice.mutate({ invoice, format: 'pdf' })}
      >
        <Download className="h-4 w-4" />
        Invoice (PDF)
      </Button>
    )}
  </>
)}
```

---

## Step 6: Create Supabase Edge Functions (Optional)

For secure cloud storage access, create Edge Functions:

### 6.1 Google Drive Token Function

```typescript
// supabase/functions/google-drive-token/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { refreshToken } = await req.json();
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  const data = await response.json();
  return new Response(JSON.stringify({ accessToken: data.access_token }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 6.2 Deploy Edge Functions

```bash
supabase functions deploy google-drive-token
```

---

## Step 7: PDF Generation (Optional)

### Option 1: Backend Service (Recommended)

Use LibreOffice or CloudConvert API:

```typescript
// In documentGenerator.ts
export async function convertWordToPDF(wordBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  // Call Supabase Edge Function or external API
  const response = await fetch('/api/convert-to-pdf', {
    method: 'POST',
    body: wordBuffer,
  });
  return await response.arrayBuffer();
}
```

### Option 2: Direct PDF Generation

Install `pdfkit` or `jspdf`:

```bash
npm install pdfkit @types/pdfkit
```

Then implement `generatePDFDocument()` in `documentGenerator.ts`.

---

## Step 8: Testing

### 8.1 Test Invoice Generation

1. Create a new sale transaction
2. Check database for invoice record:
   ```sql
   SELECT * FROM invoices WHERE transaction_id = 'your-transaction-id';
   ```
3. Verify files in Google Drive/OneDrive
4. Test download links

### 8.2 Test Invoice Update

1. Update a transaction with existing invoice
2. Verify invoice is regenerated
3. Check `last_regenerated_at` timestamp
4. Verify new files replace old ones

### 8.3 Test Error Handling

1. Test with missing template file
2. Test with invalid cloud credentials
3. Test with network failures
4. Verify graceful degradation

---

## Troubleshooting

### Issue: Invoice number generation fails

**Solution**: Check `invoice_number_sequence` table permissions and ensure function is callable.

### Issue: Template not found

**Solution**: Verify template is at `public/templates/invoice-template.docx` and accessible.

### Issue: Cloud storage upload fails

**Solution**: 
- Verify credentials are correct
- Check OAuth token hasn't expired
- Verify API permissions are granted

### Issue: PDF generation not working

**Solution**: Implement PDF conversion service or use direct PDF generation library.

---

## Next Steps

1. ✅ Run database migration
2. ✅ Set up cloud storage credentials
3. ✅ Create Word template
4. ✅ Configure environment variables
5. ✅ Integrate with SalesEntry component
6. ✅ Test end-to-end flow
7. ⏳ Implement PDF generation
8. ⏳ Add invoice status management
9. ⏳ Add invoice email sending
10. ⏳ Add invoice reporting

---

## Support

For issues or questions, refer to:
- Architecture document: `docs/invoice-generation/INVOICE_GENERATION_ARCHITECTURE.md`
- Code comments in service files
- Supabase documentation for Edge Functions
