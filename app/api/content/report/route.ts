import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { content_type, content_id, reason } = await req.json();
  if (!content_type || !content_id || !reason?.trim()) {
    return NextResponse.json({ error: "content_type, content_id, and reason required" }, { status: 400 });
  }

  const VALID = ["story", "chaos", "profile", "comment"];
  if (!VALID.includes(content_type)) {
    return NextResponse.json({ error: "Invalid content_type" }, { status: 400 });
  }

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    content_type,
    content_id,
    reason: reason.trim().slice(0, 500),
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, alreadyReported: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
