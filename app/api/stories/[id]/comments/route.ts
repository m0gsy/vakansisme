import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

function makeClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);

  const { data, error } = await supabase
    .from("story_comments")
    .select("id, author_id, author_handle, content, created_at")
    .eq("story_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim() || content.trim().length > 500) {
    return NextResponse.json({ error: "Comment must be 1–500 characters" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const { data, error } = await supabase
    .from("story_comments")
    .insert({ story_id: id, author_id: user.id, author_handle: profile.username, content: content.trim() })
    .select("id, author_id, author_handle, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id: storyId } = await params;
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const { error } = await supabase
    .from("story_comments")
    .delete()
    .eq("id", commentId)
    .eq("story_id", storyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
