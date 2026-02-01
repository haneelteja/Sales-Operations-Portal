# PDF Alignment Fine-Tuning Guide

## Overview
The PDF invoice is generated using jsPDF and should match the DOCX template layout exactly. If alignment needs adjustment, follow this guide.

## Current PDF Layout Structure

The PDF uses these key measurements (in millimeters):
- **Page**: A4 (210mm × 297mm)
- **Margins**: 15mm on all sides
- **Column Positions** (from left margin):
  - S.No.: 17mm
  - Description: 35mm
  - SKU: 103mm
  - Qty: 133mm
  - Rate: 158mm
  - Amount: 173mm (right-aligned)

## How to Adjust PDF Alignment

### 1. Column Positions
Edit `src/services/documentGenerator.ts`, find the `colPositions` object:

```typescript
const colPositions = {
  sno: margin + 2,           // Adjust +2 to move S.No. column
  description: margin + 20,  // Adjust +20 to move Description column
  sku: margin + 88,          // Adjust +88 to move SKU column
  qty: margin + 118,         // Adjust +118 to move Qty column
  rate: margin + 143,        // Adjust +143 to move Rate column
  amount: rightMargin - 2,    // Adjust -2 to move Amount column
};
```

**To match DOCX exactly:**
1. Generate a DOCX invoice
2. Open it and measure column positions (use Word's ruler or screenshot with measurements)
3. Adjust the `colPositions` values to match

### 2. Vertical Spacing
Adjust `yPosition` increments throughout the PDF generation:

```typescript
yPosition += 6;  // Change 6 to adjust spacing between elements
```

**Common spacing adjustments:**
- Header to company name: `yPosition += 12;` (line 178)
- Company name to address: `yPosition += 8;` (line 182)
- Address lines: `yPosition += 5.5;` (line 190)
- Table row height: `yPosition += 8;` (line 250)
- Total amount spacing: `yPosition += 9;` (line 256)

### 3. Font Sizes
Match font sizes to DOCX:

```typescript
addText('Bill of supply', pageWidth / 2, yPosition, 18, 'bold', 'center');
//                                                          ^^
//                                                    Change this value
```

**Current font sizes:**
- Header: 18pt
- Company name: 16pt
- Address: 11pt
- Table headers: 10pt
- Table content: 10pt
- Total: 11pt
- Account details: 10-11pt

### 4. Text Alignment
Ensure text alignment matches DOCX:

```typescript
addText(text, x, y, fontSize, 'bold', 'center');  // 'left' | 'center' | 'right'
//                                                      ^^^^^^
//                                              Change alignment here
```

## Quick Alignment Test

1. **Generate both DOCX and PDF** for the same transaction
2. **Open both files side by side**
3. **Compare visually:**
   - Column positions
   - Text alignment (left/center/right)
   - Vertical spacing
   - Font sizes
4. **Adjust values** in `documentGenerator.ts` based on differences
5. **Regenerate PDF** and compare again

## Fine-Tuning Tips

### To Move Columns Left/Right:
- Increase value = move right
- Decrease value = move left
- Example: `description: margin + 20` → `margin + 25` moves description column right

### To Adjust Vertical Spacing:
- Increase `yPosition += X` = more space
- Decrease `yPosition += X` = less space
- Example: `yPosition += 8` → `yPosition += 6` reduces spacing

### To Match Exact Positions:
1. Take a screenshot of the DOCX template
2. Measure pixel positions
3. Convert pixels to mm (1 inch = 25.4mm, adjust for your screen DPI)
4. Update `colPositions` values accordingly

## Testing After Changes

After making adjustments:
1. Clear browser cache
2. Generate a new invoice
3. Compare DOCX and PDF side by side
4. Iterate until alignment matches

## Need More Precision?

If exact pixel-perfect matching is required, consider:
1. Using a PDF library with better layout control (like pdfkit with precise positioning)
2. Converting DOCX to PDF server-side (maintains exact formatting)
3. Using a template-based PDF library that reads the DOCX structure

For now, the current implementation provides good alignment that can be fine-tuned using the above guide.
