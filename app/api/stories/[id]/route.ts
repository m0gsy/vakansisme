import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

const VALID_TYPES = ["photo dump", "short story", "video POV", "chaos moment"];
const MAX_CONTENT_LENGTH = 50000;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: story } = await supabase.from("stories").select("author_id, published").eq("id", id).single();
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const isAdmin = profile?.is_admin ?? false;
  const isOwner = story.author_id === user.id;

  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (story.published && !isAdmin) return NextResponse.json({ error: "Cannot edit a published story" }, { status: 403 });

  const { type, title, excerpt, content, image_url, audio_url, expedition_id, tags } = await req.json();

  if (type && !VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (content && content.length > MAX_CONTENT_LENGTH) return NextResponse.json({ error: "Content too long" }, { status: 400 });

  const { error } = await supabase.from("stories").update({
    ...(type ? { type } : {}),
    ...(title ? { title: title.trim() } : {}),
    excerpt: excerpt?.trim() || null,
    content: content?.trim() || null,
    image_url: image_url?.trim() || null,
    audio_url: audio_url?.trim() || null,
    expedition_id: expedition_id || null,
    tags: Array.isArray(tags) ? tags.slice(0, 5).map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [],
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
