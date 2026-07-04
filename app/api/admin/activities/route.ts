import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, name, archived")
    .order("archived", { ascending: true })
    .order("name", { ascending: true });
  return NextResponse.json({ activities: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
    return NextResponse.json({ error: "Name must be 2–50 characters" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({ name: name.trim() })
    .select("id, name, archived")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Activity already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data }, { status: 201 });
}
