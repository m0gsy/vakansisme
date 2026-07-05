import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TYPES = ["province", "city"] as const;
const SELECT = "id, type, name, slug, parent_id";

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("locations")
    .select(SELECT)
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  return NextResponse.json({ locations: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, type, parent_id } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return NextResponse.json({ error: "Name must be 2–100 characters" }, { status: 400 });
  }
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (type === "city" && !parent_id) {
    return NextResponse.json({ error: "City requires a parent province" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      name: name.trim(),
      type,
      parent_id: type === "city" ? parent_id : null,
    })
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A location with this name already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data }, { status: 201 });
}
