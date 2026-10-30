"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const authSchema = z.object({ email: z.email("Enter a valid email address."), password: z.string().min(8, "Use at least 8 characters.").max(128) });
type AuthValues = z.infer<typeof authSchema>;

export function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AuthValues>({ resolver: zodResolver(authSchema) });

  const submit = handleSubmit(async ({ email, password }) => {
    setPending(true);
    try {
      const supabase = createClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else window.location.reload();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not authenticate. Try again."); }
    finally { setPending(false); }
  });

  return <main className="auth-frame"><section className="auth-card" aria-labelledby="auth-title">
    <Link className="brand" href="/" aria-label="TRACE home"><span className="brand-mark"><Compass size={26} aria-hidden="true" /></span><span className="brand-copy"><strong>TRACE</strong><small>FIELD NOTEBOOK</small></span></Link>
    <span className="eyebrow" style={{ marginTop: 28 }}>FIELD NOTES / READY WHEN YOU ARE</span>
    <h1 id="auth-title">{mode === "signin" ? "Go where the evidence is." : "Create your TRACE account."}</h1>
    <p>Record observations with their mission and evidence. Your records are private to your account.</p>
    <form className="auth-form" onSubmit={submit} noValidate>
      <label>Email<input type="email" autoComplete="email" required {...register("email")} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="form-error">{errors.email.message}</span>}</label>
      <label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required {...register("password")} aria-invalid={Boolean(errors.password)} />{errors.password && <span className="form-error">{errors.password.message}</span>}</label>
      <Button type="submit" disabled={pending}>{pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight size={16} aria-hidden="true" /></Button>
    </form>
    <p className="auth-switch">{mode === "signin" ? "New to TRACE?" : "Already have an account?"} <button className="text-link" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create account" : "Sign in"}</button></p>
    <p className="helper" style={{ marginTop: 18 }}>Sign-in and private records require the Supabase project configured by the maintainer.</p>
  </section></main>;
}
