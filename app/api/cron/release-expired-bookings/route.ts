import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PaymentService } from "@/lib/services/payment.service";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();
  const paymentService = new PaymentService(serviceSupabase, serviceSupabase);
  const count = await paymentService.expireOverduePayments();

  return NextResponse.json({ expired: count });
}
