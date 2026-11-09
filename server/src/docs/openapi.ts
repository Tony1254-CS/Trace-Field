export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TRACE REST API",
    version: "1.0.0",
    description: "Lightweight REST API for NASA satellite telemetry, field targets, and ground-truth observations.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Default API Gateway",
    },
  ],
  tags: [
    { name: "NASA Telemetry", description: "Satellite radar scenes and NASA GIBS imagery" },
    { name: "Missions", description: "Field calibration targets and study locations" },
    { name: "Observations", description: "In-situ field notes, photos, and validation" },
    { name: "Sync", description: "Offline archive export and import" },
    { name: "System", description: "Health and operational checks" },
  ],
  paths: {
    "/nasa/sar-scenes": {
      get: {
        tags: ["NASA Telemetry"],
        summary: "Get Sentinel-1 SAR scenes & GIBS layers",
        parameters: [
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", example: 25.12 },
            description: "Latitude (-90 to 90)",
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", example: 91.07 },
            description: "Longitude (-180 to 180)",
          },
        ],
        responses: {
          "200": {
            description: "SAR granules, GIBS WMS URLs, and radar properties",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    target: { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
                    worldviewUrl: { type: "string" },
                    gibsImageUrl: { type: "string" },
                    recentModisUrl: { type: "string" },
                    scenes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          granuleName: { type: "string", example: "S1A_IW_GRDH_1SDV_20261105T115822_TRACE_CAL" },
                          polarization: { type: "string", example: "Dual-Pol (VV+VH)" },
                          flightDirection: { type: "string", example: "ASCENDING" },
                          sensor: { type: "string", example: "C-SAR (NISAR Proxy)" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid coordinates" },
        },
      },
    },
    "/nasa/status": {
      get: {
        tags: ["NASA Telemetry"],
        summary: "Check NASA & ASF services status",
        responses: {
          "200": {
            description: "Online/degraded status of CMR, ASF DAAC, GIBS, and FIRMS",
          },
        },
      },
    },
    "/nasa/satellite-context": {
      get: {
        tags: ["NASA Telemetry"],
        summary: "Get GPM IMERG precipitation context",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number", example: 25.12 } },
          { name: "lng", in: "query", required: true, schema: { type: "number", example: 91.07 } },
        ],
        responses: {
          "200": { description: "Precipitation granules for bounding box" },
        },
      },
    },
    "/missions": {
      get: {
        tags: ["Missions"],
        summary: "List all calibration missions",
        responses: {
          "200": {
            description: "Active missions list",
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
      post: {
        tags: ["Missions"],
        summary: "Create a calibration mission",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "prompt"],
                properties: {
                  title: { type: "string", example: "Sylhet Haor Water Inundation" },
                  prompt: { type: "string", example: "Is standing water visible across the haor?" },
                  place: { type: "string", example: "Tanguar Haor, Sunamganj" },
                  target: {
                    type: "object",
                    properties: { lat: { type: "number", example: 25.12 }, lng: { type: "number", example: 91.07 } },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Mission created" },
        },
      },
    },
    "/missions/{id}": {
      get: {
        tags: ["Missions"],
        summary: "Get mission by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Mission details" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Missions"],
        summary: "Update mission",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  prompt: { type: "string" },
                  place: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Mission updated" },
        },
      },
      delete: {
        tags: ["Missions"],
        summary: "Archive mission",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Archived" },
        },
      },
    },
    "/observations": {
      get: {
        tags: ["Observations"],
        summary: "List field observations",
        parameters: [
          { name: "missionId", in: "query", schema: { type: "string" }, description: "Filter by mission" },
        ],
        responses: {
          "200": {
            description: "List of ground truth records",
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
        summary: "Submit field observation",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["status", "notes", "observedAt"],
                properties: {
                  missionId: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["supports", "contradicts", "inconclusive", "not-observable"],
                    example: "supports",
                  },
                  notes: { type: "string", example: "Water confirmed at river bank" },
                  observedAt: { type: "string", format: "date-time" },
                  lat: { type: "number", example: 25.12 },
                  lng: { type: "number", example: 91.07 },
                  accuracyMeters: { type: "number", example: 5 },
                  photo: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Observation recorded" },
        },
      },
    },
    "/backup/export": {
      get: {
        tags: ["Sync"],
        summary: "Export offline field notebook",
        responses: {
          "200": { description: "JSON archive of local records" },
        },
      },
    },
    "/backup/import": {
      post: {
        tags: ["Sync"],
        summary: "Import field observations archive",
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
          "200": { description: "Archive imported and merged" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Service health check",
        responses: {
          "200": {
            description: "Service is online",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", example: "2026-11-09T18:00:00.000Z" },
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
          id: { type: "string" },
          title: { type: "string", example: "Sylhet Haor Water Inundation" },
          prompt: { type: "string", example: "Is open standing water visible?" },
          place: { type: "string", example: "Tanguar Haor, Sunamganj" },
          target: {
            type: "object",
            nullable: true,
            properties: { lat: { type: "number", example: 25.12 }, lng: { type: "number", example: 91.07 } },
          },
          created_at: { type: "string" },
        },
      },
      Observation: {
        type: "object",
        properties: {
          id: { type: "string" },
          mission_id: { type: "string" },
          status: { type: "string", enum: ["supports", "contradicts", "inconclusive", "not-observable"] },
          notes: { type: "string" },
          observed_at: { type: "string" },
          lat: { type: "number", nullable: true },
          lng: { type: "number", nullable: true },
          photo_url: { type: "string", nullable: true },
        },
      },
    },
  },
};
