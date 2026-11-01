import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/api-error.js";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "This API route does not exist." } });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error && typeof error === "object" && "status" in error && (error.status === 413 || error.status === 400)) {
    const status = error.status;
    res.status(status).json({ error: { code: status === 413 ? "REQUEST_TOO_LARGE" : "INVALID_JSON", message: status === 413 ? "Request is too large." : "Request body is not valid JSON." } });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the submitted fields.", details: error.issues.map(({ path, message }) => ({ path: path.join("."), message })) } });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: { code: "UPLOAD_ERROR", message: error.code === "LIMIT_FILE_SIZE" ? "Photo must be 8 MB or smaller." : "The photo upload could not be accepted." } });
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  logger.error({ err: error }, "Request failed");
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: process.env.NODE_ENV === "production" ? "Something went wrong. Please try again." : message } });
};
