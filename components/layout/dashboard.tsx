"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, ClipboardList, Clock, Compass, LogOut, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { ObservationForm } from "@/components/capture/observation-form";
import { MissionInbox } from "@/components/missions/mission-inbox";
import { RecordList } from "@/components/records/record-list";
import { DataPrivacyPanel } from "@/components/privacy/data-privacy-panel";
import { Button } from "@/components/ui/button";
import { useMissions } from "@/features/missions/queries";
import { createClient } from "@/lib/supabase/client";
import { getPendingObservations } from "@/lib/offline/queue";
import { syncPendingObservations } from "@/lib/offline/sync";

type View = "missions" | "capture" | "records" | "privacy";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function Dashboard({ email }: { email: string }) {
  const [selectedMissionId, setSelectedMissionId] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("case") || params.get("missionId") || undefined;
    }
    return undefined;
  });
  const [view, setView] = useState<View>(() => (selectedMissionId ? "capture" : "missions"));
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const missions = useMissions();

  const { data: pendingQueue = [], refetch: refreshPendingQueue } = useQuery({
    queryKey: ["pending-count"],
    queryFn: () => getPendingObservations(),
    staleTime: 5000,
  });
  const pendingCount = pendingQueue.length;

  useEffect(() => {
    if (selectedMissionId) {
      toast.info(`Opened investigation from link/QR: ${selectedMissionId}`);
    }

    const onlineListener = async () => {
      setOnline(true);
      toast.success("Connection restored. Synchronizing offline queue…");
      const res = await syncPendingObservations();
      if (res.synced > 0) toast.success(`Synced ${res.synced} offline field record(s) to cloud.`);
      void refreshPendingQueue();
    };

    const offlineListener = () => {
      setOnline(false);
      toast.info("Offline mode active. Observations will be saved to your local pending queue.");
    };

    window.addEventListener("online", onlineListener);
    window.addEventListener("offline", offlineListener);
    const installListener = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", installListener);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => toast.error("Offline shell could not be cached. Use TRACE online and try again."));

    return () => {
      window.removeEventListener("online", onlineListener);
      window.removeEventListener("offline", offlineListener);
      window.removeEventListener("beforeinstallprompt", installListener);
    };
  }, [refreshPendingQueue, selectedMissionId]);

  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) toast.error(error.message); else window.location.reload();
  }
  async function install() {
    if (!installPrompt) { toast.message("Use your browser menu and choose Install TRACE or Add to Home Screen."); return; }
    await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null);
  }

  const title = view === "missions" ? "Missions" : view === "capture" ? "Capture" : view === "records" ? "Records" : "Privacy & Guide";
  return <div className="app-frame">
    <header className="topbar"><a className="brand" href="#missions" aria-label="TRACE home"><span className="brand-mark"><Compass size={26} aria-hidden="true" /></span><span className="brand-copy"><strong>TRACE</strong><small>FIELD NOTEBOOK</small></span></a><div className="toolbar-actions">
      {pendingCount > 0 && (
        <button
          className="connection-pill"
          style={{ background: "#fef5d1", color: "#b7950b", borderColor: "#f9e79f", cursor: "pointer" }}
          onClick={() => setView("records")}
          title={`${pendingCount} observation(s) waiting in local offline queue`}
        >
          <Clock size={13} />
          {pendingCount} Pending Sync
        </button>
      )}
      <span className={`connection-pill ${online ? "online" : "offline"}`} role="status" title={online ? "Network connected; records require the configured account." : "Offline. Cloud requests are unavailable until you reconnect."}>{online ? <Wifi size={13} /> : <WifiOff size={13} />}{online ? "Online" : "Offline"}</span>{installPrompt && <Button className="install-button" variant="secondary" size="sm" onClick={() => void install()}>Install</Button>}<span className="account-label" title={email}>{email}</span><Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={16} /></Button></div></header>
    <nav className="bottom-nav" aria-label="Main navigation">{([ ["missions", ClipboardList, "Missions"], ["capture", Compass, "Capture"], ["records", Archive, "Records"], ["privacy", ShieldCheck, "Privacy"] ] as const).map(([key, Icon, label]) => <button className={`nav-item ${view === key ? "active" : ""}`} key={key} onClick={() => setView(key)} aria-current={view === key ? "page" : undefined} type="button"><Icon size={18} aria-hidden="true" /><span>{label}</span></button>)}</nav>
    <main id="mainContent" className="main-content" tabIndex={-1}>
      <header className="dashboard-header"><h1 className="sr-only">{title}</h1><p className="account-caption">Signed in as <strong>{email}</strong></p></header>
      {view === "missions" && <MissionInbox onCapture={(id) => { setSelectedMissionId(id); setView("capture"); }} />}
      {view === "capture" && (missions.isPending ? <div className="panel" role="status">Loading your missions…</div> : missions.isError ? <div className="panel" role="alert">{missions.error.message}</div> : <ObservationForm key={selectedMissionId ?? "capture"} missions={missions.data?.data ?? []} initialMissionId={selectedMissionId} onSaved={() => setView("records")} />)}
      {view === "records" && <RecordList />}
      {view === "privacy" && <DataPrivacyPanel email={email} />}
    </main>
    <footer className="app-footer"><span>TRACE · Account-backed field notebook</span><span>Observations are evidence for review, not verified ground truth.</span></footer>
  </div>;
}
