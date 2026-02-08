/**
 * Validation utility functions
 */

import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Validate data against a Zod schema
 * Returns the validated data or throws a formatted error
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod errors for user-friendly display
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      
      logger.error('Validation error:', formattedErrors);
      
      // Throw first error message for user display
      const firstError = error.errors[0];
      throw new Error(firstError.message);
    }
    throw error;
  }
}

/**
 * Safe validation - returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Get all validation errors as a formatted object
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (error instanceof ZodError) {
    const errors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return errors;
  }
  return {};
}
