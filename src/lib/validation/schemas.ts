/**
 * Zod validation schemas for form inputs
 * Provides runtime validation and type safety
 */

import { z } from 'zod';

// ── Reusable primitives ────────────────────────────────────────────────────────

/** Validates a rupee amount string: positive, max ₹99,99,999, max 2 decimal places. */
const rupeeAmount = (label = 'Amount') =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => { const n = parseFloat(v); return !isNaN(n) && n > 0; },
      { message: `${label} must be a positive number` })
    .refine((v) => parseFloat(v) <= 9_999_999.99,
      { message: `${label} cannot exceed ₹99,99,999.99` })
    .refine((v) => { const [, d] = v.split('.'); return !d || d.length <= 2; },
      { message: `${label} must have at most 2 decimal places` });

/** Validates a non-negative rupee amount (allows 0). */
const rupeeAmountNonNeg = (label = 'Amount') =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => { const n = parseFloat(v); return !isNaN(n) && n >= 0; },
      { message: `${label} must be a non-negative number` })
    .refine((v) => parseFloat(v) <= 9_999_999.99,
      { message: `${label} cannot exceed ₹99,99,999.99` })
    .refine((v) => { const [, d] = v.split('.'); return !d || d.length <= 2; },
      { message: `${label} must have at most 2 decimal places` });

/** Validates a case/unit quantity: positive integer, max 100,000. */
const caseQuantity = (label = 'Quantity') =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => { const n = parseInt(v, 10); return !isNaN(n) && n > 0; },
      { message: `${label} must be a positive whole number` })
    .refine((v) => parseInt(v, 10) <= 100_000,
      { message: `${label} cannot exceed 100,000` })
    .refine((v) => !v.includes('.'),
      { message: `${label} must be a whole number` });

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
export const roleSchema = z.enum(['admin', 'manager'], {
  errorMap: () => ({ message: 'Role must be one of: admin or manager' }),
});

/**
 * User Management Form Schema
 */
export const userFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  associated_dealer_areas: z
    .array(z.string().min(1, 'Client / branch entry cannot be empty'))
    .min(0),
  role: roleSchema,
});

export type UserFormInput = z.infer<typeof userFormSchema>;

/**
 * Sales Transaction Form Schema
 */
export const saleFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  amount: rupeeAmount('Amount'),
  quantity: caseQuantity('Quantity').optional().or(z.literal('')),
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
  amount: rupeeAmount('Amount'),
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
  quantity: caseQuantity('Quantity'),
  price_per_case: rupeeAmountNonNeg('Price per case'),
  amount: rupeeAmountNonNeg('Amount'),
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
// Client / branch (Configurations) validation
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

/** Single SKU pricing row for add-client form */
export const dealerSkuPricingRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  price_per_bottle: rupeeAmountNonNeg('Price per bottle'),
  bottles_per_case: z.number().int().positive().max(10_000, 'Bottles per case cannot exceed 10,000'),
});

/** Add-client form: main fields + at least one SKU pricing row */
export const dealerFormSchema = z.object({
  date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  client_name: z.string().min(1, 'Client name is required').max(200).trim(),
  branch: z.string().min(1, 'Branch is required').max(200).trim(),
  gst_number: gstinSchema,
  whatsapp_number: indiaWhatsAppSchema,
  sku_rows: z.array(dealerSkuPricingRowSchema).min(1, 'Add at least one SKU pricing row'),
});
export type DealerFormInput = z.infer<typeof dealerFormSchema>;
