import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { name, location, difficulty, price, date_start, date_end, quota_max, leader_handle, image_url, description, status } = await req.json();

  if (!name || !location || !difficulty || !price || !date_start || !date_end || !quota_max || !leader_handle) {
    return NextResponse.json({ error: "All fields required except image and description" }, { status: 400 });
  }

  const { error } = await supabase.from("expeditions").update({
    name: name.trim(),
    location: location.trim(),
    difficulty,
    price: price.trim(),
    date_start,
    date_end,
    quota_max: Number(quota_max),
    leader_handle: leader_handle.trim(),
    image_url: image_url?.trim() || null,
    description: description?.trim() || null,
    ...(status ? { status } : {}),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
