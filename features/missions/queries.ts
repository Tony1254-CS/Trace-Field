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
export function useMissions() {
  return useQuery({
    queryKey: missionKey,
    queryFn: async () => {
      try {
        const res = await apiRequest<{ data: Mission[] }>("/missions");
        if (res.data && res.data.length > 0) return res;
        return { data: DEFAULT_MISSIONS };
      } catch {
        return { data: DEFAULT_MISSIONS };
      }
    },
    staleTime: 60_000,
  });
}
export function useSaveMission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: MissionPayload & { id?: string }) => apiRequest<{ data: Mission }>(id ? `/missions/${id}` : "/missions", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) }),
    onSuccess: () => client.invalidateQueries({ queryKey: missionKey }),
  });
}
export function useArchiveMission() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, archived }: { id: string; archived: boolean }) => apiRequest(`/missions/${id}`, { method: "PATCH", body: JSON.stringify({ archived }) }), onSuccess: () => client.invalidateQueries({ queryKey: missionKey }) });
}
