import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: expired } = await supabase
    .from("expedition_members")
    .select("user_id, expedition_id")
    .eq("status", "pending_payment")
    .lt("payment_due_at", new Date().toISOString());

  if (!expired?.length) return NextResponse.json({ cancelled: 0 });

  for (const row of expired) {
    await supabase
      .from("expedition_members")
      .delete()
      .eq("user_id", row.user_id)
      .eq("expedition_id", row.expedition_id)
      .eq("status", "pending_payment");

    await supabase
      .from("expedition_payments")
      .update({ status: "cancelled" })
      .eq("user_id", row.user_id)
      .eq("expedition_id", row.expedition_id)
      .eq("status", "pending");

    await supabase.from("notifications").insert({
      user_id: row.user_id,
      type: "join",
      title: "Reservasi trip dibatalkan",
      body: "Tenggat pembayaran terlewati. Slot kamu dilepas.",
      link: `/expeditions/${row.expedition_id}`,
    });
  }

  return NextResponse.json({ cancelled: expired.length });
}
