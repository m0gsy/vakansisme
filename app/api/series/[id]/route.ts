import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: series } = await supabase
    .from("story_series")
    .select("id, title, description, cover_image, created_at, author_id, profiles(username, avatar_url)")
    .eq("id", id)
    .single();

  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, excerpt, image_url, type, series_order, created_at, profiles(username)")
    .eq("series_id", id)
    .eq("published", true)
    .order("series_order", { ascending: true });

  return NextResponse.json({ ...series, stories: stories ?? [] });
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: series } = await supabase.from("story_series").select("author_id").eq("id", id).single();
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (series.author_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, cover_image } = await req.json();
  const updates: Record<string, unknown> = {};
  if (title?.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (cover_image !== undefined) updates.cover_image = cover_image?.trim() || null;

  const { data, error } = await supabase.from("story_series").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: series } = await supabase.from("story_series").select("author_id").eq("id", id).single();
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (series.author_id !== user.id && !profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("story_series").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
