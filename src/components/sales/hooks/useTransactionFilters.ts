/**
 * Custom hook for managing transaction filter state using useReducer
 * Consolidates multiple useState calls into a single reducer
 */

import { useReducer, useCallback } from 'react';

export interface FilterState {
  searchTerm: string;
  columnFilters: {
    date: string | string[];
    customer: string | string[];
    branch: string | string[];
    type: string | string[];
    sku: string | string[];
    amount: string | string[];
  };
  columnSorts: {
    [key: string]: 'asc' | 'desc' | null;
  };
  currentPage: number;
  pageSize: number;
}

type FilterAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_COLUMN_FILTER'; payload: { column: string; value: string | string[] } }
  | { type: 'CLEAR_COLUMN_FILTER'; payload: string }
  | { type: 'SET_COLUMN_SORT'; payload: { column: string; direction: 'asc' | 'desc' | null } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'RESET_FILTERS' }
  | { type: 'RESET_PAGE' };

const initialState: FilterState = {
  searchTerm: '',
  columnFilters: {
    date: '',
    customer: '',
    branch: '',
    type: '',
    sku: '',
    amount: '',
  },
  columnSorts: {
    date: null,
    customer: null,
    branch: null,
    type: null,
    sku: null,
    amount: null,
  },
  currentPage: 1,
  pageSize: 50,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
        currentPage: 1, // Reset to first page when search changes
      };

    case 'SET_COLUMN_FILTER':
      return {
        ...state,
        columnFilters: {
          ...state.columnFilters,
          [action.payload.column]: action.payload.value,
        },
        currentPage: 1, // Reset to first page when filter changes
      };

    case 'CLEAR_COLUMN_FILTER':
      return {
        ...state,
        columnFilters: {
          ...state.columnFilters,
          [action.payload]: '',
        },
        currentPage: 1,
      };

    case 'SET_COLUMN_SORT':
      return {
        ...state,
        columnSorts: {
          ...state.columnSorts,
          [action.payload.column]: action.payload.direction,
        },
      };

    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        searchTerm: '',
        columnFilters: initialState.columnFilters,
        columnSorts: initialState.columnSorts,
        currentPage: 1,
      };

    case 'RESET_PAGE':
      return {
        ...state,
        currentPage: 1,
      };

    default:
      return state;
  }
}

export function useTransactionFilters(initialPageSize: number = 50) {
  const [state, dispatch] = useReducer(filterReducer, {
    ...initialState,
    pageSize: initialPageSize,
  });

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const setColumnFilter = useCallback((column: string, value: string | string[]) => {
    dispatch({ type: 'SET_COLUMN_FILTER', payload: { column, value } });
  }, []);

  const clearColumnFilter = useCallback((column: string) => {
    dispatch({ type: 'CLEAR_COLUMN_FILTER', payload: column });
  }, []);

  const setColumnSort = useCallback((column: string, direction: 'asc' | 'desc' | null) => {
    dispatch({ type: 'SET_COLUMN_SORT', payload: { column, direction } });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const resetPage = useCallback(() => {
    dispatch({ type: 'RESET_PAGE' });
  }, []);

  return {
    // State
    searchTerm: state.searchTerm,
    columnFilters: state.columnFilters,
    columnSorts: state.columnSorts,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    
    // Actions
    setSearchTerm,
    setColumnFilter,
    clearColumnFilter,
    setColumnSort,
    setPage,
    resetFilters,
    resetPage,
  };
}
