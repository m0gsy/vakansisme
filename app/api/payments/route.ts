import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PaymentService } from "@/lib/services/payment.service";
import { BookingRepository } from "@/lib/repositories/booking.repository";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const bookingId = body.booking_id as string;
  const paymentMethod = body.payment_method as string;
  const provider = (body.provider as string) ?? "manual_transfer";

  if (!bookingId) return NextResponse.json({ error: "booking_id required" }, { status: 400 });
  if (!paymentMethod) return NextResponse.json({ error: "payment_method required" }, { status: 400 });

  const bookingRepo = new BookingRepository(supabase);
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const expedition = booking.expedition;
  if (!expedition) return NextResponse.json({ error: "Expedition not found" }, { status: 404 });

  const amountIdr = expedition.price_amount ?? (parseInt((expedition.price ?? "0").replace(/\D/g, ""), 10) || 0);
  if (amountIdr <= 0) return NextResponse.json({ error: "Free expedition" }, { status: 400 });

  const serviceSupabase = createServiceClient();
  const paymentService = new PaymentService(supabase, serviceSupabase);
  try {
    const result = await paymentService.createPayment({
      user_id: user.id,
      expedition_id: booking.expedition_id,
      booking_id: bookingId,
      amount_idr: amountIdr,
      provider: provider as "manual_transfer",
      payment_method: paymentMethod as "bank_transfer" | "qris" | "cash" | "manual_confirmation",
    });

    return NextResponse.json({
      success: true,
      payment: result.payment,
      instructions: result.instructions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
