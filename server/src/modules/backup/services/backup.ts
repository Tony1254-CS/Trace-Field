import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../../../../lib/supabase/database.types.js";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/api-error.js";
import { backupSchema, type TraceBackup } from "../schemas/backup.js";

function raise(error: { message: string } | null): void {
  if (error) throw new ApiError(500, "BACKUP_DATABASE_ERROR", "Backup data could not be read or restored.");
}

type TraceDb = SupabaseClient<Database>;

function normalizeLegacy(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const value = input as Record<string, unknown>;
  if (value.format !== "TRACE_DEVICE_BACKUP" || !Array.isArray(value.missions) || !Array.isArray(value.observations)) return input;
  const now = new Date().toISOString();
  return {
    format: value.format,
    version: value.version,
    exportedAt: value.exportedAt,
    missions: value.missions.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const row = entry as Record<string, unknown>;
      return { id: row.id, title: row.title, prompt: row.prompt, place: row.place ?? null, visitDate: row.visitDate ?? null, target: row.target ?? null, archivedAt: row.archivedAt ?? (row.archived ? row.updatedAt ?? now : null), createdAt: row.createdAt ?? now, updatedAt: row.updatedAt ?? now };
    }),
    observations: value.observations.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const row = entry as Record<string, unknown>;
      return { id: row.id, missionId: row.missionId, answer: row.answer, note: row.note ?? "", capturedAt: row.capturedAt, createdAt: row.createdAt ?? row.capturedAt, location: row.location ?? null, photo: row.photo ?? null };
    }),
  };
}

export async function exportBackup(db: TraceDb, userId: string) {
  const missionsResult = await db.from("missions").select("id,title,prompt,place,visit_date,target_lat,target_lng,archived_at,created_at,updated_at").eq("user_id", userId).order("created_at").range(0, 1000);
  raise(missionsResult.error);
  if ((missionsResult.data ?? []).length > 1000) throw new ApiError(413, "BACKUP_TOO_LARGE", "This backup exceeds the 1,000 mission limit.");

  const observations: Record<string, unknown>[] = [];
  for (let offset = 0; offset <= 10_000; offset += 500) {
    const result = await db.from("observations").select("id,mission_id,answer,note,captured_at,created_at,latitude,longitude,accuracy,photo_path").eq("user_id", userId).order("captured_at", { ascending: true }).range(offset, offset + 499);
    raise(result.error);
    observations.push(...(result.data ?? []));
    if ((result.data ?? []).length < 500) break;
  }
  if (observations.length > 10_000) throw new ApiError(413, "BACKUP_TOO_LARGE", "This backup exceeds the 10,000 observation limit.");

  let photoBytes = 0;
  const serializedObservations: Array<Record<string, unknown>> = [];
  for (const record of observations) {
    let photo: string | null = null;
    if (typeof record.photo_path === "string") {
      const { data, error } = await db.storage.from(env.SUPABASE_STORAGE_BUCKET).download(record.photo_path);
      if (error) throw new ApiError(502, "BACKUP_PHOTO_ERROR", "An attached photo could not be included in the backup.");
      const buffer = Buffer.from(await data.arrayBuffer()); photoBytes += buffer.byteLength;
      if (photoBytes > 20 * 1024 * 1024) throw new ApiError(413, "BACKUP_TOO_LARGE", "Photos in this backup exceed the 20 MB export limit.");
      const mime = data.type || "application/octet-stream";
      if (!PHOTO_TYPES[mime]) throw new ApiError(415, "BACKUP_PHOTO_TYPE", "A photo uses an unsupported file type.");
      photo = `data:${mime};base64,${buffer.toString("base64")}`;
    }
    serializedObservations.push({
      id: record.id, missionId: record.mission_id, answer: record.answer, note: record.note,
      capturedAt: record.captured_at, createdAt: record.created_at,
      location: record.latitude == null ? null : { lat: record.latitude, lng: record.longitude, accuracy: record.accuracy, capturedAt: record.captured_at }, photo,
    });
  }

  return {
    format: "TRACE_DEVICE_BACKUP", version: 1, exportedAt: new Date().toISOString(),
    missions: (missionsResult.data ?? []).map((mission) => ({
      id: mission.id, title: mission.title, prompt: mission.prompt, place: mission.place,
      visitDate: mission.visit_date, target: mission.target_lat == null ? null : { lat: mission.target_lat, lng: mission.target_lng },
      archivedAt: mission.archived_at, createdAt: mission.created_at, updatedAt: mission.updated_at,
    })),
    observations: serializedObservations,
  };
}

