import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const serviceSupabase = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, location, difficulty, price, date_start, date_end, quota_max, leader_handle, image_url, description, requires_approval, application_prompt, activity_category, destination_id, payment_policy, payment_deadline_policy, payment_deadline_value, seat_reservation_policy, seat_reservation_hours, refund_policy, cancellation_policy, payment_instructions, accepted_payment_methods } = await req.json();

  if (!name || !location || !difficulty || !price || !date_start || !date_end || !quota_max || !leader_handle) {
    return NextResponse.json({ error: "All fields required except image and description" }, { status: 400 });
  }

  if (isNaN(Number(quota_max)) || Number(quota_max) < 3) {
    return NextResponse.json({ error: "Minimum quota is 3" }, { status: 400 });
  }

  // Resolve username → UUID
  const handle = leader_handle.trim().replace(/^@/, "");
  const { data: leaderProfile } = await supabase.from("profiles").select("id").eq("username", handle).maybeSingle();
  if (!leaderProfile?.id) return NextResponse.json({ error: "Leader username not found" }, { status: 400 });

  // Parse price_amount from price string
  const priceAmount = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;

  const { data, error } = await supabase
    .from("expeditions")
    .insert({
      name: name.trim(),
      location: location.trim(),
      difficulty,
      price: price.trim(),
      price_amount: priceAmount,
      date_start,
      date_end,
      quota_max: Number(quota_max),
      leader_id: leaderProfile.id,
      image_url: image_url?.trim() || null,
      description: description?.trim() || null,
      requires_approval: requires_approval ?? false,
      application_prompt: application_prompt?.trim() || null,
      activity_category: activity_category ?? "Other",
      destination_id: destination_id || null,
      payment_policy: payment_policy ?? (priceAmount > 0 ? "fixed_price" : "free"),
      payment_deadline_policy: payment_deadline_policy ?? "hours",
      payment_deadline_value: payment_deadline_value ?? 24,
      seat_reservation_policy: seat_reservation_policy ?? "immediate",
      seat_reservation_hours: seat_reservation_hours ?? 0,
      refund_policy: refund_policy?.trim() || null,
      cancellation_policy: cancellation_policy?.trim() || null,
      payment_instructions: payment_instructions?.trim() || null,
      accepted_payment_methods: accepted_payment_methods ?? ["bank_transfer"],
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Auto-join the leader as an approved member (use service client to bypass RLS — the "auth users can join" policy only allows inserting self)
  await serviceSupabase.from("expedition_members").upsert(
    { expedition_id: data.id, user_id: leaderProfile.id, status: "approved" },
    { onConflict: "expedition_id,user_id" }
  );

  return NextResponse.json({ id: data.id });
}
