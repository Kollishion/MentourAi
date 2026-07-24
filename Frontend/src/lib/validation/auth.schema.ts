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

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
