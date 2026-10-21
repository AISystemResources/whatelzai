import { z } from "zod";
import { validDate } from "@/lib/leads/model";
export const briefingSchema = z.object({
  id: z.uuid(),
  revision: z.coerce.number().int().nonnegative(),
  kind: z.enum(["HQH", "HHH"]),
  title: z.string().trim().min(1).max(180),
  event_name: z.string().trim().max(240),
  occurred_on: z.string().refine(validDate),
  lead_ids: z
    .array(z.uuid())
    .max(20)
    .transform((ids) => [...new Set(ids)]),
  observations: z.string().max(12000),
  reflections: z.string().max(12000),
  next_steps: z.string().max(6000),
  status: z.enum(["draft", "reviewed"]),
});
export type Briefing = z.infer<typeof briefingSchema>;
export const sourceQuerySchema = z
  .object({
    source: z.enum(["leads", "products", "events", "culture", "briefings"]),
    query: z.string().trim().max(100),
  })
  .strict();

export function futureEvents<T extends { end: string }>(
  events: T[],
  now = new Date(),
): T[] {
  return events.filter(
    (event) => new Date(event.end).getTime() > now.getTime(),
  );
}
