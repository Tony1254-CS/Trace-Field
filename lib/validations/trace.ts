import { z } from "zod";

export const responseSchema = z.enum(["supports", "contradicts", "inconclusive", "not-observable"]);
export type ResponseKind = z.infer<typeof responseSchema>;

const targetSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
}).strict();

export const missionCreateSchema = z.object({
  title: z.string().trim().min(1, "Mission name is required.").max(72),
  prompt: z.string().trim().min(1, "Observation question is required.").max(500),
  place: z.string().trim().max(100).nullable().optional(),
  visitDate: z.iso.date().nullable().optional(),
  target: targetSchema.nullable().optional(),
}).strict();

export const missionUpdateSchema = missionCreateSchema.partial().extend({
  archived: z.boolean().optional(),
}).strict();

export const observationCreateSchema = z.object({
  missionId: z.uuid(),
  answer: responseSchema,
  note: z.string().trim().max(1200).default(""),
  capturedAt: z.iso.datetime({ offset: true }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().finite().nonnegative().max(1_000_000),
    capturedAt: z.iso.datetime({ offset: true }),
  }).strict().nullable().default(null),
}).strict();

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  response: responseSchema.optional(),
  missionId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();

export type MissionCreateInput = z.infer<typeof missionCreateSchema>;
export type MissionUpdateInput = z.infer<typeof missionUpdateSchema>;
export type ObservationCreateInput = z.infer<typeof observationCreateSchema>;
