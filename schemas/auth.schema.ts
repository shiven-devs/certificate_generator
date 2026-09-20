import { z } from "zod";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordMeetsPolicy,
  PASSWORD_POLICY_MESSAGE,
} from "@/lib/auth/password-policy";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters.")
    .max(PASSWORD_MAX_LENGTH, "Password must be 72 characters or fewer.")
    .refine(passwordMeetsPolicy, { message: PASSWORD_POLICY_MESSAGE }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required.").max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
