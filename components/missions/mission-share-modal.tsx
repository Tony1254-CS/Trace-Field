"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode, Share2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Mission } from "@/features/missions/types";

interface MissionShareModalProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MissionShareModal({ mission, open, onOpenChange }: MissionShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const shareUrl =
    typeof window !== "undefined" && mission
      ? `${window.location.origin}?missionId=${encodeURIComponent(mission.id)}`
      : "";

  useEffect(() => {
    if (!shareUrl) return;

    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error("Failed to generate QR code", err);
      });
  }, [shareUrl]);

  if (!mission) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Mission link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `TRACE Mission: ${mission.title}`,
          text: `Field Investigation: ${mission.prompt}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      void handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-form" style={{ width: "min(460px, calc(100% - 24px))" }}>
        <div className="dialog-head">
          <div>
            <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <QrCode size={13} />
              INVESTIGATION HANDOFF & SHARING
            </span>
            <DialogTitle>Share Mission with Field Team</DialogTitle>
          </div>
        </div>

        <DialogDescription className="helper">
          Scan this QR code from any mobile device or share the link to immediately open this investigation and begin
          guided field capture.
        </DialogDescription>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "16px 0" }}>
          <div
            style={{
              padding: 12,
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid var(--line, #e2e8f0)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code to open mission ${mission.title}`}
                style={{ width: 220, height: 220, display: "block", borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Generating QR code…</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <strong style={{ fontSize: 14, color: "var(--ink)" }}>{mission.title}</strong>
            {mission.place && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>📍 {mission.place}</div>
            )}
            {mission.target && (
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--moss)", marginTop: 2 }}>
                Target: {mission.target.lat.toFixed(4)}°N, {mission.target.lng.toFixed(4)}°E
              </div>
            )}
          </div>
        </div>

        {/* Share URL Box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px solid var(--line, #e2e8f0)",
            fontSize: 12,
          }}
        >
          <input
            type="text"
            readOnly
            value={shareUrl}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink)",
              textOverflow: "ellipsis",
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            style={{ height: 30, padding: "0 10px", fontSize: 11, gap: 5 }}
          >
            {copied ? <Check size={13} style={{ color: "var(--moss)" }} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="dialog-actions" style={{ marginTop: 16 }}>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button type="button" variant="primary" onClick={handleNativeShare} style={{ gap: 6 }}>
              <Share2 size={14} /> Share via Phone
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Done
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
