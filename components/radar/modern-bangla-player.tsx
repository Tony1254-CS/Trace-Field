"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Languages,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScriptItem {
  id: number;
  bn: string;
  en: string;
  principle: string;
}

const SCRIPT_ITEMS: ScriptItem[] = [
  {
    id: 1,
    bn: "ট্রেস ফিল্ড গাইডে স্বাগতম। নাসা নিসার এবং সেন্টিনেল রাডার মহাকাশ থেকে দিন-রাত ভূপৃষ্ঠের পরিবর্তন পর্যবেক্ষণ করে।",
    en: "Welcome to TRACE Field Guide. NASA NISAR and Sentinel active radars monitor surface changes day and night from orbit.",
    principle: "Active Microwave Remote Sensing",
  },
  {
    id: 2,
    bn: "সমতল বা শান্ত পানি রাডার তরঙ্গকে আয়নার মতো প্রতিফলিত করে উপগ্রহ থেকে দূরে পাঠিয়ে দেয়।",
    en: "Smooth standing water reflects radar pulses away from the satellite antenna like a mirror.",
    principle: "Specular Reflection (Dark Pixels)",
  },
  {
    id: 3,
    bn: "এর ফলে স্যাটেলাইটের রাডার চিত্রে প্লাবিত এলাকা বা নদী গাঢ় এবং কালো দেখায়।",
    en: "Because little signal returns, floodwaters and open wetlands appear dark on radar imagery.",
    principle: "Dielectric Constant & Low Backscatter",
  },
  {
    id: 4,
    bn: "অপরদিকে গাছপালা, বনভূমি ও ঘরবাড়িতে সংকেত বাধা পেয়ে উজ্জ্বল ও সাদা দেখায়।",
    en: "In contrast, forest canopies, crops, and buildings scatter energy back, appearing bright.",
    principle: "Roughness & Volume Scattering",
  },
  {
    id: 5,
    bn: "আপনার মাঠপর্যায়ের ক্যামেরা ছবি ও সত্য নোট এই উপগ্রহের তথ্য যাচাই করার আসল ভিত্তি।",
    en: "Your TRACE ground notes and photos provide the verified truth needed to confirm these satellite changes.",
    principle: "In-Situ Ground Truthing",
  },
];

