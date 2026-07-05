import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendReminderEmail } from "@/lib/email";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: expeditions } = await supabase
    .from("expeditions")
    .select("id, name, date_start")
    .in("status", ["upcoming", "ongoing"])
    .order("date_start", { ascending: true })
    .limit(100);

  return NextResponse.json({ expeditions: expeditions ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { days = 7, expeditionId } = await req.json().catch(() => ({})) as { days?: number; expeditionId?: string };

  let expeditions: { id: string; slug: string; name: string; location: string; date_start: string }[] | null;
  let daysByExpedition = new Map<string, number>();

  if (expeditionId) {
    // Specific trip: send regardless of departure date
    const { data: single } = await supabase
      .from("expeditions")
      .select("id, slug, name, location, date_start")
      .eq("id", expeditionId)
      .maybeSingle();
    if (!single) return NextResponse.json({ error: "Expedition not found" }, { status: 404 });
    expeditions = [single];
    const daysUntil = Math.max(0, Math.ceil((new Date(single.date_start).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    daysByExpedition.set(single.id, daysUntil);
  } else {
    const now = new Date();
    const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const targetDate = target.toISOString().split("T")[0];

    // Expeditions starting on target date
    const { data: onTarget } = await supabase
      .from("expeditions")
      .select("id, slug, name, location, date_start")
      .gte("date_start", `${targetDate}T00:00:00`)
      .lte("date_start", `${targetDate}T23:59:59`)
      .in("status", ["upcoming", "ongoing"]);
    expeditions = onTarget;
    daysByExpedition = new Map((onTarget ?? []).map((e) => [e.id, days]));
  }

  if (!expeditions?.length) return NextResponse.json({ sent: 0, expeditions: 0 });

  let sent = 0;
  for (const exp of expeditions) {
    const expDays = daysByExpedition.get(exp.id) ?? days;
    const { data: members } = await supabase
      .from("expedition_members")
      .select("user_id, profiles(username, email)")
      .eq("expedition_id", exp.id)
      .eq("status", "approved");

    for (const m of members ?? []) {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles as { username?: string; email?: string } | null;
      if (!p?.email || !p?.username) continue;
      await sendReminderEmail(p.email, p.username, exp.name, exp.slug, expDays).catch(() => {});
      sent++;
    }

    // Also insert in-app notifications
    if (members?.length) {
      void supabase.from("notifications").insert(
        members.map((m) => ({
          user_id: m.user_id,
          type: "reminder",
          title: `${exp.name} starts in ${expDays} day${expDays !== 1 ? "s" : ""}`,
          link: `/expeditions/${exp.slug}`,
        }))
      );
    }
  }

  return NextResponse.json({ sent, expeditions: expeditions.length });
}
