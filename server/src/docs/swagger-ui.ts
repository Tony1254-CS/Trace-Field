import { Request, Response } from "express";
import { openApiSpec } from "./openapi.js";

/**
 * Clean, Human-Friendly API Documentation (Scalar Engine)
 * - Minimalist layout with zero visual clutter
 * - Instant search (Ctrl + K)
 * - One-click test request console
 * - Fast code snippets in cURL, JavaScript, Python
 */
export function renderModernDocs(_req: Request, res: Response) {
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TRACE API Reference</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d6a4f' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='m4.93 4.93 4.24 4.24'/><path d='m14.83 9.17 4.24-4.24'/><circle cx='12' cy='12' r='2'/></svg>" />
    <style>
      body { margin: 0; padding: 0; background: #0b0f19; }
      /* Minimalist top switch bar */
      .quick-nav {
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 9999;
        display: flex;
        gap: 8px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        padding: 6px 10px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .quick-nav a {
        color: #94a3b8;
        text-decoration: none;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 12px;
        transition: all 0.15s ease;
      }
      .quick-nav a:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }
    </style>
  </head>
  <body>
    <div class="quick-nav">
      <a href="/" title="Open Main Application">← TRACE App</a>
      <a href="/docs/swagger" title="View classic Swagger UI">Classic Swagger</a>
      <a href="/api/v1/openapi.json" target="_blank" title="View Raw OpenAPI JSON">JSON Spec</a>
    </div>

    <script
      id="api-reference"
      data-url="/api/v1/openapi.json"
      data-configuration='{
        "theme": "kepler",
        "layout": "modern",
        "darkMode": true,
        "showSidebar": true,
        "hideDownloadButton": true,
        "searchHotKey": "k",
        "metaData": {
          "title": "TRACE API Reference"
        }
      }'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  </body>
</html>`);
}

/**
 * Clean Classic Swagger UI (Streamlined without clutter)
 */
export function renderSwaggerUi(_req: Request, res: Response) {
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TRACE — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d6a4f' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='m4.93 4.93 4.24 4.24'/><path d='m14.83 9.17 4.24-4.24'/><circle cx='12' cy='12' r='2'/></svg>" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .quick-nav {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      gap: 8px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      padding: 6px 12px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .quick-nav a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 12px;
    }
    .quick-nav a:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
    }
    #swagger-ui {
      max-width: 1080px;
      margin: 20px auto 80px;
      padding: 0 16px;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0 20px; }
    .swagger-ui .info .title { font-size: 26px; font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <div class="quick-nav">
    <a href="/" title="Open Main Application">← TRACE App</a>
    <a href="/docs" title="View Modern Reference">✨ Modern View</a>
    <a href="/api/v1/openapi.json" target="_blank" title="Raw JSON">JSON</a>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 0,
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
