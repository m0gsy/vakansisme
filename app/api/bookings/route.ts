import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { BookingService } from "@/lib/services/booking.service";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: banCheck } = await supabase.from("profiles").select("is_banned").eq("id", user.id).single();
  if (banCheck?.is_banned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const expeditionId = body.expedition_id as string;
  if (!expeditionId) return NextResponse.json({ error: "expedition_id required" }, { status: 400 });

  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  const bookingService = new BookingService(supabase, createServiceClient());

  try {
    const result = await bookingService.createBooking(
      { expedition_id: expeditionId, user_id: user.id, notes },
      ip
    );

    return NextResponse.json({
      success: true,
      booking: result.booking,
      member_status: result.memberStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    if (message.includes("full")) {
      return NextResponse.json({ error: "Trip is full" }, { status: 409 });
    }
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
