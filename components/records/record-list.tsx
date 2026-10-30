"use client";

import { useDeferredValue, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDeleteObservation, useObservations } from "@/features/observations/queries";
import type { Observation, ResponseKind } from "@/features/observations/types";
import { apiRequest } from "@/lib/api/client";
import { missionKey } from "@/features/missions/queries";
import { observationKey } from "@/features/observations/queries";
import { formatDate } from "@/lib/utils";

const labels: Record<ResponseKind, string> = { supports: "Supports", contradicts: "Contradicts", inconclusive: "Inconclusive", "not-observable": "Not observable" };

export function RecordList() {
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState("all");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<Observation | null>(null);
  const query = useDeferredValue(search);
  const result = useObservations({ q: query, response, offset });
  const remove = useDeleteObservation();
  const queryClient = useQueryClient();
  const page = result.data;
  const lastPage = page ? Math.max(0, Math.ceil(page.count / page.limit) - 1) : 0;

  async function deleteRecord(record: Observation) {
    if (!window.confirm("Delete this field note and its attached photo? This cannot be undone.")) return;
    try { await remove.mutateAsync(record.id); setDetail(null); toast.success("Field note deleted."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Field note could not be deleted."); }
  }

  return <>
    <section className="page-intro"><span className="eyebrow">TRACE / ACCOUNT RECORDS</span><h1>Field notes, kept.</h1><p>Search saved observations. Each record shows its mission, response, capture time, optional evidence, and review state.</p></section>
    <div className="records-toolbar"><label className="search-wrap"><Search size={16} aria-hidden="true" /><input className="search-field" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} placeholder="Search notes or missions" aria-label="Search field notes" /></label><select value={response} onChange={(event) => { setResponse(event.target.value); setOffset(0); }} aria-label="Filter by response"><option value="all">All responses</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button variant="secondary" onClick={() => void exportBackup()}>Export backup</Button><label className="button secondary import-label">Restore backup<input type="file" accept="application/json,.json" hidden onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; await importBackup(file, async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: missionKey }), queryClient.invalidateQueries({ queryKey: observationKey })]); }); }} /></label></div>
    {result.isPending ? <div className="panel" role="status">Loading field notes…</div> : result.isError ? <div className="empty-state" role="alert"><div><h3>Could not load field notes</h3><p>{result.error.message}</p><Button variant="secondary" onClick={() => result.refetch()}>Try again</Button></div></div> : !page?.data.length ? <div className="empty-state"><div><div className="empty-mark" aria-hidden="true">⌕</div><h3>{page?.count ? "No matching notes" : "Your field notes will live here"}</h3><p>{page?.count ? "Try another search or response filter." : "Saved observations appear here with their mission, time, location accuracy, and attached photo."}</p></div></div> : <section className="record-list" aria-label="Saved field notes">{page.data.map((record) => <article className="record-card" key={record.id}><div><h3>{record.mission?.title ?? "Mission unavailable"}</h3><p>{record.note || "No written note"}</p><p className="record-time">{formatDate(record.captured_at, true)}</p><p className="record-mission">{record.latitude == null ? "No location" : `${record.latitude.toFixed(4)}, ${record.longitude?.toFixed(4)} · ±${Math.round(record.accuracy ?? 0)} m`}{record.photo_path ? " · Photo attached" : ""}</p></div><div className="record-side"><span className={`answer-tag ${record.answer}`}>{labels[record.answer]}</span><span className="record-review">Awaiting review</span><Button variant="ghost" size="sm" onClick={() => setDetail(record)}>View record</Button></div></article>)}</section>}
    {page && page.count > page.limit && <nav className="pagination" aria-label="Field note pages"><Button variant="secondary" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - page.limit))}>Previous</Button><span>Page {Math.floor(offset / page.limit) + 1} of {lastPage + 1}</span><Button variant="secondary" size="sm" disabled={offset + page.limit >= page.count} onClick={() => setOffset(offset + page.limit)}>Next</Button></nav>}
    <Dialog open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }}><DialogContent className="record-dialog"><div className="dialog-head"><div><span className="eyebrow">TRACE / SAVED RECORD</span><DialogTitle>{detail?.mission?.title ?? "Field note"}</DialogTitle></div></div><DialogDescription className="helper">Saved to your TRACE account · Awaiting human review</DialogDescription><span className={`answer-tag ${detail?.answer ?? ""}`}>{detail?.answer ? labels[detail.answer] : ""}</span><p className="mission-prompt-detail"><span className="eyebrow">MISSION QUESTION</span>{detail?.mission?.prompt ?? "Mission prompt unavailable"}</p><p className="privacy-copy">{detail?.note || "No written note was added."}</p>{detail?.photo_url && <img className="record-photo" src={detail.photo_url} alt="Photo attached to field note" />}<div className="detail-grid"><div className="detail-value"><small>Captured</small><strong>{detail ? formatDate(detail.captured_at, true) : ""}</strong></div><div className="detail-value"><small>Location</small><strong>{detail?.latitude == null ? "Not recorded" : `${detail.latitude.toFixed(6)}, ${detail.longitude?.toFixed(6)}`}</strong></div><div className="detail-value"><small>GPS accuracy</small><strong>{detail?.accuracy == null ? "Not recorded" : `±${Math.round(detail.accuracy)} m`}</strong></div><div className="detail-value"><small>Place</small><strong>{detail?.mission?.place || "Place not set"}</strong></div></div><div className="dialog-actions"><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose><Button variant="danger" onClick={() => detail && void deleteRecord(detail)} disabled={remove.isPending}><Trash2 size={15} />Delete record</Button></div></DialogContent></Dialog>
  </>;
}

async function exportBackup() {
  try {
    const payload = await apiRequest<unknown>("/backup/export", { headers: { Accept: "application/json" } });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `trace-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Device backup downloaded.");
  } catch (error) { toast.error(error instanceof Error ? error.message : "Backup export failed."); }
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
