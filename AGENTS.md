<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The novel library (novels, authors, playlists, categories) comes from the static `src/data/catalog.json` via `src/lib/catalog.ts`; only community data (stats, reviews, feedback, PDFs) lives in Lovable Cloud — keeps pages fast and SSR-friendly.
- Novel PDFs live in a private storage bucket and are opened through short-lived signed links — public buckets are blocked on this project.
- Reader "login" is a name stored in the browser only, not a real account; admin rights come solely from the `user_roles` table.
- Visitors read community data only through bounded database functions (one novel's reviews/stats/rating, latest reviews, PDF list without file paths); direct table reads are admin-only — keeps every public read limited to what a page shows.
- PDF links for visitors come from the `getPdfLink` server function (short-lived signed links for registered PDFs only); the bucket has no visitor read rule — files can't be listed or fetched directly.
