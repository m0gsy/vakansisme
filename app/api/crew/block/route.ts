import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ blockedIds: [] });

  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);

  return NextResponse.json({ blockedIds: (data ?? []).map((b) => b.blocked_id) });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json();
  if (!blocked_id) return NextResponse.json({ error: "blocked_id required" }, { status: 400 });
  if (blocked_id === user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: user.id, blocked_id });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json();
  if (!blocked_id) return NextResponse.json({ error: "blocked_id required" }, { status: 400 });

  await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blocked_id);

  return NextResponse.json({ ok: true });
}
