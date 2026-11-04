import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireUser } from "../../middleware/auth.js";
import { exportBackup, restoreBackup } from "./services/backup.js";

const restoreLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many restore requests. Please try again later." } },
});

export const backupRoutes = Router();
backupRoutes.use(requireUser);
backupRoutes.get("/export", async (_req, res) => {
  const payload = await exportBackup(res.locals.supabase, res.locals.user.id);
  res.json(payload);
});
backupRoutes.post("/restore", restoreLimiter, express.json({ limit: "30mb" }), async (req, res) => {
  const imported = await restoreBackup(res.locals.supabase, res.locals.user.id, req.body);
  res.json({ imported });
});
