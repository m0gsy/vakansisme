import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string; memberId: string }>;

async function getLeaderOrAdmin(supabase: Awaited<ReturnType<typeof createClient>>, expeditionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile) return null;
  if (profile.is_admin) return user;
  const { data: trip } = await supabase.from("expeditions").select("leader_id").eq("id", expeditionId).single();
  return trip?.leader_id === user.id ? user : null;
}

// PATCH — approve or reject a pending member
export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id, memberId } = await params;
  const supabase = await createClient();

  const leader = await getLeaderOrAdmin(supabase, id);
  if (!leader) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = await req.json();
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  if (action === "reject") {
    await supabase.from("expedition_members").delete().eq("expedition_id", id).eq("user_id", memberId);
    void supabase.from("notifications").insert({
      user_id: memberId,
      type: "join_rejected",
      title: "Lamaran ekspedisimu tidak diterima.",
      link: `/expeditions/${id}`,
    });
    return NextResponse.json({ success: true });
  }

  // approve — reject if user is banned
  const { data: memberProfile } = await supabase.from("profiles").select("is_banned").eq("id", memberId).single();
  if (memberProfile?.is_banned) {
    return NextResponse.json({ error: "User is banned" }, { status: 403 });
  }

  const { error } = await supabase
    .from("expedition_members")
    .update({ status: "approved" })
    .eq("expedition_id", id)
    .eq("user_id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  void supabase.from("notifications").insert({
    user_id: memberId,
    type: "join_approved",
    title: "Lamaranmu diterima — kamu masuk!",
    link: `/expeditions/${id}`,
  });

  return NextResponse.json({ success: true });
}

// DELETE — kick member
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id, memberId } = await params;
  const supabase = await createClient();

  const leader = await getLeaderOrAdmin(supabase, id);
  if (!leader) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("expedition_members").delete().eq("expedition_id", id).eq("user_id", memberId);
  return NextResponse.json({ success: true });
}
