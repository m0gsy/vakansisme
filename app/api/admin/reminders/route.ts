import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendReminderEmail } from "@/lib/email";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { days = 7 } = await req.json().catch(() => ({})) as { days?: number };

  const now = new Date();
  const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const targetDate = target.toISOString().split("T")[0];

  // Expeditions starting on target date
  const { data: expeditions } = await supabase
    .from("expeditions")
    .select("id, slug, name, location, date_start")
    .gte("date_start", `${targetDate}T00:00:00`)
    .lte("date_start", `${targetDate}T23:59:59`)
    .in("status", ["upcoming", "ongoing"]);

  if (!expeditions?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const exp of expeditions) {
    const { data: members } = await supabase
      .from("expedition_members")
      .select("user_id, profiles(username, email)")
      .eq("expedition_id", exp.id)
      .eq("status", "approved");

    for (const m of members ?? []) {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username?: string; email?: string } | null;
      if (!p?.email || !p?.username) continue;
      await sendReminderEmail(p.email, p.username, exp.name, exp.slug, days).catch(() => {});
      sent++;
    }

    // Also insert in-app notifications
    if (members?.length) {
      void supabase.from("notifications").insert(
        members.map((m) => ({
          user_id: m.user_id,
          type: "reminder",
          title: `${exp.name} starts in ${days} day${days !== 1 ? "s" : ""}`,
          link: `/expeditions/${exp.slug}`,
        }))
      );
    }
  }

  return NextResponse.json({ sent, expeditions: expeditions.length });
}
