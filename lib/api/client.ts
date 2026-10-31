import { createClient } from "@/lib/supabase/client";

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "ApiClientError"; }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new ApiClientError("Sign in again to continue.", 401);
  let base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    // In production browser, replace localhost references with same-origin /api/v1 so Next.js proxies to Express
    if (base.includes("localhost") || base.includes("127.0.0.1")) {
      base = "/api/v1";
    }
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (!(init.body instanceof FormData) && init.body !== undefined) headers.set("Content-Type", "application/json");
  let response: Response;
  try { response = await fetch(`${base.replace(/\/$/, "")}${path}`, { ...init, headers, cache: "no-store" }); }
  catch { throw new ApiClientError("TRACE API is unreachable. Check your connection and try again.", 0); }
  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload && typeof payload.error === "object" && payload.error && "message" in payload.error && typeof payload.error.message === "string" ? payload.error.message : `Request failed (${response.status}).`;
    throw new ApiClientError(message, response.status);
  }
  return payload as T;
}
