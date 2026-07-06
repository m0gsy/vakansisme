import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { BookingService } from "@/lib/services/booking.service";
import { BookingRepository } from "@/lib/repositories/booking.repository";

type Params = Promise<{ number: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { number } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const bookingRepo = new BookingRepository(supabase);
  const booking = await bookingRepo.findByBookingNumber(number);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : undefined;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  const bookingService = new BookingService(supabase, createServiceClient());
  try {
    await bookingService.cancelBooking(booking.id, user.id, reason, ip);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
