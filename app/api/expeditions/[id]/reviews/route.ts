import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (l) => l.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data } = await supabase
    .from("expedition_reviews")
    .select("id, reviewer_id, rating, content, created_at, profiles(username, avatar_url)")
    .eq("expedition_id", id)
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Must be completed, and reviewer must be a past member
  const { data: expedition } = await supabase.from("expeditions").select("status").eq("id", id).single();
  if (expedition?.status !== "completed") {
    return NextResponse.json({ error: "Reviews are only allowed after the expedition is completed" }, { status: 409 });
  }

  const { data: membership } = await supabase
    .from("expedition_members")
    .select("user_id")
    .eq("expedition_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Only trip members can review" }, { status: 403 });

  const { rating, content } = await req.json();
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating 1-5 required" }, { status: 400 });

  const { data, error } = await supabase
    .from("expedition_reviews")
    .upsert({ expedition_id: id, reviewer_id: user.id, rating, content: content?.trim() || null }, { onConflict: "expedition_id,reviewer_id" })
    .select("id, reviewer_id, rating, content, created_at, profiles(username, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  await supabase.from("expedition_reviews").delete().eq("expedition_id", id).eq("reviewer_id", user.id);
  return NextResponse.json({ success: true });
}
