import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCoreApi } from "@/lib/midtrans";
import { createNotification } from "@/lib/notify";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const coreApi = getCoreApi();
    // Midtrans library verifies signature and fetches status from their server
    const status = await coreApi.transaction.notification(body);

    const orderId = status.order_id as string;
    const transactionStatus = status.transaction_status as string;
    const fraudStatus = status.fraud_status as string | undefined;

    const isPaid =
      transactionStatus === "capture" && fraudStatus === "accept" ||
      transactionStatus === "settlement";

    if (!isPaid) return NextResponse.json({ ok: true });

    const supabase = createServiceClient();

    const { data: payment } = await supabase
      .from("expedition_payments")
      .select("user_id, expedition_id")
      .eq("payment_order_id", orderId)
      .maybeSingle();

    if (!payment) return NextResponse.json({ ok: true });

    await supabase
      .from("expedition_payments")
      .update({ status: "paid" })
      .eq("payment_order_id", orderId);

    // User already has a pending_payment slot — just promote to approved
    await supabase
      .from("expedition_members")
      .update({ status: "approved", payment_due_at: null })
      .eq("user_id", payment.user_id)
      .eq("expedition_id", payment.expedition_id);

    const { data: trip } = await supabase
      .from("expeditions")
      .select("name, id")
      .eq("id", payment.expedition_id)
      .single();

    if (trip) {
      await createNotification({
        userId: payment.user_id,
        type: "join",
        title: "Pembayaran dikonfirmasi",
        body: `Kamu bergabung ke ${trip.name}`,
        link: `/expeditions/${trip.id}`,
      });
    }
  } catch {
    return NextResponse.json({ error: "Notification error" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
