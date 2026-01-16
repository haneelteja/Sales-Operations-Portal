/**
 * Paginated Query Hook
 * 
 * Provides pagination functionality for Supabase queries
 * Reduces data transfer by fetching only the current page
 * 
 * @example
 * const {
 *   data,
 *   page,
 *   setPage,
 *   hasNextPage,
 *   hasPreviousPage,
 *   isLoading
 * } = usePaginatedQuery<SalesTransaction>({
 *   table: 'sales_transactions',
 *   pageSize: 50,
 *   orderBy: { column: 'created_at', ascending: false },
 *   select: 'id, customer_id, transaction_date, amount',
 *   relationships: 'customers (client_name, branch)'
 * });
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UsePaginatedQueryOptions<T> {
  /** Table name to query */
  table: string;
  /** Number of items per page */
  pageSize?: number;
  /** Filters to apply (key-value pairs) */
  filters?: Record<string, unknown>;
  /** Ordering configuration */
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  /** Columns to select (default: '*') */
  select?: string;
  /** Related tables to join (e.g., "customers (id, name)") */
  relationships?: string;
  /** Query key prefix (default: table name) */
  queryKey?: string[];
  /** Stale time in milliseconds (default: 2 minutes) */
  staleTime?: number;
}

export interface PaginatedQueryResult<T> {
  /** Current page data */
  data: T[];
  /** Total number of items */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

export interface UsePaginatedQueryReturn<T> {
  /** Query result data */
  data?: PaginatedQueryResult<T>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Current page number (1-indexed) */
  page: number;
  /** Function to change page */
  setPage: (page: number) => void;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: () => void;
  /** Refetch data */
  refetch: () => void;
}

export const usePaginatedQuery = <T>({
  table,
  pageSize = 50,
  filters = {},
  orderBy,
  select = '*',
  relationships = '',
  queryKey,
  staleTime = 2 * 60 * 1000, // 2 minutes
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryReturn<T> => {
  const [page, setPage] = useState(1);

  // Build select string with relationships
  const selectString = relationships
    ? `${select}, ${relationships}`
    : select;

  // Build query key
  const baseQueryKey = queryKey || [table, 'paginated'];
  const queryKeyWithParams = [
    ...baseQueryKey,
    page,
    pageSize,
    filters,
    orderBy,
  ];

  const query = useQuery({
    queryKey: queryKeyWithParams,
    queryFn: async () => {
      let queryBuilder = supabase
        .from(table)
        .select(selectString, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            // Handle array filters (IN clause)
            queryBuilder = queryBuilder.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            // Handle LIKE patterns
            queryBuilder = queryBuilder.like(key, value);
          } else {
            // Handle equality
            queryBuilder = queryBuilder.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        queryBuilder = queryBuilder.order(orderBy.column, {
          ascending: orderBy.ascending,
        });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await queryBuilder.range(from, to);

      if (error) {
        throw new Error(`Failed to fetch ${table}: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data || []) as T[],
        total,
        page,
        pageSize,
        totalPages,
      };
    },
    staleTime,
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
  });

  const result = query.data;
  const hasNextPage = (result?.totalPages || 0) > page;
  const hasPreviousPage = page > 1;

  const nextPage = () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  };

  const firstPage = () => {
    setPage(1);
  };

  const lastPage = () => {
    if (result?.totalPages) {
      setPage(result.totalPages);
    }
  };

  return {
    data: result,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    page,
    setPage,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    refetch: query.refetch,
  };
};
