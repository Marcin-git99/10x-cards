import { z } from 'zod';

/**
 * Login schema - validates email and password for sign in
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Adres email jest wymagany')
    .email('Nieprawidłowy adres email'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Signup schema - validates email, password and confirmation for registration
 */
export const SignupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Adres email jest wymagany')
      .email('Nieprawidłowy adres email'),
    password: z
      .string()
      .min(8, 'Hasło musi zawierać co najmniej 8 znaków'),
    confirmPassword: z
      .string()
      .min(1, 'Potwierdzenie hasła jest wymagane'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są zgodne',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof SignupSchema>;

/**
 * Reset password schema - validates email for password reset request
 */
export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Adres email jest wymagany')
    .email('Nieprawidłowy adres email'),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  
  return errors;
}