type Photo = { path: string; bytes: Buffer; type: string };
const PHOTO_TYPES: Record<string, { ext: string; signature: (buffer: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", signature: (bytes) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9 },
  "image/png": { ext: "png", signature: (bytes) => bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { ext: "webp", signature: (bytes) => bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
  "image/gif": { ext: "gif", signature: (bytes) => bytes.length > 6 && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)) },
  "image/bmp": { ext: "bmp", signature: (bytes) => bytes.length > 14 && bytes.toString("ascii", 0, 2) === "BM" },
  "image/heic": { ext: "heic", signature: (bytes) => bytes.length > 12 && bytes.toString("ascii", 4, 8) === "ftyp" && ["heic", "heix", "hevc", "hevx", "mif1"].includes(bytes.toString("ascii", 8, 12)) },
  "image/heif": { ext: "heif", signature: (bytes) => bytes.length > 12 && bytes.toString("ascii", 4, 8) === "ftyp" && ["mif1", "msf1"].includes(bytes.toString("ascii", 8, 12)) },
};

function decodePhoto(value: string): { bytes: Buffer; type: string } {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp|gif|bmp|heic|heif));base64,([a-z\d+/]+={0,2})$/i);
  if (!match) throw new ApiError(400, "INVALID_BACKUP_PHOTO", "Backup contains an invalid photo encoding or type.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new ApiError(400, "INVALID_BACKUP_PHOTO", "Backup photos must be between 1 byte and 8 MB.");
  const photoType = PHOTO_TYPES[match[1].toLowerCase()];
  if (!photoType.signature(bytes)) throw new ApiError(400, "INVALID_BACKUP_PHOTO", "Backup photo data does not match its declared image type.");
  return { bytes, type: match[1].toLowerCase() };
}

export async function restoreBackup(db: TraceDb, userId: string, payload: unknown) {
  const backup = backupSchema.parse(normalizeLegacy(payload)) as TraceBackup;
  const missionIdSet = new Set(backup.missions.map((mission) => mission.id));
  if (missionIdSet.size !== backup.missions.length) throw new ApiError(400, "INVALID_BACKUP", "Backup contains duplicate mission IDs.");
  const observationIdSet = new Set(backup.observations.map((record) => record.id));
  if (observationIdSet.size !== backup.observations.length) throw new ApiError(400, "INVALID_BACKUP", "Backup contains duplicate observation IDs.");
  if (backup.observations.some((record) => !missionIdSet.has(record.missionId))) throw new ApiError(400, "INVALID_BACKUP", "Every observation must reference a mission in the backup.");

  const missionIds = new Map(backup.missions.map((mission) => [mission.id, randomUUID()]));
  const observationIds = new Map(backup.observations.map((record) => [record.id, randomUUID()]));
  let photoBytesTotal = 0;
  const uploaded: string[] = [];
  const photoPlans: Array<Photo | null> = [];
  for (const observation of backup.observations) {
    if (!observation.photo) { photoPlans.push(null); continue; }
    const decoded = decodePhoto(observation.photo);
    photoBytesTotal += decoded.bytes.byteLength;
    if (photoBytesTotal > 20 * 1024 * 1024) throw new ApiError(413, "BACKUP_TOO_LARGE", "Photos in the selected backup exceed the 20 MB restore limit.");
    const kind = PHOTO_TYPES[decoded.type];
    const path = `${userId}/${missionIds.get(observation.missionId)}/${observationIds.get(observation.id)}.${kind.ext}`;
    photoPlans.push({ ...decoded, path });
  }

  const missions = backup.missions.map((mission) => ({
    id: missionIds.get(mission.id), title: mission.title, prompt: mission.prompt, place: mission.place ?? null,
    visitDate: mission.visitDate ?? null, target: mission.target,
    archivedAt: mission.archivedAt ?? (mission.archived ? mission.updatedAt ?? new Date().toISOString() : null),
    createdAt: mission.createdAt ?? new Date().toISOString(), updatedAt: mission.updatedAt ?? new Date().toISOString(),
  }));
  const observations = backup.observations.map((record, index) => ({
    id: observationIds.get(record.id), missionId: missionIds.get(record.missionId), answer: record.answer, note: record.note ?? "",
    capturedAt: record.capturedAt, createdAt: record.createdAt ?? record.capturedAt,
    location: record.location ? { ...record.location, capturedAt: record.location.capturedAt ?? record.capturedAt } : null,
    photoPath: photoPlans[index]?.path ?? null,
  }));

  try {
    for (const photo of photoPlans) {
      if (!photo) continue;
      const { error } = await db.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(photo.path, photo.bytes, { contentType: photo.type, upsert: false });
      if (error) throw new ApiError(502, "BACKUP_PHOTO_UPLOAD_FAILED", "An attached photo could not be restored.");
      uploaded.push(photo.path);
    }
    const { data, error } = await db.rpc("restore_trace_records", { p_missions: missions as Json, p_observations: observations as Json });
    if (error) throw new ApiError(500, "BACKUP_RESTORE_FAILED", "Backup records could not be restored.");
    return data as { missions: number; observations: number };
  } catch (error) {
    if (uploaded.length) await db.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(uploaded);
    throw error;
  }
}
