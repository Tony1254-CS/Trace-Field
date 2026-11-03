import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { Mission, MissionPayload } from "./types";

export const DEFAULT_MISSIONS: Mission[] = [
  {
    id: "m-sylhet-01",
    title: "Sylhet Haor Water Inundation",
    prompt: "Is open standing water or saturated marshland visible across the haor basin?",
    place: "Tanguar Haor, Sunamganj",
    visit_date: "2026-10-31",
    target_lat: 25.12,
    target_lng: 91.07,
    target: { lat: 25.12, lng: 91.07 },
    archived_at: null,
    created_at: "2026-10-30T00:00:00.000Z",
    updated_at: "2026-10-30T00:00:00.000Z",
    observationCount: 3,
  },
  {
    id: "m-jamuna-02",
    title: "Jamuna River Bank & Char Dynamics",
    prompt: "Is active bank erosion, new silt deposition, or emergent sandbar vegetation visible?",
    place: "Sariakandi, Jamuna River",
    visit_date: "2026-10-31",
    target_lat: 24.89,
    target_lng: 89.62,
    target: { lat: 24.89, lng: 89.62 },
    archived_at: null,
    created_at: "2026-10-30T00:00:00.000Z",
    updated_at: "2026-10-30T00:00:00.000Z",
    observationCount: 1,
  },
  {
    id: "m-sundarbans-03",
    title: "Sundarbans Tidal Mudflat Stability",
    prompt: "Is tidal mudflat erosion or mangrove canopy dieback observable along the water edge?",
    place: "Kotka, Sundarbans",
    visit_date: "2026-10-31",
    target_lat: 21.85,
    target_lng: 89.78,
    target: { lat: 21.85, lng: 89.78 },
    archived_at: null,
    created_at: "2026-10-30T00:00:00.000Z",
    updated_at: "2026-10-30T00:00:00.000Z",
    observationCount: 2,
  },
  {
    id: "m-padma-04",
    title: "Padma Embankment Water & Revetment",
    prompt: "Is standing floodwater or concrete revetment displacement observable along the bank?",
    place: "Mawa, Padma River",
    visit_date: "2026-10-31",
    target_lat: 23.47,
    target_lng: 90.26,
    target: { lat: 23.47, lng: 90.26 },
    archived_at: null,
    created_at: "2026-10-30T00:00:00.000Z",
    updated_at: "2026-10-30T00:00:00.000Z",
    observationCount: 0,
  },
];

export const missionKey = ["missions"] as const;

const LOCAL_MISSIONS_KEY = "trace_local_missions";

function getLocalMissions(): Mission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_MISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMission(payload: MissionPayload & { id?: string }): Mission {
  const local = getLocalMissions();
  const id = payload.id || `m-local-${Date.now()}`;
  const now = new Date().toISOString();
  
  const existingIdx = local.findIndex((m) => m.id === id);
  const updatedMission: Mission = {
    id,
    title: payload.title,
    prompt: payload.prompt,
    place: payload.place || null,
    visit_date: payload.visitDate || null,
    target_lat: payload.target?.lat ?? null,
    target_lng: payload.target?.lng ?? null,
    target: payload.target || null,
    archived_at: existingIdx >= 0 ? local[existingIdx].archived_at : null,
    created_at: existingIdx >= 0 ? local[existingIdx].created_at : now,
    updated_at: now,
    observationCount: existingIdx >= 0 ? local[existingIdx].observationCount : 0,
  };

  if (existingIdx >= 0) {
    local[existingIdx] = updatedMission;
  } else {
    local.unshift(updatedMission);
  }

  try {
    localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(local));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }

  return updatedMission;
}

function archiveLocalMission(id: string, archived: boolean): void {
  const local = getLocalMissions();
  const idx = local.findIndex((m) => m.id === id);
  if (idx >= 0) {
    local[idx].archived_at = archived ? new Date().toISOString() : null;
    local[idx].updated_at = new Date().toISOString();
    try {
      localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(local));
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  }
}

export function useMissions() {
  return useQuery({
    queryKey: missionKey,
    queryFn: async () => {
      const localMissions = getLocalMissions();
      let baseMissions = DEFAULT_MISSIONS;
      try {
        const res = await apiRequest<{ data: Mission[] }>("/missions");
        if (res.data && res.data.length > 0) {
          baseMissions = res.data;
        }
      } catch {
        // Unauthenticated or offline: fallback to DEFAULT_MISSIONS
      }

      // Merge baseMissions with localMissions
      const mergedMap = new Map<string, Mission>();
      for (const m of baseMissions) mergedMap.set(m.id, m);
      for (const m of localMissions) mergedMap.set(m.id, m);
      return { data: Array.from(mergedMap.values()) };
    },
    staleTime: 10_000,
  });
}

export function useSaveMission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: MissionPayload & { id?: string }) => {
      try {
        return await apiRequest<{ data: Mission }>(
          id ? `/missions/${id}` : "/missions",
          { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) }
        );
      } catch {
        // Fallback to local storage (Guest / Offline / Unauthenticated field investigator mode)
        const saved = saveLocalMission({ id, ...payload });
        return { data: saved };
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: missionKey }),
  });
}

export function useArchiveMission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      try {
        await apiRequest(`/missions/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ archived }),
        });
      } catch {
        archiveLocalMission(id, archived);
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: missionKey }),
  });
}
