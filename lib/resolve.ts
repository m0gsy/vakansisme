import { permanentRedirect, notFound } from "next/navigation";
import { UUID_RE } from "@/lib/seo";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

// ponytail: supabase's dynamic .select(string) can't carry column-level types through this
// generic helper — every row is cast to T at the boundary instead of threaded through.
export async function resolveSlugOrRedirect<T extends { slug: string }>(opts: {
  supabase: SupabaseClientType;
  table: "stories" | "expeditions" | "story_series";
  entityType: "story" | "expedition" | "series";
  param: string;
  basePath: string; // e.g. "/stories"
  select: string; // must include "slug"
  filter?: { column: string; value: unknown }[];
}): Promise<T> {
  const { supabase, table, entityType, param, basePath, select, filter } = opts;

  const withFilters = (query: ReturnType<typeof supabase.from>) => {
    let q: any = query.select(select); // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const f of filter ?? []) {
      q = q.eq(f.column, f.value);
    }
    return q;
  };

  if (UUID_RE.test(param)) {
    const { data } = await withFilters(supabase.from(table)).eq("id", param).maybeSingle();
    if (data) permanentRedirect(`${basePath}/${(data as { slug: string }).slug}`);
    notFound();
  }

  const { data: bySlug } = await withFilters(supabase.from(table)).eq("slug", param).maybeSingle();
  if (bySlug) return bySlug as T;

  const { data: redirectRow } = await supabase
    .from("slug_redirects")
    .select("entity_id")
    .eq("entity_type", entityType)
    .eq("old_slug", param)
    .maybeSingle();

  if (redirectRow) {
    const { data: live } = await withFilters(supabase.from(table)).eq("id", redirectRow.entity_id).maybeSingle();
    if (live) permanentRedirect(`${basePath}/${(live as { slug: string }).slug}`);
  }

  notFound();
}
