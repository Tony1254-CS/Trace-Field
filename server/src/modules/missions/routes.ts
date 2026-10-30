import { Router } from "express";
import { missionCreateSchema, missionUpdateSchema } from "../../../../lib/validations/trace.js";
import { requireUser } from "../../middleware/auth.js";
import { createMission, listMissions, updateMission } from "./services/missions.js";
import { z } from "zod";

export const missionRoutes = Router();
missionRoutes.use(requireUser);

missionRoutes.get("/", async (_req, res) => {
  res.json({ data: await listMissions(res.locals.supabase, res.locals.user.id) });
});

missionRoutes.post("/", async (req, res) => {
  const input = missionCreateSchema.parse(req.body);
  res.status(201).json({ data: await createMission(res.locals.supabase, res.locals.user.id, input) });
});

missionRoutes.patch("/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = missionUpdateSchema.parse(req.body);
  if (Object.keys(input).length === 0) { res.status(400).json({ error: { code: "EMPTY_UPDATE", message: "Provide at least one field to update." } }); return; }
  res.json({ data: await updateMission(res.locals.supabase, res.locals.user.id, id, input) });
});
