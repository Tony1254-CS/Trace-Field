"use client";

import { useEffect, useRef, useState, useMemo, type CSSProperties } from "react";
import {
  Satellite,
  Camera,
  Navigation,
  Compass,
  Layers,
  Radio,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Mission } from "@/features/missions/types";
import type { Map as LeafletMap, LayerGroup, GeoJSON, TileLayer } from "leaflet";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

interface BangladeshRadarMapProps {
  missions: Mission[];
  onCapture: (missionId: string) => void;
  onOpenRadar: (mission: Mission) => void;
}

// Haversine formula to compute geodesic distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getMissionDomain(mission: Mission) {
  const text = `${mission.title} ${mission.place ?? ""} ${mission.prompt}`.toLowerCase();
  if (text.includes("haor") || text.includes("water") || text.includes("flood") || text.includes("inundation")) {
    return {
      name: "Wetlands & Haor",
      color: "#00b4d8",
      accent: "rgba(0, 180, 216, 0.25)",
      badgeBg: "rgba(0, 180, 216, 0.15)",
    };
  }
  if (text.includes("char") || text.includes("river") || text.includes("silt") || text.includes("erosion") || text.includes("jamuna")) {
    return {
      name: "River Char & Silt",
      color: "#f59e0b",
      accent: "rgba(245, 158, 11, 0.25)",
      badgeBg: "rgba(245, 158, 11, 0.15)",
    };
  }
  if (text.includes("sundarban") || text.includes("mangrove") || text.includes("tidal") || text.includes("mudflat")) {
    return {
      name: "Tidal Mangrove",
      color: "#10b981",
      accent: "rgba(16, 185, 129, 0.25)",
      badgeBg: "rgba(16, 185, 129, 0.15)",
    };
  }
  if (text.includes("embankment") || text.includes("padma") || text.includes("revetment") || text.includes("concrete")) {
    return {
      name: "River Embankment",
      color: "#818cf8",
      accent: "rgba(129, 140, 248, 0.25)",
      badgeBg: "rgba(129, 140, 248, 0.15)",
    };
  }
  return {
    name: "General Ground Study",
    color: "#d6f05d",
    accent: "rgba(214, 240, 93, 0.25)",
    badgeBg: "rgba(214, 240, 93, 0.15)",
  };
}

