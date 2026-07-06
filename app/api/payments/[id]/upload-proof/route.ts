import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PaymentService } from "@/lib/services/payment.service";
import { PaymentRepository } from "@/lib/repositories/payment.repository";

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const paymentRepo = new PaymentRepository(supabase);
  const payment = await paymentRepo.findById(id);
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.user_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const formData = await req.formData().catch(() => null);
  let imageUrl: string | null = null;

  if (formData) {
    const file = formData.get("proof") as File | null;
    if (!file) return NextResponse.json({ error: "Proof image required" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileName = `payment-proof/${payment.payment_order_id}-${Date.now()}.${file.name.split(".").pop() ?? "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
    imageUrl = supabase.storage.from("payment-proofs").getPublicUrl(fileName).data.publicUrl;
  } else {
    const body = await req.json().catch(() => ({}));
    imageUrl = body.image_url as string;
    if (!imageUrl) return NextResponse.json({ error: "image_url required" }, { status: 400 });
  }

  const paymentService = new PaymentService(supabase, createServiceClient());
  try {
    await paymentService.uploadProof(id, user.id, imageUrl);
    return NextResponse.json({ success: true, image_url: imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
