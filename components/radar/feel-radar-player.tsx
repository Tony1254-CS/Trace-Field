"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Activity, Compass, Vibrate } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeelRadarPlayerProps {
  initialDb?: number;
  compact?: boolean;
}

const PRESETS = [
  { label: "Calm Water", db: -24, desc: "Specular reflection (dark pixel)", color: "#1d4ed8" },
  { label: "Sand / Silt", db: -16, desc: "Low diffuse scatter (dim pixel)", color: "#b45309" },
  { label: "Wetland / Crops", db: -10, desc: "Vegetative volume scatter", color: "#15803d" },
  { label: "Dense Forest / Urban", db: -4, desc: "High roughness & double-bounce", color: "#047857" },
];

export function FeelRadarPlayer({ initialDb = -14, compact = false }: FeelRadarPlayerProps) {
  const [db, setDb] = useState<number>(initialDb);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hapticAvailable] = useState<boolean>(
    () => typeof window !== "undefined" && "vibrate" in navigator
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stopAudio = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      try {
        gainRef.current.gain.linearRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
        setTimeout(() => {
          oscRef.current?.stop();
          oscRef.current?.disconnect();
          audioCtxRef.current?.close();
          oscRef.current = null;
          gainRef.current = null;
          audioCtxRef.current = null;
        }, 100);
      } catch {
        // cleanup safe
      }
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Map -25 dB (150 Hz low drone) to 0 dB (900 Hz high pitch)
  const dbToFreq = (val: number) => {
    const clamped = Math.max(-25, Math.min(0, val));
    const normalized = (clamped + 25) / 25; // 0 to 1
    return 140 + Math.pow(normalized, 1.8) * 750;
  };

  const triggerHaptic = useCallback((val: number) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const intensity = Math.round(((val + 25) / 25) * 40) + 10;
      navigator.vibrate(intensity);
    }
  }, []);

  const updateSound = useCallback(
    (newDb: number) => {
      if (oscRef.current && audioCtxRef.current) {
        const freq = dbToFreq(newDb);
        oscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.05);
      }
    },
    []
  );

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(dbToFreq(db), ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
      setIsPlaying(true);
      triggerHaptic(db);
    } catch {
      // Audio autoplay policy or unavailable
    }
  };

  const handleToggle = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setDb(val);
    updateSound(val);
    triggerHaptic(val);
  };

  const handlePreset = (val: number) => {
    setDb(val);
    updateSound(val);
    triggerHaptic(val);
  };

  return (
    <div
      style={{
        padding: compact ? "12px" : "16px",
        borderRadius: "14px",
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--line, #e2e8f0)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--moss, #2d6a4f)", display: "flex", alignItems: "center", gap: 5 }}>
            <Activity size={13} />
            FEEL — WALK ON THE RADAR (SONIFICATION & HAPTICS)
          </span>
          <h4 style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600 }}>
            SAR Backscatter Sound & Vibration ({db.toFixed(1)} dB)
          </h4>
        </div>
        <Button
          variant={isPlaying ? "primary" : "secondary"}
          onClick={handleToggle}
          style={{ height: 32, padding: "0 12px", fontSize: 12, gap: 6 }}
        >
          {isPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {isPlaying ? "Mute Radar" : "Listen (dB)"}
        </Button>
      </div>

      <div style={{ margin: "14px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted, #64748b)", marginBottom: 4 }}>
          <span>-25 dB (Specular Water / Dark)</span>
          <strong style={{ color: "var(--ink, #0f172a)", fontFamily: "var(--mono)" }}>{db.toFixed(1)} dB</strong>
          <span>0 dB (Rough Forest / Bright)</span>
        </div>
        <input
          type="range"
          min="-25"
          max="0"
          step="0.5"
          value={db}
          onChange={handleSliderChange}
          style={{
            width: "100%",
            accentColor: "var(--moss, #2d6a4f)",
            cursor: "pointer",
          }}
          aria-label="SAR Backscatter Decibel Slider"
        />
      </div>

      {/* Preset Surfaces */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 6, marginBottom: 10 }}>
        {PRESETS.map((p) => {
          const isSelected = Math.abs(db - p.db) < 2;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p.db)}
              style={{
                padding: "6px 8px",
                borderRadius: "8px",
                textAlign: "left",
                border: isSelected ? "2px solid var(--moss, #2d6a4f)" : "1px solid var(--line, #e2e8f0)",
                background: isSelected ? "#ecfdf5" : "#f8fafc",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: p.color }}>{p.label}</div>
              <div style={{ fontSize: 9, color: "var(--muted, #64748b)" }}>{p.db} dB</div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          color: "var(--muted, #64748b)",
          paddingTop: 8,
          borderTop: "1px dashed var(--line, #e2e8f0)",
        }}
      >
        <span>
          <Compass size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
          Data-driven audio encoding, not sound from space.
        </span>
        {hapticAvailable && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#166534" }}>
            <Vibrate size={11} /> Tactile pulse active
          </span>
        )}
      </div>
    </div>
  );
}
