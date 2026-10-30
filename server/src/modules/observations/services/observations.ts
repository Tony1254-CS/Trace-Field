import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../lib/supabase/database.types.js";
import type { ObservationCreateInput, ResponseKind } from "../../../../../lib/validations/trace.js";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/api-error.js";

type TraceDb = SupabaseClient<Database>;

function raise(error: { message: string } | null): void {
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Observation data could not be loaded or saved.");
}

const PHOTO_TYPES = new Map([
  ["image/jpeg", { extension: "jpg", signature: (bytes: Buffer) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9 }],
  ["image/png", { extension: "png", signature: (bytes: Buffer) => bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ["image/webp", { extension: "webp", signature: (bytes: Buffer) => bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" }],
]);

async function withPhotoUrl(db: TraceDb, row: Record<string, unknown>) {
  const path = typeof row.photo_path === "string" ? row.photo_path : null;
  if (!path) return { ...row, photo_url: null };
  const { data, error } = await db.storage.from(env.SUPABASE_STORAGE_BUCKET).createSignedUrl(path, 300);
  if (error) throw new ApiError(502, "PHOTO_URL_ERROR", "Attached photo could not be loaded.");
  return { ...row, photo_url: data.signedUrl };
}

export async function listObservations(db: TraceDb, userId: string, options: { response?: ResponseKind; missionId?: string; q?: string; limit: number; offset: number }) {
  let ids: string[] | null = null;
  const q = options.q?.trim();
  if (q) {
    const pattern = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    const [noteResult, missionResult] = await Promise.all([
      db.from("observations").select("id").eq("user_id", userId).ilike("note", pattern).limit(1000),
      db.from("missions").select("id").eq("user_id", userId).ilike("title", pattern).limit(1000),
    ]);
    raise(noteResult.error); raise(missionResult.error);
    const missionIds = (missionResult.data ?? []).map((mission) => mission.id as string);
    if (missionIds.length) {
      const linkedResult = await db.from("observations").select("id").eq("user_id", userId).in("mission_id", missionIds).limit(1000);
      raise(linkedResult.error);
      ids = Array.from(new Set([...(noteResult.data ?? []).map((row) => row.id as string), ...(linkedResult.data ?? []).map((row) => row.id as string)]));
    } else ids = (noteResult.data ?? []).map((row) => row.id as string);
  }
  if (ids?.length === 0) return { data: [], count: 0, limit: options.limit, offset: options.offset };
  let query = db.from("observations").select("id,mission_id,answer,note,captured_at,created_at,latitude,longitude,accuracy,photo_path,verification_state,mission:missions!observations_mission_id_fkey(title,prompt,place)", { count: "exact" }).eq("user_id", userId).order("captured_at", { ascending: false }).range(options.offset, options.offset + options.limit - 1);
  if (options.response) query = query.eq("answer", options.response);
  if (options.missionId) query = query.eq("mission_id", options.missionId);
  if (ids) query = query.in("id", ids);
  const { data, error, count } = await query;
  raise(error);
  const records = await Promise.all((data ?? []).map((row) => withPhotoUrl(db, row)));
  return { data: records, count: count ?? 0, limit: options.limit, offset: options.offset };
}

export async function getObservation(db: TraceDb, userId: string, id: string) {
  const { data, error } = await db.from("observations").select("id,mission_id,answer,note,captured_at,created_at,latitude,longitude,accuracy,photo_path,verification_state,mission:missions!observations_mission_id_fkey(title,prompt,place)").eq("user_id", userId).eq("id", id).maybeSingle();
  raise(error);
  if (!data) throw new ApiError(404, "OBSERVATION_NOT_FOUND", "Field note not found.");
  return withPhotoUrl(db, data);
}

export async function createObservation(db: TraceDb, userId: string, input: ObservationCreateInput, file?: Express.Multer.File) {
  const missionResult = await db.from("missions").select("id").eq("id", input.missionId).eq("user_id", userId).is("archived_at", null).maybeSingle();
  raise(missionResult.error);
  if (!missionResult.data) throw new ApiError(400, "ACTIVE_MISSION_REQUIRED", "Choose an open mission before saving a field note.");

  const id = randomUUID();
  let photoPath: string | null = null;
  if (file) {
    const photoType = PHOTO_TYPES.get(file.mimetype);
    if (!photoType || !photoType.signature(file.buffer)) throw new ApiError(415, "UNSUPPORTED_PHOTO", "Choose a valid JPEG, PNG, or WebP photo.");
    photoPath = `${userId}/${input.missionId}/${id}.${photoType.extension}`;
    const { error } = await db.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(photoPath, file.buffer, { contentType: file.mimetype, upsert: false, cacheControl: "3600" });
    if (error) throw new ApiError(502, "PHOTO_UPLOAD_FAILED", "Photo could not be stored. The field note was not saved.");
  }

  const location = input.location;
  const { data, error } = await db.from("observations").insert({
    id, user_id: userId, mission_id: input.missionId, answer: input.answer, note: input.note,
    captured_at: input.capturedAt, latitude: location?.lat ?? null, longitude: location?.lng ?? null,
    accuracy: location?.accuracy ?? null, photo_path: photoPath, verification_state: "awaiting_review",
  }).select("id,mission_id,answer,note,captured_at,created_at,latitude,longitude,accuracy,photo_path,verification_state").single();
  if (error) {
    if (photoPath) await db.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([photoPath]);
    raise(error);
  }
  if (!data) throw new ApiError(500, "DATABASE_ERROR", "Observation was not returned after saving.");
  return withPhotoUrl(db, data);
}

export async function deleteObservation(db: TraceDb, userId: string, id: string) {
  const existing = await db.from("observations").select("photo_path").eq("id", id).eq("user_id", userId).maybeSingle();
  raise(existing.error);
  if (!existing.data) throw new ApiError(404, "OBSERVATION_NOT_FOUND", "Field note not found.");
  const removed = await db.from("observations").delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
  raise(removed.error);
  if (existing.data.photo_path) {
    const { error } = await db.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([existing.data.photo_path]);
    if (error) throw new ApiError(502, "PHOTO_CLEANUP_FAILED", "Field note was deleted, but its private photo needs cleanup.");
  }
}
