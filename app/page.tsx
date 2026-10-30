import { AuthPanel } from "@/components/auth/auth-panel";
import { Dashboard } from "@/components/layout/dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return <main className="auth-frame"><section className="auth-card"><span className="eyebrow">TRACE / SETUP NEEDED</span><h1>Connect your Supabase project.</h1><p>Copy <code>.env.example</code> to <code>.env.local</code>, add your project URL and publishable key, then apply the migration in <code>supabase/migrations</code>.</p><p className="helper">No service-role key is needed or accepted by this application.</p></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase!.auth.getUser();
  return user ? <Dashboard email={user.email ?? ""} /> : <AuthPanel />;
}
