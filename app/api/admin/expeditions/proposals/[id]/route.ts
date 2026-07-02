import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { sendProposalApprovedEmail, sendProposalRejectedEmail } from "@/lib/email";

type Params = Promise<{ id: string }>;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, admin_note } = await req.json();
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: proposal } = await service
    .from("expedition_proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    // Create real expedition
    const { data: expedition, error } = await service.from("expeditions").insert({
      name: proposal.name,
      location: proposal.location,
      difficulty: proposal.difficulty,
      price: proposal.price,
      date_start: proposal.date_start,
      date_end: proposal.date_end,
      quota_max: proposal.quota_max,
      leader_id: proposal.proposer_id,
      image_url: proposal.image_url,
      description: proposal.description,
      requires_approval: proposal.requires_approval,
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Auto-join proposer as leader
    await service.from("expedition_members").insert({
      expedition_id: expedition.id,
      user_id: proposal.proposer_id,
      status: "approved",
    });

    // Mark proposal approved
    await service.from("expedition_proposals").update({ status: "approved" }).eq("id", id);

    // Notify proposer
    const { data: proposerProfile } = await service
      .from("profiles")
      .select("email")
      .eq("id", proposal.proposer_id)
      .single();

    if (proposerProfile?.email) {
      sendProposalApprovedEmail(proposerProfile.email, proposal.proposer_handle, proposal.name, expedition.id).catch(() => {});
    }

    await service.from("notifications").insert({
      user_id: proposal.proposer_id,
      type: "story_approved",
      title: "Trip proposal approved!",
      body: `${proposal.name} is now live.`,
      link: `/expeditions/${expedition.id}`,
    });

    return NextResponse.json({ ok: true, expeditionId: expedition.id });
  }

  // reject
  await service.from("expedition_proposals").update({
    status: "rejected",
    admin_note: admin_note?.trim() || null,
  }).eq("id", id);

  const { data: proposerProfile } = await service
    .from("profiles")
    .select("email")
    .eq("id", proposal.proposer_id)
    .single();

  if (proposerProfile?.email) {
    sendProposalRejectedEmail(proposerProfile.email, proposal.proposer_handle, proposal.name, admin_note).catch(() => {});
  }

  await service.from("notifications").insert({
    user_id: proposal.proposer_id,
    type: "story_rejected",
    title: "Trip proposal not approved",
    body: admin_note?.trim() || "We couldn't greenlight this proposal.",
    link: "/expeditions/propose",
  });

  return NextResponse.json({ ok: true });
}
