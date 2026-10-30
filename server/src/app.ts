import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { logger } from "./utils/logger.js";
import { missionRoutes } from "./modules/missions/routes.js";
import { observationRoutes } from "./modules/observations/routes.js";
import { backupRoutes } from "./modules/backup/routes.js";
import { nasaRoutes } from "./modules/nasa/routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Authorization", "Content-Type"], maxAge: 600 }));
  app.use(pinoHttp({ logger, redact: ["req.headers.authorization", "req.headers.cookie"] }));
  app.get("/api/v1/health", (_req, res) => res.json({ status: "ok", service: "trace-api", timestamp: new Date().toISOString() }));
  app.use("/api/v1", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
  app.use("/api/v1", (_req, res, next) => { res.setHeader("Cache-Control", "private, no-store"); next(); });
  app.use("/api/v1/backup", backupRoutes);
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/v1/missions", missionRoutes);
  app.use("/api/v1/observations", observationRoutes);
  app.use("/api/v1/nasa", nasaRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
