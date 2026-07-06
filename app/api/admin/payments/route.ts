import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { PaymentService } from "@/lib/services/payment.service";

export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  const supabase = await createClient();
  let query = supabase
    .from("expedition_payments")
    .select("*, expedition:expeditions(name, slug), profile:profiles!inner(username)", { count: "exact" });

  if (status) {
    query = query.eq("payment_status", status);
  }
  if (search) {
    query = query.or(`payment_order_id.ilike.%${search}%,profiles.username.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return NextResponse.json({
    payments: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

export async function PATCH(req: Request) {
  const { supabase: adminSupabase, user } = await requireAdmin();

  const body = await req.json();
  const { action, payment_ids, ...params } = body;

  if (!action || !payment_ids?.length) {
    return NextResponse.json({ error: "action and payment_ids required" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient();
  const paymentService = new PaymentService(adminSupabase, serviceSupabase);
  const ip = req.headers.get("x-forwarded-for") ?? undefined;
  const results: Record<string, unknown>[] = [];

  for (const id of payment_ids) {
    try {
      switch (action) {
        case "verify":
          await paymentService.verifyPayment(id, user.id, ip);
          results.push({ id, status: "verified" });
          break;
        case "reject":
          await paymentService.rejectPayment(id, user.id, params.reason ?? "Bukti tidak valid", ip);
          results.push({ id, status: "rejected" });
          break;
        case "refund":
          await paymentService.refundPayment(id, user.id, params.reason ?? "Refund", ip);
          results.push({ id, status: "refunded" });
          break;
        case "extend":
          await paymentService.extendDeadline(id, user.id, params.new_expires_at);
          results.push({ id, status: "extended" });
          break;
        default:
          results.push({ id, status: "unknown_action" });
      }
    } catch (err) {
      results.push({ id, status: "error", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return NextResponse.json({ results });
}
