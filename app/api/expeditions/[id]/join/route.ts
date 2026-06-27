import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendJoinConfirmationEmail } from "@/lib/email";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
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
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  // Check quota before inserting
  const { data: expedition } = await supabase
    .from("expeditions")
    .select("quota_max, expedition_members(count)")
    .eq("id", id)
    .single();

  if (!expedition) {
    return NextResponse.json({ error: "Expedition not found" }, { status: 404 });
  }

  const count = (expedition.expedition_members as { count: number }[])[0]?.count ?? 0;
  if (count >= expedition.quota_max) {
    return NextResponse.json({ error: "Trip is full" }, { status: 409 });
  }

  const { error } = await supabase
    .from("expedition_members")
    .insert({ expedition_id: id, user_id: user.id });

  if (error) {
    // unique violation = already joined
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already joined" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Fire-and-forget confirmation email
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { data: trip } = await supabase
    .from("expeditions")
    .select("name, location, date_start")
    .eq("id", id)
    .single();

  if (user.email && profile && trip) {
    sendJoinConfirmationEmail(
      user.email,
      profile.username,
      trip.name,
      trip.location,
      trip.date_start
    ).catch(() => {});
  }

  return NextResponse.json({ success: true, member_count: count + 1 });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
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

  const { error } = await supabase
    .from("expedition_members")
    .delete()
    .eq("expedition_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { count: memberCount } = await supabase
    .from("expedition_members")
    .select("*", { count: "exact", head: true })
    .eq("expedition_id", id);

  return NextResponse.json({ success: true, member_count: memberCount ?? 0 });
}
