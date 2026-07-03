import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: submission } = await supabase.from("chaos_submissions").select("user_id").eq("id", id).maybeSingle();
  if (submission?.user_id === user.id) {
    return NextResponse.json({ error: "Cannot react to your own submission" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("chaos_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("chaos_id", id)
    .maybeSingle();

  if (existing) {
    await supabase.from("chaos_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("chaos_reactions").insert({ user_id: user.id, chaos_id: id });
  }

  const { count } = await supabase
    .from("chaos_reactions")
    .select("*", { count: "exact", head: true })
    .eq("chaos_id", id);

  return NextResponse.json({ reacted: !existing, count: count ?? 0 });
}
