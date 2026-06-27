import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (story.author_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title?.trim() || null;
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt?.trim() || null;
  if (body.content !== undefined) updates.content = body.content?.trim() || null;
  if (body.image_url !== undefined) updates.image_url = body.image_url?.trim() || null;
  if (body.type !== undefined) updates.type = body.type;

  // Authors may move a story to draft or submit it for review — never self-publish.
  if (body.status === "draft") {
    updates.status = "draft";
    updates.published = false;
  } else if (body.status === "pending") {
    updates.status = "pending";
    updates.published = false;
  }

  const { error } = await supabase.from("stories").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
