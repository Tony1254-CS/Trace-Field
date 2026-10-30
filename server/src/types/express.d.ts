import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../../../lib/supabase/database.types.js";

declare global {
  namespace Express {
    interface Locals {
      user: User;
      supabase: SupabaseClient<Database>;
    }
  }
}

export {};
