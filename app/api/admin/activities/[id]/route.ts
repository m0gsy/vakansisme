import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: { name?: string; archived?: boolean } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 50) return NextResponse.json({ error: "Name must be 2–50 characters" }, { status: 400 });
    update.name = name;
  }
  if (typeof body.archived === "boolean") update.archived = body.archived;
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data: updated, error } = await supabase
    .from("activities")
    .update(update)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Activity name already exists" }, { status: 409 });
    if (error.code === "PGRST116") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Block delete if any expedition uses this activity
  const { data: act } = await supabase.from("activities").select("name").eq("id", id).single();
  if (!act) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { count } = await supabase
    .from("expeditions")
    .select("*", { count: "exact", head: true })
    .eq("activity_category", act.name);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${count} expedition(s) use this activity` }, { status: 409 });
  }

  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
