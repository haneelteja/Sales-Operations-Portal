import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/lib/form-utils';

describe('Form Utils', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(1234567.89)).toBe('₹12,34,567.89');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-₹1,000.00');
    });
  });

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('handles invalid dates gracefully', () => {
      const invalidDate = 'invalid-date';
      const formatted = formatDate(invalidDate);
      expect(formatted).toBeTruthy();
    });
  });
});

