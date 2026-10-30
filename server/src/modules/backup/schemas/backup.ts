import { z } from "zod";

const target = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).strict().nullable();
const location = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().finite().nonnegative().max(1_000_000), capturedAt: z.iso.datetime({ offset: true }).optional() }).strict().nullable();

export const backupSchema = z.object({
  format: z.literal("TRACE_DEVICE_BACKUP"),
  version: z.literal(1),
  exportedAt: z.iso.datetime({ offset: true }).optional(),
  missions: z.array(z.object({
    id: z.string().min(1).max(128), title: z.string().trim().min(1).max(72), prompt: z.string().trim().min(1).max(500),
    place: z.string().max(100).nullable().optional(), visitDate: z.iso.date().nullable().optional(), target,
    archivedAt: z.iso.datetime({ offset: true }).nullable().optional(), archived: z.boolean().optional(),
    createdAt: z.iso.datetime({ offset: true }).optional(), updatedAt: z.iso.datetime({ offset: true }).optional(),
  }).strict()).max(1000),
  observations: z.array(z.object({
    id: z.string().min(1).max(128), missionId: z.string().min(1).max(128), answer: z.enum(["supports", "contradicts", "inconclusive", "not-observable"]),
    note: z.string().max(1200).optional(), capturedAt: z.iso.datetime({ offset: true }), createdAt: z.iso.datetime({ offset: true }).optional(),
    location, photo: z.string().max(11_200_000).nullable().optional(),
  }).strict()).max(10_000),
}).strict();

export type TraceBackup = z.infer<typeof backupSchema>;
