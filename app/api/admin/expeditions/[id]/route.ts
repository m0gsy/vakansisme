import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendExpeditionStatusEmail } from "@/lib/email";

type Params = Promise<{ id: string }>;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin ? user : null;
}

async function notifyMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expeditionId: string,
  expeditionSlug: string,
  tripName: string,
  newStatus: "cancelled" | "ongoing" | "completed"
) {
  const { data: members } = await supabase
    .from("expedition_members")
    .select("user_id, profiles(username, email)")
    .eq("expedition_id", expeditionId);

  if (!members?.length) return;

  const notifTitle = {
    cancelled: `${tripName} has been cancelled`,
    ongoing:   `${tripName} is now underway`,
    completed: `${tripName} is complete — rate your trip`,
  }[newStatus];

  const notifLink = `/expeditions/${expeditionSlug}`;

  const notifRows = members.map((m) => ({
    user_id: m.user_id,
    type: `expedition_${newStatus}`,
    title: notifTitle,
    link: notifLink,
  }));

  void supabase.from("notifications").insert(notifRows);

  if (newStatus === "cancelled") {
    for (const m of members) {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username: string; email: string | null } | null;
      const email = p?.email;
      const username = p?.username;
      if (email && username) {
        sendExpeditionStatusEmail(email, username, tripName, expeditionSlug, "cancelled").catch(() => {});
      }
    }
  }
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, location, difficulty, price, date_start, date_end, quota_max, leader_handle, image_url, description, status, requires_approval, application_prompt, featured, activity_category, destination_id } = await req.json();

  if (!name || !location || !difficulty || !price || !date_start || !date_end || !quota_max || !leader_handle) {
    return NextResponse.json({ error: "All fields required except image and description" }, { status: 400 });
  }

  if (isNaN(Number(quota_max)) || Number(quota_max) < 3) {
    return NextResponse.json({ error: "Minimum quota is 3" }, { status: 400 });
  }

  const VALID_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Resolve leader username → UUID
  const handle = leader_handle.trim().replace(/^@/, "");
  const { data: leaderProfile } = await supabase.from("profiles").select("id").eq("username", handle).maybeSingle();
  if (!leaderProfile?.id) return NextResponse.json({ error: "Leader username not found" }, { status: 400 });

  // Fetch current status before update to detect changes
  const { data: current } = await supabase.from("expeditions").select("status, name, slug").eq("id", id).single();
  const prevStatus = current?.status ?? "upcoming";
  const tripName = name.trim();

  const { error } = await supabase.from("expeditions").update({
    name: tripName,
    location: location.trim(),
    difficulty,
    price: price.trim(),
    date_start,
    date_end,
    quota_max: Number(quota_max),
    leader_id: leaderProfile.id,
    image_url: image_url?.trim() || null,
    description: description?.trim() || null,
    requires_approval: requires_approval ?? false,
    application_prompt: application_prompt?.trim() || null,
    ...(status ? { status } : {}),
    ...(featured !== undefined ? { featured: !!featured } : {}),
    ...(activity_category ? { activity_category } : {}),
    ...(destination_id !== undefined ? { destination_id: destination_id || null } : {}),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify members when status changes to a meaningful state
  if (status && status !== prevStatus && ["cancelled", "ongoing", "completed"].includes(status)) {
    notifyMembers(supabase, id, current?.slug ?? id, tripName, status as "cancelled" | "ongoing" | "completed").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("expeditions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
