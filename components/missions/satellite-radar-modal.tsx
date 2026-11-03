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
  Headphones,
  Sparkles,
  CheckCircle2,
  Radio,
  Activity,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { FeelRadarPlayer } from "@/components/radar/feel-radar-player";
import { ModernBanglaPlayer } from "@/components/radar/modern-bangla-player";

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
  recentModisUrl?: string;
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
  const [activeTab, setActiveTab] = useState<"audio" | "radar" | "science">("audio");
  const [layerType, setLayerType] = useState<"bluemarble" | "modis" | "sar">("bluemarble");

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-form sar-radar-modal">
        {/* Modal Header */}
        <div className="dialog-head sar-modal-head">
          <div>
            <span className="eyebrow" style={{ color: "var(--moss)", fontSize: 10, letterSpacing: "0.12em" }}>
              NASA-ISRO NISAR / SAR CONTEXT &amp; DYNAMICS
            </span>
            <DialogTitle style={{ fontSize: 20, marginTop: 2 }}>Radar Satellite &amp; Surface Dynamics</DialogTitle>
          </div>
        </div>

        <DialogDescription className="helper sar-modal-desc">
          Target: <strong>{missionTitle}</strong> ({lat.toFixed(4)}°N, {lng.toFixed(4)}°E) · NASA GIBS &amp; ASF DAAC
        </DialogDescription>

        {/* Sub-Navbar: 3 Distinct Visible Segments */}
        <div className="sar-tab-nav" role="tablist" aria-label="SAR Satellite View Options">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "audio"}
            className={`sar-tab-btn ${activeTab === "audio" ? "active" : ""}`}
            onClick={() => setActiveTab("audio")}
          >
            <Headphones size={16} className="sar-tab-icon" />
            <span className="sar-tab-label">অডিও নির্দেশিকা</span>
            <span className="sar-tab-pill">৫ ধাপ</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "radar"}
            className={`sar-tab-btn ${activeTab === "radar" ? "active" : ""}`}
            onClick={() => setActiveTab("radar")}
          >
            <Satellite size={16} className="sar-tab-icon" />
            <span className="sar-tab-label">স্যাটেলাইট দৃশ্য</span>
            <span className="sar-tab-pill">ASF DAAC</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "science"}
            className={`sar-tab-btn ${activeTab === "science" ? "active" : ""}`}
            onClick={() => setActiveTab("science")}
          >
            <Sparkles size={16} className="sar-tab-icon" />
            <span className="sar-tab-label">বিজ্ঞান ও পাস</span>
            <span className="sar-tab-pill">১২-দিন</span>
          </button>
        </div>

        {/* Tab Content Body with Scrollable Area */}
        <div
          className="sar-modal-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 4,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {isLoading ? (
            <div className="panel" role="status" style={{ textAlign: "center", padding: 36 }}>
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
            <>
              {/* TAB 1: 🎙️ ফিল্ড অডিও গাইড */}
              {activeTab === "audio" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <ModernBanglaPlayer />

                  {/* Ground Truth Field Tips */}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(243, 245, 238, 0.7)",
                      border: "1px solid var(--line)",
                      fontSize: 11,
                      lineHeight: 1.5,
                      color: "var(--muted)",
                    }}
                  >
                    <strong
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--ink)",
                        marginBottom: 6,
                        fontSize: 12,
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: "#2d6a4f" }} /> ফিল্ড ট্রুথিং চেকলিস্ট (Field Investigator Tips)
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                      <li>
                        <b>শান্ত পানি:</b> রাডার তরঙ্গ মিরর রিফ্লেকশনে ছিটকে যায়, চিত্রে এলাকাটি কালো দেখায়।
                      </li>
                      <li>
                        <b>রুক্ষ মাটি বা শস্য:</b> সংকেত বিচ্ছুরণ ঘটিয়ে ধূসর বা উজ্জ্বল পিক্সেল তৈরি করে।
                      </li>
                      <li>
                        <b>ফিল্ড প্রমাণ:</b> অডিও নির্দেশিকা শুনে সঠিক স্থানে গিয়ে ছবি তুলুন ও নোট রেকর্ড করুন।
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: 🛰️ স্যাটেলাইট রাডার দৃশ্য */}
              {activeTab === "radar" && (
                <div style={{ display: "grid", gap: 14 }}>
                  {/* Cinematic NASA Satellite Telemetry Viewer */}
                  <div className="nasa-sat-viewer">
                    {/* High-Definition Satellite Viewport with HUD Overlay */}
                    <div className={`sat-viewport ${layerType === "sar" ? "sat-viewport-sar" : ""}`}>
                      <img
                        src={layerType === "modis" && data.recentModisUrl ? data.recentModisUrl : data.gibsImageUrl}
                        alt="NASA GIBS satellite observation tile"
                        onError={(e) => {
                          e.currentTarget.src = data.gibsImageUrl;
                        }}
                        className={`sat-viewport-img ${layerType === "sar" ? "sar-composite-mode" : ""}`}
                      />

                      {/* Radar reticle grid overlay */}
                      <div className="sat-hud-grid" aria-hidden="true" />

                      {/* SAR Sweep Line when in SAR mode */}
                      {layerType === "sar" && (
                        <div className="sar-scan-beam" aria-hidden="true" />
                      )}

                      {/* Top HUD Overlay: Live telemetry & Worldview Link */}
                      <div className="sat-hud-top">
                        <div className="sat-hud-badge">
                          <span className={`sat-pulse-dot ${layerType === "sar" ? "sar-pulse-active" : ""}`} />
                          <span>
                            {layerType === "sar"
                              ? "Sentinel-1 / NISAR SAR Backscatter (VV/VH)"
                              : "NASA GIBS Live View"}
                          </span>
                          <span className="sat-coords">
                            {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                          </span>
                        </div>

                        <a
                          href={data.worldviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sat-hud-link"
                          title="Open interactive multi-layer viewer in NASA Worldview"
                        >
                          <span>NASA Worldview</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      {/* Bottom HUD Controls: Layer Switcher & Resolution */}
                      <div className="sat-hud-bottom">
                        <div className="sat-layer-pill-group">
                          <button
                            type="button"
                            onClick={() => setLayerType("bluemarble")}
                            className={`sat-layer-pill ${layerType === "bluemarble" ? "active" : ""}`}
                          >
                            <Satellite size={12} />
                            <span>BlueMarble (TrueColor)</span>
                          </button>
                          {data.recentModisUrl && (
                            <button
                              type="button"
                              onClick={() => setLayerType("modis")}
                              className={`sat-layer-pill ${layerType === "modis" ? "active" : ""}`}
                            >
                              <span>MODIS (Daily Swath)</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setLayerType("sar")}
                            className={`sat-layer-pill sat-layer-pill-sar ${layerType === "sar" ? "active" : ""}`}
                          >
                            <Radio size={12} />
                            <span>🛰️ SAR Radar (False-Color)</span>
                          </button>
                        </div>
                        <span className="sat-res-tag">
                          {layerType === "sar" ? "10m SAR RTC" : "250m Resolution"}
                        </span>
                      </div>
                    </div>

                    {/* SAR Backscatter Calibration Legend Bar when SAR is active */}
                    {layerType === "sar" && (
                      <div className="sar-legend-strip">
                        <div className="sar-legend-label">
                          <Activity size={13} style={{ color: "#d6f05d" }} />
                          <span>Calibrated Backscatter (σ° dB) Scale:</span>
                        </div>
                        <div className="sar-scale-bar">
                          <div className="sar-scale-gradient" />
                          <div className="sar-scale-marks">
                            <span>-25 dB (Open Water / Mirror)</span>
                            <span>-14 dB (Wet Soil &amp; Silt)</span>
                            <span>-6 dB (Vegetation Canopy)</span>
                            <span>0 dB (Urban / Revetment Double-Bounce)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Telemetry Stats Strip below the image */}
                    <div className="sat-meta-grid">
                      <div className="sat-meta-item">
                        <small>SURFACE TARGET</small>
                        <strong>{missionTitle}</strong>
                      </div>
                      <div className="sat-meta-item">
                        <small>SENSOR &amp; DAAC</small>
                        <strong>NASA EOSDIS · Sentinel-1 / GIBS</strong>
                      </div>
                      <div className="sat-meta-item">
                        <small>CALIBRATION</small>
                        <strong>SAR Microwave Backscatter</strong>
                      </div>
                    </div>
                  </div>

                  {/* Live SAR Scenes from ASF DAAC */}
                  <div>
                    <span className="eyebrow" style={{ marginBottom: 6, display: "block" }}>
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
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              marginTop: 5,
                              color: "var(--muted)",
                              flexWrap: "wrap",
                            }}
                          >
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
                </div>
              )}

              {/* TAB 3: 🔬 বিজ্ঞান ও অরবিট পাস */}
              {activeTab === "science" && (
                <div style={{ display: "grid", gap: 14 }}>
                  {/* 12-day Orbital Repeat Watch Banner */}
                  {nextPassInfo && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 14,
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        fontSize: 12,
                      }}
                    >
                      <Clock size={20} style={{ color: "#2563eb", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 13, marginBottom: 4 }}>
                          My Place Watch (12-Day Nominal Orbit Cycle)
                        </div>
                        <div style={{ color: "#1e3a8a", lineHeight: 1.5, marginBottom: 6 }}>
                          Next radar acquisition in <b>{nextPassInfo.days} days {nextPassInfo.hours} hours</b> (
                          {nextPassInfo.passDate.toISOString().slice(0, 10)}).
                        </div>
                        <div style={{ fontSize: 11, color: "#3b82f6" }}>
                          Sentinel-1 and NASA-ISRO NISAR satellites follow a sun-synchronous exact repeat orbit, capturing this
                          exact coordinate every 12 days to monitor surface changes.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Physical Drivers & Radar Science Breakdown */}
                  <div style={{ padding: 14, borderRadius: 14, background: "#f8f9f4", border: "1px dashed var(--line)" }}>
                    <span className="eyebrow" style={{ color: "var(--moss)", marginBottom: 4, display: "block" }}>
                      PHYSICAL DRIVERS BEHIND SAR BACKSCATTER
                    </span>
                    <h4 style={{ margin: "4px 0 10px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
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

                  {/* Geographic & Technical Bounding Box */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "#fff",
                      border: "1px solid var(--line)",
                      fontSize: 11,
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--muted)" }}>Target Coordinates:</span>{" "}
                      <b>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</b>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)" }}>Sensor Bands:</span> <b>C-Band (5.4 GHz) / L-Band (1.2 GHz)</b>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
