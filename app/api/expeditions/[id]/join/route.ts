import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendJoinConfirmationEmail, sendLeaderJoinEmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!await rateLimit(`join:${ip}`, 10, 60_000)) {
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

  const { data: banCheck } = await supabase.from("profiles").select("is_banned").eq("id", user.id).single();
  if (banCheck?.is_banned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;

  // Check quota (approved members only) before inserting
  const { data: expedition } = await supabase
    .from("expeditions")
    .select("quota_max, requires_approval, price_amount, status")
    .eq("id", id)
    .single();

  if (!expedition) {
    return NextResponse.json({ error: "Expedition not found" }, { status: 404 });
  }

  if (expedition.status === "completed" || expedition.status === "cancelled") {
    return NextResponse.json({ error: "This expedition is no longer open for registration" }, { status: 409 });
  }

  const isPaid = (expedition.price_amount ?? 0) > 0;

  // Count approved + pending_payment (both hold a slot)
  const { count: takenCount } = await supabase
    .from("expedition_members")
    .select("*", { count: "exact", head: true })
    .eq("expedition_id", id)
    .in("status", ["approved", "pending_payment"]);

  const count = takenCount ?? 0;
  if (count >= expedition.quota_max) {
    return NextResponse.json({ error: "Trip is full" }, { status: 409 });
  }

  // Paid expeditions: reserve slot with 3-day payment deadline
  const memberStatus = isPaid ? "pending_payment" : (expedition.requires_approval ? "pending" : "approved");
  const paymentDueAt = isPaid
    ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("expedition_members")
    .insert({
      expedition_id: id,
      user_id: user.id,
      status: memberStatus,
      ...(notes ? { notes } : {}),
      ...(paymentDueAt ? { payment_due_at: paymentDueAt } : {}),
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already joined" }, { status: 409 });
    }
    if (error.message?.includes("expedition_full")) {
      return NextResponse.json({ error: "Trip is full" }, { status: 409 });
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

  if (memberStatus === "pending_payment") {
    return NextResponse.json({ success: true, pending_payment: true, payment_due_at: paymentDueAt, member_count: count });
  }
  if (memberStatus === "pending") {
    return NextResponse.json({ success: true, pending: true, member_count: count });
  }
  return NextResponse.json({ success: true, pending: false, member_count: count + 1 });
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
