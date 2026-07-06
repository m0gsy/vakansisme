import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

type Params = Promise<{ id: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();
  const body = await req.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("bank_accounts").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
