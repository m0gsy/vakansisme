import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string; memberId: string }>;

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id, memberId } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Verify caller is the expedition leader
  const { data: expedition } = await supabase
    .from("expeditions")
    .select("leader_handle")
    .eq("id", id)
    .single();

  if (!expedition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leaderHandle = expedition.leader_handle?.replace(/^@/, "");
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.username !== leaderHandle) {
    // Also allow admin
    const { data: adminCheck } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("expedition_members")
    .delete()
    .eq("expedition_id", id)
    .eq("user_id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
