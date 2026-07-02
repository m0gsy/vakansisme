import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
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
  const supabase = makeSupabase(cookieStore);

  const { data, error } = await supabase
    .from("expedition_updates")
    .select("id, author_id, content, created_at, profiles(username)")
    .eq("expedition_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Only leader or admin
  const { data: expedition } = await supabase
    .from("expeditions")
    .select("name, leader_id")
    .eq("id", id)
    .single();
  if (!expedition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  if (expedition.leader_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data: update, error } = await supabase
    .from("expedition_updates")
    .insert({ expedition_id: id, author_id: user.id, content: content.trim() })
    .select("id, author_id, content, created_at, profiles(username)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify all members
  const { data: members } = await supabase
    .from("expedition_members")
    .select("user_id")
    .eq("expedition_id", id)
    .neq("user_id", user.id);

  if (members?.length) {
    await supabase.from("notifications").insert(
      members.map((m) => ({
        user_id: m.user_id,
        type: "leader_update",
        title: `Update: ${expedition.name}`,
        body: content.trim().slice(0, 120),
        link: `/expeditions/${id}`,
      }))
    );
  }

  return NextResponse.json(update);
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { updateId } = await req.json();
  const { error } = await supabase
    .from("expedition_updates")
    .delete()
    .eq("id", updateId)
    .eq("author_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
