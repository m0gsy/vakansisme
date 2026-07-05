import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SELECT = "id, kind, name, slug, parent_id, location_id, elevation_m, description, image_url";

async function isValidKind(supabase: Awaited<ReturnType<typeof createClient>>, kind: unknown) {
  if (typeof kind !== "string") return false;
  const { data } = await supabase.from("destination_kinds").select("name").eq("name", kind).maybeSingle();
  return !!data;
}

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("destinations")
    .select(SELECT)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });
  return NextResponse.json({ destinations: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, kind, parent_id, location_id, elevation_m, description, image_url } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return NextResponse.json({ error: "Name must be 2–100 characters" }, { status: 400 });
  }
  if (!await isValidKind(supabase, kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (kind === "trail" && !parent_id) {
    return NextResponse.json({ error: "Trail requires a parent mountain" }, { status: 400 });
  }
  if (kind === "trail" && parent_id) {
    const { data: parent } = await supabase.from("destinations").select("kind").eq("id", parent_id).maybeSingle();
    if (parent?.kind !== "mountain") {
      return NextResponse.json({ error: "Trail's parent must be a mountain" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("destinations")
    .insert({
      name: name.trim(),
      kind,
      parent_id: parent_id || null,
      location_id: location_id || null,
      elevation_m: elevation_m !== undefined && elevation_m !== null && elevation_m !== "" ? Number(elevation_m) : null,
      description: description?.trim() || null,
      image_url: image_url?.trim() || null,
    })
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A destination with this name already exists" }, { status: 409 });
    if (error.code === "23503") return NextResponse.json({ error: "Invalid parent or location reference" }, { status: 400 });
    if (error.code === "23514") return NextResponse.json({ error: "Violates hierarchy rules (trail needs mountain parent, city needs province)" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ destination: data }, { status: 201 });
}
