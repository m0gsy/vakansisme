import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data } = await supabase
    .from("notification_prefs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    prefs: data ?? { email_on_join: true, email_on_story: true, email_on_status: true, email_newsletter: true },
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json();
  const allowed = ["email_on_join", "email_on_story", "email_on_status", "email_newsletter"];
  const update: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof body[key] === "boolean") update[key] = body[key];
  }

  const { error } = await supabase
    .from("notification_prefs")
    .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
