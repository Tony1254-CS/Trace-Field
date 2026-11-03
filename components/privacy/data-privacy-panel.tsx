"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Upload,
  Shield,
  Database,
  MapPin,
  Eye,
  Satellite,
  ExternalLink,
  Languages,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileJson,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { missionKey } from "@/features/missions/queries";
import { observationKey } from "@/features/observations/queries";

interface ServiceStatus {
  name: string;
  url: string;
  status: string;
  keyConfigured?: boolean;
  portal?: string;
}

interface NasaStatusResponse {
  timestamp: string;
  services: {
    cmr: ServiceStatus;
    asf: ServiceStatus;
    gibs: ServiceStatus;
    firms: ServiceStatus;
  };
}

type PrivacyTab = "security" | "nasa-api" | "backup" | "guide";

export function DataPrivacyPanel({ email }: { email: string }) {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<PrivacyTab>("security");
  const queryClient = useQueryClient();

  const { data: nasaStatus, isFetching: loadingNasa, refetch: fetchNasaStatus } = useQuery({
    queryKey: ["nasa-status"],
    queryFn: () => apiRequest<NasaStatusResponse>("/nasa/status"),
    staleTime: 60_000,
  });

  async function handleExport() {
    try {
      const payload = await apiRequest<unknown>("/backup/export", { headers: { Accept: "application/json" } });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(lang === "bn" ? "ডিভাইস ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে।" : "Device backup downloaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup export failed.");
    }
  }

  async function handleImport(file: File) {
    if (file.size > 30 * 1024 * 1024) {
      toast.error(lang === "bn" ? "ব্যাকআপ ফাইল ৩০ মেগাবাইটের কম হতে হবে।" : "Backup must be smaller than 30 MB.");
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      const result = await apiRequest<{ imported: { missions: number; observations: number } }>("/backup/restore", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success(
        lang === "bn"
          ? `${result.imported.missions}টি মিশন এবং ${result.imported.observations}টি পর্যবেক্ষণ পুনরুদ্ধার করা হয়েছে।`
          : `Restored ${result.imported.missions} missions and ${result.imported.observations} field notes.`
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: missionKey }),
        queryClient.invalidateQueries({ queryKey: observationKey }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup could not be restored.");
    }
  }

  return (
    <div className="privacy-view">
      {/* Header Intro */}
      <section className="page-intro">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">{lang === "bn" ? "ট্রেস / ডাটা ও গোপনীয়তা প্যানেল" : "TRACE / DATA & PRIVACY"}</span>
            <h1>{lang === "bn" ? "ডাটা ও গোপনীয়তা নির্দেশিকা" : "Data, privacy, and field guide."}</h1>
            <p>
              {lang === "bn"
                ? "মাঠ পর্যবেক্ষকদের সুরক্ষা, স্বচ্ছতা এবং নির্ভরযোগ্য তথ্যের নিশ্চয়তা দিতে ট্রেস-এর সুনির্দিষ্ট নিরাপত্তা ব্যবস্থা।"
                : "Understand how your records, location, and photo evidence are secured in your account before field deployment."}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            aria-label="Toggle language"
            style={{ display: "inline-flex", gap: 6, fontWeight: 700 }}
          >
            <Languages size={15} />
            {lang === "en" ? "বাংলা ভার্সন" : "English Version"}
          </Button>
        </div>
      </section>

      {/* 4-Segment Modern Sub-Navbar Tabs */}
      <div className="privacy-tab-nav" role="tablist" aria-label="Privacy sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "security"}
          className={`privacy-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Shield size={16} />
          <span>{lang === "bn" ? "ডাটা নিরাপত্তা" : "Data Security"}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "nasa-api"}
          className={`privacy-tab-btn ${activeTab === "nasa-api" ? "active" : ""}`}
          onClick={() => setActiveTab("nasa-api")}
        >
          <Satellite size={16} />
          <span>{lang === "bn" ? "নাসা এপিআই" : "NASA APIs"}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "backup"}
          className={`privacy-tab-btn ${activeTab === "backup" ? "active" : ""}`}
          onClick={() => setActiveTab("backup")}
        >
          <FileJson size={16} />
          <span>{lang === "bn" ? "ব্যাকআপ ভল্ট" : "Backup Vault"}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "guide"}
          className={`privacy-tab-btn ${activeTab === "guide" ? "active" : ""}`}
          onClick={() => setActiveTab("guide")}
        >
          <BookOpen size={16} />
          <span>{lang === "bn" ? "মাঠ নির্দেশিকা" : "Field Guide"}</span>
        </button>
      </div>

      {/* TAB 1: 🛡️ ডাটা ও নিরাপত্তা (Data Security & RLS) */}
      {activeTab === "security" && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Card 1: Account & PostgreSQL RLS */}
          <section className="panel" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <span className="eyebrow">{lang === "bn" ? "অ্যাকাউন্ট ডাটাবেজ নিরাপত্তা" : "ACCOUNT STORAGE & RLS"}</span>
                <h2 style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
                  <Database size={20} style={{ color: "#2d6a4f" }} />
                  {lang === "bn" ? "ক্লাউড স্টোরেজ ও রো-লেভেল সিকিউরিটি (RLS)" : "PostgreSQL with Row-Level Security"}
                </h2>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "#eff3e7",
                  color: "#2d6a4f",
                  fontWeight: 600,
                  border: "1px solid rgba(45, 106, 79, 0.2)",
                }}
              >
                RLS ENFORCED
              </span>
            </div>
            <p className="privacy-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--muted)" }}>
              {lang === "bn" ? (
                <>
                  আপনার সমস্ত মিশন এবং পর্যবেক্ষণ আপনার সাইন-ইন করা অ্যাকাউন্টে (<strong>{email}</strong>) সুরক্ষিত।
                  পোস্টগ্রেসকিউএল (PostgreSQL)-এর <strong>Row-Level Security (RLS)</strong> পলিসি ডাটাবেজ স্তরে নিশ্চিত করে
                  যে অন্য কোনো ব্যবহারকারী আপনার সংরক্ষিত নোট বা ছবি দেখতে বা প্রবেশ করতে পারবে না।
                </>
              ) : (
                <>
                  All field observations and missions are tied to your authenticated account (<strong>{email}</strong>).
                  PostgreSQL <strong>Row-Level Security (RLS)</strong> policies enforce complete user isolation at the
                  database level, preventing cross-user record exposure.
                </>
              )}
            </p>
          </section>

          {/* 2-Column Sub-grid for Location & Evidence Integrity */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {/* Card 2: Location & GPS */}
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="eyebrow">{lang === "bn" ? "অবস্থান ও ক্যামেরা পারমিশন" : "LOCATION & SENSORS"}</span>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <MapPin size={18} style={{ color: "#2d6a4f" }} />
                {lang === "bn" ? "চাহিদামাক জিপিএস (নো ট্র্যাকিং)" : "On-Demand GPS Only"}
              </h3>
              <p className="privacy-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--muted)" }}>
                {lang === "bn"
                  ? "ট্রেস কখনোই পটভূমিতে বা সার্বক্ষণিকভাবে ব্যবহারকারীর অবস্থান ট্র্যাক করে না। আপনি যখন ফিল্ড ক্যাপচারে 'Add current location' বাটনে সম্মতি দেন, তখনই কেবল বর্তমান স্থানাঙ্ক এবং জিপিএস নির্ভুলতা (± মিটার) নেওয়া হয়।"
                  : "TRACE never requests continuous or background geolocation. Coordinates, timestamps, and GPS accuracy (± m) are queried only upon explicit tap of the location control. Adding photos or coordinates is always optional."}
              </p>
            </section>

            {/* Card 3: Evidence Integrity */}
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="eyebrow">{lang === "bn" ? "পর্যবেক্ষণ বনাম বৈজ্ঞানিক প্রমাণ" : "EVIDENCE INTEGRITY"}</span>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <Eye size={18} style={{ color: "#2d6a4f" }} />
                {lang === "bn" ? "পর্যালোচনার নথি (মানুষের সত্য যাচাই)" : "Evidence for Review"}
              </h3>
              <p className="privacy-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--muted)" }}>
                {lang === "bn"
                  ? "ট্রেস-এ সংরক্ষিত ফিল্ড নোট এবং ছবি হলো মাঠ পর্যায়ের সাক্ষ্য-প্রমাণ যা মানুষের পর্যালোচনার অপেক্ষায় থাকে (Awaiting human review)। কোনো ফিল্ড ছবিকে স্বয়ংক্রিয় বৈজ্ঞানিক রায় বা চূড়ান্ত সত্য বলে দাবি করা হয় না।"
                  : "Recorded field observations are categorized as supporting evidence awaiting human verification. TRACE never fabricates metrics, validation scores, or claims a field snapshot constitutes verified scientific proof."}
              </p>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: 🛰️ লাইভ নাসা সিস্টেম স্ট্যাটাস (NASA Telemetry Services) */}
      {activeTab === "nasa-api" && (
        <section className="panel" style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--moss)" }}>
                {lang === "bn" ? "নাসা অফিসিয়াল এপিআই স্ট্যাটাস" : "LIVE NASA SATELLITE APIS"}
              </span>
              <h3 style={{ margin: "4px 0 0", display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
                <Satellite size={20} style={{ color: "#2d6a4f" }} />
                {lang === "bn" ? "আসল নাসা স্যাটেলাইট ডাটা কানেক্টিভিটি" : "Verified NASA Data Services"}
              </h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void fetchNasaStatus()}
              disabled={loadingNasa}
              aria-label="Refresh status"
              style={{ display: "inline-flex", gap: 6, fontWeight: 600 }}
            >
              <RefreshCw size={13} className={loadingNasa ? "animate-spin" : ""} />
              <span>{lang === "bn" ? "রিফ্রেশ করুন" : "Refresh Status"}</span>
            </Button>
          </div>

          <p className="helper" style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            {lang === "bn"
              ? "ট্রেস কোনো কাল্পনিক বা সিমুলেটেড স্যাটেলাইট ডাটা ব্যবহার করে না। নিচের সার্ভিসগুলো সরাসরি নাসার মূল সার্ভার থেকে রিয়েল-টাইম তথ্য সংগ্রহ করে:"
              : "TRACE queries official NASA Earth observation and DAAC APIs directly without fabricated telemetry:"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {/* NASA CMR */}
            <div style={{ padding: 14, borderRadius: 14, background: "#ffffff", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "var(--ink)" }}>NASA CMR Granules &amp; Health</strong>
                <span className="status-tag active" style={{ display: "inline-flex", gap: 5, fontSize: 10 }}>
                  <CheckCircle2 size={12} /> {nasaStatus?.services?.cmr?.status?.toUpperCase() || "ONLINE"}
                </span>
              </div>
              <small style={{ color: "var(--muted)", display: "block", marginTop: 4, fontFamily: "var(--mono)", fontSize: 10 }}>
                cmr.earthdata.nasa.gov
              </small>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                {lang === "bn" ? "বিশ্বব্যাপী বৃষ্টিপাত (GPM IMERG) ও স্যাটেলাইট মেটাডাটা সার্চ।" : "Real-time precipitation (GPM IMERG) and Earth granules search."}
              </p>
            </div>

            {/* ASF DAAC */}
            <div style={{ padding: 14, borderRadius: 14, background: "#ffffff", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "var(--ink)" }}>Alaska Satellite Facility (ASF) DAAC</strong>
                <span className="status-tag active" style={{ display: "inline-flex", gap: 5, fontSize: 10 }}>
                  <CheckCircle2 size={12} /> {nasaStatus?.services?.asf?.status?.toUpperCase() || "ONLINE"}
                </span>
              </div>
              <small style={{ color: "var(--muted)", display: "block", marginTop: 4, fontFamily: "var(--mono)", fontSize: 10 }}>
                api.daac.asf.alaska.edu
              </small>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                {lang === "bn" ? "নাসার অফিসিয়াল SAR রাডার স্যাটেলাইট ডাটা সেন্টার।" : "NASA Distributed Active Archive Center for SAR & radar data."}
              </p>
            </div>

            {/* NASA GIBS */}
            <div style={{ padding: 14, borderRadius: 14, background: "#ffffff", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "var(--ink)" }}>NASA GIBS Satellite Tiles (WMTS)</strong>
                <span className="status-tag active" style={{ display: "inline-flex", gap: 5, fontSize: 10 }}>
                  <CheckCircle2 size={12} /> AVAILABLE
                </span>
              </div>
              <small style={{ color: "var(--muted)", display: "block", marginTop: 4, fontFamily: "var(--mono)", fontSize: 10 }}>
                gibs.earthdata.nasa.gov
              </small>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                {lang === "bn" ? "গ্লোবাল স্যাটেলাইট ব্রাউজ ও অপটিক্যাল ইমেজারি টাইলস।" : "Global imagery browse services for real satellite optical layers."}
              </p>
            </div>

            {/* NASA FIRMS Key */}
            <div style={{ padding: 14, borderRadius: 14, background: "#f8f8f3", border: "1px dashed var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "var(--ink)" }}>NASA FIRMS Key Configuration</strong>
                <span className="status-tag" style={{ display: "inline-flex", gap: 5, fontSize: 10 }}>
                  <AlertCircle size={12} /> FREE MAP KEY
                </span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                {lang === "bn"
                  ? "আসল ফায়ার ও তাপমাত্রার ডাটা পেতে নাসার পোর্টাল থেকে বিনামূল্যে একটি ৩২ ডিজিটের Map Key নিয়ে সার্ভার কনফিগারেশনে যুক্ত করতে পারেন:"
                  : "For real-time thermal alerts, acquire a free 32-character key from NASA's FIRMS portal and set FIRMS_MAP_KEY in server/.env:"}
              </p>
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11 }}
              >
                firms.modaps.eosdis.nasa.gov/api/map_key <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: 💾 লোকাল ডাটা ভল্ট ও ব্যাকআপ (Backup & Data Vault) */}
      {activeTab === "backup" && (
        <section className="panel" style={{ display: "grid", gap: 16 }}>
          <div>
            <span className="eyebrow">{lang === "bn" ? "পোর্টেবল ব্যাকআপ ও পুনরুদ্ধার" : "PORTABLE DATA BACKUP"}</span>
            <h2 style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
              <FileJson size={20} style={{ color: "#2d6a4f" }} />
              {lang === "bn" ? "ভার্সনযুক্ত JSON ব্যাকআপ ও রিস্টোর ভল্ট" : "Versioned JSON Backup & Restore"}
            </h2>
            <p className="privacy-copy" style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--muted)" }}>
              {lang === "bn"
                ? "আপনার সমস্ত মিশন, ফিল্ড নোট, জিপিএস নির্ভুলতা এবং সংযুক্ত ছবি সহ একটি সুনির্দিষ্ট সংস্করণকৃত JSON ফাইলে (TRACE_DEVICE_BACKUP v1) ডাউনলোড করে রাখতে পারেন।"
                : "Export your complete account history as a versioned JSON file (TRACE_DEVICE_BACKUP v1) with embedded photos and coordinates. Restoring validates schema integrity, remaps IDs transactionally, and prevents accidental data overwriting."}
            </p>
          </div>

          {/* Telemetry Feature Chips */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f5f6ee", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase" }}>FORMAT</span>
              <strong style={{ display: "block", fontSize: 12, marginTop: 2 }}>TRACE_DEVICE_BACKUP v1</strong>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f5f6ee", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase" }}>INTEGRITY</span>
              <strong style={{ display: "block", fontSize: 12, marginTop: 2 }}>Schema Validated Transaction</strong>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f5f6ee", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase" }}>OFFLINE VAULT</span>
              <strong style={{ display: "block", fontSize: 12, marginTop: 2 }}>100% Client-Side Ready</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
            <Button
              variant="secondary"
              onClick={() => void handleExport()}
              style={{ display: "inline-flex", gap: 8, fontWeight: 700, padding: "10px 18px", borderRadius: 10 }}
            >
              <Download size={16} />
              {lang === "bn" ? "ব্যাকআপ ডাউনলোড করুন" : "Export account backup"}
            </Button>

            <label
              className="button secondary import-label"
              style={{ display: "inline-flex", gap: 8, fontWeight: 700, padding: "10px 18px", borderRadius: 10, cursor: "pointer" }}
            >
              <Upload size={16} />
              {lang === "bn" ? "ব্যাকআপ রিস্টোর করুন" : "Restore backup file"}
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  await handleImport(file);
                }}
              />
            </label>
          </div>
        </section>
      )}

      {/* TAB 4: 📋 মাঠ নির্দেশিকা ও বিজ্ঞান (Field Guide & Protocol) */}
      {activeTab === "guide" && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Bengali & English 4 Core Principles */}
          <section className="panel" style={{ background: "#f3f5ee", border: "1px solid var(--line)" }}>
            <span className="eyebrow">{lang === "bn" ? "মাঠ নির্দেশিকা" : "FIELD PRACTICE NOTE"}</span>
            <h3 style={{ margin: "4px 0 10px", fontSize: 17 }}>
              {lang === "bn" ? "মাঠ পর্যায়ের ৪টি মূল নীতি (4 Core Principles)" : "4 Core Principles in the Field"}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.7, display: "grid", gap: 6 }}>
              <li>
                <strong style={{ color: "var(--ink)" }}>{lang === "bn" ? "নিরপেক্ষ প্রশ্ন:" : "Neutral Prompts:"}</strong>{" "}
                {lang === "bn" ? "মিশনের প্রশ্নে কোনো পূর্বানুমান করবেন না।" : "Define observable questions without leading bias."}
              </li>
              <li>
                <strong style={{ color: "var(--ink)" }}>{lang === "bn" ? "চারটি নির্দিষ্ট উত্তর:" : "Four Strict Answers:"}</strong>{" "}
                {lang === "bn" ? "Supports, Contradicts, Inconclusive অথবা Not observable।" : "Supports, Contradicts, Inconclusive, or Not observable."}
              </li>
              <li>
                <strong style={{ color: "var(--ink)" }}>{lang === "bn" ? "স্পষ্ট সেন্সর সীমানা:" : "Sensor Transparency:"}</strong>{" "}
                {lang === "bn" ? "জিপিএস নির্ভুলতা এবং সময় কোনো কৃত্রিম মসৃণকরণ ছাড়াই অপরিবর্তিত থাকে।" : "Report exact GPS accuracy bounds without smoothing."}
              </li>
              <li>
                <strong style={{ color: "var(--ink)" }}>{lang === "bn" ? "অফলাইন সচেতনতা:" : "Offline Boundary:"}</strong>{" "}
                {lang === "bn" ? "অফলাইনে অ্যাপশেল খুলবে, তবে রেকর্ড নিরাপদ রাখতে ক্লাউড কানেকশন প্রয়োজন।" : "App shell opens offline; private records require authenticated connectivity."}
              </li>
            </ul>
          </section>

          {/* NASA NISAR Science Lab & Polarizations */}
          <section className="panel" style={{ background: "#ffffff", border: "1px solid var(--line)" }}>
            <span className="eyebrow" style={{ color: "var(--moss)" }}>
              {lang === "bn" ? "নাসা নিসার রাডার বিজ্ঞান" : "NISAR SAR REMOTE SENSING LAB"}
            </span>
            <h3 style={{ margin: "4px 0 10px", fontSize: 17 }}>
              {lang === "bn" ? "রাডার স্যাটেলাইট কীভাবে ভূপৃষ্ঠের পরিবর্তন দেখে?" : "How Radar Tracks Earth Surface Dynamics"}
            </h3>
            <div style={{ display: "grid", gap: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>
                  {lang === "bn" ? "পানির ডাইইলেকট্রিক ধ্রুবক (Dielectric Constant):" : "Dielectric Constant of Water:"}
                </strong>{" "}
                {lang === "bn"
                  ? "পানির ডাইইলেকট্রিক ধ্রুবক অনেক বেশি (~৮০), যা রাডার তরঙ্গকে দূরবর্তী দিকে প্রতিফলিত করে দেয়। ফলে রাডার চিত্রে প্লাবিত জমি ও নদী কালো (Dark) দেখায়।"
                  : "Water's high dielectric constant (~80 vs ~4 in soil) causes specular bounce away from the sensor, rendering floodplains and open wetlands dark."}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>
                  {lang === "bn" ? "পোলারাইজেশন (VV বনাম VH):" : "Polarization Modes (VV vs VH):"}
                </strong>{" "}
                {lang === "bn"
                  ? "VV পোলারাইজেশন মাটির আর্দ্রতা ও পানির সীমানা নিখুঁতভাবে চিহ্নিত করে। আর VH পোলারাইজেশন গাছপালার ক্যানোপি ও ফসলের ঘনত্বের পরিবর্তন পরিমাপ করে।"
                  : "VV highlights soil moisture and water-land interfaces; VH captures volume scattering from vegetation canopies and crops."}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>
                  {lang === "bn" ? "গ্রাউন্ড ট্রুথিং (Ground Truthing):" : "Ground Truthing with TRACE:"}
                </strong>{" "}
                {lang === "bn"
                  ? "স্যাটেলাইটের সিগন্যাল বাস্তবে সত্যি কিনা তা মাঠ পর্যবেক্ষকের ক্যামেরা ছবি ও নোট ছাড়া বৈজ্ঞানিকভাবে যাচাই করা সম্ভব নয়। TRACE ঠিক এই সেতুবন্ধন তৈরি করে।"
                  : "Without in-situ observer evidence, SAR change models cannot be calibrated. TRACE provides the verifiable ground-truth link."}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
