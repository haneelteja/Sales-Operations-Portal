# Invoice Generation System

Automated invoice generation system that creates Word and PDF invoices for every client transaction, stores them in Google Drive/OneDrive, and automatically updates invoices when transactions are modified.

## 📚 Documentation

- **[Architecture & Implementation Plan](./INVOICE_GENERATION_ARCHITECTURE.md)** - Complete system architecture, database schema, and design decisions
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Step-by-step setup and integration instructions

## 🚀 Quick Start

1. **Run Database Migration**
   ```sql
   -- Execute: supabase/migrations/20250127000000_create_invoice_system.sql
   ```

2. **Set Up Cloud Storage**
   - Configure Google Drive OAuth credentials
   - Store credentials in Supabase Edge Function secrets

3. **Create Word Template**
   - Place template at `public/templates/invoice-template.docx`
   - Use docxtemplater placeholders (see Implementation Guide)

4. **Configure Environment Variables**
   ```env
   VITE_COMPANY_NAME=Your Company Name
   VITE_COMPANY_ADDRESS=Your Address
   VITE_COMPANY_PHONE=Your Phone
   VITE_COMPANY_EMAIL=Your Email
   ```

5. **Integrate with SalesEntry Component**
   - Import `useInvoiceGeneration` hook
   - Call on transaction create/update

## 📁 File Structure

```
src/
├── services/
│   ├── invoiceService.ts          # Invoice number generation, DB operations
│   ├── documentGenerator.ts       # Word/PDF document generation
│   └── cloudStorage/
│       ├── storageAdapter.ts       # Storage interface
│       ├── googleDriveAdapter.ts   # Google Drive implementation
│       └── storageService.ts       # Storage service factory
├── hooks/
│   └── useInvoiceGeneration.ts    # React hooks for invoice operations
└── types/
    └── index.ts                    # Invoice type definitions

supabase/
└── migrations/
    └── 20250127000000_create_invoice_system.sql

public/
└── templates/
    └── invoice-template.docx      # Word template (create this)

docs/
└── invoice-generation/
    ├── INVOICE_GENERATION_ARCHITECTURE.md
    ├── IMPLEMENTATION_GUIDE.md
    └── README.md
```

## ✨ Features

- ✅ **Automatic Invoice Generation** - Creates invoice on transaction creation
- ✅ **Unique Invoice Numbers** - Sequential numbering with year/month prefix
- ✅ **Word & PDF Formats** - Generates both document types
- ✅ **Cloud Storage** - Stores files in Google Drive/OneDrive
- ✅ **Auto-Update** - Regenerates invoices when transactions are modified
- ✅ **Download Links** - Provides direct download URLs
- ✅ **Error Handling** - Graceful failure handling with retries

## 🔧 Configuration

### Invoice Number Format

Default: `INV-YYYY-MM-NNN` (e.g., `INV-2025-01-001`)

Can be customized via `generateInvoiceNumber()` parameters:
- `prefix`: Invoice prefix (default: 'INV')
- `useYear`: Include year (default: true)
- `useMonth`: Include month (default: true)

### Storage Provider

Supported providers:
- `google_drive` (default)
- `onedrive` (to be implemented)

Set via `VITE_STORAGE_PROVIDER` environment variable.

## 📝 Usage Example

```typescript
import { useInvoiceGeneration } from '@/hooks/useInvoiceGeneration';

const invoiceGeneration = useInvoiceGeneration();

// Generate invoice
await invoiceGeneration.mutateAsync({
  transactionId: 'transaction-id',
  transaction: salesTransaction,
  customer: customerData,
});

// Download invoice
const downloadInvoice = useInvoiceDownload();
downloadInvoice.mutate({
  invoice: invoiceData,
  format: 'word', // or 'pdf'
});
```

## 🗄️ Database Schema

### `invoices` Table

- `id` - UUID primary key
- `invoice_number` - Unique invoice number (e.g., INV-2025-01-001)
- `transaction_id` - Foreign key to sales_transactions
- `customer_id` - Foreign key to customers
- `invoice_date` - Invoice date
- `due_date` - Payment due date
- `word_file_id` - Cloud storage file ID for Word document
- `pdf_file_id` - Cloud storage file ID for PDF document
- `word_file_url` - Direct download URL for Word
- `pdf_file_url` - Direct download URL for PDF
- `storage_provider` - 'google_drive' or 'onedrive'
- `status` - 'generated', 'sent', 'paid', 'cancelled'

### `invoice_number_sequence` Table

Tracks sequential invoice numbers per year/month for unique number generation.

## 🔐 Security

- Cloud storage credentials stored in Supabase Edge Function secrets
- OAuth 2.0 authentication for Google Drive/OneDrive
- File access controlled via cloud storage permissions
- Invoice numbers generated server-side to prevent manipulation

## 📊 Status

- ✅ Database schema
- ✅ Invoice number generation
- ✅ Word document generation
- ✅ Cloud storage adapters (Google Drive)
- ✅ React hooks
- ⏳ PDF generation (requires backend service)
- ⏳ OneDrive adapter
- ⏳ Email sending
- ⏳ Invoice reporting

## 🤝 Contributing

When adding new features:
1. Update architecture document
2. Add database migrations
3. Update TypeScript types
4. Add tests
5. Update this README

## 📞 Support

For implementation questions, refer to:
- [Architecture Document](./INVOICE_GENERATION_ARCHITECTURE.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- Code comments in service files
