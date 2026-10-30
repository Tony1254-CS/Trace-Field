import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../lib/supabase/database.types.js";
import type { MissionCreateInput, MissionUpdateInput } from "../../../../../lib/validations/trace.js";
import { ApiError } from "../../../utils/api-error.js";

type TraceDb = SupabaseClient<Database>;

function raise(error: { message: string } | null): void {
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Mission data could not be loaded or saved.");
}

export async function listMissions(db: TraceDb, userId: string) {
  const { data, error } = await db.from("missions").select("id,title,prompt,place,visit_date,target_lat,target_lng,archived_at,created_at,updated_at,observations(count)").eq("user_id", userId).order("updated_at", { ascending: false });
  raise(error);
  return (data ?? []).map((row) => ({ ...row, target: row.target_lat == null ? null : { lat: row.target_lat, lng: row.target_lng }, observationCount: row.observations?.[0]?.count ?? 0 }));
}

export async function createMission(db: TraceDb, userId: string, input: MissionCreateInput) {
  const { data, error } = await db.from("missions").insert({
    user_id: userId, title: input.title, prompt: input.prompt,
    place: input.place || null, visit_date: input.visitDate || null,
    target_lat: input.target?.lat ?? null, target_lng: input.target?.lng ?? null,
  }).select("id,title,prompt,place,visit_date,target_lat,target_lng,archived_at,created_at,updated_at").single();
  raise(error);
  return data;
}

export async function updateMission(db: TraceDb, userId: string, id: string, input: MissionUpdateInput) {
  const update: Database["public"]["Tables"]["missions"]["Update"] = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) update.title = input.title;
  if (input.prompt !== undefined) update.prompt = input.prompt;
  if (input.place !== undefined) update.place = input.place || null;
  if (input.visitDate !== undefined) update.visit_date = input.visitDate;
  if (input.target !== undefined) {
    update.target_lat = input.target?.lat ?? null;
    update.target_lng = input.target?.lng ?? null;
  }
  if (input.archived !== undefined) update.archived_at = input.archived ? new Date().toISOString() : null;
  const { data, error } = await db.from("missions").update(update).eq("id", id).eq("user_id", userId).select("id,title,prompt,place,visit_date,target_lat,target_lng,archived_at,created_at,updated_at").maybeSingle();
  raise(error);
  if (!data) throw new ApiError(404, "MISSION_NOT_FOUND", "Mission not found.");
  return data;
}
