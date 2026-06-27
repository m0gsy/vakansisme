import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "members";

  if (type === "subscribers") {
    const { data } = await supabase.from("newsletter_subscribers").select("email, created_at").order("created_at", { ascending: false });
    const csv = ["email,joined_at", ...(data ?? []).map((r) => `${r.email},${r.created_at}`)].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="subscribers.csv"` } });
  }

  if (type === "members") {
    const { data } = await supabase
      .from("expedition_members")
      .select("user_id, joined_at, profiles(username), expeditions(name)")
      .order("joined_at", { ascending: false });
    const csv = ["username,expedition,joined_at", ...(data ?? []).map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles as { username: string } | null;
      const e = Array.isArray(r.expeditions) ? r.expeditions[0] : r.expeditions as { name: string } | null;
      return `${p?.username ?? ""},${e?.name ?? ""},${r.joined_at}`;
    })].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="members.csv"` } });
  }

  if (type === "users") {
    const { data } = await supabase.from("profiles").select("username, created_at").order("created_at", { ascending: false });
    const csv = ["username,joined_at", ...(data ?? []).map((r) => `${r.username},${r.created_at}`)].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="users.csv"` } });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
