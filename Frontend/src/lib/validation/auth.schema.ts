import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters"),

  email: z.email("Invalid email"),

  password: z
    .string()
    .min(8, "Password should be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email(),

  password: z.string().min(1, "Password required"),
});

export const verifyEmailSchema = z.object({
  email: z.string(),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((email) => email.toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is missing"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters")
    .superRefine((val, ctx) => {
      if (!/[A-Z]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain an uppercase letter",
        });
      }
      if (!/[a-z]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain a lowercase letter",
        });
      }
      if (!/[0-9]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain a number",
        });
      }
      if (!/[^A-Za-z0-9]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain a special character",
        });
      }
    }),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
