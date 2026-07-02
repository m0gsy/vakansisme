import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Allow leader or admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const { data: expedition } = await supabase.from("expeditions").select("name, leader_id").eq("id", id).single();
  if (!expedition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (expedition.leader_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: members } = await supabase
    .from("expedition_members")
    .select("user_id, joined_at, profiles(username, bio, instagram_handle)")
    .eq("expedition_id", id)
    .order("joined_at", { ascending: true });

  const rows = [
    ["username", "instagram", "bio", "joined_at"],
    ...(members ?? []).map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username?: string; bio?: string; instagram_handle?: string } | null;
      return [
        p?.username ?? "",
        p?.instagram_handle ? `@${p.instagram_handle}` : "",
        (p?.bio ?? "").replace(/,/g, " "),
        m.joined_at ? new Date(m.joined_at).toLocaleDateString("en") : "",
      ];
    }),
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const filename = `crew-${expedition.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.csv`;
  return new Response(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
