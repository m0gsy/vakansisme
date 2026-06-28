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

  const { segment } = await req.clone().json().catch(() => ({ segment: "all" })) as { segment?: string };

  const emailsQuery = supabase.from("newsletter_subscribers").select("email");
  const { data: subscribers } = await emailsQuery;

  let emails = (subscribers ?? []).map((s: { email: string }) => s.email).filter(Boolean);

  // Segment: "members" = users who joined at least 1 expedition
  if (segment === "members") {
    const { data: memberProfiles } = await supabase
      .from("expedition_members")
      .select("profiles!expedition_members_user_id_fkey(email)")
      .limit(2000);
    const memberEmails = new Set(
      (memberProfiles ?? []).flatMap((m: Record<string, unknown>) => {
        const p = m.profiles as { email?: string } | { email?: string }[] | null;
        if (!p) return [];
        return Array.isArray(p) ? p.map((x) => x.email).filter(Boolean) : [p.email].filter(Boolean);
      })
    );
    emails = emails.filter((e: string) => memberEmails.has(e));
  }

  if (!emails.length) return NextResponse.json({ sent: 0 });

  const { sent } = await sendNewsletterEmail(emails, subject.trim(), html.trim());
  return NextResponse.json({ sent });
}
