import { z } from "zod";
import { observationCreateSchema } from "../../../../../lib/validations/trace.js";

export const multipartObservationSchema = z.object({ payload: z.string().min(1).max(20_000).transform((value, ctx) => {
  try { return JSON.parse(value) as unknown; }
  catch { ctx.addIssue({ code: "custom", message: "Observation details must contain valid JSON." }); return z.NEVER; }
}).pipe(observationCreateSchema) });
