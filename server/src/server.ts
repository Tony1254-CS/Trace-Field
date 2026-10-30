import { createServer } from "node:http";
import { assertSupabaseConfigured, env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

try { assertSupabaseConfigured(); }
catch (error) { logger.error({ message: error instanceof Error ? error.message : error }, "Startup configuration error"); process.exit(1); }

const server = createServer(createApp());
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.listen(env.API_PORT, "0.0.0.0", () => logger.info({ port: env.API_PORT }, "TRACE API listening"));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close((error) => {
    if (error) { logger.error({ err: error }, "API shutdown failed"); process.exitCode = 1; }
    else logger.info("TRACE API stopped cleanly");
  }));
}
