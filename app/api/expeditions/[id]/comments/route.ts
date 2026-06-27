import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expedition_comments")
    .select("id, author_id, author_handle, content, created_at")
    .eq("expedition_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim() || content.length > 500) {
    return NextResponse.json({ error: "Content must be 1–500 characters" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("expedition_comments")
    .insert({ expedition_id: id, author_id: user.id, author_handle: profile.username, content: content.trim() })
    .select("id, author_id, author_handle, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { commentId } = await req.json();
  await supabase.from("expedition_comments").delete().eq("id", commentId).eq("expedition_id", id);
  return NextResponse.json({ ok: true });
}
