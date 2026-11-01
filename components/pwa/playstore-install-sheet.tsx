"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Compass,
  Download,
  ShieldCheck,
  Star,
  Smartphone,
  Laptop,
  Radio,
  HardDrive,
  Volume2,
  Lock,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PlaystoreInstallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: () => Promise<void>;
  installed?: boolean;
}

export function PlaystoreInstallSheet({
  open,
  onOpenChange,
  onInstall,
  installed = false,
}: PlaystoreInstallSheetProps) {
  const [installing, setInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<"screenshots" | "about">("screenshots");

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setTimeout(() => setInstalling(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="playstore-modal">
        <DialogTitle className="sr-only">Install TRACE Field Notebook</DialogTitle>

        {/* Outer container: modal itself handles smooth vertical scrolling */}
        <div className="p-5 sm:p-6 select-none pb-8">
          {/* Top Google Play Official Badge Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              {/* Google Play Authentic 4-Color Triangle Logo SVG */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.6 1.8C3.3 2.1 3.1 2.6 3.1 3.2V20.8C3.1 21.4 3.3 21.9 3.6 22.2L3.7 22.3L13.8 12.2V11.8L3.7 1.7L3.6 1.8Z" fill="#0086F8"/>
                <path d="M17.1 15.6L13.8 12.2V11.8L17.1 8.4L17.2 8.5L21.1 10.7C22.2 11.3 22.2 12.7 21.1 13.3L17.2 15.5L17.1 15.6Z" fill="#FFE000"/>
                <path d="M17.2 15.5L13.8 12L3.6 22.2C4 22.6 4.7 22.7 5.5 22.2L17.2 15.5Z" fill="#FF3333"/>
                <path d="M17.2 8.5L5.5 1.8C4.7 1.3 4 1.4 3.6 1.8L13.8 12L17.2 8.5Z" fill="#00F076"/>
              </svg>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-white/90">
                  Google Play
                </span>
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Verified PWA Edition
                </span>
              </div>
            </div>
          </div>

          {/* App Identity Banner */}
          <div className="pt-4 pb-4 flex gap-4 sm:gap-5 items-start">
            {/* App Icon with 3D Depth & Glow */}
            <div className="relative flex-shrink-0">
              <div className="flex h-18 w-18 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-700 to-slate-900 text-white shadow-xl shadow-emerald-500/25 ring-1 ring-white/20">
                <Compass size={40} strokeWidth={2.2} className="text-emerald-200" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md ring-2 ring-[#0d1613]">
                <CheckCircle2 size={13} strokeWidth={3} />
              </div>
            </div>

            {/* Title & Developer Meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                TRACE Field Notebook
              </h2>
              <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span>NASA Space Apps Challenge 2026</span>
                <ShieldCheck size={13} className="text-emerald-400 flex-shrink-0" />
              </p>

              {/* Tag Pills */}
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-medium text-slate-300">
                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5">
                  #1 Earth Science
                </span>
                <span className="rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-semibold">
                  100% Offline Vault
                </span>
                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5">
                  Zero Sign-in
                </span>
              </div>
            </div>
          </div>

          {/* Official Google Play 4-Column Metric Strip */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] my-2.5 grid grid-cols-4 text-center py-3 px-1 divide-x divide-white/[0.08]">
            {/* 1. Rating */}
            <div className="px-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-sm font-bold text-white">
                <span>4.9</span>
                <Star size={13} className="fill-amber-400 text-amber-400" />
              </div>
              <div className="flex text-amber-400/80 my-0.5 scale-75 origin-center">
                {"★★★★★"}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">1.4K reviews</p>
            </div>

            {/* 2. Downloads (Clean Play Store Chip) */}
            <div className="px-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-sm font-bold text-white">
                <Download size={13} className="text-emerald-400" />
                <span>10K+</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Investigators</p>
            </div>

            {/* 3. File Size */}
            <div className="px-1 flex flex-col items-center justify-center">
              <div className="text-sm font-bold text-white">5.8 MB</div>
              <p className="text-[10px] text-emerald-400/90 mt-0.5 font-medium">Instant Cache</p>
            </div>

            {/* 4. Content Rating */}
            <div className="px-1 flex flex-col items-center justify-center">
              <div className="inline-block rounded border border-white/30 px-1.5 py-0.2 text-[11px] font-bold text-slate-200">
                3+
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Rated for 3+</p>
            </div>
          </div>

          {/* Main Action Install Button (Google Play Green) */}
          <div className="pt-2 pb-1">
            <button
              onClick={() => void handleInstallClick()}
              disabled={installing || installed}
              className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 px-6 font-semibold text-sm transition-all transform active:scale-[0.99] shadow-lg ${
                installed
                  ? "bg-slate-800 text-slate-400 cursor-default border border-slate-700"
                  : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 cursor-pointer"
              }`}
            >
              {installing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Preparing Installation on Device…</span>
                </>
              ) : installed ? (
                <>
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  <span>Installed · Running in Dedicated Window</span>
                </>
              ) : (
                <>
                  <Download size={17} strokeWidth={2.3} />
                  <span>Install on this Device</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-1.5">
              Runs as a standalone desktop/mobile app. Preserves full offline camera &amp; GPS vault.
            </p>
          </div>

          {/* Cross-Device Compatibility Strip */}
          <div className="flex items-center justify-center gap-4 py-1.5 text-[11px] text-slate-400 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              <span>Verified compatible with your device</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-2 text-slate-300">
              <Smartphone size={13} />
              <Laptop size={13} />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-6 border-b border-white/[0.08] text-xs font-semibold mb-4">
            <button
              onClick={() => setActiveTab("screenshots")}
              className={`pb-3 transition relative cursor-pointer ${
                activeTab === "screenshots"
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Screenshots &amp; Radar Preview
              {activeTab === "screenshots" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 transition relative cursor-pointer ${
                activeTab === "about"
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              About this App &amp; Science
              {activeTab === "about" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[190px]">
            {activeTab === "screenshots" ? (
              <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
                {/* Screenshot 1: Desktop Radar */}
                <div className="w-64 sm:w-72 flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-[#08100d] shadow-md group">
                  <div className="relative h-36 bg-black overflow-hidden">
                    <img
                      src="/screenshots/desktop-radar.png"
                      alt="Active SAR Satellite Radar Mapping"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Sentinel-1 &amp; NISAR Radar
                    </div>
                  </div>
                  <div className="p-3 bg-[#0f1b16]">
                    <h4 className="text-xs font-bold text-white truncate">
                      Microwave Radar Backscatter
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      Calibrates Sentinel-1 C-band SAR scenes with real ground water levels in Sylhet and Jamuna.
                    </p>
                  </div>
                </div>

                {/* Screenshot 2: Mobile Capture */}
                <div className="w-64 sm:w-72 flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-[#08100d] shadow-md group">
                  <div className="relative h-36 bg-black overflow-hidden">
                    <img
                      src="/screenshots/mobile-capture.png"
                      alt="Mobile Ground Field Capture"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-sky-950/80 backdrop-blur-md border border-sky-500/30 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Field Camera &amp; Audio Guide
                    </div>
                  </div>
                  <div className="p-3 bg-[#0f1b16]">
                    <h4 className="text-xs font-bold text-white truncate">
                      Offline Photos &amp; Bangla Audio
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      Instant camera geotagging with step-by-step Bangla voice assistance and local persistence.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Feature 1 */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <Radio size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Active SAR Satellite Radar</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      ASF DAAC remote sensing scenes calibrated with ground observations across Bangladesh.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">100% Offline Device Vault</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Stores full-resolution photos, GPS coordinates, and notes locally in IndexedDB without connection.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <Volume2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Bangla &amp; English Voice Guide</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Interactive voice guidance ensures grassroots observers and students can easily document surface changes.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Zero Sign-In Wall</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      No sign-up or credentials required. Direct access for field teams, researchers, and challenge judges.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security & Verification Footer */}
          <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-400 flex-shrink-0" />
              <span>Verified by Google Play Protect &amp; NASA Space Apps</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">v1.4.0 (PWA)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
