import { z } from "zod";
import type { register } from "./auth.controller";

export const registerSchema = z.object({
	username: z.string().trim().min(2, "First name must be at least 2 characters").max(50),
	email: z.string().trim().toLowerCase(),
	password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password cannot exceed 100 characters").superRefine((val, ctx) => {
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
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
