/**
 * Code Optimization Examples and Utilities
 * 
 * This file contains optimized code patterns and utilities
 * to improve React component performance
 */

import { useCallback, useMemo, useReducer } from 'react';

// ==============================================
// 1. State Management Optimization
// ==============================================

/**
 * Combined filter state reducer
 * Replaces multiple useState calls with a single reducer
 */
export type FilterState = {
  searchTerm: string;
  columnFilters: Record<string, string>;
  columnSorts: Record<string, 'asc' | 'desc' | null>;
};

export type FilterAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_COLUMN_FILTER'; payload: { column: string; value: string } }
  | { type: 'SET_COLUMN_SORT'; payload: { column: string; direction: 'asc' | 'desc' | null } }
  | { type: 'RESET_FILTERS' };

export const filtersReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_COLUMN_FILTER':
      return {
        ...state,
        columnFilters: {
          ...state.columnFilters,
          [action.payload.column]: action.payload.value,
        },
      };
    case 'SET_COLUMN_SORT':
      return {
        ...state,
        columnSorts: {
          ...state.columnSorts,
          [action.payload.column]: action.payload.direction,
        },
      };
    case 'RESET_FILTERS':
      return {
        searchTerm: '',
        columnFilters: {},
        columnSorts: {},
      };
    default:
      return state;
  }
};

/**
 * Usage example:
 * 
 * const [filters, dispatch] = useReducer(filtersReducer, {
 *   searchTerm: '',
 *   columnFilters: {},
 *   columnSorts: {},
 * });
 * 
 * dispatch({ type: 'SET_SEARCH_TERM', payload: 'search text' });
 */

// ==============================================
// 2. Memoization Utilities
// ==============================================

/**
 * Memoized filter function
 * Only recalculates when dependencies change
 */
export const useFilteredData = <T>(
  data: T[],
  filterFn: (item: T) => boolean,
  dependencies: unknown[] = []
) => {
  return useMemo(() => {
    return data.filter(filterFn);
  }, [data, ...dependencies]);
};

/**
 * Memoized sort function
 */
export const useSortedData = <T>(
  data: T[],
  sortFn: (a: T, b: T) => number,
  dependencies: unknown[] = []
) => {
  return useMemo(() => {
    return [...data].sort(sortFn);
  }, [data, ...dependencies]);
};

/**
 * Memoized grouped data
 */
export const useGroupedData = <T, K extends string | number>(
  data: T[],
  groupBy: (item: T) => K,
  dependencies: unknown[] = []
) => {
  return useMemo(() => {
    const groups = new Map<K, T[]>();
    data.forEach((item) => {
      const key = groupBy(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    return groups;
  }, [data, ...dependencies]);
};

// ==============================================
// 3. Debounce Hook
// ==============================================

import { useState, useEffect } from 'react';

/**
 * Debounce hook for search inputs and API calls
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Usage example:
 * 
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // Trigger search with debounced value
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 */

// ==============================================
// 4. Optimized Callback Patterns
// ==============================================

/**
 * Stable callback creator
 * Returns a memoized callback that doesn't change unless dependencies change
 */
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies: unknown[]
): T => {
  return useCallback(callback, dependencies) as T;
};

/**
 * Batch state updates
 * Prevents multiple re-renders from sequential state updates
 */
export const useBatchedUpdates = () => {
  return useCallback((updates: Array<() => void>) => {
    // React 18 automatically batches updates, but this ensures it
    updates.forEach((update) => update());
  }, []);
};

// ==============================================
// 5. Performance Monitoring
// ==============================================

/**
 * Component render profiler
 * Logs slow renders for debugging
 */
export const useRenderProfiler = (componentName: string, threshold: number = 16) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > threshold) {
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
        );
      }
    };
  });
};

/**
 * Usage example:
 * 
 * const MyComponent = () => {
 *   useRenderProfiler('MyComponent', 16);
 *   // component code
 * };
 */

// ==============================================
// 6. Optimized Data Processing
// ==============================================

/**
 * Batch process items to avoid blocking the main thread
 */
export const useBatchedProcessing = <T, R>(
  items: T[],
  processFn: (item: T) => R,
  batchSize: number = 100
) => {
  return useMemo(() => {
    const results: R[] = [];
    
    const processBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + batchSize, items.length);
      for (let i = startIndex; i < endIndex; i++) {
        results.push(processFn(items[i]));
      }
      
      if (endIndex < items.length) {
        // Schedule next batch
        setTimeout(() => processBatch(endIndex), 0);
      }
    };
    
    if (items.length > 0) {
      processBatch(0);
    }
    
    return results;
  }, [items, processFn, batchSize]);
};

// ==============================================
// 7. Memory Leak Prevention
// ==============================================

/**
 * Safe timeout hook that cleans up on unmount
 */
export const useSafeTimeout = () => {
  const timeouts = useMemo(() => new Set<NodeJS.Timeout>(), []);

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeouts.delete(timeoutId);
      callback();
    }, delay);
    timeouts.add(timeoutId);
    return timeoutId;
  }, [timeouts]);

  const clearSafeTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId);
    timeouts.delete(timeoutId);
  }, [timeouts]);

  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, [timeouts]);

  return { setSafeTimeout, clearSafeTimeout };
};

/**
 * Safe interval hook
 */
export const useSafeInterval = () => {
  const intervals = useMemo(() => new Set<NodeJS.Timeout>(), []);

  const setSafeInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = setInterval(callback, delay);
    intervals.add(intervalId);
    return intervalId;
  }, [intervals]);

  const clearSafeInterval = useCallback((intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
    intervals.delete(intervalId);
  }, [intervals]);

  useEffect(() => {
    return () => {
      intervals.forEach((intervalId) => clearInterval(intervalId));
      intervals.clear();
    };
  }, [intervals]);

  return { setSafeInterval, clearSafeInterval };
};

// ==============================================
// 8. Optimized Component Patterns
// ==============================================

/**
 * Example: Optimized table row component
 * Memoized to prevent unnecessary re-renders
 * 
 * Note: This is a TypeScript file, so JSX components should be in separate .tsx files
 * This example is kept for reference but should be moved to a .tsx file for actual use
 */

// ==============================================
// 9. Data Transformation Utilities
// ==============================================

/**
 * Memoized data transformation
 */
export const useTransformedData = <T, R>(
  data: T[],
  transformFn: (item: T) => R,
  dependencies: unknown[] = []
) => {
  return useMemo(() => {
    return data.map(transformFn);
  }, [data, ...dependencies]);
};

/**
 * Memoized aggregation
 */
export const useAggregatedData = <T>(
  data: T[],
  aggregator: (acc: number, item: T) => number,
  initialValue: number = 0,
  dependencies: unknown[] = []
) => {
  return useMemo(() => {
    return data.reduce(aggregator, initialValue);
  }, [data, initialValue, ...dependencies]);
};

// ==============================================
// 10. Export all utilities
// ==============================================

export default {
  filtersReducer,
  useFilteredData,
  useSortedData,
  useGroupedData,
  useDebounce,
  useStableCallback,
  useBatchedUpdates,
  useRenderProfiler,
  useBatchedProcessing,
  useSafeTimeout,
  useSafeInterval,
  useTransformedData,
  useAggregatedData,
};

