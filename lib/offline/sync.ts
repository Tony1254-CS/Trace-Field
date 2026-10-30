import { getPendingObservations, removePendingObservation, updatePendingObservationStatus } from "./queue";
import { apiRequest } from "@/lib/api/client";

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export async function syncPendingObservations(): Promise<SyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, errors: ["Device is currently offline."] };
  }

  const pending = await getPendingObservations();
  if (!pending.length) {
    return { synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const obs of pending) {
    try {
      await updatePendingObservationStatus(obs.id, "syncing");

      const body = new FormData();
      const payload = {
        missionId: obs.missionId,
        answer: obs.answer,
        quickLabel: obs.quickLabel,
        note: obs.quickLabel ? `[Cover: ${obs.quickLabel.toUpperCase()}] ${obs.note}` : obs.note,
        capturedAt: obs.capturedAt,
        location: obs.location,
      };

      body.append("payload", JSON.stringify(payload));
      if (obs.photoBlob) {
        body.append("photo", obs.photoBlob, obs.photoName || "trace-field-photo.jpg");
      }

      await apiRequest("/observations", {
        method: "POST",
        body,
      });

      await removePendingObservation(obs.id);
      synced++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : "Synchronization failed.";
      errors.push(`${obs.missionTitle}: ${message}`);
      await updatePendingObservationStatus(obs.id, "failed", message);
    }
  }

  return { synced, failed, errors };
}
