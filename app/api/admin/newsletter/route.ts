import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendNewsletterEmail } from "@/lib/email";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, html } = await req.json();
  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "subject and html required" }, { status: 400 });
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email");

  if (!subscribers?.length) return NextResponse.json({ sent: 0 });

  const emails = subscribers.map((s) => s.email).filter(Boolean);
  const { sent } = await sendNewsletterEmail(emails, subject.trim(), html.trim());
  return NextResponse.json({ sent });
}
