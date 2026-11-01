"use client";

import { useEffect, useDeferredValue, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, Download, Eye, Image as ImageIcon, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDeleteObservation, useObservations } from "@/features/observations/queries";
import type { Observation, ResponseKind } from "@/features/observations/types";
import { apiRequest } from "@/lib/api/client";
import { missionKey } from "@/features/missions/queries";
import { observationKey } from "@/features/observations/queries";
import { formatDate } from "@/lib/utils";
import { getPendingObservations, removePendingObservation, type PendingObservation } from "@/lib/offline/queue";
import { syncPendingObservations } from "@/lib/offline/sync";

const labels: Record<ResponseKind, string> = { supports: "Supports", contradicts: "Contradicts", inconclusive: "Inconclusive", "not-observable": "Not observable" };

function isSampleRecord(note?: string | null, missionTitle?: string | null): boolean {
  const text = `${note || ""} ${missionTitle || ""}`.toLowerCase();
  return text.includes("[sample") || text.includes("simulation") || text.includes("demo");
}

function LocalBlobImage({ blob, alt, style, className }: { blob: Blob; alt: string; style?: React.CSSProperties; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return null;
  return <img src={url} alt={alt} style={style} className={className} />;
}

function downloadBlob(blob: Blob, filename = "trace-field-photo.jpg") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success(`Photo downloaded as "${filename}"!`);
}

