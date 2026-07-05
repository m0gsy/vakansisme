import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notify";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: story } = await supabase.from("stories").select("id, slug, title, author_id").eq("id", id).eq("published", true).maybeSingle();
  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

  const { error } = await supabase.from("story_likes").insert({ story_id: id, user_id: user.id });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // already liked
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (story.author_id !== user.id) {
    const { data: liker } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    createNotification({
      userId: story.author_id,
      type: "story_like",
      title: `@${liker?.username ?? "someone"} liked your story`,
      body: story.title,
      link: `/stories/${story.slug}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  await supabase.from("story_likes").delete().eq("story_id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
