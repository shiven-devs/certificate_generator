import { z } from "zod";

export const checkInSchema = z.object({
  timeZone: z.string().trim().min(1).max(80).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
