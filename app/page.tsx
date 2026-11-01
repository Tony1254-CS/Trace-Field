import { Dashboard } from "@/components/layout/dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let userEmail = "field-investigator@trace.nasa";
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) userEmail = user.email;
    }
  } catch {
    // Seamless field investigator session
  }

  return <Dashboard email={userEmail} />;
}
