"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, MapPin, Plus, RotateCcw, Archive, Camera, CalendarDays, Satellite, Sparkles, QrCode } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SatelliteRadarModal } from "@/components/missions/satellite-radar-modal";
import { MissionShareModal } from "@/components/missions/mission-share-modal";
import { useArchiveMission, useMissions, useSaveMission } from "@/features/missions/queries";
import type { Mission, MissionPayload } from "@/features/missions/types";
import { formatDate } from "@/lib/utils";

const missionFormSchema = z.object({
  title: z.string().trim().min(1, "Add a mission name.").max(72),
  prompt: z.string().trim().min(1, "Add a neutral observation question.").max(500),
  place: z.string().trim().max(100),
  visitDate: z.string(),
  lat: z.string(),
  lng: z.string(),
}).superRefine((values, ctx) => {
  const lat = values.lat.trim(); const lng = values.lng.trim();
  if (Boolean(lat) !== Boolean(lng)) ctx.addIssue({ code: "custom", path: [lat ? "lng" : "lat"], message: "Enter both coordinates, or leave both blank." });
  if (lat && (Number.isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) ctx.addIssue({ code: "custom", path: ["lat"], message: "Latitude must be between -90 and 90." });
  if (lng && (Number.isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180)) ctx.addIssue({ code: "custom", path: ["lng"], message: "Longitude must be between -180 and 180." });
});
type MissionFormValues = z.infer<typeof missionFormSchema>;

const STUDY_PRESETS = [
  {
    name: "🌊 Sylhet Haor (Flood/Water)",
    title: "Sylhet Haor Water Inundation",
    prompt: "Is open standing water or saturated marshland visible across the haor basin?",
    place: "Tanguar Haor, Sunamganj",
    lat: "25.1200",
    lng: "91.0700",
  },
  {
    name: "🌾 Jamuna Char (Silt Dynamics)",
    title: "Jamuna River Bank & Char Dynamics",
    prompt: "Is active bank erosion, new silt deposition, or emergent sandbar vegetation visible?",
    place: "Sariakandi, Jamuna River",
    lat: "24.8900",
    lng: "89.6200",
  },
  {
    name: "🌲 Sundarbans (Canopy/Tide)",
    title: "Sundarbans Tidal Mudflat Stability",
    prompt: "Is tidal mudflat erosion or mangrove canopy dieback observable along the water edge?",
    place: "Kotka, Sundarbans",
    lat: "21.8500",
    lng: "89.7800",
  },
  {
    name: "🏗️ Padma Bank (Embankment)",
    title: "Padma Embankment Water & Revetment",
    prompt: "Is standing floodwater or concrete revetment displacement observable along the bank?",
    place: "Mawa, Padma River",
    lat: "23.4750",
    lng: "90.2600",
  },
];

function MissionEditor({ mission, onDone }: { mission?: Mission; onDone: () => void }) {
  const save = useSaveMission();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MissionFormValues>({ resolver: zodResolver(missionFormSchema), defaultValues: { title: mission?.title ?? "", prompt: mission?.prompt ?? "", place: mission?.place ?? "", visitDate: mission?.visit_date ?? "", lat: mission?.target?.lat?.toString() ?? "", lng: mission?.target?.lng?.toString() ?? "" } });

  const applyPreset = (preset: typeof STUDY_PRESETS[0]) => {
    setValue("title", preset.title);
    setValue("prompt", preset.prompt);
    setValue("place", preset.place);
    setValue("lat", preset.lat);
    setValue("lng", preset.lng);
    setValue("visitDate", new Date().toISOString().slice(0, 10));
    toast.success(`Applied ${preset.name} study area.`);
  };

  const submit = handleSubmit(async (values) => {
    const payload: MissionPayload = { title: values.title, prompt: values.prompt, place: values.place || null, visitDate: values.visitDate || null, target: values.lat.trim() ? { lat: Number(values.lat), lng: Number(values.lng) } : null };
    try { await save.mutateAsync({ ...payload, id: mission?.id }); toast.success("Mission saved."); onDone(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Mission could not be saved."); }
  });
  return <form className="dialog-form" onSubmit={submit} noValidate>
    <div className="dialog-head"><div><span className="eyebrow">TRACE / MISSION</span><DialogTitle>{mission ? "Edit mission" : "New mission"}</DialogTitle></div></div>
    <DialogDescription className="helper">Write what an observer should look for in neutral, observable terms.</DialogDescription>

    {!mission && (
      <div style={{ padding: 10, borderRadius: 12, background: "#f5f6ee", border: "1px dashed var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--moss-deep)", marginBottom: 6 }}>
          <Sparkles size={13} />
          <span>NISAR / SAR Challenge Study Area Presets (1-Click)</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STUDY_PRESETS.map((p) => (
            <Button
              key={p.name}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyPreset(p)}
              style={{ fontSize: 10, padding: "4px 8px", height: "auto" }}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>
    )}

    <label>Mission name <span className="required">Required</span><input maxLength={72} {...register("title")} aria-invalid={Boolean(errors.title)} />{errors.title && <span className="form-error">{errors.title.message}</span>}</label>
    <label>What should the observer look for? <span className="required">Required</span><textarea rows={3} maxLength={500} {...register("prompt")} aria-invalid={Boolean(errors.prompt)} />{errors.prompt && <span className="form-error">{errors.prompt.message}</span>}</label>
    <div className="field-pair"><label>Place or area<input maxLength={100} {...register("place")} /></label><label>Visit date<input type="date" {...register("visitDate")} /></label></div>
    <details className="coordinate-details"><summary>Add approximate target coordinates</summary><div className="field-pair coordinate-fields"><label>Latitude<input type="number" min={-90} max={90} step="any" inputMode="decimal" {...register("lat")} aria-invalid={Boolean(errors.lat)} />{errors.lat && <span className="form-error">{errors.lat.message}</span>}</label><label>Longitude<input type="number" min={-180} max={180} step="any" inputMode="decimal" {...register("lng")} aria-invalid={Boolean(errors.lng)} />{errors.lng && <span className="form-error">{errors.lng.message}</span>}</label></div><p className="helper">Target area only. TRACE does not request live location here.</p></details>
    <div className="dialog-actions"><DialogClose asChild><Button variant="secondary" type="button">Cancel</Button></DialogClose><Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save mission"}</Button></div>
  </form>;
}

function getDomainBadge(mission: Mission): { label: string; icon: string; bg: string; color: string; border: string } {
  const text = `${mission.title} ${mission.place ?? ""} ${mission.prompt}`.toLowerCase();
  if (text.includes("haor") || text.includes("water") || text.includes("flood") || text.includes("inundation")) {
    return { label: "Wetlands & Inundation", icon: "🌊", bg: "rgba(14, 165, 233, 0.09)", color: "#0284c7", border: "rgba(14, 165, 233, 0.25)" };
  }
  if (text.includes("char") || text.includes("river") || text.includes("silt") || text.includes("erosion") || text.includes("jamuna")) {
    return { label: "River Char & Silt", icon: "🌾", bg: "rgba(217, 119, 6, 0.09)", color: "#b45309", border: "rgba(217, 119, 6, 0.25)" };
  }
  if (text.includes("sundarban") || text.includes("mangrove") || text.includes("tidal") || text.includes("mudflat")) {
    return { label: "Tidal Mangrove", icon: "🌲", bg: "rgba(16, 185, 129, 0.09)", color: "#059669", border: "rgba(16, 185, 129, 0.25)" };
  }
  if (text.includes("embankment") || text.includes("padma") || text.includes("revetment") || text.includes("concrete")) {
    return { label: "Riverbank & Revetment", icon: "🏗️", bg: "rgba(99, 102, 241, 0.09)", color: "#4f46e5", border: "rgba(99, 102, 241, 0.25)" };
  }
  return { label: "Surface Field Study", icon: "🛰️", bg: "rgba(45, 106, 79, 0.09)", color: "#2d6a4f", border: "rgba(45, 106, 79, 0.25)" };
}

export function MissionInbox({ onCapture }: { onCapture: (missionId: string) => void }) {
  const missionsQuery = useMissions();
  const archive = useArchiveMission();
  const [editor, setEditor] = useState<{ open: boolean; mission?: Mission }>({ open: false });
  const [radarModal, setRadarModal] = useState<{ open: boolean; mission?: Mission }>({ open: false });
  const [shareModal, setShareModal] = useState<{ open: boolean; mission?: Mission }>({ open: false });
  const missions = missionsQuery.data?.data ?? [];
  const activeCount = missions.filter((mission) => !mission.archived_at).length;
  const noteCount = missions.reduce((total, mission) => total + mission.observationCount, 0);

  async function toggleArchive(mission: Mission) {
    const action = mission.archived_at ? "Reopen" : "Archive";
    if (!window.confirm(`${action} “${mission.title}”?`)) return;
    try { await archive.mutateAsync({ id: mission.id, archived: !mission.archived_at }); toast.success(`Mission ${mission.archived_at ? "reopened" : "archived"}.`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Mission state could not be updated."); }
  }

  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">FIELD NOTES / READY WHEN YOU ARE</span><h1>Go where the evidence is.</h1><p>Open a mission, record what you can observe, and keep every note tied to its source.</p></div><Dialog open={editor.open} onOpenChange={(open) => setEditor({ open, mission: open ? editor.mission : undefined })}><DialogTrigger asChild><Button onClick={() => setEditor({ open: true })}><Plus size={17} />New mission</Button></DialogTrigger><DialogContent className="mission-editor"><MissionEditor key={editor.mission?.id ?? "new"} mission={editor.mission} onDone={() => setEditor({ open: false })} /></DialogContent></Dialog></section>
    <div className="stat-strip" aria-label="Your TRACE account records"><div className="stat"><strong>{missionsQuery.isLoading ? "—" : activeCount}</strong><span>open missions</span></div><div className="stat"><strong>{missionsQuery.isLoading ? "—" : noteCount}</strong><span>field notes</span></div><div className="stat"><strong>PRIVATE</strong><span>account records</span></div></div>
    <div className="section-head"><div><h2>Your missions</h2><p>Each observation remains linked to the mission that prompted it.</p></div></div>
    {missionsQuery.isPending ? <div className="panel" role="status">Loading your missions…</div> : missionsQuery.isError ? <div className="empty-state" role="alert"><div><h3>Could not load missions</h3><p>{missionsQuery.error.message}</p><Button variant="secondary" onClick={() => missionsQuery.refetch()}>Try again</Button></div></div> : <section className="mission-grid" aria-label="Missions">
      {!missions.length ? <div className="empty-state"><div><div className="empty-mark" aria-hidden="true">+</div><h3>Your field list starts here</h3><p>Create a mission with a clear observation question. TRACE keeps every record connected to its mission.</p><Button onClick={() => setEditor({ open: true })}>Create a mission</Button></div></div> : missions.map((mission, index) => {
        const domain = getDomainBadge(mission);
        return (
          <article className="mission-card-modern" key={mission.id}>
            {/* Top Row: Mission Index, Domain Tag, Status, and Action Icons */}
            <div className="mission-card-top-modern">
              <div className="mission-badge-group">
                <span className="mission-index-chip">MISSION / {String(index + 1).padStart(2, "0")}</span>
                <span
                  className="domain-pill"
                  style={{
                    background: domain.bg,
                    color: domain.color,
                    border: `1px solid ${domain.border}`,
                  }}
                >
                  <span>{domain.icon}</span>
                  <span>{domain.label}</span>
                </span>
                <span className={`status-tag ${mission.archived_at ? "archived" : "active"}`}>
                  {mission.archived_at ? "Archived" : "Open"}
                </span>
              </div>

              {/* Secondary quick tools top-right: Share, Edit, Archive */}
              <div className="card-quick-actions">
                <button
                  type="button"
                  className="card-action-icon-btn"
                  title={`Share ${mission.title}`}
                  onClick={() => setShareModal({ open: true, mission })}
                >
                  <QrCode size={15} />
                </button>
                <button
                  type="button"
                  className="card-action-icon-btn"
                  title={`Edit ${mission.title}`}
                  onClick={() => setEditor({ open: true, mission })}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="card-action-icon-btn danger"
                  title={mission.archived_at ? "Reopen mission" : "Archive mission"}
                  onClick={() => void toggleArchive(mission)}
                  disabled={archive.isPending}
                >
                  {mission.archived_at ? <RotateCcw size={15} /> : <Archive size={15} />}
                </button>
              </div>
            </div>

            {/* Mission Title */}
            <h3 className="mission-title-modern">{mission.title}</h3>

            {/* Scientific Observation Question */}
            <div className="mission-prompt-box">
              &ldquo;{mission.prompt}&rdquo;
            </div>

            {/* Geospatial and Research Metadata Strip */}
            <div className="mission-meta-strip">
              <div className="meta-item" title={mission.place || "Location not set"}>
                <MapPin size={13} style={{ color: "#2d6a4f", flexShrink: 0 }} />
                <span>
                  <strong>{mission.place || "Target Area"}</strong>
                  {mission.target ? ` (${mission.target.lat.toFixed(3)}°, ${mission.target.lng.toFixed(3)}°)` : ""}
                </span>
              </div>
              <div className="meta-item">
                <CalendarDays size={13} style={{ color: "#2d6a4f", flexShrink: 0 }} />
                <span>
                  {mission.visit_date ? formatDate(mission.visit_date) : "Active Window"}
                  {" · "}
                  <strong>{mission.observationCount} {mission.observationCount === 1 ? "note" : "notes"}</strong>
                </span>
              </div>
            </div>

            {/* Primary Action Bar: SAR Satellite Radar + Field Capture */}
            <div className="card-action-bar-modern">
              {mission.target ? (
                <button
                  type="button"
                  className="sar-radar-cta-btn"
                  onClick={() => setRadarModal({ open: true, mission })}
                  title="Inspect SAR satellite radar backscatter & flood coverage"
                >
                  <span className="radar-pulse-dot" aria-hidden="true" />
                  <Satellite size={16} />
                  <span>SAR Satellite Radar</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="sar-radar-cta-btn"
                  onClick={() => setEditor({ open: true, mission })}
                  style={{ background: "#475569" }}
                >
                  <MapPin size={15} />
                  <span>Set Radar Coords</span>
                </button>
              )}

              {mission.archived_at ? (
                <button
                  type="button"
                  className="capture-cta-btn"
                  onClick={() => void toggleArchive(mission)}
                  disabled={archive.isPending}
                >
                  <RotateCcw size={15} />
                  <span>Reopen</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="capture-cta-btn"
                  onClick={() => onCapture(mission.id)}
                >
                  <Camera size={15} />
                  <span>Capture Note</span>
                </button>
              )}
            </div>
          </article>
        );
      })}
    </section>}
    <aside className="privacy-banner"><span className="privacy-symbol" aria-hidden="true">⌑</span><div><b>Your records are private to your account</b><p>Records are stored in your configured Supabase project and protected by database row-level security.</p></div></aside>
    {radarModal.mission?.target && (
      <SatelliteRadarModal
        open={radarModal.open}
        onOpenChange={(open) => setRadarModal({ open, mission: open ? radarModal.mission : undefined })}
        missionTitle={radarModal.mission.title}
        lat={radarModal.mission.target.lat}
        lng={radarModal.mission.target.lng}
      />
    )}
    <MissionShareModal
      mission={shareModal.mission ?? null}
      open={shareModal.open}
      onOpenChange={(open) => setShareModal({ open, mission: open ? shareModal.mission : undefined })}
    />
  </>;
}
