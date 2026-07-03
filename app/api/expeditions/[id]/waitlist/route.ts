import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: expedition } = await supabase.from("expeditions").select("status").eq("id", id).single();
  if (expedition?.status === "completed" || expedition?.status === "cancelled") {
    return NextResponse.json({ error: "This expedition is no longer open for registration" }, { status: 409 });
  }

  const { error } = await supabase.from("expedition_waitlist").insert({ expedition_id: id, user_id: user.id });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // already on waitlist
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { count } = await supabase
    .from("expedition_waitlist")
    .select("*", { count: "exact", head: true })
    .eq("expedition_id", id);

  return NextResponse.json({ ok: true, waitlist_count: count ?? 0 });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  await supabase.from("expedition_waitlist").delete().eq("expedition_id", id).eq("user_id", user.id);

  const { count } = await supabase
    .from("expedition_waitlist")
    .select("*", { count: "exact", head: true })
    .eq("expedition_id", id);

  return NextResponse.json({ ok: true, waitlist_count: count ?? 0 });
}
