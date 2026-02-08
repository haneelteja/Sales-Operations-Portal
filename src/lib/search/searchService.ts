// Enhanced Search Service with Full-Text Search and Advanced Filtering
import { supabase } from '@/integrations/supabase/client';
import type { 
  SearchQuery, 
  SearchResult, 
  SearchModule, 
  FilterCondition,
  SearchFilter,
  FacetResult 
} from '@/types/search';
import { logger } from '@/lib/logger';

export class SearchService {
  /**
   * Perform full-text search across specified modules
   */
  static async search<T = unknown>(
    query: SearchQuery,
    module: SearchModule
  ): Promise<SearchResult<T>> {
    try {
      const {
        query: searchText,
        filters,
        sortBy,
        sortOrder = 'desc',
        page = 1,
        pageSize = 50,
        highlight = false,
      } = query;

      let supabaseQuery = supabase.from(module).select('*', { count: 'exact' });

      // Apply full-text search if query provided
      if (searchText && searchText.trim()) {
        supabaseQuery = this.applyFullTextSearch(supabaseQuery, module, searchText);
      }

      // Apply filters
      if (filters && filters.conditions.length > 0) {
        supabaseQuery = this.applyFilters(supabaseQuery, filters);
      }

      // Apply sorting
      if (sortBy) {
        supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      supabaseQuery = supabaseQuery.range(from, to);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        logger.error('Search error:', error);
        throw error;
      }

      // Generate highlights if requested
      const highlights = highlight && searchText
        ? this.generateHighlights(data || [], module, searchText)
        : undefined;

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data || []) as T[],
        total,
        page,
        pageSize,
        totalPages,
        highlights,
      };
    } catch (error) {
      logger.error('Search service error:', error);
      throw error;
    }
  }

  /**
   * Cross-module search
   */
  static async searchAcrossModules<T = unknown>(
    query: SearchQuery,
    modules: SearchModule[]
  ): Promise<Record<SearchModule, SearchResult<T>>> {
    const results: Record<string, SearchResult<T>> = {};

    await Promise.all(
      modules.map(async (module) => {
        try {
          results[module] = await this.search<T>(query, module);
        } catch (error) {
          logger.error(`Error searching module ${module}:`, error);
          results[module] = {
            data: [],
            total: 0,
            page: query.page || 1,
            pageSize: query.pageSize || 50,
            totalPages: 0,
          };
        }
      })
    );

    return results as Record<SearchModule, SearchResult<T>>;
  }

  /**
   * Get facets for a module
   */
  static async getFacets(
    module: SearchModule,
    fields: string[],
    filters?: SearchFilter
  ): Promise<FacetResult[]> {
    try {
      const facets: FacetResult[] = [];

      for (const field of fields) {
        let query = supabase
          .from(module)
          .select(field);

        if (filters) {
          query = this.applyFilters(query, filters);
        }

        const { data, error } = await query;

        if (error) {
          logger.warn(`Error getting facet for ${field}:`, error);
          continue;
        }

        // Count occurrences
        const counts: Record<string, number> = {};
        data?.forEach((item) => {
          const value = String(item[field as keyof typeof item] || 'null');
          counts[value] = (counts[value] || 0) + 1;
        });

        facets.push({
          field,
          values: Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
        });
      }

      return facets;
    } catch (error) {
      logger.error('Error getting facets:', error);
      return [];
    }
  }

  /**
   * Apply full-text search using PostgreSQL text search
   * Uses ilike for simple matching, can use database function for multi-field search
   */
  private static applyFullTextSearch(
    query: any,
    module: SearchModule,
    searchText: string
  ): any {
    // Get searchable text fields for the module
    const textFields = this.getSearchableTextFields(module);
    
    if (textFields.length === 0 || !searchText.trim()) {
      return query;
    }

    // For better multi-field search, we can use the search_multiple_fields function
    // For now, use a simple approach with ilike on primary field
    // To use the database function, uncomment the RPC call below
    
    const primaryField = textFields[0];
    
    // Simple approach: search in primary field with ilike
    // This works well for most cases
    let resultQuery = query.ilike(primaryField, `%${searchText.trim()}%`);
    
    // Alternative: Use database function for better multi-field search
    // Uncomment to use the search_multiple_fields function:
    /*
    try {
      const { data: searchResults, error } = await supabase.rpc('search_multiple_fields', {
        table_name: module,
        search_text: searchText.trim(),
        field_names: textFields
      });
      
      if (!error && searchResults && searchResults.length > 0) {
        const ids = searchResults.map(r => r.id);
        resultQuery = query.in('id', ids);
      }
    } catch (error) {
      logger.warn('Full-text search function not available, using ilike fallback');
      // Fallback to ilike
      resultQuery = query.ilike(primaryField, `%${searchText.trim()}%`);
    }
    */
    
    return resultQuery;
  }

  /**
   * Apply filters to query
   */
  private static applyFilters(query: any, filter: SearchFilter): any {
    const { conditions, logic } = filter;

    if (conditions.length === 0) {
      return query;
    }

    // Apply each condition
    conditions.forEach((condition, index) => {
      const { field, operator, value, value2 } = condition;

      if (logic === 'AND' || index === 0) {
        query = this.applyCondition(query, field, operator, value, value2);
      } else {
        // For OR logic, we need to use .or() - Supabase limitation
        // This is a simplified version - for complex OR, consider database functions
        query = this.applyCondition(query, field, operator, value, value2);
      }
    });

    return query;
  }

  /**
   * Apply a single filter condition
   */
  private static applyCondition(
    query: any,
    field: string,
    operator: string,
    value: string | number | boolean | string[] | null,
    value2?: string | number | null
  ): any {
    switch (operator) {
      case 'equals':
        return query.eq(field, value);
      case 'not_equals':
        return query.neq(field, value);
      case 'contains':
        return query.ilike(field, `%${value}%`);
      case 'not_contains':
        return query.not('ilike', field, `%${value}%`);
      case 'starts_with':
        return query.ilike(field, `${value}%`);
      case 'ends_with':
        return query.ilike(field, `%${value}`);
      case 'greater_than':
        return query.gt(field, value);
      case 'less_than':
        return query.lt(field, value);
      case 'greater_than_or_equal':
        return query.gte(field, value);
      case 'less_than_or_equal':
        return query.lte(field, value);
      case 'between':
        if (value !== null && value2 !== null) {
          return query.gte(field, value).lte(field, value2);
        }
        return query;
      case 'in':
        if (Array.isArray(value)) {
          return query.in(field, value);
        }
        return query;
      case 'not_in':
        if (Array.isArray(value)) {
          // Supabase doesn't have not.in, so we use .not() with .in()
          return query.not('in', field, value);
        }
        return query;
      case 'is_null':
        return query.is(field, null);
      case 'is_not_null':
        return query.not('is', field, null);
      default:
        return query;
    }
  }

  /**
   * Get searchable text fields for a module
   */
  private static getSearchableTextFields(module: SearchModule): string[] {
    // This would ideally come from the search config
    const commonTextFields: Record<SearchModule, string[]> = {
      sales_transactions: ['sku', 'description'],
      orders: ['client', 'branch', 'sku'],
      customers: ['client_name', 'branch', 'contact_person', 'email', 'phone'],
      user_management: ['username', 'email'],
      factory_payables: ['description', 'sku'],
      transport_expenses: ['expense_group', 'description'],
      label_purchases: ['vendor_id', 'sku'],
      label_payments: ['vendor', 'payment_method'],
      sku_configurations: ['sku'],
      factory_pricing: ['sku'],
    };

    return commonTextFields[module] || [];
  }

  /**
   * Generate highlights for search results
   */
  private static generateHighlights(
    data: unknown[],
    module: SearchModule,
    searchText: string
  ): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const textFields = this.getSearchableTextFields(module);
    const searchLower = searchText.toLowerCase();

    data.forEach((item, index) => {
      const itemHighlights: string[] = [];
      
      textFields.forEach((field) => {
        const fieldValue = (item as Record<string, unknown>)[field];
        if (typeof fieldValue === 'string') {
          const lowerValue = fieldValue.toLowerCase();
          if (lowerValue.includes(searchLower)) {
            // Simple highlighting - in production, use a proper highlighting library
            const highlighted = fieldValue.replace(
              new RegExp(searchText, 'gi'),
              (match) => `<mark>${match}</mark>`
            );
            itemHighlights.push(`${field}: ${highlighted}`);
          }
        }
      });

      if (itemHighlights.length > 0) {
        highlights[String(index)] = itemHighlights;
      }
    });

    return highlights;
  }
}
