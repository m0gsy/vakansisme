import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { expeditionId } = await req.json();
  if (!expeditionId) return NextResponse.json({ error: "expeditionId required" }, { status: 400 });

  const { data: trip } = await supabase
    .from("expeditions")
    .select("id, name, price_amount")
    .eq("id", expeditionId)
    .single();

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!trip.price_amount || trip.price_amount <= 0) {
    return NextResponse.json({ error: "Free expedition" }, { status: 400 });
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.com";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "idr",
        product_data: { name: trip.name },
        unit_amount: trip.price_amount,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/expeditions/${expeditionId}`,
    metadata: { user_id: user.id, expedition_id: expeditionId },
  });

  await supabase.from("expedition_payments").upsert({
    user_id: user.id,
    expedition_id: expeditionId,
    stripe_session_id: session.id,
    amount_idr: trip.price_amount,
    status: "pending",
  }, { onConflict: "user_id,expedition_id" });

  return NextResponse.json({ url: session.url });
}
