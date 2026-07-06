import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("payment_settings").select("*");
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  await requireAdmin();
  const body = await req.json();
  const supabase = createServiceClient();

  for (const [key, value] of Object.entries(body)) {
    await supabase.from("payment_settings").upsert({
      key,
      value: JSON.parse(JSON.stringify(value)),
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  }

  return NextResponse.json({ success: true });
}
