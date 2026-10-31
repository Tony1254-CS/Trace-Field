import { spawnSync } from "node:child_process";

// Guarantee that next build always runs in production mode,
// preventing any "NODE_ENV=development" in hosting providers (like Render)
// from corrupting Next.js prerender workers.
const env = { ...process.env };
delete env.NODE_ENV;
env.NODE_ENV = "production";

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(executable, ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env,
});

process.exit(result.status ?? 0);
