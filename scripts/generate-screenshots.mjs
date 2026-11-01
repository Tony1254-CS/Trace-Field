import sharp from "sharp";
import fs from "node:fs";

if (!fs.existsSync("public/screenshots")) {
  fs.mkdirSync("public/screenshots", { recursive: true });
}

// 1. Generate Desktop Screenshot (1280x720)
const desktopSvg = `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#0f172a" />
  <!-- Header -->
  <rect width="1280" height="64" fill="#1e293b" />
  <circle cx="48" cy="32" r="18" fill="#10b981" />
  <text x="78" y="38" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">TRACE FIELD NOTEBOOK</text>
  <rect x="1100" y="16" width="140" height="32" rx="8" fill="#10b981" />
  <text x="1118" y="37" fill="#0f172a" font-family="sans-serif" font-weight="bold" font-size="13">ACTIVE STATION</text>
  
  <!-- Content Cards -->
  <rect x="48" y="96" width="560" height="576" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <text x="76" y="140" fill="#10b981" font-family="sans-serif" font-weight="bold" font-size="12">SAR SATELLITE RADAR · SENTINEL-1 / NISAR</text>
  <text x="76" y="172" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="22">Sylhet Haor Water Inundation</text>
  <rect x="76" y="196" width="504" height="260" rx="12" fill="#0284c7" opacity="0.3" />
  <circle cx="328" cy="326" r="60" fill="#0ea5e9" opacity="0.6" />
  <text x="190" y="332" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">HAOR BASIN WATER MAPPING</text>
  <text x="76" y="490" fill="#94a3b8" font-family="sans-serif" font-size="14">Active microwave backscatter calibrated with ground-truth observations.</text>

  <!-- Right Panel -->
  <rect x="640" y="96" width="592" height="576" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <text x="668" y="140" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="12">GROUND EVIDENCE VAULT</text>
  <text x="668" y="172" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="22">IndexedDB Offline Records</text>
  <rect x="668" y="200" width="536" height="100" rx="12" fill="#0f172a" stroke="#334155" />
  <text x="692" y="235" fill="#34d399" font-family="sans-serif" font-weight="bold" font-size="14">Supports Satellite Change</text>
  <text x="692" y="260" fill="#94a3b8" font-family="sans-serif" font-size="12">Tanguar Haor · GPS 25.1200 N, 91.0700 E · Photo Verified</text>
</svg>
`;

// 2. Generate Mobile Screenshot (720x1280)
const mobileSvg = `
<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
  <rect width="720" height="1280" fill="#0f172a" />
  <!-- Mobile Status Bar -->
  <rect width="720" height="56" fill="#1e293b" />
  <text x="36" y="36" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">TRACE Field</text>
  <text x="560" y="36" fill="#10b981" font-family="sans-serif" font-weight="bold" font-size="16">100% Offline</text>

  <!-- Card 1 -->
  <rect x="32" y="80" width="656" height="420" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <text x="60" y="126" fill="#10b981" font-family="sans-serif" font-weight="bold" font-size="15">FIELD EVIDENCE CAPTURE</text>
  <text x="60" y="165" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="24">Jamuna River Bank &amp; Char</text>
  <rect x="60" y="190" width="600" height="200" rx="14" fill="#047857" opacity="0.25" />
  <text x="180" y="300" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">GPS Geotagged Photo</text>
  <text x="60" y="425" fill="#94a3b8" font-family="sans-serif" font-size="16">Sariakandi · High-precision silt boundary</text>

  <!-- Card 2: Voice Guide -->
  <rect x="32" y="520" width="656" height="360" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <text x="60" y="566" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="15">MODERN AUDIO GUIDE</text>
  <text x="60" y="605" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="22">NASA Radar &amp; Earth Surface Change</text>
  <rect x="60" y="630" width="600" height="140" rx="14" fill="#0284c7" opacity="0.2" />
  <text x="120" y="710" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="18">Voice Player: Active Microwave Remote Sensing</text>
  <text x="60" y="820" fill="#94a3b8" font-family="sans-serif" font-size="16">Multi-step audio narrative with synchronized subtitles</text>

  <!-- Bottom Nav -->
  <rect y="1180" width="720" height="100" fill="#1e293b" />
  <text x="90" y="1238" fill="#10b981" font-family="sans-serif" font-weight="bold" font-size="18">Missions</text>
  <text x="270" y="1238" fill="#94a3b8" font-family="sans-serif" font-size="18">Capture</text>
  <text x="450" y="1238" fill="#94a3b8" font-family="sans-serif" font-size="18">Records</text>
  <text x="610" y="1238" fill="#94a3b8" font-family="sans-serif" font-size="18">Guide</text>
</svg>
`;

await Promise.all([
  sharp(Buffer.from(desktopSvg)).png().toFile("public/screenshots/desktop-radar.png"),
  sharp(Buffer.from(mobileSvg)).png().toFile("public/screenshots/mobile-capture.png"),
]);

console.log("PWA Screenshots generated successfully!");

