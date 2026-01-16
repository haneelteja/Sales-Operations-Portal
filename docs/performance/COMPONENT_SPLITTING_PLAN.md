# Component Splitting Plan
## SalesEntry.tsx Refactoring Strategy

**Date:** January 2025  
**Current Size:** 2,653 lines  
**Target:** Split into 5-6 smaller components (~200-400 lines each)

---

## 🎯 Goals

1. **Reduce Bundle Size:** Smaller components = better code splitting
2. **Improve Maintainability:** Easier to understand and modify
3. **Better Performance:** Smaller components = faster renders
4. **Easier Testing:** Test components in isolation

---

## 📋 Component Structure Plan

### Current Structure
```
SalesEntry.tsx (2,653 lines)
├── State Management (100+ lines)
├── Sale Form (400+ lines)
├── Payment Form (300+ lines)
├── Transactions Table (800+ lines)
├── Edit Modal (200+ lines)
├── Delete Modal (100+ lines)
├── Filters (300+ lines)
└── Utility Functions (200+ lines)
```

### Proposed Structure
```
src/components/sales/
├── SalesEntry.tsx (150-200 lines) - Main orchestrator
├── SalesEntryForm.tsx (300-400 lines) - Sale form
├── PaymentEntryForm.tsx (250-300 lines) - Payment form
├── SalesTransactionsTable.tsx (400-500 lines) - Transactions table
├── SalesEntryFilters.tsx (200-250 lines) - Filters and search
├── EditTransactionModal.tsx (200-250 lines) - Edit modal
└── DeleteTransactionModal.tsx (100-150 lines) - Delete confirmation
```

---

## 🔧 Implementation Plan

### Phase 1: Extract Forms (Easiest)

#### 1.1 SalesEntryForm Component

**File:** `src/components/sales/SalesEntryForm.tsx`

**Extract:**
- Sale form state
- Customer selection
- SKU management
- Single SKU mode logic
- Multiple items management
- Form submission

**Props:**
```typescript
interface SalesEntryFormProps {
  customers: Customer[];
  onSubmit: (data: SaleForm) => void;
  isLoading?: boolean;
}
```

**Benefits:**
- Isolated form logic
- Easier to test
- Reusable if needed

---

#### 1.2 PaymentEntryForm Component

**File:** `src/components/sales/PaymentEntryForm.tsx`

**Extract:**
- Payment form state
- Customer/branch selection
- Payment amount
- Form submission

**Props:**
```typescript
interface PaymentEntryFormProps {
  customers: Customer[];
  onSubmit: (data: PaymentForm) => void;
  isLoading?: boolean;
}
```

**Benefits:**
- Clean separation
- Easier maintenance
- Better code organization

---

### Phase 2: Extract Table (Medium Complexity)

#### 2.1 SalesTransactionsTable Component

**File:** `src/components/sales/SalesTransactionsTable.tsx`

**Extract:**
- Table rendering
- Column definitions
- Row rendering
- Mobile table rendering
- Pagination display

**Props:**
```typescript
interface SalesTransactionsTableProps {
  transactions: SalesTransaction[];
  customers: Customer[];
  onEdit: (transaction: SalesTransaction) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isMobile?: boolean;
}
```

**Benefits:**
- Large code reduction in main component
- Better performance (can memoize table separately)
- Easier to optimize table rendering

---

### Phase 3: Extract Modals (Easy)

#### 3.1 EditTransactionModal Component

**File:** `src/components/sales/EditTransactionModal.tsx`

**Extract:**
- Edit modal dialog
- Edit form state
- Form validation
- Update logic

**Props:**
```typescript
interface EditTransactionModalProps {
  transaction: SalesTransaction | null;
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<SalesTransaction>) => void;
}
```

**Benefits:**
- Clean modal logic
- Easier to test
- Better UX (can optimize modal separately)

---

#### 3.2 DeleteTransactionModal Component

**File:** `src/components/sales/DeleteTransactionModal.tsx`

**Extract:**
- Delete confirmation dialog
- Delete logic

**Props:**
```typescript
interface DeleteTransactionModalProps {
  transaction: SalesTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}
```

**Benefits:**
- Simple, focused component
- Easy to test
- Reusable pattern

---

### Phase 4: Extract Filters (Medium)

#### 4.1 SalesEntryFilters Component

**File:** `src/components/sales/SalesEntryFilters.tsx`

**Extract:**
- Search input
- Column filters
- Column sorts
- Clear filters button
- Export button

