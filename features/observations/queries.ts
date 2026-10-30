import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { missionKey } from "@/features/missions/queries";
import type { ObservationPage } from "./types";

export const observationKey = ["observations"] as const;
export function useObservations(options: { q: string; response: string; offset: number }) {
  const params = new URLSearchParams({ limit: "30", offset: String(options.offset) });
  if (options.q.trim()) params.set("q", options.q.trim());
  if (options.response !== "all") params.set("response", options.response);
  return useQuery({ queryKey: [...observationKey, options], queryFn: () => apiRequest<ObservationPage>(`/observations?${params}`) });
}
export function useSaveObservation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: FormData) => apiRequest(`/observations`, { method: "POST", body }), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: observationKey }), client.invalidateQueries({ queryKey: missionKey })]); } });
}
export function useDeleteObservation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => apiRequest(`/observations/${id}`, { method: "DELETE" }), onSettled: async () => { await Promise.all([client.invalidateQueries({ queryKey: observationKey }), client.invalidateQueries({ queryKey: missionKey })]); } });
}
