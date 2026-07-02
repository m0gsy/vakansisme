import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, location, difficulty, price, date_start, date_end, quota_max, leader_handle, image_url, description, requires_approval, application_prompt } = await req.json();

  if (!name || !location || !difficulty || !price || !date_start || !date_end || !quota_max || !leader_handle) {
    return NextResponse.json({ error: "All fields required except image and description" }, { status: 400 });
  }

  // Resolve username → UUID
  const handle = leader_handle.trim().replace(/^@/, "");
  const { data: leaderProfile } = await supabase.from("profiles").select("id").eq("username", handle).maybeSingle();
  if (!leaderProfile?.id) return NextResponse.json({ error: "Leader username not found" }, { status: 400 });

  const { data, error } = await supabase
    .from("expeditions")
    .insert({
      name: name.trim(),
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
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Auto-join the leader as an approved member
  await supabase.from("expedition_members").upsert(
    { expedition_id: data.id, user_id: leaderProfile.id, status: "approved" },
    { onConflict: "expedition_id,user_id" }
  );

  return NextResponse.json({ id: data.id });
}
