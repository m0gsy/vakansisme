import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";
import { createNotification } from "@/lib/notify";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const expeditionId = session.metadata?.expedition_id;
    if (!userId || !expeditionId) return NextResponse.json({ ok: true });

    const supabase = createServiceClient();

    await supabase
      .from("expedition_payments")
      .update({ status: "paid" })
      .eq("stripe_session_id", session.id);

    await supabase.from("expedition_members").upsert({
      user_id: userId,
      expedition_id: expeditionId,
      status: "approved",
    }, { onConflict: "user_id,expedition_id" });

    const { data: trip } = await supabase
      .from("expeditions")
      .select("name, id")
      .eq("id", expeditionId)
      .single();

    if (trip) {
      await createNotification({
        userId,
        type: "join",
        title: "Payment confirmed",
        body: `You've joined ${trip.name}`,
        link: `/expeditions/${trip.id}`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
