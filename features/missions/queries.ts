import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { Mission, MissionPayload } from "./types";

export const missionKey = ["missions"] as const;
export function useMissions() {
  return useQuery({ queryKey: missionKey, queryFn: () => apiRequest<{ data: Mission[] }>("/missions") });
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