export function RecordList() {
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState("all");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<Observation | null>(null);
  const [selectedLocal, setSelectedLocal] = useState<PendingObservation | null>(null);
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const query = useDeferredValue(search);
  const result = useObservations({ q: query, response, offset });
  const remove = useDeleteObservation();
  const page = result.data;
  const lastPage = page ? Math.max(0, Math.ceil(page.count / page.limit) - 1) : 0;

  const { data: pendingData, refetch: loadPending } = useQuery({
    queryKey: ["pending-queue"],
    queryFn: () => getPendingObservations(),
    staleTime: 5000,
  });
  const pendingQueue: PendingObservation[] = pendingData ?? [];

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncPendingObservations();
      if (res.synced > 0) {
        toast.success(`Synchronized ${res.synced} offline observation(s) to cloud.`);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: missionKey }),
          queryClient.invalidateQueries({ queryKey: observationKey }),
        ]);
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} item(s) could not sync yet. Stored in queue.`);
      }
      await loadPending();
    } finally {
      setSyncing(false);
    }
  };

  async function deleteRecord(record: Observation) {
    if (!window.confirm("Delete this field note and its attached photo? This cannot be undone.")) return;
    try { await remove.mutateAsync(record.id); setDetail(null); toast.success("Field note deleted."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Field note could not be deleted."); }
  }

  async function handleDeleteLocal(id: string) {
    if (!window.confirm("Remove this local observation and photo from your device storage?")) return;
    try {
      await removePendingObservation(id);
      setSelectedLocal(null);
      await loadPending();
      await queryClient.invalidateQueries({ queryKey: ["pending-count"] });
      toast.success("Removed from local device.");
    } catch {
      toast.error("Could not remove record.");
    }
  }

  // Detect conflicting observations across missions
  const missionAnswers = new Map<string, Set<ResponseKind>>();
  for (const obs of page?.data ?? []) {
    const set = missionAnswers.get(obs.mission_id) || new Set<ResponseKind>();
    set.add(obs.answer);
    missionAnswers.set(obs.mission_id, set);
  }

  return <>
    <section className="page-intro"><span className="eyebrow">TRACE / DEVICE & FIELD JOURNAL</span><h1>Field notes, kept.</h1><p>Search saved observations. Each record shows its mission, response, capture time, local photos, and evidence state.</p></section>

    {/* Pending Offline Queue Banner if items exist */}
    {pendingQueue.length > 0 && (
      <div style={{ marginBottom: 16, padding: 14, borderRadius: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={18} style={{ color: "#16a34a" }} />
          <div>
            <strong style={{ fontSize: 13, color: "#166534" }}>{pendingQueue.length} Observation(s) Stored Locally on this Device</strong>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#15803d" }}>Preserved in IndexedDB. Fully accessible offline anytime.</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void handleSync()} disabled={syncing} style={{ display: "inline-flex", gap: 6 }}>
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync to Cloud"}
        </Button>
      </div>
    )}

    <div className="records-toolbar">
      <label className="search-wrap"><Search size={16} aria-hidden="true" /><input className="search-field" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} placeholder="Search notes or missions" aria-label="Search field notes" /></label>
      <select value={response} onChange={(event) => { setResponse(event.target.value); setOffset(0); }} aria-label="Filter by response"><option value="all">All responses</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <Button variant="secondary" onClick={() => void exportBackup()}>Export Journal (JSON)</Button>
      <label className="button secondary import-label">Restore backup<input type="file" accept="application/json,.json" hidden onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; await importBackup(file, async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: missionKey }), queryClient.invalidateQueries({ queryKey: observationKey }), loadPending()]); }); }} /></label>
    </div>

    {/* Local Device Items Section */}
    {pendingQueue.length > 0 && (
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <span className="eyebrow" style={{ color: "#16a34a", marginBottom: 6 }}>DEVICE LOCAL STORAGE ({pendingQueue.length})</span>
        <section className="record-list" aria-label="Device local observations">
          {pendingQueue.map((item) => (
            <article className="record-card" key={item.id} style={{ borderColor: "#bbf7d0", background: "#fcfdfc" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", width: "100%" }}>
                {item.photoBlob ? (
                  <div style={{ flexShrink: 0 }}>
                    <LocalBlobImage
                      blob={item.photoBlob}
                      alt="Ground evidence preview"
                      style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid #d1fae5" }}
                    />
                  </div>
                ) : (
                  <div style={{ width: 84, height: 84, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", flexShrink: 0, border: "1px dashed #bbf7d0" }}>
                    <ImageIcon size={28} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span className="status-tag" style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", fontWeight: 700 }}>
                      💾 Saved on Device
                    </span>
                    {isSampleRecord(item.note, item.missionTitle) ? (
                      <span className="status-tag" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                        Sample / Simulation
                      </span>
                    ) : (
                      <span className="status-tag" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                        Genuine Ground Evidence
                      </span>
                    )}
                    {item.quickLabel && (
                      <span className="status-tag" style={{ background: "#edf2e8", color: "#47604f" }}>
                        Cover: {item.quickLabel.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 style={{ marginTop: 6, fontSize: 16 }}>{item.missionTitle}</h3>
                  <p style={{ margin: "4px 0" }}>{item.note || "No written note"}</p>
                  <p className="record-time">{formatDate(item.capturedAt, true)}</p>
                  <p className="record-mission">
                    {item.location == null ? "No GPS location" : `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)} · ±${Math.round(item.location.accuracy)} m`}
                    {item.photoBlob ? " · 📸 Photo Stored Locally" : ""}
                  </p>
                </div>
              </div>
              <div className="record-side" style={{ marginTop: 8 }}>
                <span className={`answer-tag ${item.answer}`}>{labels[item.answer]}</span>
                <span className="record-review" style={{ color: "#15803d" }}>Active in Device</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLocal(item)} title="View detailed evidence">
                    <Eye size={14} /> View
                  </Button>
                  {item.photoBlob && (
                    <Button variant="secondary" size="sm" onClick={() => downloadBlob(item.photoBlob!, item.photoName || `trace-${item.id.slice(0, 8)}.jpg`)} title="Download photo to gallery">
                      <Download size={13} /> Save Photo
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteLocal(item.id)} title="Delete from device" style={{ color: "#b91c1c" }}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    )}

    {/* Cloud Server Records */}
    {result.isPending ? <div className="panel" role="status">Loading field notes…</div> : result.isError ? <div className="empty-state" role="alert"><div><h3>Could not load field notes</h3><p>{result.error.message}</p><Button variant="secondary" onClick={() => result.refetch()}>Try again</Button></div></div> : !page?.data.length && pendingQueue.length === 0 ? <div className="empty-state"><div><div className="empty-mark" aria-hidden="true">⌕</div><h3>{page?.count ? "No matching notes" : "Your field notes will live here"}</h3><p>{page?.count ? "Try another search or response filter." : "Saved observations appear here with their mission, time, location accuracy, and attached photo."}</p></div></div> : <section className="record-list" aria-label="Saved field notes">{page?.data.map((record) => {
      const answersForMission = missionAnswers.get(record.mission_id);
      const hasConflict = answersForMission && answersForMission.has("supports") && answersForMission.has("contradicts");

      return <article className="record-card" key={record.id}><div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
          {hasConflict && (
            <span className="status-tag" style={{ background: "#fdedec", color: "#b03a2e", border: "1px solid #fadbd8", display: "inline-flex", gap: 4 }}>
              <AlertTriangle size={11} /> Disagreement Reported
            </span>
          )}
          {isSampleRecord(record.note, record.mission?.title) ? (
            <span className="status-tag" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              Sample / Simulation
            </span>
          ) : (
            <span className="status-tag" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              Genuine Field Evidence
            </span>
          )}
          <span className="status-tag" style={{ background: "#e8f8f5", color: "#117864" }}>
            Synchronized (Cloud)
          </span>
        </div>
        <h3>{record.mission?.title ?? "Mission unavailable"}</h3><p>{record.note || "No written note"}</p><p className="record-time">{formatDate(record.captured_at, true)}</p><p className="record-mission">{record.latitude == null ? "No location" : `${record.latitude.toFixed(4)}, ${record.longitude?.toFixed(4)} · ±${Math.round(record.accuracy ?? 0)} m`}{record.photo_path ? " · Photo attached" : ""}</p></div><div className="record-side"><span className={`answer-tag ${record.answer}`}>{labels[record.answer]}</span><span className="record-review">Awaiting review</span><Button variant="ghost" size="sm" onClick={() => setDetail(record)}>View record</Button></div></article>;
    })}</section>}
    {page && page.count > page.limit && <nav className="pagination" aria-label="Field note pages"><Button variant="secondary" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - page.limit))}>Previous</Button><span>Page {Math.floor(offset / page.limit) + 1} of {lastPage + 1}</span><Button variant="secondary" size="sm" disabled={offset + page.limit >= page.count} onClick={() => setOffset(offset + page.limit)}>Next</Button></nav>}

    {/* Cloud Record Detail Dialog */}
    <Dialog open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }}><DialogContent className="record-dialog"><div className="dialog-head"><div><span className="eyebrow">TRACE / CLOUD RECORD</span><DialogTitle>{detail?.mission?.title ?? "Field note"}</DialogTitle></div></div><DialogDescription className="helper">Saved to TRACE cloud · Awaiting human review</DialogDescription>
<div style={{ display: "flex", gap: 6, margin: "8px 0", flexWrap: "wrap" }}>
  <span className={`answer-tag ${detail?.answer ?? ""}`}>{detail?.answer ? labels[detail.answer] : ""}</span>
  {isSampleRecord(detail?.note, detail?.mission?.title) ? (
    <span className="status-tag" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
      Sample / Simulation
    </span>
  ) : (
    <span className="status-tag" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
      Genuine Ground Evidence
    </span>
  )}
</div><p className="mission-prompt-detail"><span className="eyebrow">MISSION QUESTION</span>{detail?.mission?.prompt ?? "Mission prompt unavailable"}</p><p className="privacy-copy">{detail?.note || "No written note was added."}</p>{detail?.photo_url && <img className="record-photo" src={detail.photo_url} alt="Photo attached to field note" />}<div className="detail-grid"><div className="detail-value"><small>Captured</small><strong>{detail ? formatDate(detail.captured_at, true) : ""}</strong></div><div className="detail-value"><small>Location</small><strong>{detail?.latitude == null ? "Not recorded" : `${detail.latitude.toFixed(6)}, ${detail.longitude?.toFixed(6)}`}</strong></div><div className="detail-value"><small>GPS accuracy</small><strong>{detail?.accuracy == null ? "Not recorded" : `±${Math.round(detail.accuracy)} m`}</strong></div><div className="detail-value"><small>Place</small><strong>{detail?.mission?.place || "Place not set"}</strong></div></div><div className="dialog-actions"><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose><Button variant="danger" onClick={() => detail && void deleteRecord(detail)} disabled={remove.isPending}><Trash2 size={15} />Delete record</Button></div></DialogContent></Dialog>

    {/* Local Device Record Detail Dialog with Photo Viewer */}
    <Dialog open={Boolean(selectedLocal)} onOpenChange={(open) => { if (!open) setSelectedLocal(null); }}>
      <DialogContent className="record-dialog">
        <div className="dialog-head">
          <div>
            <span className="eyebrow" style={{ color: "#16a34a" }}>TRACE / LOCAL DEVICE EVIDENCE</span>
            <DialogTitle>{selectedLocal?.missionTitle ?? "Field note"}</DialogTitle>
          </div>
        </div>
        <DialogDescription className="helper">Stored locally in device IndexedDB storage · Zero data loss</DialogDescription>
        <div style={{ display: "flex", gap: 6, margin: "8px 0", flexWrap: "wrap" }}>
          <span className={`answer-tag ${selectedLocal?.answer ?? ""}`}>{selectedLocal?.answer ? labels[selectedLocal.answer] : ""}</span>
          {isSampleRecord(selectedLocal?.note, selectedLocal?.missionTitle) ? (
            <span className="status-tag" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              Sample / Simulation
            </span>
          ) : (
            <span className="status-tag" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              Genuine Ground Evidence
            </span>
          )}
          {selectedLocal?.quickLabel && (
            <span className="status-tag" style={{ background: "#edf2e8", color: "#47604f" }}>
              Cover: {selectedLocal.quickLabel.toUpperCase()}
            </span>
          )}
        </div>
        <p className="privacy-copy" style={{ fontWeight: 500 }}>{selectedLocal?.note || "No written note was added."}</p>
        {selectedLocal?.photoBlob && (
          <div style={{ margin: "12px 0" }}>
            <LocalBlobImage blob={selectedLocal.photoBlob} alt="Field observation evidence" className="record-photo" />
          </div>
        )}
        <div className="detail-grid">
          <div className="detail-value"><small>Captured</small><strong>{selectedLocal ? formatDate(selectedLocal.capturedAt, true) : ""}</strong></div>
          <div className="detail-value"><small>Location</small><strong>{selectedLocal?.location ? `${selectedLocal.location.lat.toFixed(6)}, ${selectedLocal.location.lng.toFixed(6)}` : "Not recorded"}</strong></div>
          <div className="detail-value"><small>GPS accuracy</small><strong>{selectedLocal?.location ? `±${Math.round(selectedLocal.location.accuracy)} m` : "Not recorded"}</strong></div>
          <div className="detail-value"><small>Storage</small><strong style={{ color: "#15803d" }}>Local Device (IndexedDB)</strong></div>
        </div>
        <div className="dialog-actions">
          <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
          {selectedLocal?.photoBlob && (
            <Button variant="secondary" onClick={() => downloadBlob(selectedLocal.photoBlob!, selectedLocal.photoName || `trace-${selectedLocal.id.slice(0, 8)}.jpg`)}>
              <Download size={14} /> Download Photo
            </Button>
          )}
          <Button variant="danger" onClick={() => selectedLocal && void handleDeleteLocal(selectedLocal.id)}>
            <Trash2 size={15} /> Delete from Device
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}

async function exportBackup() {
  try {
    const localQueue = await getPendingObservations();
    let cloudData: unknown = null;
    try {
      cloudData = await apiRequest<unknown>("/backup/export", { headers: { Accept: "application/json" } });
    } catch {
      // Guest or offline mode
    }

    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: "TRACE Field Notebook",
      deviceStorageObservations: localQueue.map((item) => ({
        id: item.id,
        missionId: item.missionId,
        missionTitle: item.missionTitle,
        answer: item.answer,
        quickLabel: item.quickLabel,
        note: item.note,
        capturedAt: item.capturedAt,
        location: item.location,
        hasPhoto: Boolean(item.photoBlob),
        photoName: item.photoName || (item.photoBlob ? "photo.jpg" : null),
        status: item.status,
      })),
      cloudData,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trace-field-journal-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Field Journal & device records downloaded!");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Backup export failed.");
  }
}

async function importBackup(file: File, onSuccess: () => Promise<void>) {
  if (file.size > 30 * 1024 * 1024) { toast.error("Backup must be smaller than 30 MB."); return; }
  try {
    const payload: unknown = JSON.parse(await file.text());
    const result = await apiRequest<{ imported: { missions: number; observations: number } }>("/backup/restore", { method: "POST", body: JSON.stringify(payload) });
    toast.success(`Restored ${result.imported.missions} missions and ${result.imported.observations} field notes.`);
    await onSuccess();
  } catch (error) { toast.error(error instanceof Error ? error.message : "Backup could not be restored."); }
}
