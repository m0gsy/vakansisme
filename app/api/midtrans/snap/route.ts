import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSnap } from "@/lib/midtrans";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const orderId = `exp-${expeditionId.slice(0, 8)}-${user.id.slice(0, 8)}-${Date.now()}`;

  const snap = getSnap();
  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: trip.price_amount,
    },
    item_details: [{
      id: trip.id,
      price: trip.price_amount,
      quantity: 1,
      name: trip.name.slice(0, 50),
    }],
    customer_details: {
      email: user.email,
      first_name: profile?.username ?? user.email?.split("@")[0] ?? "User",
    },
  });

  await supabase.from("expedition_payments").upsert({
    user_id: user.id,
    expedition_id: expeditionId,
    payment_order_id: orderId,
    amount_idr: trip.price_amount,
    status: "pending",
  }, { onConflict: "user_id,expedition_id" });

  return NextResponse.json({ token: transaction.token, orderId });
}
