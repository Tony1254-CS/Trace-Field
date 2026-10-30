import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { listQuerySchema } from "../../../../lib/validations/trace.js";
import { requireUser } from "../../middleware/auth.js";
import { createObservation, deleteObservation, getObservation, listObservations } from "./services/observations.js";
import { multipartObservationSchema } from "./schemas/observation.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 1, fieldSize: 20_000 } });
export const observationRoutes = Router();
observationRoutes.use(requireUser);

observationRoutes.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  res.json(await listObservations(res.locals.supabase, res.locals.user.id, query));
});

observationRoutes.get("/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  res.json({ data: await getObservation(res.locals.supabase, res.locals.user.id, id) });
});

observationRoutes.post("/", upload.single("photo"), async (req, res) => {
  const { payload } = multipartObservationSchema.parse(req.body);
  res.status(201).json({ data: await createObservation(res.locals.supabase, res.locals.user.id, payload, req.file) });
});

observationRoutes.delete("/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  await deleteObservation(res.locals.supabase, res.locals.user.id, id);
  res.status(204).end();
});
