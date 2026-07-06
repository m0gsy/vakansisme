import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { sendReminderEmail, sendPaymentReminderEmail } from "@/lib/email";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: expeditions } = await supabase
    .from("expeditions")
    .select("id, name, date_start, price_amount")
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

  const body = await req.json().catch(() => ({})) as { type?: string; days?: number; expeditionId?: string };
  const { type = "trip", days = 7, expeditionId } = body;

  let expeditions: { id: string; slug: string; name: string; date_start: string }[] | null;
  let daysByExpedition = new Map<string, number>();

  if (expeditionId) {
    const { data: single } = await supabase
      .from("expeditions")
      .select("id, slug, name, date_start")
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

    const { data: onTarget } = await supabase
      .from("expeditions")
      .select("id, slug, name, date_start")
      .gte("date_start", `${targetDate}T00:00:00`)
      .lte("date_start", `${targetDate}T23:59:59`)
      .in("status", ["upcoming", "ongoing"]);
    expeditions = onTarget;
    daysByExpedition = new Map((onTarget ?? []).map((e) => [e.id, days]));
  }

  if (!expeditions?.length) return NextResponse.json({ sent: 0, expeditions: 0 });

  let sent = 0;

  if (type === "payment") {
    // Payment reminders: only for members with pending (not yet uploaded) payments
    for (const exp of expeditions) {
      const { data: payments } = await supabase
        .from("expedition_payments")
        .select("user_id, amount_idr, expires_at")
        .eq("expedition_id", exp.id)
        .eq("payment_status", "pending");

      if (!payments?.length) continue;

      const pendingUserIds = payments.map((p) => p.user_id);

      const { data: members } = await supabase
        .from("expedition_members")
        .select("id, user_id, booking_number")
        .eq("expedition_id", exp.id)
        .eq("booking_status", "waiting_payment")
        .in("user_id", pendingUserIds);

      if (!members?.length) continue;

      const memberByUser = new Map(members.map((m) => [m.user_id, m]));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, email")
        .in("id", pendingUserIds);

      const profileByUser = new Map((profiles ?? []).map((p) => [p.id, p]));

      // Read template from payment_settings
      const { data: settings } = await supabase
        .from("payment_settings")
        .select("value")
        .eq("key", "reminder_templates")
        .maybeSingle();
      const templates = (settings?.value as Record<string, unknown> | null) ?? {};
      const template = (templates.payment_reminder as string) ?? "Halo {{name}}, kamu masih punya tagihan untuk {{trip}}. Segera lakukan pembayaran sebelum {{deadline}}.";

      const notifRows: { user_id: string; type: string; title: string; body: string; link: string }[] = [];

      for (const p of payments) {
        const m = memberByUser.get(p.user_id);
        if (!m) continue;

        const profile = profileByUser.get(p.user_id);
        if (!profile?.username) continue;
        let email = profile.email;
        if (!email) {
          const service = createServiceClient();
          const { data } = await service.auth.admin.getUserById(p.user_id);
          email = data.user?.email ?? null;
        }
        if (!email) continue;

        await sendPaymentReminderEmail(email, profile.username, exp.name, p.amount_idr, m.booking_number ?? "", p.expires_at ?? "").catch(() => {});
        sent++;

        notifRows.push({
          user_id: p.user_id,
          type: "payment_reminder",
          title: `Payment reminder — ${exp.name}`,
          body: template
            .replace(/\{\{name\}\}/g, "You")
            .replace(/\{\{trip\}\}/g, exp.name)
            .replace(/\{\{deadline\}\}/g, ""),
          link: `/bookings/${m.booking_number}`,
        });
      }

      if (notifRows.length) {
        void supabase.from("notifications").insert(notifRows);
      }
    }
  } else {
    // Trip departure reminders (existing)
    for (const exp of expeditions) {
      const expDays = daysByExpedition.get(exp.id) ?? days;
      const { data: members } = await supabase
        .from("expedition_members")
        .select("user_id")
        .eq("expedition_id", exp.id)
        .eq("status", "approved");

      if (!members?.length) continue;

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, email")
        .in("id", userIds);

      const profileByUser = new Map((profiles ?? []).map((p) => [p.id, p]));

      for (const m of members) {
        const p = profileByUser.get(m.user_id);
        if (!p?.username) continue;
        let email = p.email;
        if (!email) {
          const service = createServiceClient();
          const { data } = await service.auth.admin.getUserById(m.user_id);
          email = data.user?.email ?? null;
        }
        if (!email) continue;
        await sendReminderEmail(email, p.username, exp.name, exp.slug, expDays).catch(() => {});
        sent++;
      }

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
