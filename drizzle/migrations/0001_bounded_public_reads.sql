-- Reviews: direct reads are admin-only; visitors use bounded functions below.
drop policy if exists "Reviews are public" on public.reviews;
create policy "Admins read reviews" on public.reviews for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
revoke select on public.reviews from anon;
revoke select on public.novel_ratings from anon, authenticated;
comment on view public.novel_ratings is 'DEPRECATED: replaced by public.get_novel_rating';

-- Stats: no direct reads; get_novel_stats returns one novel's counts.
drop policy if exists "Stats are public" on public.novel_stats;
revoke select on public.novel_stats from anon, authenticated;

-- PDF list: direct reads are admin-only; visitors get the list without file locations.
drop policy if exists "PDF list is public" on public.novel_pdfs;
create policy "Admins read pdfs" on public.novel_pdfs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
revoke select on public.novel_pdfs from anon;

-- Feedback: validate submitted content instead of accepting everything.
drop policy if exists "Anyone can send feedback" on public.feedback;
create policy "Anyone can send valid feedback" on public.feedback for insert to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 80
    and char_length(btrim(message)) between 1 and 2000
    and char_length(contact) <= 120
  );

-- Storage: no direct reads for visitors; the website hands out short-lived links.
drop policy if exists "Anyone can read novel pdfs" on storage.objects;
create policy "Admins read novel pdfs" on storage.objects for select to authenticated
  using (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));

-- Bounded public read functions.
create or replace function public.get_novel_reviews(_slug text)
returns table (id uuid, name text, rating smallint, comment text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, r.rating, r.comment, r.created_at
  from public.reviews r
  where _slug is not null and length(_slug) <= 200 and _slug ~ '^[a-z0-9-]+$'
    and r.novel_slug = _slug
  order by r.created_at desc
  limit 50
$$;

create or replace function public.get_latest_reviews()
returns table (id uuid, novel_slug text, name text, rating smallint, comment text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.novel_slug, r.name, r.rating, r.comment, r.created_at
  from public.reviews r
  order by r.created_at desc
  limit 6
$$;

create or replace function public.get_novel_rating(_slug text)
returns table (avg_rating numeric, rating_count int)
language sql stable security definer set search_path = public as $$
  select coalesce(round(avg(r.rating)::numeric, 2), 0), count(*)::int
  from public.reviews r
  where _slug is not null and length(_slug) <= 200 and _slug ~ '^[a-z0-9-]+$'
    and r.novel_slug = _slug
$$;

create or replace function public.get_novel_stats(_slug text)
returns table (views bigint, pdf_reads bigint, pdf_downloads bigint)
language sql stable security definer set search_path = public as $$
  select s.views, s.pdf_reads, s.pdf_downloads
  from public.novel_stats s
  where _slug is not null and length(_slug) <= 200 and _slug ~ '^[a-z0-9-]+$'
    and s.novel_slug = _slug
$$;

create or replace function public.list_novel_pdfs()
returns table (novel_slug text, file_size bigint, uploaded_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.novel_slug, p.file_size, p.uploaded_at
  from public.novel_pdfs p
  order by p.uploaded_at desc
  limit 1000
$$;

revoke all on function public.get_novel_reviews(text) from public;
revoke all on function public.get_latest_reviews() from public;
revoke all on function public.get_novel_rating(text) from public;
revoke all on function public.get_novel_stats(text) from public;
revoke all on function public.list_novel_pdfs() from public;
grant execute on function public.get_novel_reviews(text) to anon, authenticated;
grant execute on function public.get_latest_reviews() to anon, authenticated;
grant execute on function public.get_novel_rating(text) to anon, authenticated;
grant execute on function public.get_novel_stats(text) to anon, authenticated;
grant execute on function public.list_novel_pdfs() to anon, authenticated;