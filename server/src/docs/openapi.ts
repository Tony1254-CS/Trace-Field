export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TRACE — Tactical Radar-ground-truth Acquisition & Calibration Environment REST API",
    version: "1.0.0-rc.1",
    description:
      "Interactive OpenAPI / Swagger documentation for the TRACE scientific backend. Powers in-situ ground truth collection, epistemic four-valued truth evaluation ($L_4$), NASA Earthdata telemetry integration (Alaska Satellite Facility DAAC, NASA CMR, GIBS WMS, FIRMS), and offline-first encrypted field synchronization.",
    contact: {
      name: "Quintessence Minus Infinity — NASA Space Apps Challenge 2026",
      url: "https://nana-space-apps-2026-trace.onrender.com/",
    },
    license: {
      name: "MIT Open Science License",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current Host Context (Auto-routed through relative /api/v1 rewrite)",
    },
    {
      url: "http://localhost:8000/api/v1",
      description: "Direct Local Express API Server (Port 8000)",
    },
    {
      url: "https://nana-space-apps-2026-trace.onrender.com/api/v1",
      description: "Live Production Cloud Deployment (Render)",
    },
  ],
  tags: [
    {
      name: "NASA Earthdata",
      description: "Real-time telemetry from NASA CMR, Alaska Satellite Facility (ASF DAAC), GIBS WMS, and FIRMS",
    },
    {
      name: "Missions",
      description: "Geographic ground-truth calibration target missions across Bangladesh transects",
    },
    {
      name: "Observations",
      description: "In-situ field notes, photos, and four-valued epistemic classification (supports / contradicts / inconclusive / not-observable)",
    },
    {
      name: "Backup & Sync",
      description: "Encrypted offline archive export and synchronization for field devices",
    },
    {
      name: "System",
      description: "Health checks, service status, and operational uptime diagnostics",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Service health check",
        description: "Returns operational status and ISO 8601 server timestamp.",
        responses: {
          "200": {
            description: "Service is healthy and responding",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "trace-api" },
                    timestamp: { type: "string", format: "date-time", example: "2026-11-09T05:40:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/nasa/status": {
      get: {
        tags: ["NASA Earthdata"],
        summary: "Query NASA & ESA upstream services health",
        description:
          "Performs lightweight connectivity checks against NASA CMR, Alaska Satellite Facility DAAC, NASA GIBS WMTS, and FIRMS.",
        responses: {
          "200": {
            description: "Status report of external satellite data providers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    timestamp: { type: "string", format: "date-time" },
                    services: {
                      type: "object",
                      properties: {
                        cmr: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            url: { type: "string" },
                            status: { type: "string", enum: ["online", "degraded", "checking"] },
                            authenticated: { type: "boolean" },
                          },
                        },
                        asf: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            url: { type: "string" },
                            status: { type: "string", enum: ["online", "degraded", "checking"] },
                            authenticated: { type: "boolean" },
                          },
                        },
                        gibs: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            url: { type: "string" },
                            status: { type: "string", enum: ["available"] },
                            authenticated: { type: "boolean" },
                          },
                        },
                        firms: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            url: { type: "string" },
                            status: { type: "string" },
                            keyConfigured: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/nasa/sar-scenes": {
      get: {
        tags: ["NASA Earthdata"],
        summary: "Retrieve SAR scenes and NASA GIBS WMS layers for coordinates",
        description:
          "Queries the Alaska Satellite Facility (ASF DAAC) for real Sentinel-1 C-SAR / NISAR proxy granules covering the target coordinate, computes NASA GIBS BlueMarble and MODIS WMS bounding boxes, and returns radar scattering physical principles.",
        parameters: [
          {
            name: "lat",
            in: "query",
            required: true,
            description: "Latitude coordinate in decimal degrees (e.g. 25.1200 for Sylhet Haor)",
            schema: { type: "number", minimum: -90, maximum: 90, example: 25.12 },
          },
          {
            name: "lng",
            in: "query",
            required: true,
            description: "Longitude coordinate in decimal degrees (e.g. 91.0700 for Sylhet Haor)",
            schema: { type: "number", minimum: -180, maximum: 180, example: 91.07 },
          },
        ],
        responses: {
          "200": {
            description: "SAR telemetry, WMS URLs, granules, and radar backscatter physics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    target: {
                      type: "object",
                      properties: { lat: { type: "number" }, lng: { type: "number" } },
                    },
                    boundingBox: {
                      type: "object",
                      properties: {
                        minLat: { type: "string" },
                        minLng: { type: "string" },
                        maxLat: { type: "string" },
                        maxLng: { type: "string" },
                      },
                    },
                    worldviewUrl: { type: "string", format: "uri" },
                    gibsImageUrl: { type: "string", format: "uri" },
                    recentModisUrl: { type: "string", format: "uri" },
                    scenes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          granuleName: { type: "string", example: "S1A_IW_GRDH_1SDV_20261105T115822_TRACE_CAL" },
                          polarization: { type: "string", example: "Dual-Pol (VV+VH)" },
                          flightDirection: { type: "string", example: "ASCENDING" },
                          sensor: { type: "string", example: "C-SAR (NISAR Proxy)" },
                          beamModeType: { type: "string", example: "IW" },
                          startTime: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    physicalPrinciples: {
                      type: "object",
                      properties: {
                        dielectricProperty: { type: "string" },
                        roughnessProperty: { type: "string" },
                        polarizations: {
                          type: "object",
                          properties: {
                            VV: { type: "string" },
                            VH: { type: "string" },
                            HH: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid or missing coordinates",
          },
        },
      },
    },
    "/nasa/satellite-context": {
      get: {
        tags: ["NASA Earthdata"],
        summary: "Retrieve NASA CMR satellite context (GPM IMERG Precipitation)",
        description: "Queries NASA CMR granules for precipitation data over the target bounding box.",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number" } },
          { name: "lng", in: "query", required: true, schema: { type: "number" } },
        ],
        responses: {
          "200": { description: "GPM IMERG satellite context granules" },
          "400": { description: "Invalid coordinates" },
        },
      },
    },
    "/missions": {
      get: {
        tags: ["Missions"],
        summary: "List calibration target missions",
        description: "Retrieves active ground truth target missions configured across Bangladesh study areas.",
        responses: {
          "200": {
            description: "Array of calibration target missions",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Mission" },
                },
              },
            },
          },
        },
      },
      POST: {
        tags: ["Missions"],
        summary: "Create a new calibration target mission",
        description: "Creates a ground-truth investigation mission with prompt, place, and optional coordinates.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMissionPayload" },
            },
          },
        },
        responses: {
          "201": {
            description: "Mission created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Mission" },
              },
            },
          },
        },
      },
    },
    "/missions/{id}": {
      get: {
        tags: ["Missions"],
        summary: "Get mission by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Mission details", content: { "application/json": { schema: { $ref: "#/components/schemas/Mission" } } } },
          "404": { description: "Mission not found" },
        },
      },
      patch: {
        tags: ["Missions"],
        summary: "Update mission details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateMissionPayload" } } },
        },
        responses: {
          "200": { description: "Mission updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Mission" } } } },
        },
      },
      delete: {
        tags: ["Missions"],
        summary: "Archive / soft-delete mission",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Mission archived" },
        },
      },
    },
    "/observations": {
      get: {
        tags: ["Observations"],
        summary: "List field observations",
        description: "Returns in-situ observations with four-state epistemic labeling and GPS accuracy.",
        parameters: [
          { name: "missionId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "List of field observations",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Observation" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Observations"],
        summary: "Submit in-situ ground truth observation",
        description:
          "Records field inspection with 4-valued truth logic (supports / contradicts / inconclusive / not-observable), GPS coordinates, accuracy radius, and optional photographic proof.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["status", "notes", "observedAt"],
                properties: {
                  missionId: { type: "string", format: "uuid" },
                  status: {
                    type: "string",
                    enum: ["supports", "contradicts", "inconclusive", "not-observable"],
                    description: "Four-valued truth logic state (L_4 algebra)",
                  },
                  notes: { type: "string", description: "In-situ field notes" },
                  observedAt: { type: "string", format: "date-time" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  accuracyMeters: { type: "number", description: "GPS radial accuracy circle (Δr in meters)" },
                  terrainClass: {
                    type: "string",
                    enum: ["water", "land", "sand", "crop", "urban", "vegetation"],
                    description: "Instant surface categorization",
                  },
                  photo: { type: "string", format: "binary", description: "Field photograph proof" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Observation recorded",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Observation" } } },
          },
        },
      },
    },
    "/backup/export": {
      get: {
        tags: ["Backup & Sync"],
        summary: "Export offline field notebook archive",
        description: "Produces an encrypted, timestamped JSON archive of local ground truth records for peer synchronization.",
        responses: {
          "200": {
            description: "Encrypted export archive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    version: { type: "string" },
                    exportedAt: { type: "string", format: "date-time" },
                    recordsCount: { type: "number" },
                    observations: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/backup/import": {
      post: {
        tags: ["Backup & Sync"],
        summary: "Import and merge field observations archive",
        description: "Validates and merges offline field observations collected during remote expeditions.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["observations"],
                properties: {
                  observations: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Archive merged successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    imported: { type: "number" },
                    skipped: { type: "number" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Mission: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Sylhet Haor Water Inundation" },
          prompt: { type: "string", example: "Is open standing water or saturated marshland visible across the haor basin?" },
          place: { type: "string", example: "Tanguar Haor, Sunamganj" },
          visit_date: { type: "string", format: "date", example: "2026-11-09" },
          target: {
            type: "object",
            nullable: true,
            properties: {
              lat: { type: "number", example: 25.12 },
              lng: { type: "number", example: 91.07 },
            },
          },
          created_at: { type: "string", format: "date-time" },
          archived_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      CreateMissionPayload: {
        type: "object",
        required: ["title", "prompt"],
        properties: {
          title: { type: "string", example: "Jamuna River Bank & Char Dynamics" },
          prompt: { type: "string", example: "Is active bank erosion or emergent sandbar visible?" },
          place: { type: "string", example: "Sariakandi, Jamuna River" },
          visitDate: { type: "string", format: "date" },
          target: {
            type: "object",
            nullable: true,
            properties: {
              lat: { type: "number", example: 24.89 },
              lng: { type: "number", example: 89.62 },
            },
          },
        },
      },
      Observation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          mission_id: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["supports", "contradicts", "inconclusive", "not-observable"],
            example: "supports",
          },
          notes: { type: "string", example: "Observed standing water across lower char fields." },
          observed_at: { type: "string", format: "date-time" },
          lat: { type: "number", nullable: true, example: 25.1205 },
          lng: { type: "number", nullable: true, example: 91.0712 },
          accuracy_meters: { type: "number", nullable: true, example: 4.8 },
          terrain_class: { type: "string", nullable: true, example: "water" },
          photo_url: { type: "string", format: "uri", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

