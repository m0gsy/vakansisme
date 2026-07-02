import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function runAutoStatus(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;

  const supabase = await createClient();

  if (!isCron) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();

  const [{ data: ongoingRows }, { data: completedRows }] = await Promise.all([
    supabase
      .from("expeditions")
      .update({ status: "ongoing" })
      .lt("date_start", now)
      .gt("date_end", now)
      .eq("status", "upcoming")
      .select("id, name"),
    supabase
      .from("expeditions")
      .update({ status: "completed" })
      .lt("date_end", now)
      .in("status", ["upcoming", "ongoing"])
      .select("id, name"),
  ]);

  async function notifyBatch(rows: { id: string; name: string }[], newStatus: "ongoing" | "completed") {
    for (const exp of rows) {
      const { data: members } = await supabase
        .from("expedition_members")
        .select("user_id")
        .eq("expedition_id", exp.id);
      if (!members?.length) continue;

      const title = newStatus === "ongoing"
        ? `${exp.name} is now underway`
        : `${exp.name} is complete — rate your trip`;

      void supabase.from("notifications").insert(
        members.map((m) => ({
          user_id: m.user_id,
          type: `expedition_${newStatus}`,
          title,
          link: `/expeditions/${exp.id}`,
        }))
      );
    }
  }

  if (ongoingRows?.length) notifyBatch(ongoingRows, "ongoing").catch(() => {});
  if (completedRows?.length) notifyBatch(completedRows, "completed").catch(() => {});

  return NextResponse.json({ updated: { ongoing: ongoingRows?.length ?? 0, completed: completedRows?.length ?? 0 } });
}

// Vercel cron sends GET; admin UI POSTs — both supported
export const GET = runAutoStatus;
export const POST = runAutoStatus;
