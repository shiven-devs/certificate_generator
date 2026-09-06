import { z } from "zod";

export const certificateParamsSchema = z.object({
  enrollmentId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid certificate."),
});
