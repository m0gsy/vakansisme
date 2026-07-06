import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PaymentService } from "@/lib/services/payment.service";

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const body = await req.json();
  const { expires_at } = body;
  if (!expires_at) return NextResponse.json({ error: "expires_at required" }, { status: 400 });

  const paymentService = new PaymentService(supabase, createServiceClient());
  try {
    await paymentService.extendDeadline(id, user.id, expires_at);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
