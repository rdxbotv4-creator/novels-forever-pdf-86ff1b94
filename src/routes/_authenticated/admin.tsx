import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { adminPdfListQuery, isAdminQuery, removeNovelPdf, uploadNovelPdf } from "@/lib/admin";
import { byViews, searchNovels } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Owner Area — Novels Forever" },
      { name: "description", content: "Upload and manage novel PDFs on Novels Forever." },
      { property: "og:title", content: "Owner Area — Novels Forever" },
      { property: "og:description", content: "Manage novel PDFs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useQuery(isAdminQuery(user.id));
  const { data: pdfs } = useQuery({ ...adminPdfListQuery(), enabled: isAdmin === true });
  const [q, setQ] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const list = searchNovels(q, byViews).slice(0, 30);
  const pdfMap = new Map((pdfs ?? []).map((p) => [p.novel_slug, p]));

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const upload = async (slug: string, file: File | undefined) => {
    if (!file) return;
    setBusySlug(slug);
    try {
      await uploadNovelPdf(slug, file);
      toast.success("PDF uploaded.");
      await qc.invalidateQueries({ queryKey: ["novel-pdf"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusySlug(null);
    }
  };

  const remove = async (slug: string, path: string) => {
    setBusySlug(slug);
    try {
      await removeNovelPdf(slug, path);
      toast.success("PDF removed.");
      await qc.invalidateQueries({ queryKey: ["novel-pdf"] });
    } catch {
      toast.error("Could not remove the PDF.");
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Owner area</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">PDF uploads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Button variant="glass" onClick={() => void signOut()}>Sign out</Button>
      </div>
      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Checking access…</p>
      ) : !isAdmin ? (
        <p className="mt-8 rounded-2xl border border-border bg-card-grad p-6 text-muted-foreground">
          This account is not an admin yet. Ask for admin access to be given to {user.email}.
        </p>
      ) : (
        <>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search novel…" aria-label="Search novel" className="mt-8 h-11" />
          <ul className="mt-6 space-y-3">
            {list.map((n) => {
              const pdf = pdfMap.get(n.slug);
              return (
                <li key={n.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <span className="min-w-0">
                    <span className="block font-medium">{n.name}</span>
                    <span className="block text-xs text-muted-foreground">{pdf ? "PDF uploaded" : "No PDF yet"}{n.author ? ` · ${n.author}` : ""}</span>
                  </span>
                  <span className="flex gap-2">
                    <label className="cursor-pointer rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                      {busySlug === n.slug ? "Working…" : pdf ? "Replace PDF" : "Upload PDF"}
                      <input type="file" accept="application/pdf" className="sr-only" disabled={busySlug !== null} onChange={(e) => void upload(n.slug, e.target.files?.[0])} />
                    </label>
                    {pdf && (
                      <Button size="sm" variant="glass" disabled={busySlug !== null} onClick={() => void remove(n.slug, pdf.file_path)}>Remove</Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
