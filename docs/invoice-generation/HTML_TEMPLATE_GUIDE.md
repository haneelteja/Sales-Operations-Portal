# HTML Invoice Template Guide

## Overview

The PDF invoice is now generated from an HTML template (`public/templates/invoice-template.html`) that matches the Word document structure exactly. This approach provides perfect alignment and easy customization.

## Template Location

- **File**: `public/templates/invoice-template.html`
- **Access**: Automatically loaded when generating PDF invoices

## Template Structure

The template uses CSS styling to match the Word document layout:

- **A4 Page Size**: 210mm × 297mm
- **Font**: Times New Roman (matching Word document)
- **Margins**: 20mm padding
- **Sections**: Header, Bill To, Invoice Details, Table, Totals, Account Details, Signatures

## Dynamic Fields

The template uses placeholders that are automatically replaced with actual data:

- `{{companyName}}` - Company name
- `{{companyAddress}}` - Company address (supports line breaks)
- `{{clientName}}` - Client name
- `{{branch}}` - Branch name
- `{{invoiceNumber}}` - Invoice number
- `{{invoiceDate}}` - Invoice date (formatted)
- `{{sku}}` - SKU code
- `{{quantity}}` - Quantity
- `{{unitPrice}}` - Unit price (formatted as currency)
- `{{amount}}` - Line amount (formatted as currency)
- `{{totalAmount}}` - Grand total (formatted as currency)
- `{{amountInWords}}` - Amount in words

## Customizing Alignment

### Adjusting Column Widths

Edit the table column widths in the CSS:

```css
.invoice-table .sno-col {
    width: 8%;  /* Adjust as needed */
}

.invoice-table .description-col {
    width: 35%;  /* Adjust as needed */
}
```

### Adjusting Spacing

Modify margins and padding:

```css
.header {
    margin-bottom: 15mm;  /* Adjust header spacing */
}

.table-section {
    margin: 8mm 0;  /* Adjust table spacing */
}
```

### Adjusting Font Sizes

Change font sizes to match Word document:

```css
.header h1 {
    font-size: 18pt;  /* Adjust header font size */
}

.company-name {
    font-size: 16pt;  /* Adjust company name font size */
}
```

### Adjusting Text Alignment

Modify text alignment:

```css
.invoice-meta {
    text-align: right;  /* Right-align invoice details */
}

.total-section {
    text-align: right;  /* Right-align totals */
}
```

## Testing Changes

1. **Make changes** to `public/templates/invoice-template.html`
2. **Save the file**
3. **Generate an invoice** from the Sales Entry page
4. **Compare** the PDF output with the Word document
5. **Iterate** until alignment matches perfectly

## Tips for Perfect Alignment

1. **Use mm units** for precise measurements (matches Word document)
2. **Match font sizes** exactly (pt units)
3. **Test with real data** to see how content flows
4. **Check table alignment** - ensure columns align with headers
5. **Verify spacing** between sections matches Word document

## Troubleshooting

### PDF doesn't match Word document

- Check font sizes match exactly
- Verify column widths are proportional
- Ensure margins and padding match
- Compare spacing between sections

### Text overflow or wrapping issues

- Adjust column widths in the table
- Reduce font sizes if needed
- Check container width (should be 210mm)

### Alignment issues

- Use browser DevTools to inspect the rendered HTML
- Check CSS specificity and inheritance
- Verify flexbox/table layout is correct

## Technical Details

- **Rendering**: HTML → Canvas (via html2canvas) → PDF (via jsPDF)
- **Quality**: 2x scale for high-resolution output
- **Format**: A4 portrait (210mm × 297mm)
- **Browser**: Works in all modern browsers
