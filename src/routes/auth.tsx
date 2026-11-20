import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GoogleLogo } from "@/components/site/GoogleLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

// Username logins map to an internal email; the prefix lets short owner passwords meet the minimum length.
const ADMIN_DOMAIN = "novelsforever.app";
const PASS_PREFIX = "nf-";

type AuthSearch = { redirect?: string | undefined };

function safePath(value: string | undefined): string {
  if (!value) return "/admin";
  try {
    const url = new URL(value, "http://x");
    if (url.origin !== "http://x" && typeof window !== "undefined" && url.origin !== window.location.origin) return "/admin";
    const path = url.pathname + url.search;
    return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/auth") ? path : "/admin";
  } catch {
    return "/admin";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch =>
    typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Owner Sign In — Novels Forever" },
      { name: "description", content: "Sign in to the Novels Forever owner area to manage novel PDFs, reviews and feedback." },
      { property: "og:title", content: "Owner Sign In — Novels Forever" },
      { property: "og:description", content: "Owner area for Novels Forever." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const go = () => void navigate({ to: safePath(redirect), replace: true });
    void supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) go();
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const login = email.includes("@") ? email.trim() : `${email.trim().toLowerCase()}@${ADMIN_DOMAIN}`;
        const pass = email.includes("@") ? password : `${PASS_PREFIX}${password}`;
        const { error } = await supabase.auth.signInWithPassword({ email: login, password: pass });
        if (error) throw new Error("Wrong username or password.");
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (!data.session) setSent("Check your email and click the link to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Check your email for a link to set a new password.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error("Google sign-in failed. Please try again.");
  };

  const title = mode === "signin" ? "Admin portal" : mode === "signup" ? "Create owner account" : "Reset password";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <div className="gold-frame rounded-2xl bg-card-grad p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Owner area</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For uploading novel PDFs and managing reviews. Readers don't need this — they log in with just a name.
        </p>
        {sent ? (
          <p className="mt-6 rounded-lg border border-primary/40 p-4 text-sm">{sent}</p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <Input type={mode === "signin" ? "text" : "email"} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={mode === "signin" ? "Username" : "Email"} aria-label={mode === "signin" ? "Username" : "Email"} autoComplete="username" />
              {mode !== "forgot" && (
                <Input type="password" required minLength={mode === "signin" ? 1 : 6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              )}
              <Button type="submit" variant="gold" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
      </div>
      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-primary">← Back to the library</Link>
    </div>
  );
}
