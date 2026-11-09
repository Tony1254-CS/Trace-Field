import { Request, Response } from "express";
import { openApiSpec } from "./openapi.js";

export function renderSwaggerUi(_req: Request, res: Response) {
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TRACE REST API — OpenAPI / Swagger Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d6a4f' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='m4.93 4.93 4.24 4.24'/><path d='m14.83 9.17 4.24-4.24'/><circle cx='12' cy='12' r='2'/></svg>" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .trace-header {
      background: #090d16;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .trace-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .trace-logo-badge {
      background: #2d6a4f;
      color: #d6f05d;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.1em;
      padding: 6px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      box-shadow: 0 0 12px rgba(214, 240, 93, 0.2);
    }
    .trace-title {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }
    .trace-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin: 2px 0 0;
    }
    .trace-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .trace-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .trace-btn-app {
      background: #2563eb;
      color: #ffffff;
    }
    .trace-btn-app:hover {
      background: #1d4ed8;
    }
    .trace-btn-json {
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .trace-btn-json:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    /* Swagger container dark mode adjustments */
    #swagger-ui {
      max-width: 1280px;
      margin: 0 auto;
      padding: 20px;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui {
      background: #ffffff;
      border-radius: 12px;
      margin-top: 20px;
      margin-bottom: 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  <header class="trace-header">
    <div class="trace-brand">
      <span class="trace-logo-badge">TRACE</span>
      <div>
        <h1 class="trace-title">Tactical Radar Calibration Environment — OpenAPI / Swagger UI</h1>
        <p class="trace-subtitle">Interactive REST API Documentation · NASA Space Apps Challenge 2026</p>
      </div>
    </div>
    <div class="trace-actions">
      <a href="/api/v1/openapi.json" target="_blank" class="trace-btn trace-btn-json">
        <span>📄 openapi.json</span>
      </a>
      <a href="/" class="trace-btn trace-btn-app">
        <span>🚀 Open Web App</span>
      </a>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
}

export function getOpenApiJson(_req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json(openApiSpec);
}

