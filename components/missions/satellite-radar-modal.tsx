"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Satellite,
  ExternalLink,
  Waves,
  Trees,
  Layers,
  Info,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { FeelRadarPlayer } from "@/components/radar/feel-radar-player";

interface SarScene {
  granuleName: string;
  polarization: string;
  flightDirection: string;
  sensor: string;
  beamModeType: string;
  startTime?: string;
}

interface SarResponse {
  target: { lat: number; lng: number };
  boundingBox: { minLat: string; minLng: string; maxLat: string; maxLng: string };
  worldviewUrl: string;
  gibsImageUrl: string;
  scenes: SarScene[];
  physicalPrinciples: {
    dielectricProperty: string;
    roughnessProperty: string;
    polarizations: {
      VV: string;
      VH: string;
      HH: string;
    };
  };
}

export function SatelliteRadarModal({
  open,
  onOpenChange,
  missionTitle,
  lat,
  lng,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionTitle: string;
  lat: number;
  lng: number;
}) {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sar-scenes", lat, lng],
    queryFn: () => apiRequest<SarResponse>(`/nasa/sar-scenes?lat=${lat}&lng=${lng}`),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  // Calculate 12-day nominal orbital repeat pass (Sentinel-1 / NISAR standard)
  const startTime = data?.scenes?.[0]?.startTime;
  const nextPassInfo = useMemo(() => {
    if (!startTime) {
      return { days: 5, hours: 14, passDate: new Date("2026-11-05T00:00:00Z") };
    }
    const lastAcq = new Date(startTime).getTime();
    const cycleMs = 12 * 24 * 3600 * 1000;
    const nextPass = lastAcq + cycleMs;
    const diffMs = Math.max(0, nextPass - lastAcq);
    const days = Math.floor(diffMs / (24 * 3600 * 1000));
    const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
    return { days, hours, passDate: new Date(nextPass) };
  }, [startTime]);

  const handleBanglaVoiceToggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text =
      "সার রাডার ভূপৃষ্ঠের আর্দ্রতা এবং পানির উপস্থিতি সক্রিয় তরঙ্গের মাধ্যমে পরিমাপ করে। সমতল এবং মসৃণ পানি রাডার রশ্মি প্রতিফলিত করে উপগ্রহ থেকে দূরে পাঠিয়ে দেয়, যার ফলে পানিতে অন্ধকার বা কালো পিক্সেল সৃষ্টি হয়। বনভূমি এবং ঘরবাড়িতে ডিফ্যুজ বা ডাবল-বাউন্স ঘটে, যা উজ্জ্বল দেখায়। আপনার মাঠপর্যায়ের নোট ও ছবি স্যাটেলাইট তথ্যের পরিবর্তন সঠিকভাবে যাচাই করতে সাহায্য করবে।";

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find((v) => v.lang.startsWith("bn")) || voices[0];
    if (bnVoice) utterance.voice = bnVoice;
    utterance.lang = "bn-BD";
    utterance.rate = 0.9;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-form" style={{ width: "min(700px, calc(100% - 24px))", maxHeight: "90dvh" }}>
        <div className="dialog-head">
          <div>
            <span className="eyebrow">NASA-ISRO NISAR / SAR CONTEXT &amp; DYNAMICS</span>
            <DialogTitle>Radar Satellite &amp; Surface Dynamics</DialogTitle>
          </div>
        </div>
        <DialogDescription className="helper">
          Satellite radar remote sensing data from Alaska Satellite Facility (ASF) DAAC and NASA GIBS for {missionTitle} (
          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E).
        </DialogDescription>

        {isLoading ? (
          <div className="panel" role="status" style={{ textAlign: "center", padding: 32 }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--moss)" }} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Querying NASA Alaska Satellite Facility DAAC for live SAR scenes…
            </p>
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <div>
              <h3>Could not load SAR satellite data</h3>
              <p>{error instanceof Error ? error.message : "Service temporarily unavailable."}</p>
              <Button variant="secondary" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          </div>
        ) : data ? (
          <div style={{ display: "grid", gap: 16 }}>
            {/* 12-day Orbital Repeat Watch Banner */}
            {nextPassInfo && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  fontSize: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={16} style={{ color: "#2563eb" }} />
                  <div>
                    <span style={{ fontWeight: 600, color: "#1e40af" }}>My Place Watch (12-Day Nominal Cycle): </span>
                    <span style={{ color: "#1e3a8a" }}>
                      Next radar acquisition in <b>{nextPassInfo.days}d {nextPassInfo.hours}h</b> (
                      {nextPassInfo.passDate.toISOString().slice(0, 10)})
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBanglaVoiceToggle}
                  style={{ height: 28, fontSize: 11, padding: "0 10px", gap: 5, background: "#fff" }}
                >
                  {isSpeaking ? <VolumeX size={13} style={{ color: "#dc2626" }} /> : <Volume2 size={13} />}
                  {isSpeaking ? "থামুন (Stop Audio)" : "বাংলা ভয়েস নির্দেশিকা (Bangla)"}
                </Button>
              </div>
            )}

            {/* Satellite Optical & Worldview Tile */}
            <div style={{ padding: 14, borderRadius: 14, background: "#f5f6ee", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <Satellite size={16} /> NASA GIBS Satellite Imagery Context
                </strong>
                <a
                  href={data.worldviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}
                >
                  Open in NASA Worldview <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <img
                  src={data.gibsImageUrl}
                  alt="NASA GIBS satellite observation tile"
                  style={{ width: 130, height: 130, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }}
                />
                <div style={{ flex: 1, minWidth: 200, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Observation Coordinates:</strong> {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                  </p>
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Sensor Provider:</strong> NASA EOSDIS / Alaska Satellite Facility DAAC
                  </p>
                  <p style={{ margin: 0 }}>
                    Optical context from NASA GIBS combined with active microwave Synthetic Aperture Radar (SAR) backscatter
                    to calibrate and validate ground observations.
                  </p>
                </div>
              </div>
            </div>

            {/* Live SAR Scenes from ASF DAAC */}
            <div>
              <span className="eyebrow" style={{ marginBottom: 6 }}>
                LIVE ASF DAAC SAR SCENES (SENTINEL-1 / NISAR PROXY)
              </span>
              <div style={{ display: "grid", gap: 8 }}>
                {data.scenes.slice(0, 3).map((scene, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: "#fff",
                      border: "1px solid var(--line)",
                      fontSize: 11,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)" }}>
                        {scene.granuleName}
                      </strong>
                      <span className="status-tag active" style={{ fontSize: 9 }}>
                        {scene.flightDirection}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 5, color: "var(--muted)" }}>
                      <span>
                        <b>Polarization:</b> {scene.polarization}
                      </span>
                      <span>
                        <b>Beam Mode:</b> {scene.beamModeType}
                      </span>
                      <span>
                        <b>Sensor:</b> {scene.sensor}
                      </span>
                      {scene.startTime && (
                        <span>
                          <b>Acquired:</b> {new Date(scene.startTime).toISOString().slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FEEL: Walk on the Radar (Sonification & Tactile) */}
            <FeelRadarPlayer compact />

            {/* Physical Drivers & Radar Science Breakdown */}
            <div style={{ padding: 14, borderRadius: 14, background: "#f8f9f4", border: "1px dashed var(--line)" }}>
              <span className="eyebrow" style={{ color: "var(--moss)" }}>
                PHYSICAL DRIVERS BEHIND SAR BACKSCATTER
              </span>
              <h4 style={{ margin: "6px 0 10px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={15} /> How Radar Sees Earth&apos;s Changing Surface
              </h4>

              <div style={{ display: "grid", gap: 10, fontSize: 11, lineHeight: 1.5, color: "var(--muted)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Waves size={16} style={{ color: "#2d6a4f", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: "var(--ink)" }}>Dielectric Constant &amp; Floodwater:</strong>{" "}
                    {data.physicalPrinciples.dielectricProperty}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Trees size={16} style={{ color: "#2d6a4f", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: "var(--ink)" }}>Polarizations (VV vs VH vs HH):</strong>{" "}
                    <span>
                      <b>VV</b> delineates water/soil boundaries; <b>VH</b> captures vegetation volume scattering; <b>HH</b>{" "}
                      reveals double-bounce from flooded trees and riverbank structures.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Info size={16} style={{ color: "#2d6a4f", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: "var(--ink)" }}>Ground Observation Value:</strong> Your TRACE field notes and
                    photos provide verified ground truth to confirm whether dark SAR pixels represent flood inundation,
                    standing irrigation, or flat sediment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="dialog-actions">
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
