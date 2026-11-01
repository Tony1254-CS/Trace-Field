import { createClient } from "@/lib/supabase/client";

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "ApiClientError"; }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token: string | undefined = undefined;
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {
    // Unauthenticated / guest investigator mode
  }

  let base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  if (typeof window !== "undefined") {
    // In browser, always route through relative /api/v1 (which Next.js rewrites to Express on port 8000)
    // This avoids CORS issues and ensures seamless connectivity in both localhost and production
    base = "/api/v1";
  }
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
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
