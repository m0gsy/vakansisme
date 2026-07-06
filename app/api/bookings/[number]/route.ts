import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { PaymentRepository } from "@/lib/repositories/payment.repository";

type Params = Promise<{ number: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { number } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const bookingRepo = new BookingRepository(supabase);
  const paymentRepo = new PaymentRepository(supabase);

  const booking = await bookingRepo.findByBookingNumber(number);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.user_id !== user.id) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payments = await paymentRepo.findByBooking(booking.id);

  return NextResponse.json({ booking, payments });
}
