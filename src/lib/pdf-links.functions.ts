import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Hands out a short-lived link to a library PDF. Visitors cannot read the private bucket
 * directly; only PDFs registered in the library can be opened, and only for 10 minutes.
 * Returns the link's path so the browser joins it with the public backend address.
 */
export const getPdfLink = createServerFn({ method: "POST" })
  .validator(
    z.object({
      slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
      download: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("novel_pdfs")
      .select("file_path")
      .eq("novel_slug", data.slug)
      .maybeSingle();
    if (error) {
      console.error("pdf lookup failed", error.message);
      throw new Error("Could not open the PDF.");
    }
    if (!row) return { path: null };

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("novel-pdfs")
      .createSignedUrl(row.file_path, 60 * 10, data.download ? { download: `${data.slug}.pdf` } : undefined);
    if (signErr || !signed) {
      console.error("pdf link failed", signErr?.message);
      throw new Error("Could not open the PDF.");
    }
    const at = signed.signedUrl.indexOf("/storage/v1/");
    return { path: at >= 0 ? signed.signedUrl.slice(at) : null };
  });