**Props:**
```typescript
interface SalesEntryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  columnFilters: ColumnFilters;
  onFilterChange: (column: string, value: string | string[]) => void;
  columnSorts: ColumnSorts;
  onSortChange: (column: string, direction: 'asc' | 'desc' | null) => void;
  onClearFilters: () => void;
  onExport: () => void;
  uniqueValues: {
    customers: string[];
    branches: string[];
    skus: string[];
    types: string[];
  };
}
```

**Benefits:**
- Clean filter logic
- Easier to optimize filtering
- Better code organization

---

## 📝 Implementation Steps

### Step 1: Create Component Files

```bash
# Create component files
touch src/components/sales/SalesEntryForm.tsx
touch src/components/sales/PaymentEntryForm.tsx
touch src/components/sales/SalesTransactionsTable.tsx
touch src/components/sales/SalesEntryFilters.tsx
touch src/components/sales/EditTransactionModal.tsx
touch src/components/sales/DeleteTransactionModal.tsx
```

### Step 2: Extract Forms First

1. Copy sale form code to `SalesEntryForm.tsx`
2. Extract props and state
3. Update `SalesEntry.tsx` to use new component
4. Test functionality

### Step 3: Extract Payment Form

1. Copy payment form code to `PaymentEntryForm.tsx`
2. Extract props and state
3. Update `SalesEntry.tsx` to use new component
4. Test functionality

### Step 4: Extract Table

1. Copy table code to `SalesTransactionsTable.tsx`
2. Extract props
3. Update `SalesEntry.tsx` to use new component
4. Test functionality

### Step 5: Extract Modals

1. Copy modal code to separate files
2. Extract props
3. Update `SalesEntry.tsx` to use new components
4. Test functionality

### Step 6: Extract Filters

1. Copy filter code to `SalesEntryFilters.tsx`
2. Extract props
3. Update `SalesEntry.tsx` to use new component
4. Test functionality

### Step 7: Refactor Main Component

1. Update `SalesEntry.tsx` to orchestrate components
2. Keep only state management and coordination
3. Reduce to ~150-200 lines
4. Test all functionality

---

## 🎨 Component Communication

### State Management Strategy

**Option 1: Lift State Up (Recommended)**
- Keep state in `SalesEntry.tsx`
- Pass down as props
- Pass callbacks for updates

**Option 2: Context API**
- Create `SalesEntryContext`
- Share state via context
- Use in child components

**Recommendation:** Option 1 (simpler, more explicit)

---

## 📊 Expected Results

### Before
- **SalesEntry.tsx:** 2,653 lines
- **Bundle:** Large, loads all at once
- **Maintainability:** Difficult
- **Testing:** Hard to test in isolation

### After
- **SalesEntry.tsx:** ~150-200 lines
- **Total Components:** 6-7 files (~200-400 lines each)
- **Bundle:** Better code splitting
- **Maintainability:** Much easier
- **Testing:** Easy to test components separately

---

## ✅ Benefits

1. **Performance:**
   - Better code splitting
   - Smaller initial bundle
   - Faster component loads

2. **Maintainability:**
   - Easier to understand
   - Easier to modify
   - Clear separation of concerns

3. **Testing:**
   - Test components in isolation
   - Easier to write tests
   - Better test coverage

4. **Developer Experience:**
   - Faster navigation in IDE
   - Easier code reviews
   - Better collaboration

---

## 🚧 Risks & Mitigation

### Risk: Breaking Changes
**Mitigation:**
- Extract one component at a time
- Test after each extraction
- Keep original code commented initially

### Risk: Prop Drilling
**Mitigation:**
- Use TypeScript interfaces
- Document prop requirements
- Consider Context API if needed

### Risk: State Synchronization
**Mitigation:**
- Keep state in parent
- Use callbacks for updates
- Test state updates thoroughly

---

## 📅 Timeline Estimate

- **Phase 1 (Forms):** 2-3 hours
- **Phase 2 (Table):** 3-4 hours
- **Phase 3 (Modals):** 1-2 hours
- **Phase 4 (Filters):** 2-3 hours
- **Testing:** 2-3 hours
- **Total:** 10-15 hours

---

## 🎯 Success Criteria

- [ ] SalesEntry.tsx reduced to < 300 lines
- [ ] All functionality works as before
- [ ] No performance regressions
- [ ] All components testable in isolation
- [ ] Better code organization
- [ ] Improved bundle splitting

---

## 📚 Next Steps

1. Review this plan
2. Start with Phase 1 (Forms)
3. Test after each phase
4. Iterate based on results
5. Document component APIs

---

**Last Updated:** January 2025  
**Status:** Planning Complete - Ready for Implementation
