import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const KINDS = ["mountain", "trail", "national_park"] as const;
const SELECT = "id, kind, name, slug, parent_id, location_id, elevation_m, description, image_url";

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
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (kind === "trail" && !parent_id) {
    return NextResponse.json({ error: "Trail requires a parent mountain" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("destinations")
    .insert({
      name: name.trim(),
      kind,
      parent_id: parent_id || null,
      location_id: location_id || null,
      elevation_m: elevation_m ? Number(elevation_m) : null,
      description: description?.trim() || null,
      image_url: image_url?.trim() || null,
    })
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A destination with this name already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ destination: data }, { status: 201 });
}
