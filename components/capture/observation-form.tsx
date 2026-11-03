"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ChevronDown, Crosshair, MapPin, Navigation, Tag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSaveObservation } from "@/features/observations/queries";
import type { LocationEvidence, ResponseKind } from "@/features/observations/types";
import type { Mission } from "@/features/missions/types";
import { formatDate } from "@/lib/utils";
import { responseSchema, type QuickLabelKind } from "@/lib/validations/trace";
import { addPendingObservation } from "@/lib/offline/queue";

const captureSchema = z.object({ answer: responseSchema, note: z.string().trim().max(1200) });
type CaptureValues = z.infer<typeof captureSchema>;
const responses: Array<[ResponseKind, string]> = [["supports", "Supports"], ["contradicts", "Contradicts"], ["inconclusive", "Inconclusive"], ["not-observable", "Not observable"]];

const quickLabels: Array<[QuickLabelKind, string, string]> = [
  ["water", "💧 Water", "Standing water, inundation, or wetland"],
  ["land", "🏜️ Land", "Dry soil, permanent bank, or high ground"],
  ["sand", "🏖️ Sand", "River char sandbar or loose silt sediment"],
  ["crop", "🌾 Crop", "Agricultural field, rice paddy, or crops"],
];

function calculateAlignment(userLat: number, userLng: number, targetLat: number, targetLng: number) {
  const R = 6371e3;
  const phi1 = (userLat * Math.PI) / 180;
  const phi2 = (targetLat * Math.PI) / 180;
  const deltaPhi = ((targetLat - userLat) * Math.PI) / 180;
  const deltaLambda = ((targetLng - userLng) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const cardinal = directions[Math.round(bearing / 22.5) % 16];
  return {
    distance: distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(2)} km`,
    bearing: `${Math.round(bearing)}° ${cardinal}`,
  };
}

async function resizePhoto(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Choose a JPEG, PNG, or WebP photo.");
  if (file.size > 24 * 1024 * 1024) throw new Error("Choose a photo smaller than 24 MB.");
  if (!("createImageBitmap" in window)) {
    if (file.size > 8 * 1024 * 1024) throw new Error("This browser cannot resize this photo. Choose one under 8 MB.");
    return file;
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Photo could not be prepared.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Photo could not be prepared.")), "image/jpeg", 0.82));
    if (blob.size > 8 * 1024 * 1024) throw new Error("Prepared photo is still larger than 8 MB. Choose a smaller one.");
    return new File([blob], "trace-photo.jpg", { type: "image/jpeg", lastModified: file.lastModified });
  } finally { bitmap.close(); }
}

export function ObservationForm({ missions, initialMissionId, onSaved }: { missions: Mission[]; initialMissionId?: string; onSaved: () => void }) {
  const active = useMemo(() => missions.filter((mission) => !mission.archived_at), [missions]);
  const [missionId, setMissionId] = useState(initialMissionId && active.some((mission) => mission.id === initialMissionId) ? initialMissionId : active[0]?.id ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationEvidence | null>(null);
  const [locationStatus, setLocationStatus] = useState("No location attached");
  const [quickLabel, setQuickLabel] = useState<QuickLabelKind | null>(null);
  const [isSample, setIsSample] = useState<boolean>(false);
  const [pending, setPending] = useState<CaptureValues | null>(null);
  const queryClient = useQueryClient();
  const save = useSaveObservation();
  const selected = active.find((mission) => mission.id === missionId);
  const alignment = selected?.target && location ? calculateAlignment(location.lat, location.lng, selected.target.lat, selected.target.lng) : null;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CaptureValues>({ resolver: zodResolver(captureSchema), defaultValues: { note: "" } });

  function updatePhoto(file: File | null) {
    setPhotoUrl((current) => { if (current) URL.revokeObjectURL(current); return file ? URL.createObjectURL(file) : null; });
    setPhoto(file);
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocationStatus("Location is not supported by this browser. You can still save without it."); return; }
    setLocationStatus("Requesting location…");
    navigator.geolocation.getCurrentPosition((position) => {
      const capturedAt = new Date(position.timestamp).toISOString();
      setLocation({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt });
      setLocationStatus(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} · ±${Math.round(position.coords.accuracy)} m`);
      toast.success("Location added with reported accuracy.");
    }, (error) => {
      const message = error.code === 1 ? "Permission not granted" : error.code === 2 ? "Position unavailable" : "Location request timed out";
      setLocationStatus(`${message}. You can still save without location.`);
      toast.error(message);
    }, { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
  }

  const confirmSave = async () => {
    if (!selected || !pending) return;
    const capturedAt = location?.capturedAt ?? new Date().toISOString();
    const finalNote = [
      isSample ? "[SAMPLE / DEMO]" : "",
      quickLabel ? `[Cover: ${quickLabel.toUpperCase()}]` : "",
      pending.note,
    ].filter(Boolean).join(" ");

    const recordId = crypto.randomUUID();
    let savedLocally = false;

    // 1. ALWAYS store the observation and photo directly in the user's local IndexedDB
    try {
      await addPendingObservation({
        id: recordId,
        missionId,
        missionTitle: selected.title,
        answer: pending.answer,
        quickLabel,
        note: finalNote,
        capturedAt,
        location,
        photoBlob: photo || null,
        photoName: photo?.name || null,
        status: "pending",
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
      savedLocally = true;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pending-count"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-queue"] }),
      ]);
    } catch (e) {
      console.warn("Could not write to local IndexedDB:", e);
    }

    // 2. If online and authenticated, attempt background cloud synchronization
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const body = new FormData();
        body.append("payload", JSON.stringify({
          missionId,
          answer: pending.answer,
          quickLabel,
          note: finalNote,
          capturedAt,
          location,
        }));
        if (photo) body.append("photo", photo, photo.name);
        await save.mutateAsync(body);
        toast.success("Saved to device & synced to cloud!");
      } catch {
        if (savedLocally) {
          toast.success("Saved to device storage! Photo stored locally.");
        } else {
          toast.error("Could not write observation.");
        }
      }
    } else {
      toast.success("Offline Mode: Saved to device storage with photo!");
    }

    setPending(null);
    updatePhoto(null);
    setLocation(null);
    setLocationStatus("No location attached");
    setQuickLabel(null);
    setIsSample(false);
    reset();
    onSaved();
  };

  if (!active.length) return <div className="empty-state"><div><div className="empty-mark" aria-hidden="true">＋</div><h3>No open missions yet</h3><p>Create a mission before starting a field note.</p></div></div>;
  return <>
    <section className="page-intro"><span className="eyebrow">TRACE / FIELD CAPTURE</span><h1>Record what you see.</h1><p>Describe the observation in your own words. Location and photo are optional; the record is attached to the selected mission.</p></section>
    <div className="capture-layout"><section className="panel"><h2>Observation</h2><form className="capture-form" onSubmit={handleSubmit((values) => setPending(values))} noValidate>
      <label className="mission-field-label">
        <span className="eyebrow" style={{ color: "var(--moss-deep)", marginBottom: 4, display: "block" }}>
          MISSION TARGET
        </span>
        <div className="custom-select-wrap">
          <MapPin size={16} className="select-icon-left" />
          <select
            value={missionId}
            onChange={(event) => setMissionId(event.target.value)}
            required
            aria-label="Select an open mission"
            className="modern-select"
          >
            {active.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title} {mission.place ? `· ${mission.place}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="select-icon-right" />
        </div>
      </label>
      {selected && <div className="mission-callout"><strong>{selected.title}</strong><p>{selected.prompt}</p>{(selected.place || selected.target || selected.visit_date) && <p className="mission-context">{[selected.place, selected.visit_date ? `Visit date: ${formatDate(selected.visit_date)}` : "", selected.target ? `Target: ${selected.target.lat.toFixed(4)}, ${selected.target.lng.toFixed(4)}` : ""].filter(Boolean).join(" · ")}</p>}</div>}
      <fieldset className="capture-fieldset"><legend className="eyebrow">YOUR OBSERVATION</legend><div className="response-options">{responses.map(([value, label]) => <label className="response-option" key={value}><input type="radio" value={value} {...register("answer")} /><span>{label}</span></label>)}</div>{errors.answer && <span className="form-error">Choose one response.</span>}</fieldset>
      <div>
        <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
          <Tag size={12} /> QUICK FIELD ANSWER (ONE-TAP CLASSIFICATION)
        </span>
        <p className="helper" style={{ marginBottom: 8 }}>
          Satellite Asked Me: Fast-response ground surface state for NISAR change verification.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
          {quickLabels.map(([val, label, desc]) => (
            <button
              key={val}
              type="button"
              title={desc}
              onClick={() => setQuickLabel(quickLabel === val ? null : val)}
              style={{
                minHeight: 38,
                padding: "6px 8px",
                borderRadius: 10,
                border: quickLabel === val ? "2px solid var(--moss)" : "1px solid var(--line)",
                background: quickLabel === val ? "#edf2e8" : "#fff",
                fontWeight: quickLabel === val ? 700 : 500,
                fontSize: 11,
                color: quickLabel === val ? "var(--ink)" : "var(--muted)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label>Field note <span className="helper">What did you observe? Keep interpretation separate from what you saw.</span><textarea rows={4} maxLength={1200} placeholder="Describe visible conditions and anything that may affect the observation." {...register("note")} /></label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", margin: "4px 0 10px" }}>
        <input
          type="checkbox"
          checked={isSample}
          onChange={(e) => setIsSample(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: "var(--moss)" }}
        />
        <span>
          <strong>Mark as demonstration / sample training record</strong> (Ensures practice notes are not treated as genuine ground truth)
        </span>
      </label>
      <div><span className="eyebrow">LOCATION / OPTIONAL</span><div className="capture-row"><Button variant="secondary" type="button" onClick={requestLocation}><Crosshair size={15} />{location ? "Update location" : "Add current location"}</Button><span className="gps-output" role="status">{locationStatus}</span>{location && <Button variant="ghost" size="sm" type="button" onClick={() => { setLocation(null); setLocationStatus("No location attached"); }} aria-label="Remove location"><X size={15} /></Button>}</div>
      {alignment && (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#f3f5ee", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--moss-deep)", fontWeight: 700, fontSize: 12 }}>
            <Navigation size={14} />
            <span>Point & Prove Target Alignment</span>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "var(--ink)", flexWrap: "wrap" }}>
            <span><strong>Distance:</strong> {alignment.distance}</span>
            <span><strong>Bearing:</strong> {alignment.bearing}</span>
            <span><strong>GPS Accuracy:</strong> ±{Math.round(location!.accuracy)} m</span>
          </div>
          <small style={{ display: "block", marginTop: 4, color: "var(--muted)", fontSize: 10 }}>
            Approximate alignment relative to target coordinates. Does not imply exact AR or automatic confirmation.
          </small>
        </div>
      )}</div>
      <div><label htmlFor="photoInput">Photo evidence <span className="helper">Optional. A resized copy is sent with the observation.</span></label><div className="photo-box">{photoUrl ? <><img className="photo-preview" src={photoUrl} alt="Selected field photo preview" /><Button className="remove-photo" variant="ghost" size="sm" type="button" onClick={() => updatePhoto(null)}>Remove photo</Button></> : <Camera className="privacy-symbol" aria-hidden="true" size={28} />}<input id="photoInput" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label="Add photo evidence" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { updatePhoto(await resizePhoto(file)); toast.success("Photo ready to review."); } catch (error) { toast.error(error instanceof Error ? error.message : "Photo could not be prepared."); event.target.value = ""; } }} /></div></div>
      <Button type="submit" disabled={save.isPending}>Review field note <span className="button-arrow">↗</span></Button><p className="helper">Saved to your TRACE account, awaiting human review. A photo is supporting evidence, not automatic confirmation.</p>
    </form></section><aside className="panel"><span className="eyebrow">FIELD PRACTICE</span><h2 style={{ marginTop: 8 }}>Evidence before interpretation.</h2><p className="helper">If you cannot tell what happened, choose inconclusive or not observable. Location is requested only after you tap the control.</p><div className="privacy-banner"><MapPin size={18} aria-hidden="true" /><div><b>Location is your choice</b><p>TRACE records the coordinates, time, and reported GPS accuracy only after permission is granted.</p></div></div></aside></div>
    <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) setPending(null); }}><DialogContent className="review-dialog"><div className="dialog-head"><div><span className="eyebrow">TRACE / REVIEW</span><DialogTitle>Review field note</DialogTitle></div></div><DialogDescription className="helper">Check the observation and evidence before saving it to your account.</DialogDescription><div className="detail-grid"><div className="detail-value"><small>Mission</small><strong>{selected?.title}</strong></div><div className="detail-value"><small>Response</small><strong>{responses.find(([value]) => value === pending?.answer)?.[1]}</strong></div><div className="detail-value"><small>Quick Cover</small><strong>{quickLabel ? quickLabels.find(([v]) => v === quickLabel)?.[1] : "Not selected"}</strong></div><div className="detail-value"><small>Integrity</small><strong style={{ color: isSample ? "#b45309" : "var(--moss)" }}>{isSample ? "Demonstration / Sample" : "Genuine Ground Evidence"}</strong></div><div className="detail-value"><small>Location</small><strong>{location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} · ±${Math.round(location.accuracy)} m` : "Not recorded"}</strong></div><div className="detail-value"><small>Photo</small><strong>{photo ? "Attached" : "None"}</strong></div></div><p className="review-note">{pending?.note || "No written note was added."}</p>{photoUrl && <img className="record-photo" src={photoUrl} alt="Photo evidence for this field note" />}<div className="dialog-actions"><DialogClose asChild><Button variant="secondary" type="button">Back to note</Button></DialogClose><Button type="button" onClick={() => void confirmSave()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save to TRACE"}</Button></div></DialogContent></Dialog>
  </>;
}
