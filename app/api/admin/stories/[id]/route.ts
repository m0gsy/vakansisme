import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendStoryApprovedEmail, sendStoryRejectedEmail } from "@/lib/email";

type Params = Promise<{ id: string }>;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return { supabase, isAdmin: profile?.is_admin === true };
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, featured } = body;

  // Feature toggle
  if (featured !== undefined) {
    const { error } = await supabase.from("stories").update({ featured: !!featured }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const updates =
    action === "approve"
      ? { published: true, status: "published" }
      : action === "reject"
      ? { published: false, status: "rejected" }
      : null;

  if (!updates) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { error } = await supabase.from("stories").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email + in-app notification (fire-and-forget)
  supabase
    .from("stories")
    .select("title, slug, author_id, profiles!stories_author_id_fkey(email, username)")
    .eq("id", id)
    .single()
    .then(({ data: story }) => {
      if (!story) return;
      const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles as { email?: string; username?: string } | null;
      if (profile?.email) {
        if (action === "approve") {
          sendStoryApprovedEmail(profile.email, profile.username ?? "", story.title, story.slug).catch(() => {});
        } else {
          sendStoryRejectedEmail(profile.email, profile.username ?? "", story.title).catch(() => {});
        }
      }
      // In-app notification
      void supabase.from("notifications").insert({
        user_id: story.author_id,
        type: action === "approve" ? "story_approved" : "story_rejected",
        title: action === "approve" ? `Your story was published` : `Your story was not approved`,
        body: story.title,
        link: action === "approve" ? `/stories/${story.slug}` : null,
      });
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
