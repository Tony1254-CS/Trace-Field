import { createClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import type { Database } from "../../../lib/supabase/database.types.js";

export const requireUser: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) { res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } }); return; }

  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Supabase is not configured." } });
      return;
    }
    const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) { res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Your session has expired. Sign in again." } }); return; }
    res.locals.user = user;
    res.locals.supabase = supabase;
    next();
  } catch (error) { next(error); }
};
