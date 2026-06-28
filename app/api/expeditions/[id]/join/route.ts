import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendJoinConfirmationEmail, sendLeaderJoinEmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`join:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
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
    .select("name, location, date_start, leader_handle")
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

    // Notify leader (email + in-app)
    const leaderHandle = trip.leader_handle?.replace(/^@/, "");
    if (leaderHandle) {
      supabase
        .from("profiles")
        .select("id, email, username")
        .eq("username", leaderHandle)
        .maybeSingle()
        .then(({ data: leader }) => {
          if (!leader || leader.username === profile.username) return;
          if (leader.email) {
            sendLeaderJoinEmail(leader.email, leader.username, profile.username, trip.name, id).catch(() => {});
          }
          void supabase.from("notifications").insert({
            user_id: leader.id,
            type: "join",
            title: `@${profile.username} joined ${trip.name}`,
            link: `/expeditions/${id}`,
          });
        });
    }
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

  // Block leave when trip is in progress or done
  const { data: expedition } = await supabase.from("expeditions").select("status").eq("id", id).single();
  if (expedition?.status === "ongoing") {
    return NextResponse.json({ error: "Cannot leave a trip that is currently ongoing." }, { status: 403 });
  }
  if (expedition?.status === "completed") {
    return NextResponse.json({ error: "Cannot leave a trip that has already completed." }, { status: 403 });
  }

  const { data: expInfo } = await supabase.from("expeditions").select("name").eq("id", id).single();

  const { error } = await supabase
    .from("expedition_members")
    .delete()
    .eq("expedition_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify first person on waitlist that a spot opened
  supabase
    .from("expedition_waitlist")
    .select("user_id")
    .eq("expedition_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .then(({ data: waitlist }) => {
      if (!waitlist?.[0]) return;
      void supabase.from("notifications").insert({
        user_id: waitlist[0].user_id,
        type: "waitlist_spot",
        title: `A spot opened on ${expInfo?.name ?? "your waitlisted trip"} — join now`,
        link: `/expeditions/${id}`,
      });
    });

  const { count: memberCount } = await supabase
    .from("expedition_members")
    .select("*", { count: "exact", head: true })
    .eq("expedition_id", id);

  return NextResponse.json({ success: true, member_count: memberCount ?? 0 });
}