export function ModernBanglaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(0.9);
  const [voiceLang, setVoiceLang] = useState<"bn" | "en">("bn");
  const [hasNativeBanglaVoice, setHasNativeBanglaVoice] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const playSentenceRef = useRef<(index: number) => void>(() => {});

  // Initialize and check available voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        if (!synthRef.current) return;
        const voices = synthRef.current.getVoices();
        setAvailableVoices(voices);
        const bnExists = voices.some(
          (v) => v.lang.toLowerCase().startsWith("bn") || v.name.toLowerCase().includes("bangla") || v.name.toLowerCase().includes("bengali")
        );
        setHasNativeBanglaVoice(bnExists);
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
  }, []);

  const playSentence = useCallback(
    (index: number) => {
      if (!synthRef.current || index >= SCRIPT_ITEMS.length) {
        setIsPlaying(false);
        setActiveSentenceIndex(0);
        return;
      }

      synthRef.current.cancel();
      setActiveSentenceIndex(index);
      setIsPlaying(true);

      const item = SCRIPT_ITEMS[index];
      // If native Bangla voice is available and user chose 'bn', speak Bangla.
      // If no native Bangla voice is installed, speak English clearly to prevent garbled robotic noises,
      // while displaying the Bangla text prominently.
      const shouldSpeakEnglish = voiceLang === "en" || !hasNativeBanglaVoice;
      const textToSpeak = shouldSpeakEnglish ? item.en : item.bn;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = speed;

      if (!shouldSpeakEnglish) {
        const bnVoice = availableVoices.find(
          (v) => v.lang.toLowerCase().startsWith("bn") || v.name.toLowerCase().includes("bangla") || v.name.toLowerCase().includes("bengali")
        );
        if (bnVoice) utterance.voice = bnVoice;
        utterance.lang = "bn-BD";
      } else {
        const enVoice = availableVoices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Online"))
        ) || availableVoices.find((v) => v.lang.startsWith("en"));
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = "en-US";
      }

      utterance.onend = () => {
        if (index + 1 < SCRIPT_ITEMS.length) {
          playSentenceRef.current(index + 1);
        } else {
          setIsPlaying(false);
          setActiveSentenceIndex(0);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      synthRef.current.speak(utterance);
    },
    [availableVoices, hasNativeBanglaVoice, speed, voiceLang]
  );

  useEffect(() => {
    playSentenceRef.current = playSentence;
  }, [playSentence]);

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playSentence(activeSentenceIndex);
    }
  };

  const restartPlayback = () => {
    stopPlayback();
    playSentence(0);
  };

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        border: "1px solid #cbd5e1",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        margin: "12px 0",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <span className="eyebrow" style={{ color: "#0f766e", display: "flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={13} />
            আধুনিক অডিও নির্দেশিকা · MODERN VOICE GUIDE
          </span>
          <h4 style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            নাসা রাডার ও ভূপৃষ্ঠের পরিবর্তনের ব্যাখ্যা (Voice &amp; Subtitles)
          </h4>
        </div>

        {/* Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasNativeBanglaVoice ? (
            <span
              className="status-tag"
              style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", fontSize: 10, display: "inline-flex", gap: 4 }}
            >
              <CheckCircle2 size={12} /> বাংলা কণ্ঠস্বর সক্রিয়
            </span>
          ) : (
            <span
              className="status-tag"
              style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047", fontSize: 10, display: "inline-flex", gap: 4 }}
              title="ডিভাইসে উইন্ডোজ বাংলা ভয়েস প্যাক না থাকায় পরিষ্কার ইংরেজি ভয়েসের সাথে আধুনিক বাংলা সাবটাইটেল সিঙ্ক করা হচ্ছে"
            >
              <Info size={12} /> স্মার্ট সাবটাইটেল মোড
            </span>
          )}
        </div>
      </div>

      {/* Audio Waveform Animation (When playing) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          height: 28,
          margin: "10px 0",
          background: "#ffffff",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          padding: "0 12px",
        }}
      >
        {[40, 75, 55, 90, 60, 85, 45, 95, 65, 80, 50, 70].map((h, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: isPlaying ? `${h}%` : "15%",
              background: isPlaying ? "#0d9488" : "#cbd5e1",
              borderRadius: 3,
              transition: "height 0.2s ease-in-out",
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: "#64748b", marginLeft: 8, fontFamily: "var(--mono)" }}>
          {isPlaying ? `Playing ${activeSentenceIndex + 1}/${SCRIPT_ITEMS.length}` : "Ready to play"}
        </span>
      </div>

      {/* Active Sentence Teleprompter Card */}
      <div
        style={{
          padding: "14px 16px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #cbd5e1",
          minHeight: 88,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#0d9488", textTransform: "uppercase" }}>
            {SCRIPT_ITEMS[activeSentenceIndex].principle}
          </span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            বাক্য {activeSentenceIndex + 1} / {SCRIPT_ITEMS.length}
          </span>
        </div>
        <p style={{ margin: "2px 0 6px", fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.5 }}>
          {SCRIPT_ITEMS[activeSentenceIndex].bn}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontStyle: "italic", lineHeight: 1.4 }}>
          &ldquo;{SCRIPT_ITEMS[activeSentenceIndex].en}&rdquo;
        </p>
      </div>

      {/* Sentence Navigation Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 10 }}>
        {SCRIPT_ITEMS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => playSentence(idx)}
            style={{
              padding: "6px 4px",
              borderRadius: 6,
              border: activeSentenceIndex === idx ? "2px solid #0d9488" : "1px solid #e2e8f0",
              background: activeSentenceIndex === idx ? "#ccfbf1" : "#ffffff",
              fontSize: 10,
              fontWeight: 600,
              color: activeSentenceIndex === idx ? "#0f766e" : "#64748b",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
          >
            ধাপ {idx + 1}
          </button>
        ))}
      </div>

      {/* Controls & Options Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px dashed #cbd5e1",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="button"
            variant={isPlaying ? "secondary" : "primary"}
            onClick={togglePlayback}
            style={{ height: 32, padding: "0 14px", fontSize: 12, gap: 6 }}
          >
            {isPlaying ? <VolumeX size={14} style={{ color: "#dc2626" }} /> : <Volume2 size={14} />}
            {isPlaying ? "থামুন (Pause)" : "শুনুন (Play Audio)"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={restartPlayback}
            style={{ height: 32, padding: "0 10px", fontSize: 11, gap: 5 }}
            title="প্রথম থেকে শুরু করুন"
          >
            <RotateCcw size={13} />
            শুরু থেকে
          </Button>
        </div>

        {/* Speed & Language Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#64748b" }}>গতি:</span>
            {[0.8, 0.9, 1.1].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                style={{
                  padding: "3px 6px",
                  borderRadius: 4,
                  border: speed === s ? "1px solid #0d9488" : "1px solid #cbd5e1",
                  background: speed === s ? "#0d9488" : "#ffffff",
                  color: speed === s ? "#ffffff" : "#475569",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setVoiceLang(voiceLang === "bn" ? "en" : "bn")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              fontSize: 10,
              cursor: "pointer",
              color: "#334155",
            }}
            title="ভয়েসের ভাষা পরিবর্তন করুন"
          >
            <Languages size={12} />
            {voiceLang === "bn" ? "ভয়েস: বাংলা" : "Voice: English"}
          </button>
        </div>
      </div>
    </div>
  );
}
