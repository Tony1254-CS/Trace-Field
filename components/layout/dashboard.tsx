"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, ClipboardList, Clock, Compass, Download, LogIn, LogOut, ShieldCheck, User, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { ObservationForm } from "@/components/capture/observation-form";
import { MissionInbox } from "@/components/missions/mission-inbox";
import { RecordList } from "@/components/records/record-list";
import { DataPrivacyPanel } from "@/components/privacy/data-privacy-panel";
import { PlaystoreInstallSheet } from "@/components/pwa/playstore-install-sheet";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMissions } from "@/features/missions/queries";
import { getPendingObservations } from "@/lib/offline/queue";
import { syncPendingObservations } from "@/lib/offline/sync";
import { createClient } from "@/lib/supabase/client";

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
  const [authOpen, setAuthOpen] = useState(false);
  const isAuthenticated = Boolean(email && email !== "field-investigator@trace.nasa");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installSheetOpen, setInstallSheetOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone
    );
  });
  const missions = useMissions();

  const { data: pendingQueue = [], refetch: refreshPendingQueue } = useQuery({
    queryKey: ["pending-count"],
    queryFn: () => getPendingObservations(),
    staleTime: 5000,
  });
  const pendingCount = pendingQueue.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

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

  async function handleInstallApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setInstallSheetOpen(false);
        setInstallPrompt(null);
        toast.success("TRACE Field Notebook installed on your device!");
      }
    } else {
      if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        toast.success("TRACE Field Notebook is already installed.");
      } else {
        toast.message("To install: Use your browser address bar (⊕ icon) or menu and tap 'Add to Home Screen'.");
      }
    }
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
      <span className={`connection-pill ${online ? "online" : "offline"}`} role="status" title={online ? "Network connected." : "Offline. Cloud requests are unavailable until you reconnect."}>{online ? <Wifi size={13} /> : <WifiOff size={13} />}<span className="pill-status-label">{online ? "Online" : "Offline"}</span></span>
      {isAuthenticated ? (
        <button
          className="connection-pill"
          style={{ cursor: "pointer", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", display: "inline-flex", alignItems: "center", gap: 5 }}
          title={`Signed in as ${email}. Click to sign out.`}
          onClick={async () => {
            if (window.confirm(`Sign out of ${email}?`)) {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.reload();
            }
          }}
        >
          <User size={13} />
          <span className="user-email-label">{email.split("@")[0]}</span>
          <LogOut size={11} style={{ opacity: 0.7 }} />
        </button>
      ) : (
        <Dialog open={authOpen} onOpenChange={setAuthOpen}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="auth-btn"
              style={{
                borderRadius: 9999,
                padding: "7px 12px",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <LogIn size={13} />
              <span className="auth-btn-label">Sign in</span>
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: 490, padding: 0, border: "none", background: "transparent" }}>
            <DialogTitle className="sr-only">Sign In to TRACE</DialogTitle>
            <DialogDescription className="sr-only">Sign in to your account or create a new field investigator account.</DialogDescription>
            <AuthPanel />
          </DialogContent>
        </Dialog>
      )}
      <Button
        className="install-button"
        variant="secondary"
        size="sm"
        onClick={() => setInstallSheetOpen(true)}
        style={{
          background: "linear-gradient(135deg, #01875f 0%, #03684a 100%)",
          color: "#ffffff",
          borderColor: "transparent",
          fontWeight: 700,
          gap: 6,
          borderRadius: 9999,
          padding: "7px 14px",
          boxShadow: "0 2px 10px rgba(1, 135, 95, 0.3)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Download size={13} strokeWidth={2.4} />
        <span className="install-btn-label">{isInstalled ? "Installed" : "Install App"}</span>
      </Button>
    </div></header>
    <nav className="bottom-nav" aria-label="Main navigation">{([ ["missions", ClipboardList, "Missions"], ["capture", Compass, "Capture"], ["records", Archive, "Records"], ["privacy", ShieldCheck, "Privacy"] ] as const).map(([key, Icon, label]) => <button className={`nav-item ${view === key ? "active" : ""}`} key={key} onClick={() => setView(key)} aria-current={view === key ? "page" : undefined} type="button"><Icon size={18} aria-hidden="true" /><span>{label}</span></button>)}</nav>
    <main id="mainContent" className="main-content" tabIndex={-1}>
      <h1 className="sr-only">{title}</h1>
      {view === "missions" && <MissionInbox onCapture={(id) => { setSelectedMissionId(id); setView("capture"); }} />}
      {view === "capture" && (missions.isPending ? <div className="panel" role="status">Loading your missions…</div> : missions.isError ? <div className="panel" role="alert">{missions.error.message}</div> : <ObservationForm key={selectedMissionId ?? "capture"} missions={missions.data?.data ?? []} initialMissionId={selectedMissionId} onSaved={() => setView("records")} />)}
      {view === "records" && <RecordList />}
      {view === "privacy" && <DataPrivacyPanel email={email} />}
    </main>
    <footer className="app-footer"><span>TRACE · Ground Evidence Companion</span><span>Observations are evidence for review, not verified ground truth.</span></footer>
    <PlaystoreInstallSheet
      open={installSheetOpen}
      onOpenChange={setInstallSheetOpen}
      onInstall={handleInstallApp}
      installed={isInstalled}
    />
  </div>;
}
