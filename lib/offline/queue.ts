export interface PendingObservation {
  id: string;
  missionId: string;
  missionTitle: string;
  answer: "supports" | "contradicts" | "inconclusive" | "not-observable";
  quickLabel?: "water" | "land" | "sand" | "crop" | null;
  note: string;
  capturedAt: string;
  location: { lat: number; lng: number; accuracy: number; capturedAt: string } | null;
  photoBlob?: Blob | null;
  photoName?: string | null;
  status: "pending" | "syncing" | "failed";
  createdAt: string;
  lastError?: string | null;
  retryCount: number;
}

const DB_NAME = "trace_offline_db";
const STORE_NAME = "pending_observations";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingObservation(item: PendingObservation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingObservations(): Promise<PendingObservation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as PendingObservation[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingObservation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updatePendingObservationStatus(
  id: string,
  status: "pending" | "syncing" | "failed",
  error?: string | null
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as PendingObservation | undefined;
      if (!record) {
        resolve();
        return;
      }
      record.status = status;
      if (error !== undefined) record.lastError = error;
      if (status === "failed") record.retryCount = (record.retryCount || 0) + 1;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

