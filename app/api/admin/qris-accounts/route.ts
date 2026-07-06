import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("qris_accounts").select("*").order("display_order", { ascending: true });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json();
  const { name, image_url, display_order } = body;

  if (!name || !image_url) {
    return NextResponse.json({ error: "name, image_url required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("qris_accounts").insert({
    name, image_url, display_order: display_order ?? 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
