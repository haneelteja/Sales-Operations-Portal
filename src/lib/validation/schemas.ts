/**
 * Zod validation schemas for form inputs
 * Provides runtime validation and type safety
 */

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .trim();

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

/**
 * Role validation schema
 */
export const roleSchema = z.enum(['admin', 'manager', 'client'], {
  errorMap: () => ({ message: 'Role must be one of: admin, manager, client' }),
});

/**
 * User Management Form Schema
 */
export const userFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  associated_dealer_areas: z
    .array(z.string().min(1, 'Dealer-area combination cannot be empty'))
    .min(0),
  role: roleSchema,
}).refine(
  (data) => {
    if (data.role === 'client') {
      return data.associated_dealer_areas.length > 0;
    }
    return true;
  },
  {
    message: 'Client role requires at least one dealer-area combination',
    path: ['associated_dealer_areas'],
  }
);

export type UserFormInput = z.infer<typeof userFormSchema>;

/**
 * Sales Transaction Form Schema
 */
export const saleFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be a positive number' }
    ),
  quantity: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Quantity must be a positive number' }
    ),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  transaction_date: z
    .string()
    .min(1, 'Transaction date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  area: z.string().min(1, 'Area is required').max(100, 'Area must be less than 100 characters'),
});

export type SaleFormInput = z.infer<typeof saleFormSchema>;

/**
 * Payment Form Schema
 */
export const paymentFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  area: z.string().min(1, 'Area is required').max(100, 'Area must be less than 100 characters'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be a positive number' }
    ),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  transaction_date: z
    .string()
    .min(1, 'Transaction date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;

/**
 * Sales Item Schema (for multiple items)
 */
export const salesItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Quantity must be a positive number' }
    ),
  price_per_case: z
    .string()
    .min(1, 'Price per case is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Price per case must be a non-negative number' }
    ),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Amount must be a non-negative number' }
    ),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type SalesItemInput = z.infer<typeof salesItemSchema>;

/**
 * Auth Form Schemas
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// ---------------------------------------------------------------------------
// Dealer (Configurations) validation
// ---------------------------------------------------------------------------

/** GSTIN: 15 characters — 2 digit state, 10 char PAN (5 alpha + 4 digit + 1 alpha), 1 entity, 1 Z, 1 checksum */
export const gstinSchema = z
  .string()
  .min(1, 'GST Number is required')
  .length(15, 'GST Number must be exactly 15 characters (GSTIN format)')
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GSTIN format. Example: 22AAAAA0000A1Z5'
  )
  .toUpperCase()
  .trim();

/** India WhatsApp: +91 followed by 10 digits (6–9 start), or 10 digits only */
export const indiaWhatsAppSchema = z
  .string()
  .min(1, 'WhatsApp Number is required')
  .transform((val) => val.replace(/\s/g, ''))
  .refine(
    (val) => /^(\+91)?[6-9]\d{9}$/.test(val),
    'Enter a valid Indian mobile number (e.g. +919876543210 or 9876543210)'
  )
  .transform((val) => (val.startsWith('+') ? val : `+91${val}`));

/** Single SKU pricing row for dealer form */
export const dealerSkuPricingRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  price_per_bottle: z
    .string()
    .min(1, 'Price per bottle is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Must be a non-negative number'),
  bottles_per_case: z.number().int().positive(),
});

/** Dealer form: main fields + at least one SKU pricing row */
export const dealerFormSchema = z.object({
  date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  dealer_name: z.string().min(1, 'Dealer Name is required').max(200).trim(),
  area: z.string().min(1, 'Area is required').max(200).trim(),
  gst_number: gstinSchema,
  whatsapp_number: indiaWhatsAppSchema,
  sku_rows: z.array(dealerSkuPricingRowSchema).min(1, 'Add at least one SKU pricing row'),
});
export type DealerFormInput = z.infer<typeof dealerFormSchema>;
