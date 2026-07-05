// Known kinds get a dedicated route (SEO-friendly path); any other kind (admin-added)
// falls back to the generic /destination/[slug] route.
const DEDICATED_BASE_PATH: Record<string, string> = {
  mountain: "/mountain",
  trail: "/trail",
  national_park: "/national-park",
};

export function destBasePath(kind: string): string {
  return DEDICATED_BASE_PATH[kind] ?? "/destination";
}

// ponytail: sums weights per row id across score groups, keeps first-seen row data,
// sorts score desc then created_at desc (if the rows carry one). Good enough for a
// handful of small selects merged in-memory; no need for a DB-side scoring RPC.
export function mergeScored<T extends { id: string; created_at?: string }>(
  ...groups: { rows: T[]; weight: number }[]
): T[] {
  const scores = new Map<string, number>();
  const rows = new Map<string, T>();

  for (const { rows: groupRows, weight } of groups) {
    for (const row of groupRows) {
      scores.set(row.id, (scores.get(row.id) ?? 0) + weight);
      if (!rows.has(row.id)) rows.set(row.id, row);
    }
  }

  return [...rows.values()].sort((a, b) => {
    const scoreDiff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}
