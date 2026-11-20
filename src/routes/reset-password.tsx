import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Novels Forever" },
      { name: "description", content: "Choose a new password for your Novels Forever owner account." },
      { property: "og:title", content: "Set New Password — Novels Forever" },
      { property: "og:description", content: "Choose a new owner password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    void navigate({ to: "/admin", replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="gold-frame rounded-2xl bg-card-grad p-8">
        <h1 className="font-display text-4xl font-semibold">Set a new password</h1>
        {ready ? (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" aria-label="New password" autoComplete="new-password" />
            <Button type="submit" variant="gold" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Open this page from the reset link in your email.</p>
        )}
      </div>
    </div>
  );
}
