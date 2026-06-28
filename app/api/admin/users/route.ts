import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, created_at, is_admin")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ users: users ?? [] });
}
