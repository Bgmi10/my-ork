import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    type: z.enum(['signup', 'login', 'forgot'], {
      errorMap: () => ({ message: 'Type must be signup, login, or forgot' }),
    }),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().length(6, 'OTP must be 6 digits'),
  }),
}); 