export function BangladeshRadarMap({
  missions,
  onCapture,
  onOpenRadar,
}: BangladeshRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const userLayerRef = useRef<LayerGroup | null>(null);
  const tileLayerRef = useRef<LayerGroup | TileLayer | null>(null);
  const boundaryLayerRef = useRef<GeoJSON | null>(null);

  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [baseMap, setBaseMap] = useState<"dark" | "satellite" | "topo">("dark");
  const [mapReady, setMapReady] = useState(false);

  // Active missions with GPS coordinates
  const validMissions = useMemo(() => {
    return missions.filter((m) => !m.archived_at && m.target && m.target.lat && m.target.lng);
  }, [missions]);

  // Derived selected mission
  const selectedMission = useMemo(() => {
    if (selectedMissionId) {
      const found = validMissions.find((m) => m.id === selectedMissionId);
      if (found) return found;
    }
    return validMissions[0] ?? null;
  }, [selectedMissionId, validMissions]);

  // Filtered missions by domain
  const filteredMissions = useMemo(() => {
    if (activeFilter === "all") return validMissions;
    return validMissions.filter((m) => {
      const d = getMissionDomain(m);
      return d.name.toLowerCase().includes(activeFilter.toLowerCase());
    });
  }, [validMissions, activeFilter]);

  // Nearest mission to user
  const nearestMissionInfo = useMemo(() => {
    if (!userLocation || validMissions.length === 0) return null;
    let closest: Mission | null = null;
    let minDistance = Infinity;

    for (const m of validMissions) {
      if (m.target) {
        const dist = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          m.target.lat,
          m.target.lng
        );
        if (dist < minDistance) {
          minDistance = dist;
          closest = m;
        }
      }
    }
    return closest ? { mission: closest, distance: minDistance } : null;
  }, [userLocation, validMissions]);

  // 1. Initialize Leaflet Map (client-only)
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Geographic center of Bangladesh [23.6850, 90.3563]
      const map = L.map(mapContainerRef.current, {
        center: [23.85, 90.35],
        zoom: 7,
        minZoom: 6,
        maxZoom: 16,
        attributionControl: false,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Add ESRI Dark Gray Canvas (Base + Reference labels) - 100% Free, No Watermark, No API Key needed
      const baseDark = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16 }
      );
      const refDark = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16 }
      );
      const darkGroup = L.layerGroup([baseDark, refDark]);
      darkGroup.addTo(map);
      tileLayerRef.current = darkGroup;

      // Layer groups for markers
      markersLayerRef.current = L.layerGroup().addTo(map);
      userLayerRef.current = L.layerGroup().addTo(map);

      // Load Official Bangladesh National Border Polygon with Glowing Stroke (Edge-to-Edge focus)
      fetch("/data/bangladesh-boundary.json")
        .then((res) => res.json())
        .then((geoData) => {
          if (!mapInstanceRef.current || !isMounted) return;
          const boundary = L.geoJSON(geoData, {
            style: {
              color: "#ffffff",
              weight: 2.8,
              opacity: 0.95,
              fillColor: "#059669",
              fillOpacity: 0.08,
              className: "bd-glowing-boundary",
            },
          });
          boundary.addTo(map);
          boundaryLayerRef.current = boundary;

          // Fit viewport tightly to Bangladesh
          map.fitBounds(boundary.getBounds(), {
            padding: [16, 16],
            maxZoom: 8,
          });
        })
        .catch((err) => {
          console.warn("Could not load BD boundary:", err);
          map.fitBounds(
            [
              [20.55, 88.0],
              [26.65, 92.7],
            ],
            { padding: [16, 16] }
          );
        });

      setMapReady(true);
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Switch base tile layer (Dark Tactical vs Satellite vs Topo)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    void (async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      if (baseMap === "satellite") {
        // ESRI World Imagery (High-res Optical Satellite - Free & No Key)
        tileLayerRef.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 18 }
        ).addTo(map);
      } else if (baseMap === "topo") {
        // OpenStreetMap Standard Topo (Free & No Key)
        tileLayerRef.current = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          { maxZoom: 19 }
        ).addTo(map);
      } else {
        // ESRI Dark Gray Canvas (Base + Reference Labels - Free & No Key)
        const baseDark = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const refDark = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        tileLayerRef.current = L.layerGroup([baseDark, refDark]).addTo(map);
      }
    })();
  }, [baseMap, mapReady]);

  // 3. Render Mission Radar Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !mapReady) return;

    void (async () => {
      const L = (await import("leaflet")).default;
      const layer = markersLayerRef.current;
      if (!layer) return;
      layer.clearLayers();

      filteredMissions.forEach((mission) => {
        if (!mission.target) return;
        const domain = getMissionDomain(mission);
        const isSelected = selectedMission?.id === mission.id;

        // Custom HTML radar pulsing marker icon
        const iconHtml = `
          <div class="leaflet-radar-marker ${isSelected ? "selected" : ""}" style="--marker-color: ${domain.color};">
            <div class="marker-radar-wave"></div>
            ${isSelected ? '<div class="marker-radar-wave-outer"></div>' : ""}
            <div class="marker-core-dot"></div>
            <div class="marker-label-tag">${mission.title}</div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-radar-pin-container",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([mission.target.lat, mission.target.lng], {
          icon: customIcon,
          title: mission.title,
        });

        marker.on("click", () => {
          setSelectedMissionId(mission.id);
          mapInstanceRef.current?.flyTo([mission.target!.lat, mission.target!.lng], 9, {
            duration: 1.2,
          });
        });

        marker.addTo(layer);
      });
    })();
  }, [filteredMissions, selectedMission, mapReady]);

  // 4. Render User Location & Connecting Line
  useEffect(() => {
    if (!mapInstanceRef.current || !userLayerRef.current || !mapReady) return;

    void (async () => {
      const L = (await import("leaflet")).default;
      const layer = userLayerRef.current;
      if (!layer) return;
      layer.clearLayers();

      if (!userLocation) return;

      // User location marker
      const userIconHtml = `
        <div class="leaflet-user-marker">
          <div class="user-pulse-halo"></div>
          <div class="user-core-dot"></div>
          <div class="user-label-tag">YOU (OBSERVER)</div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userIconHtml,
        className: "custom-user-pin-container",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(layer);

      // Connecting line to nearest target
      if (nearestMissionInfo?.mission?.target) {
        const latlngs: [number, number][] = [
          [userLocation.lat, userLocation.lng],
          [nearestMissionInfo.mission.target.lat, nearestMissionInfo.mission.target.lng],
        ];

        L.polyline(latlngs, {
          color: "#00b4d8",
          weight: 2,
          dashArray: "6, 8",
          opacity: 0.85,
        }).addTo(layer);
      }
    })();
  }, [userLocation, nearestMissionInfo, mapReady]);

  // Geolocation trigger
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 9, { duration: 1.4 });
        }
      },
      (err) => {
        console.warn("GPS error:", err.message);
        // Central Dhaka default fallback for local dev
        const fallback = { lat: 23.8103, lng: 90.4125 };
        setUserLocation(fallback);
        setLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([fallback.lat, fallback.lng], 8, { duration: 1.2 });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Reset map view to show full Bangladesh tightly focused
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      if (boundaryLayerRef.current) {
        mapInstanceRef.current.fitBounds(boundaryLayerRef.current.getBounds(), {
          padding: [16, 16],
          maxZoom: 8,
        });
      } else {
        mapInstanceRef.current.fitBounds(
          [
            [20.55, 88.0],
            [26.65, 92.7],
          ],
          { padding: [16, 16] }
        );
      }
    }
  };

  return (
    <div className="bd-radar-map-card">
      {/* Tactical Radar Map Header */}
      <div className="bd-map-header">
        <div className="bd-map-title-area">
          <div className="bd-map-badge">
            <Radio size={12} className="sat-pulse-active" />
            <span>REAL GIS RADAR CARTOGRAPHY</span>
            <span className="bd-grid-status">WGS 84 · LIVE TILES</span>
          </div>
          <h3>Bangladesh Real Geographic Mission Map</h3>
          <p>
            Real spatial satellite &amp; tactical mapping of Bangladesh. Explore active Haor, River Char, Sundarbans &amp; Embankment observation zones.
          </p>
        </div>

        <div className="bd-map-actions">
          {/* Base Layer Switcher */}
          <div className="bd-tile-switcher">
            <button
              type="button"
              onClick={() => setBaseMap("dark")}
              className={`bd-tile-pill ${baseMap === "dark" ? "active" : ""}`}
            >
              <Radio size={12} />
              <span>Dark Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMap("satellite")}
              className={`bd-tile-pill ${baseMap === "satellite" ? "active" : ""}`}
            >
              <Satellite size={12} />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMap("topo")}
              className={`bd-tile-pill ${baseMap === "topo" ? "active" : ""}`}
            >
              <Layers size={12} />
              <span>Street/Topo</span>
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleResetView}
            className="bd-reset-btn"
            title="Reset view to whole Bangladesh"
          >
            <Maximize2 size={13} />
            <span>Whole BD</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDetectLocation}
            disabled={locating}
            className="bd-location-btn"
          >
            <Navigation size={13} className={locating ? "animate-spin" : ""} />
            <span>{userLocation ? "Location Synced" : locating ? "Locating…" : "Detect My Position"}</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bd-map-filter-bar">
        <span className="bd-filter-label">Filter Domains:</span>
        <div className="bd-filter-chips">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`bd-chip ${activeFilter === "all" ? "active" : ""}`}
          >
            All Targets ({validMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("wetland")}
            className={`bd-chip ${activeFilter === "wetland" ? "active" : ""}`}
            style={{ "--chip-color": "#00b4d8" } as CSSProperties}
          >
            🌊 Wetlands
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("char")}
            className={`bd-chip ${activeFilter === "char" ? "active" : ""}`}
            style={{ "--chip-color": "#f59e0b" } as CSSProperties}
          >
            🌾 River Char
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("mangrove")}
            className={`bd-chip ${activeFilter === "mangrove" ? "active" : ""}`}
            style={{ "--chip-color": "#10b981" } as CSSProperties}
          >
            🌲 Mangrove
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("embankment")}
            className={`bd-chip ${activeFilter === "embankment" ? "active" : ""}`}
            style={{ "--chip-color": "#818cf8" } as CSSProperties}
          >
            🏗️ Embankment
          </button>
        </div>
      </div>

      {/* Real Leaflet Map Viewport Container */}
      <div className="bd-real-map-wrapper">
        <div ref={mapContainerRef} className="bd-leaflet-map-element" />

        {/* Spatial HUD Overlay Legend on Top-Left */}
        <div className="bd-map-legend-overlay">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#00b4d8" }} />
            <span>Wetlands / Haor</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#f59e0b" }} />
            <span>River Char &amp; Silt</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#10b981" }} />
            <span>Sundarbans Mangrove</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#818cf8" }} />
            <span>River Embankment</span>
          </div>
        </div>

        {/* Nearest Target Notification Toast */}
        {nearestMissionInfo && (
          <div className="bd-nearest-toast">
            <Compass size={14} style={{ color: "#d6f05d", flexShrink: 0 }} />
            <span>
              Nearest field target: <b>{nearestMissionInfo.mission.title}</b> (~{nearestMissionInfo.distance} km away)
            </span>
          </div>
        )}
      </div>

      {/* Selected Mission Tactical Detail Card */}
      {selectedMission && (
        <div className="bd-selected-hud">
          <div className="bd-hud-main">
            <div className="bd-hud-domain-row">
              <span
                className="bd-hud-domain-badge"
                style={{
                  background: getMissionDomain(selectedMission).badgeBg,
                  color: getMissionDomain(selectedMission).color,
                  borderColor: getMissionDomain(selectedMission).color,
                }}
              >
                {getMissionDomain(selectedMission).name}
              </span>
              <span className="bd-hud-coords">
                📍 {selectedMission.target?.lat.toFixed(4)}°N, {selectedMission.target?.lng.toFixed(4)}°E
              </span>
              {userLocation && selectedMission.target && (
                <span className="bd-hud-distance">
                  (~{calculateDistanceKm(userLocation.lat, userLocation.lng, selectedMission.target.lat, selectedMission.target.lng)} km from your device)
                </span>
              )}
            </div>

            <h4 className="bd-hud-title">{selectedMission.title}</h4>
            <p className="bd-hud-prompt">“{selectedMission.prompt}”</p>
            <div className="bd-hud-meta">
              <span>{selectedMission.place ?? "Bangladesh"}</span>
              <span>·</span>
              <span>{selectedMission.observationCount} ground observations</span>
            </div>
          </div>

          <div className="bd-hud-actions">
            <Button
              type="button"
              className="bd-sar-launch-btn"
              onClick={() => onOpenRadar(selectedMission)}
            >
              <Radio size={14} className="sat-pulse-active" />
              <span>🛰️ Launch SAR Satellite Radar</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="bd-capture-launch-btn"
              onClick={() => onCapture(selectedMission.id)}
            >
              <Camera size={14} />
              <span>📸 Capture Ground Truth</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
