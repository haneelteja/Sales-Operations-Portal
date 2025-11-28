import { describe, it, expect, vi } from 'vitest';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';

describe('Supabase Client', () => {
  it('should be initialized', () => {
    expect(supabase).toBeDefined();
  });

  describe('handleSupabaseError', () => {
    it('handles network errors', () => {
      const networkError = { message: 'Failed to fetch', name: 'TypeError' };
      const result = handleSupabaseError(networkError);
      expect(result).toContain('Network error');
    });

    it('handles timeout errors', () => {
      const timeoutError = { message: 'timeout', name: 'AbortError' };
      const result = handleSupabaseError(timeoutError);
      expect(result).toContain('timeout');
    });

    it('handles RLS errors', () => {
      const rlsError = { code: '42501', message: 'permission denied' };
      const result = handleSupabaseError(rlsError);
      expect(result).toContain('Permission denied');
    });

    it('handles unknown errors', () => {
      const unknownError = { message: 'Something went wrong' };
      const result = handleSupabaseError(unknownError);
      expect(result).toBe('Something went wrong');
    });

    it('handles null/undefined errors', () => {
      expect(handleSupabaseError(null)).toBe('An unknown error occurred');
      expect(handleSupabaseError(undefined)).toBe('An unknown error occurred');
    });
  });
});

