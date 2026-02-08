# Phase 2: Component Refactoring - Implementation Plan

**Date:** January 27, 2026  
**Status:** In Progress  
**Phase:** Component Refactoring (Week 2-3)

---

## Overview

Phase 2 focuses on splitting large monolithic components into smaller, maintainable, and testable components. This improves:
- Code maintainability
- Reusability
- Testability
- Performance (smaller component trees)
- Developer experience

---

## Target Components

### 1. SalesEntry.tsx (2,789 lines) → Target: 5 components

**Current Structure:**
- Sale form (single SKU + multiple SKUs)
- Payment form
- Transactions table with filters
- Edit transaction dialog
- Export functionality

**Proposed Split:**
1. **SalesEntryForm.tsx** (~400 lines)
   - Sale form (single SKU mode)
   - Multiple SKUs form
   - Payment form
   - Form validation logic

2. **SalesEntryTable.tsx** (~600 lines)
   - Transactions table
   - Column filters
   - Sorting
   - Pagination

3. **EditTransactionDialog.tsx** (~150 lines)
   - Edit form dialog
   - Update mutation logic

4. **SalesEntryFilters.tsx** (~200 lines)
   - Search bar
   - Filter controls
   - Export buttons

5. **SalesEntry.tsx** (~300 lines) - Main orchestrator
   - State management
   - Data fetching
   - Component composition

---

### 2. OrderManagement.tsx (1,243 lines) → Target: 3 components

**Current Structure:**
- Order form
- Current Orders table
- Orders Dispatched table

**Proposed Split:**
1. **OrderForm.tsx** (~300 lines)
   - Order creation form
   - Form validation
   - Auto-population logic

2. **OrdersTable.tsx** (~400 lines)
   - Current Orders table
   - Filters and sorting
   - Dispatch actions

3. **DispatchTable.tsx** (~300 lines)
   - Orders Dispatched table
   - Filters and sorting

4. **OrderManagement.tsx** (~200 lines) - Main orchestrator
   - State management
   - Data fetching
   - Component composition

---

### 3. ConfigurationManagement.tsx (1,887 lines) → Target: 3 components

**Current Structure:**
- Customer Pricing table
- Factory Pricing table
- SKU Configuration table

**Proposed Split:**
1. **CustomerPricingTable.tsx** (~600 lines)
   - Customer pricing CRUD
   - Table with filters

2. **FactoryPricingTable.tsx** (~600 lines)
   - Factory pricing CRUD
   - Table with filters

3. **SKUConfigurationTable.tsx** (~500 lines)
   - SKU configuration CRUD
   - Table with filters

4. **ConfigurationManagement.tsx** (~200 lines) - Main orchestrator
   - Tab navigation
   - Component composition

---

## Implementation Strategy

### Step 1: State Management Optimization ✅
- [x] Create `useTransactionFilters` hook with useReducer
- [ ] Create `useOrderFilters` hook
- [ ] Create `useConfigurationState` hook

### Step 2: Extract Self-Contained Components
- [ ] Extract EditTransactionDialog (SalesEntry)
- [ ] Extract Export functionality
- [ ] Extract Pagination component

### Step 3: Extract Form Components
- [ ] Extract SalesEntryForm
- [ ] Extract OrderForm
- [ ] Extract Configuration forms

### Step 4: Extract Table Components
- [ ] Extract SalesEntryTable
- [ ] Extract OrdersTable
- [ ] Extract DispatchTable
- [ ] Extract Configuration tables

### Step 5: Refactor Main Components
- [ ] Refactor SalesEntry to use extracted components
- [ ] Refactor OrderManagement to use extracted components
- [ ] Refactor ConfigurationManagement to use extracted components

---

## Benefits

### Code Quality
- **Maintainability:** Smaller files easier to navigate
- **Testability:** Components can be tested in isolation
- **Reusability:** Components can be reused across pages

### Performance
- **Smaller bundles:** Code splitting opportunities
- **Faster renders:** Smaller component trees
- **Better memoization:** Smaller components = better memoization

### Developer Experience
- **Faster navigation:** Find code faster
- **Easier debugging:** Isolated components
- **Better collaboration:** Multiple developers can work on different components

---

## File Structure

```
src/components/sales/
├── SalesEntry.tsx (main orchestrator)
├── SalesEntryForm.tsx
├── SalesEntryTable.tsx
├── EditTransactionDialog.tsx
├── SalesEntryFilters.tsx
└── hooks/
    └── useTransactionFilters.ts ✅

src/components/order-management/
├── OrderManagement.tsx (main orchestrator)
├── OrderForm.tsx
├── OrdersTable.tsx
├── DispatchTable.tsx
└── hooks/
    └── useOrderFilters.ts

src/components/configurations/
├── ConfigurationManagement.tsx (main orchestrator)
├── CustomerPricingTable.tsx
├── FactoryPricingTable.tsx
├── SKUConfigurationTable.tsx
└── hooks/
    └── useConfigurationState.ts
```

---

## Progress Tracking

### SalesEntry.tsx Refactoring
- [x] Filter state reducer hook created
- [ ] EditTransactionDialog extracted
- [ ] SalesEntryForm extracted
- [ ] SalesEntryTable extracted
- [ ] SalesEntryFilters extracted
- [ ] Main component refactored

### OrderManagement.tsx Refactoring
- [ ] OrderForm extracted
- [ ] OrdersTable extracted
- [ ] DispatchTable extracted
- [ ] Main component refactored

### ConfigurationManagement.tsx Refactoring
- [ ] CustomerPricingTable extracted
- [ ] FactoryPricingTable extracted
- [ ] SKUConfigurationTable extracted
- [ ] Main component refactored

---

## Testing Strategy

After each extraction:
1. **Visual Testing:** Verify UI looks identical
2. **Functional Testing:** Verify all features work
3. **Performance Testing:** Verify no performance regressions
4. **Integration Testing:** Verify components work together

---

## Estimated Impact

### Code Metrics
- **Before:** 3 files, ~5,900 lines
- **After:** 15 files, ~5,900 lines (same code, better organized)
- **Average file size:** 393 lines (down from 1,967 lines)

### Performance
- **Bundle size:** No change (same code)
- **Render performance:** Improved (smaller component trees)
- **Memory:** Improved (better garbage collection)

### Maintainability
- **Complexity:** Reduced per file
- **Testability:** Improved (isolated components)
- **Reusability:** Improved (extracted components)

---

**Status:** Phase 2 Started - Filter State Hook Created ✅
