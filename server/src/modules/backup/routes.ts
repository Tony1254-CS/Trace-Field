import express, { Router } from "express";
import { requireUser } from "../../middleware/auth.js";
import { exportBackup, restoreBackup } from "./services/backup.js";

export const backupRoutes = Router();
backupRoutes.use(requireUser);
backupRoutes.get("/export", async (_req, res) => {
  const payload = await exportBackup(res.locals.supabase, res.locals.user.id);
  res.json(payload);
});
backupRoutes.post("/restore", express.json({ limit: "30mb" }), async (req, res) => {
  const imported = await restoreBackup(res.locals.supabase, res.locals.user.id, req.body);
  res.json({ imported });
});
