# Invoice Template

## Template File

Place your invoice Word template here: `invoice-template.docx`

## Template Requirements

The template should be a standard Word document (`.docx` format) with the following placeholders using docxtemplater syntax:

### Invoice Header
- `{invoiceNumber}` - Invoice number (e.g., INV-2026-01-001)
- `{invoiceDate}` - Invoice date (DD-MM-YYYY format)
- `{dueDate}` - Due date (DD-MM-YYYY format)

### Company Details
- `{companyName}` - Company name
- `{companyAddress}` - Company address
- `{companyPhone}` - Company phone number
- `{companyEmail}` - Company email
- `{companyGSTIN}` - Company GSTIN (optional, may be empty)

### Client Details
- `{clientName}` - Client name
- `{branch}` - Branch name (optional, may be empty)
- `{clientAddress}` - Client address (optional, may be empty)
- `{clientPhone}` - Client phone (optional, may be empty)
- `{clientEmail}` - Client email (optional, may be empty)

### Invoice Items
Use a loop for items:
```
{#items}
{sku} | {description} | {quantity} | {unitPrice} | {amount}
{/items}
```

- `{sku}` - SKU code
- `{description}` - Item description
- `{quantity}` - Quantity
- `{unitPrice}` - Unit price (formatted as ₹X,XXX.XX)
- `{amount}` - Line total (formatted as ₹X,XXX.XX)

### Totals
- `{subtotal}` - Subtotal (formatted as ₹X,XXX.XX)
- `{tax}` - Tax amount (formatted as ₹X,XXX.XX)
- `{totalAmount}` - Grand total (formatted as ₹X,XXX.XX)
- `{amountInWords}` - Amount in words (e.g., "Sixteen Thousand Rupees Only")

### Terms
- `{terms}` - Payment terms and conditions

## Example Template Structure

```
┌─────────────────────────────────────────┐
│  INVOICE                                │
│  Invoice #: {invoiceNumber}             │
│  Date: {invoiceDate}                    │
│  Due Date: {dueDate}                   │
├─────────────────────────────────────────┤
│  FROM:                                  │
│  {companyName}                          │
│  {companyAddress}                      │
│  Phone: {companyPhone}                  │
│  Email: {companyEmail}                  │
│  GSTIN: {companyGSTIN}                 │
├─────────────────────────────────────────┤
│  TO:                                    │
│  {clientName}                          │
│  {branch}                              │
│  {clientAddress}                       │
├─────────────────────────────────────────┤
│  ITEMS                                  │
│  ───────────────────────────────────── │
│  {#items}                              │
│  {sku} | {quantity} | {unitPrice} | {amount} │
│  {/items}                              │
├─────────────────────────────────────────┤
│  Subtotal: {subtotal}                  │
│  Tax: {tax}                            │
│  Total: {totalAmount}                  │
│                                         │
│  Amount in Words: {amountInWords}      │
├─────────────────────────────────────────┤
│  Terms: {terms}                        │
└─────────────────────────────────────────┘
```

## Creating the Template

1. Create a Word document with your desired layout
2. Use `{placeholder}` syntax for dynamic values
3. Use `{#items}...{/items}` for loops
4. Save as `.docx` format (not `.doc`)
5. Place the file as `invoice-template.docx` in this directory

## Testing

After creating the template, test invoice generation:
1. Go to Client Transactions page
2. Select a transaction
3. Click "Generate Invoice"
4. Verify the generated document matches your template
