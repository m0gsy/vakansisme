import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const NAME_RE = /^[a-z][a-z0-9_]*$/;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("destination_kinds").select("name").order("name", { ascending: true });
  return NextResponse.json({ kinds: (data ?? []).map((k) => k.name) });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (typeof name !== "string" || name.length < 2 || name.length > 40 || !NAME_RE.test(name)) {
    return NextResponse.json({ error: "Name must be 2–40 chars, lowercase snake_case (a-z0-9_, starting with a letter)" }, { status: 400 });
  }

  const { error } = await supabase.from("destination_kinds").insert({ name });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This kind already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ kind: name }, { status: 201 });
}
