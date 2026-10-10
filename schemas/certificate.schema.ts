import { z } from "zod";

export const certificateParamsSchema = z.object({
  enrollmentId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid certificate."),
});

export const certificateVerifyTokenSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Invalid certificate."),
});
