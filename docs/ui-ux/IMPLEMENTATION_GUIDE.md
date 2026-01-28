# UI/UX Implementation Guide

**Quick Reference:** Specific code changes to implement UI/UX improvements

---

## 1. Global Changes

### 1.1 Reduce Main Container Padding

**File:** `src/pages/Index.tsx`

**Change:**
```tsx
// Line 143: Change from p-6 to p-4
// Before:
<main className="flex-1 p-6 bg-background">

// After:
<main className="flex-1 p-4 bg-background">
```

---

## 2. Component-Specific Changes

### 2.1 OrderManagement.tsx

#### Fix 1: Add overflow wrapper to Current Orders table

**Find:** The Current Orders table section (around line 900-1000)

**Before:**
```tsx
<CardContent>
  <Table className="min-w-full">
    <TableHeader>
      {/* Table headers */}
    </TableHeader>
    <TableBody>
      {/* Table rows */}
    </TableBody>
  </Table>
</CardContent>
```

**After:**
```tsx
<CardContent>
  <div className="w-full overflow-x-auto">
    <Table className="min-w-full">
      <TableHeader>
        {/* Table headers */}
      </TableHeader>
      <TableBody>
        {/* Table rows */}
      </TableBody>
    </Table>
  </div>
</CardContent>
```

#### Fix 2: Add overflow wrapper to Orders Dispatched table

**Find:** The Orders Dispatched table section (around line 1100-1200)

**Apply the same fix as Fix 1** - wrap the Table in `div className="w-full overflow-x-auto"`

---

### 2.2 ConfigurationManagement.tsx

#### Fix 1: Remove fixed column widths from Customer Pricing table

**Find:** Customer Pricing table headers (around line 1180-1280)

**Before:**
```tsx
<TableHead className="w-[20%]">Client Name</TableHead>
<TableHead className="w-[15%]">Branch</TableHead>
<TableHead className="w-[12%]">SKU</TableHead>
<TableHead className="w-[12%]">Pricing Date</TableHead>
<TableHead className="text-right w-[12%]">Price/Case</TableHead>
<TableHead className="text-right w-[12%]">Price/Bottle</TableHead>
<TableHead className="w-[10%]">Status</TableHead>
<TableHead className="w-[10%]">Created</TableHead>
<TableHead className="text-right w-[8%]">Actions</TableHead>
```

**After:**
```tsx
<TableHead>Client Name</TableHead>
<TableHead>Branch</TableHead>
<TableHead>SKU</TableHead>
<TableHead>Pricing Date</TableHead>
<TableHead className="text-right">Price/Case</TableHead>
<TableHead className="text-right">Price/Bottle</TableHead>
<TableHead>Status</TableHead>
<TableHead>Created</TableHead>
<TableHead className="text-right">Actions</TableHead>
```

**Also update corresponding TableCell elements:**

**Before:**
```tsx
<TableCell className="font-medium w-[20%]">{customer.client_name}</TableCell>
<TableCell className="w-[15%]">{customer.branch}</TableCell>
<TableCell className="w-[12%]">{customer.sku || '-'}</TableCell>
// ... etc
```

**After:**
```tsx
<TableCell className="font-medium">{customer.client_name}</TableCell>
<TableCell>{customer.branch}</TableCell>
<TableCell>{customer.sku || '-'}</TableCell>
// ... etc (remove all w-[*%] classes)
```

#### Fix 2: Add overflow wrapper to Customer Pricing table

**Find:** The Customer Pricing table section

**Wrap the entire Table component:**
```tsx
<div className="w-full overflow-x-auto">
  <Table className="min-w-full">
    {/* Table content */}
  </Table>
</div>
```

#### Fix 3: Add overflow wrapper to Factory Pricing table

**Find:** The Factory Pricing table section (if it exists)

**Apply the same overflow wrapper fix**

---

### 2.3 TransportExpenses.tsx

#### Fix 1: Add overflow wrapper to expenses table

**Find:** The expenses table section (around line 700-800)

**Before:**
```tsx
<Table>
  <TableHeader>
    {/* Headers */}
  </TableHeader>
  <TableBody>
    {/* Rows */}
  </TableBody>
</Table>
```

**After:**
```tsx
<div className="w-full overflow-x-auto">
  <Table className="min-w-full">
    <TableHeader>
      {/* Headers */}
    </TableHeader>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</div>
```

---

### 2.4 FactoryPayables.tsx

#### Fix 1: Add overflow wrapper to payables table

**Find:** The payables table section (around line 900-1000)

**Apply the same overflow wrapper fix as TransportExpenses**

**Before:**
```tsx
<Table>
  {/* Table content */}
</Table>
```

**After:**
```tsx
<div className="w-full overflow-x-auto">
  <Table className="min-w-full">
    {/* Table content */}
  </Table>
</div>
```

---

### 2.5 Reports.tsx

#### Fix 1: Verify/Add container wrapper

**Find:** The return statement of the Reports component

**Check if it has:**
```tsx
return (
  <div className="w-full space-y-6">
    {/* Content */}
  </div>
);
```

**If not, add the wrapper around all content.**

---

## 3. Optional: Standardize Card Padding

If you want to reduce Card padding when nested in main container:

**Pattern to apply:**
```tsx
// Change CardContent padding from default p-6 to p-4
<CardContent className="p-4">
  {/* Content */}
</CardContent>
```

**Apply to:**
- OrderManagement (all Cards)
- ConfigurationManagement (all Cards)
- TransportExpenses (all Cards)
- FactoryPayables (all Cards)
- Dashboard (if needed)
- Reports (if needed)

**Note:** This is optional and depends on visual preference. The main container padding reduction (p-6 → p-4) may be sufficient.

---

## 4. Verification Steps

After making changes:

1. **Test at 1920px width:**
   - Open each landing page
   - Verify no horizontal scrollbar appears
   - Check that tables scroll horizontally when content is wide

2. **Test at 1366px width:**
   - Same checks as above
   - Verify forms don't appear cramped

3. **Test at 1280px width:**
   - Same checks as above
   - Verify all content is accessible

4. **Visual Check:**
   - Verify consistent spacing across pages
   - Check that padding looks balanced
   - Ensure no visual misalignment

---

## 5. Quick Copy-Paste Patterns

### Pattern 1: Table Overflow Wrapper
```tsx
<div className="w-full overflow-x-auto">
  <Table className="min-w-full">
    {/* Your table content */}
  </Table>
</div>
```

### Pattern 2: Page Container
```tsx
<div className="w-full space-y-6">
  {/* Your page content */}
</div>
```

### Pattern 3: Card with Reduced Padding
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-4">
    {/* Your content */}
  </CardContent>
</Card>
```

---

## 6. Files Summary

**Files to modify:**

1. ✅ `src/pages/Index.tsx` - Reduce main padding
2. ✅ `src/components/order-management/OrderManagement.tsx` - Add overflow wrappers (2 tables)
3. ✅ `src/components/configurations/ConfigurationManagement.tsx` - Remove fixed widths, add overflow wrapper
4. ✅ `src/components/transport/TransportExpenses.tsx` - Add overflow wrapper
5. ✅ `src/components/factory/FactoryPayables.tsx` - Add overflow wrapper
6. ⚠️ `src/components/reports/Reports.tsx` - Verify/add container wrapper (if needed)

**Estimated changes:** ~10-15 lines per component

---

**Last Updated:** January 27, 2026
