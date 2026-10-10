import { z } from "zod";

export const adminLoginSchema = z.object({
  adminId: z.string().trim().min(1, "Enter the admin ID.").max(64),
  password: z.string().min(1, "Enter the password.").max(128),
});

export const certificateDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});
