import { z } from 'zod';

/**
 * Shared email schema with common validation
 */
const emailSchema = z
  .string({
    required_error: 'Email is required',
  })
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((val) => val.toLowerCase().trim());

/**
 * Password schema with common validation rules
 */
const passwordSchema = z
  .string({
    required_error: 'Password is required',
  })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Password must contain at least one number',
  });

/**
 * Registration schema
 */
export const registerSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
    })
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => val.trim()),
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({
      required_error: 'Reset token is required',
    })
    .min(1, 'Reset token is required')
    .max(128, 'Invalid token format'),
  newPassword: passwordSchema,
});

/**
 * Validate request body against a schema
 * Returns { success, data, error } object
 */
export function validateRequest(schema, body) {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return first error message for simplicity
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }
    return { success: false, error: 'Invalid request format' };
  }
}
