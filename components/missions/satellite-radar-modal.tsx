"use client";

import { useQuery } from "@tanstack/react-query";
import { Satellite, ExternalLink, Waves, Trees, Layers, Info, RefreshCw } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";

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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sar-scenes", lat, lng],
    queryFn: () => apiRequest<SarResponse>(`/nasa/sar-scenes?lat=${lat}&lng=${lng}`),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-form" style={{ width: "min(680px, calc(100% - 24px))", maxHeight: "90dvh" }}>
        <div className="dialog-head">
          <div>
            <span className="eyebrow">NASA-ISRO NISAR / SAR CONTEXT</span>
            <DialogTitle>Radar Satellite & Surface Dynamics</DialogTitle>
          </div>
        </div>
        <DialogDescription className="helper">
          Satellite radar remote sensing data from Alaska Satellite Facility (ASF) DAAC and NASA GIBS for {missionTitle} (
          {lat.toFixed(4)}, {lng.toFixed(4)}).
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
                  style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }}
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

            {/* Physical Drivers & Radar Science Breakdown (NASA Challenge Core) */}
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
                    <strong style={{ color: "var(--ink)" }}>Dielectric Constant & Floodwater:</strong>{" "}
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
